import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import checkContactEmail from '@salesforce/apex/BookingHistoryController.checkContactEmail';
import sendVerificationCode from '@salesforce/apex/BookingHistoryController.sendVerificationCode';
import getBookingHistory from '@salesforce/apex/BookingHistoryDataController.getBookingHistory';
import { NavigationMixin } from 'lightning/navigation';
import EVENT_IMAGE from '@salesforce/resourceUrl/EventImage';

export default class BookingHistoryVerificationDisplay extends NavigationMixin(LightningElement) {
    @track email = '';
    @track verificationCode = '';
    @track enteredCode = '';
    @track isEmailVerified = false;
    @track isCodeSent = false;
    @track isLoading = false;
    @track contactId = '';
    @track errorMessage = '';
    @track bookings = [];
    @track hasBookings = false;
    // keep selectedBooking as an array so templates using for:each work consistently
    @track selectedBooking = [];
    @track attachments = [];
    eventImage = EVENT_IMAGE;

    handleEmailChange(event) {
        this.email = event.target.value;
        this.errorMessage = '';
    }

    handleCodeChange(event) {
        this.enteredCode = event.target.value;
        this.errorMessage = '';
    }

    validateEmail() {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(this.email);
    }

    async verifyEmail() {
        if (!this.validateEmail()) {
            this.errorMessage = 'Please enter a valid email address';
            return;
        }

        this.isLoading = true;

        try {
            const result = await checkContactEmail({ email: this.email });

            if (result.isValid) {
                this.contactId = result.contactId;
                await this.sendCode();
            } else {
                this.errorMessage = result.message || 'Email not found';
                this.isLoading = false;
            }
        } catch (error) {
            this.handleError(error);
        }
    }

    async sendCode() {
        try {
            // show spinner while sending
            this.isLoading = true;
            this.verificationCode = await sendVerificationCode({
                email: this.email,
                contactId: this.contactId
            });

            this.isCodeSent = true;
            this.isLoading = false;

            this.showToast('Success', 'Verification code sent to your email', 'success');
        } catch (error) {
            this.handleError(error);
        }
    }

    async verifyCode() {
        if (!this.enteredCode) {
            this.errorMessage = 'Please enter the verification code';
            return;
        }

        if (this.enteredCode === this.verificationCode) {
            this.isEmailVerified = true;
            this.errorMessage = '';
            this.showToast('Success', 'Email verified successfully', 'success');

            await this.loadBookingHistory();
        } else {
            this.errorMessage = 'Invalid verification code. Please try again.';
        }
    }

    async resendCode() {
        try {
            this.isLoading = true;
            await this.sendCode();
        } finally {
            this.isLoading = false;
        }
    }

