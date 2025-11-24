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

    // Converted: used Promise chain instead of async/await
    verifyEmail() {
        if (!this.validateEmail()) {
            this.errorMessage = 'Please enter a valid email address';
            return;
        }

        this.isLoading = true;

        checkContactEmail({ email: this.email })
            .then(result => {
                if (result && result.isValid) {
                    this.contactId = result.contactId;
                    // return the promise so caller can chain if needed
                    return this.sendCode();
                } else {
                    this.errorMessage = (result && result.message) ? result.message : 'Email not found';
                    this.isLoading = false;
                    return Promise.resolve();
                }
            })
            .catch(error => {
                this.handleError(error);
            });
    }

    // Converted: returns a Promise (no async)
    sendCode() {
        this.isLoading = true;
        return sendVerificationCode({
            email: this.email,
            contactId: this.contactId
        })
            .then(code => {
                this.verificationCode = code;
                this.isCodeSent = true;
                this.isLoading = false;
                this.showToast('Success', 'Verification code sent to your email', 'success');
                return code;
            })
            .catch(error => {
                this.handleError(error);
                // rethrow or resolve depending on desired behavior; here resolve to allow chain to continue
                return Promise.reject(error);
            });
    }

    // Converted: synchronous checks + promise for loading booking history
    verifyCode() {
        if (!this.enteredCode) {
            this.errorMessage = 'Please enter the verification code';
            return;
        }

        if (this.enteredCode === this.verificationCode) {
            this.isEmailVerified = true;
            this.errorMessage = '';
            this.showToast('Success', 'Email verified successfully', 'success');

            // trigger loadBookingHistory; it's a promise but we don't use async/await
            this.loadBookingHistory().catch(err => {
                // loadBookingHistory already handles errors via handleError, but catch any leftover
                console.error('loadBookingHistory error:', err);
            });
        } else {
            this.errorMessage = 'Invalid verification code. Please try again.';
        }
    }

    // Converted: calls sendCode (which returns a Promise) and ensures loading flag
    resendCode() {
        this.isLoading = true;
        this.sendCode()
            .catch(err => {
                // sendCode already calls handleError
                console.error('resendCode error:', err);
            })
            .finally(() => {
                this.isLoading = false;
            });
    }

    // Converted: returns a Promise and uses .then/.catch/.finally
    loadBookingHistory() {
        if (!this.contactId && !this.email) {
            console.warn('No contactId or email - skipping loadBookingHistory');
            return Promise.resolve();
        }

        this.isLoading = true;

        return getBookingHistory({ email: this.email })
            .then(bookingData => {
                console.log('getBookingHistory ->', JSON.stringify(bookingData));

                if (bookingData && bookingData.length > 0) {
                    // normalize each booking and compute eventStartDate ISO and eventStartTs
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

                        // helper to parse many date formats into a timestamp (ms since epoch) or null
                        const parseToTs = (val) => {
                            if (!val && val !== 0) return null;

                            if (typeof val === 'number' && !isNaN(val)) return Number(val);
                            if (val instanceof Date) {
                                const t = val.getTime();
                                return isNaN(t) ? null : t;
                            }

                            const s = String(val).trim();

                            // MS JSON dates: /Date(1600000000000)/
                            const msMatch = s.match(/\/Date\((\-?\d+)\)\/?/);
                            if (msMatch) return Number(msMatch[1]);

                            // epoch seconds or ms
                            if (/^\d{10}$/.test(s)) return Number(s) * 1000;
                            if (/^\d{13}$/.test(s)) return Number(s);

                            // YYYY-MM-DD
                            if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
                                const dt = new Date(s + 'T00:00:00');
                                return isNaN(dt.getTime()) ? null : dt.getTime();
                            }

                            // YYYY-MM-DD HH:mm(:ss)?
                            if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(:\d{2})?$/.test(s)) {
                                const iso = s.replace(/\s+/, 'T');
                                const dt = new Date(iso);
                                if (!isNaN(dt.getTime())) return dt.getTime();
                                const dt2 = new Date(iso + 'Z');
                                return isNaN(dt2.getTime()) ? null : dt2.getTime();
                            }

                            const parsed = Date.parse(s);
                            if (!isNaN(parsed)) return parsed;

                            return null;
                        };

                        const startTs = parseToTs(start);
                        const endTs = parseToTs(end);

                        const eventStartDate = startTs ? new Date(startTs).toISOString() : (start ? String(start) : null);
                        const eventStartTime = startTs ? new Date(startTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                        const eventEndTime = endTs ? new Date(endTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (end ? String(end) : '');

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
                            eventStartTs: startTs,
                            eventEndTs: endTs,
                            hasAttended: !!b.hasAttended || !!b.has_attended || (status && status.toLowerCase().includes('attend')),
                            __raw: b
                        };
                    });

                    // update flags and selection
                    this.hasBookings = this.normalizedBookings.length > 0;
                    this.selectedBooking = this.bookings.slice();

                    // debug log to inspect timestamps
                    console.log('BOOKINGS NORMALIZED:', this.bookings.map(x => ({ id: x.id, eventStartDate: x.eventStartDate, eventStartTs: x.eventStartTs })));
                } else {
                    this.bookings = [];
                    this.hasBookings = false;
                    this.selectedBooking = [];
                    console.log('No bookingData returned');
                }
            })
            .catch(error => {
                this.handleError(error);
            })
            .finally(() => {
                this.isLoading = false;
                console.log('loadBookingHistory finished, isLoading=false');
            });
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

    get normalizedBookings() {
        if (!Array.isArray(this.bookings)) return [];
        return this.bookings.map((b, idx) => {
            return {
                ...b,
                id: b.id || b.Id || `booking-${idx}`
            };
        });
    }

    get now() {
        return new Date();
    }

    get futureBookings() {
        const nowTs = this.now.getTime();
        return this.normalizedBookings
            .filter(b => {
                if (!b.eventStartTs) return true;
                return b.eventStartTs >= nowTs;
            })
            .sort((a, b) => a.eventStartTs - b.eventStartTs);
    }

    get previousBookings() {
        const nowTs = this.now.getTime();
        console.log('previous booking => ',JSON.stringify(this.bookings
            .filter(b => {
                if (!b.eventStartTs) return false;
                return b.eventStartTs < nowTs;
            })
            .sort((a, b) => b.eventStartTs - a.eventStartTs)));


        return this.normalizedBookings
            .filter(b => {
                if (!b.eventStartTs) return true;
                return b.eventStartTs < nowTs;
            })
            .sort((a, b) => b.eventStartTs - a.eventStartTs);
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

    get activeSections() {
        const sections = [];
        if (this.hasFutureBookings) sections.push('futureSection');
        if (this.hasPreviousBookings) sections.push('previousSection');
        console.log('Session => ',JSON.stringify(sections));
        return sections;
    }

    get hasSelectedBooking() {
        return this.selectedBooking && this.selectedBooking.length > 0;
    }

    get futureLabel() {
        return `Future Bookings (${this.futureBookings.length})`;
    }

    get previousLabel() {
        return `Previous Bookings (${this.previousBookings.length})`;
    }

    get bookingsAsJson() { 
        return JSON.stringify(this.bookings, null, 2); 
    }

}