    async loadBookingHistory() {
        if (!this.contactId && !this.email) {
            return;
        }

        this.isLoading = true;

        try {
            const bookingData = await getBookingHistory({ email: this.email });

            if (bookingData && bookingData.length > 0) {
                // normalize each booking and compute eventStartDate ISO
                this.bookings = bookingData.map((b, idx) => {
                    const id = b.id || b.Id || b.bookingId || b.BookingId || `booking-${idx}`;
                    const name = b.name || b.Name || '';
                    const eventName = b.eventName || b.EventName || b.title || '';
                    const eventId = b.eventId || b.EventId || b.eventId__c || b.Event__c || '';
                    const sessionId = b.sessionId || b.SessionId || b.sessionId__c || b.Session__c || '';
                    const heroFromRecord = b.heroImageUrl || b.imageUrl || b.hero || b.eventImageUrl || null;
                    const description = b.description || b.Description || b.eventDescription || '';
                    const eventVenue = b.eventVenue || b.venue || b.Venue || '';
                    const eventLocation = b.eventLocation || b.location || b.Location || '';
                    const start = b.eventStartDate || b.startDate || b.startDateTime || b.EventStart__c || null;
                    const end = b.eventEndDate || b.endDate || b.endDateTime || b.EventEnd__c || null;
                    const bookingReference = b.bookingReference || b.reference || b.bookingRef || b.BookingReference__c || '';
                    const status = b.status || b.Status || b.bookingStatus || '';
                    const ticketQRRaw = b.ticketQR || b.qr || b.qrCode || b.ticketQRCode || '';

                    let eventStartDate = null;
                    let eventStartTime = '';
                    let eventEndTime = '';
                    if (start) {
                        const dt = new Date(start);
                        if (!isNaN(dt)) {
                            // convert to ISO for consistent comparison and formatted-date-time usage
                            eventStartDate = dt.toISOString();
                            eventStartTime = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        } else {
                            eventStartDate = start;
                        }
                    }
                    if (end) {
                        const dt2 = new Date(end);
                        if (!isNaN(dt2)) {
                            eventEndTime = dt2.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        } else {
                            eventEndTime = end || '';
                        }
                    }

                    let qrCodeUrl = '';
                    if (ticketQRRaw) {
                        const imgMatch = String(ticketQRRaw).match(/src\s*=\s*"([^"]+)"/i);
                        qrCodeUrl = (imgMatch && imgMatch[1]) ? imgMatch[1] : String(ticketQRRaw);
                        qrCodeUrl = qrCodeUrl.replace(/&amp;/g, '&').trim();
                    }

                    return {
                        id: String(id),
                        eventId: String(eventId),
                        sessionId: String(sessionId),
                        heroImageUrl: heroFromRecord,
                        description,
                        eventName,
                        name,
                        eventVenue,
                        eventLocation,
                        eventStartDate,
                        eventStartTime,
                        eventEndTime,
                        bookingReference,
                        status,
                        qrCodeUrl,
                        hasAttended: !!b.hasAttended || !!b.has_attended || (status && status.toLowerCase().includes('attend')),
                        __raw: b
                    };
                });

                this.hasBookings = this.normalizedBookings.length > 0;
                // set selectedBooking to the full list by default (views that iterate selectedBooking will work)
                this.selectedBooking = this.bookings.slice();
            } else {
                this.bookings = [];
                this.hasBookings = false;
                this.selectedBooking = [];
            }
        } catch (error) {
            this.handleError(error);
        } finally {
            this.isLoading = false;
        }
    }

    handleError(error) {
        this.isLoading = false;
        let message = 'Unknown error';
        if (error && error.body && error.body.message) {
            message = error.body.message;
        } else if (error && error.message) {
            message = error.message;
        } else if (typeof error === 'string') {
            message = error;
        }
        this.errorMessage = message;
        this.showToast('Error', message, 'error');
    }

    showToast(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(evt);
    }

    // ---------- Helpers & computed getters for template (lightning-accordion) ----------

    // normalized bookings (same order as loaded)
    get normalizedBookings() {
        if (!Array.isArray(this.bookings)) return [];
        return this.bookings.map((b, idx) => {
            // ensure id exists (defensive)
            return {
                ...b,
                id: b.id || b.Id || `booking-${idx}`
            };
        });
    }

    // current timestamp for comparisons
    get now() {
        return new Date();
    }

    // future bookings: start >= now (includes today/ongoing)
    get futureBookings() {
        const nowTs = this.now.getTime();
        return this.normalizedBookings
            .filter(b => {
                if (!b.eventStartDate) return false;
                const dt = Date.parse(b.eventStartDate);
                if (isNaN(dt)) return false;
                return dt >= nowTs;
            })
            .sort((a, b) => Date.parse(a.eventStartDate) - Date.parse(b.eventStartDate));
    }

    // previous bookings: start < now
    get previousBookings() {
        const nowTs = this.now.getTime();
        return this.normalizedBookings
            .filter(b => {
                if (!b.eventStartDate) return false;
                const dt = Date.parse(b.eventStartDate);
                if (isNaN(dt)) return false;
                return dt < nowTs;
            })
            .sort((a, b) => Date.parse(b.eventStartDate) - Date.parse(a.eventStartDate)); // newest first
    }

    get hasFutureBookings() {
        return this.futureBookings.length > 0;
    }

    get hasPreviousBookings() {
        return this.previousBookings.length > 0;
    }

    get hasAnyBooking() {
        return this.normalizedBookings.length > 0;
    }

    // keep only sections that have items open by default
    get activeSections() {
        const sections = [];
        if (this.hasFutureBookings) sections.push('future');
        if (this.hasPreviousBookings) sections.push('previous');
        return sections;
    }

    // legacy getter used by your existing template (keeps behavior similar)
    get hasSelectedBooking() {
        // log left for debugging
        // console.log('Selected Booking => ', JSON.stringify(this.selectedBooking));
        return this.selectedBooking && this.selectedBooking.length > 0;
    }

    get futureLabel() {
        return `Future Bookings (${this.futureBookings.length})`;
    }

    // label used by the lightning-accordion-section for previous bookings
    get previousLabel() {
        return `Previous Bookings (${this.previousBookings.length})`;
    }
}
