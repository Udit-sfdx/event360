import { LightningElement, track , api } from 'lwc';
import getSessionsForEvent from '@salesforce/apex/EventRegistrationController.getSessionsForEvent';
import saveRegistration from '@salesforce/apex/EventRegistrationController.saveRegistration';
import getQrForRegistration from '@salesforce/apex/EventRegistrationController.getQrForRegistration';
import sendRegistrationEmail from '@salesforce/apex/EventRegistrationController.sendRegistrationEmail';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import basePath from '@salesforce/community/basePath';

export default class EventRegistration extends NavigationMixin(LightningElement) {

    @api eventId;
    @track firstName = '';
    @track lastName = '';
    @track email = '';
    @track phone = '';
    @track skills = '';
    @track eventSession = '';
    @track company = '';
    @track showSessionList = false;
    @track sessionOptions = [];
    @track eventSessionRadio;
    @track showQr = false;
    @track isLoading = false;
    @track bookingType = 'fullEvent';
    @track selectedSessions = [];
    @track eventDetailName = '';
    @track count = 0;
    loading = false;

    gatewayOptions = [
        { label: 'Razorpay', value: 'razorpay' },
        { label: 'Stripe', value: 'stripe' },
        { label: 'PayPal', value: 'paypal' },
        { label: 'PhonePe', value: 'phonepe' },
        { label: 'Google Pay', value: 'gpay' }
    ];
    
    connectedCallback() {
        this.handleEventSession();
    }

    @api
    handleProceed() {
        saveRegistration({ registrationEventDetail: this.req })
            .then(contactId => {
                console.log('saved', contactId);
                this.contactId = contactId;
                return getQrForRegistration({ contactId: this.contactId });
            })
            .then(result => {
                console.log('Event sub details => ', JSON.stringify(result));
                const rawQr = result && result.TicketQR__c;
                if (!rawQr) {
                    this.qrImageUrl = null;
                    return;
                }
                const imgMatch = rawQr.match(/src\s*=\s*"([^"]+)"/i);
                let qrUrl = imgMatch && imgMatch[1] ? imgMatch[1] : rawQr;
                qrUrl = qrUrl.replace(/&amp;/g, '&');
                qrUrl = qrUrl.trim();
                this.qrImageUrl = qrUrl;
                this.eventName = result?.EventDetail__r?.Name;
                this.bookingId = result?.Name;
                return sendRegistrationEmail({ contactId: this.contactId, qrUrl: this.qrImageUrl });
            })
                .then(()=> {
                    this.dispatchEvent(new CustomEvent('registrationdone', {
                            detail: {
                                contactId: this.contactId,
                                bookingId: this.bookingId
                            },
                            bubbles: true,
                            composed: true
                        }));

                this[NavigationMixin.Navigate]({
                    type: 'standard__webPage',
                    attributes: { 
                        url: `${basePath}/` 
                    }
                });
                this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Registration completed and confirmation email sent successfully!',
                    variant: 'success',
                    mode: 'dismissable'
                })
            );
            })
            .catch(error => {
                console.error('Error saving registration or fetching QR:', error);
            });
    }

    @api
    handleBack() {
        if (this.showQr) {
            this.showQr = false;
            this.notifyParentPaymentState();
            return true;
        }
        return false;
    }

    @api
    handleMakePayment() {
        const allInputs = this.template.querySelectorAll('lightning-input');
        let allValid = true;
        this.isLoading = false;

        allInputs.forEach((input) => {
            if (!input.reportValidity()) {
                allValid = false;
            }
        });

        if (!allValid) {
            this.notifyParentPaymentState();
        }

        const filteredSessions = this.sessionOptions.map(item => ({
            Id: item.Id,
            Name: item.Name,
            Quantity: item.Quantity
        }));

        this.req = {
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            phone: this.phone,
            skills: this.skills,
            eventSession: filteredSessions,
            company: this.company,
            eventId: this.eventId
        };
        this.showQr = true;
        console.log('Log in child => ',this.showQr);
        this.notifyParentPaymentState();
    }

    notifyParentPaymentState() {
        const disabled = this.makePaymentButtonVisible;
        const detail = { disabled: !!disabled, showQr: !!this.showQr };
        this.dispatchEvent(new CustomEvent('paymentstate', {
            detail,
            bubbles: true, 
            composed: true
        }));
    }

    handleEventSession() {
        this.eventIdOne = this.eventId;
        getSessionsForEvent({ eventId: this.eventIdOne })
            .then(result => {
                console.log('item => ',JSON.stringify(result));
                if (Array.isArray(result)) {
                    
                    this.sessionOptions = result.map(item => ({
                        
                        ...item,
                        Quantity: 0,
                        TotalPrice: 0
                    }));
                } else {
                    console.error('Unexpected result type:', result);
                    this.sessionOptions = [];
                }
                this.eventDetailName = this.sessionOptions[0].EventDetail__r.Name;
                this.notifyParentPaymentState();
            })
            .catch(error => {
                console.error('Error fetching event sessions:', error);
            });
    }

    handleIncrement(event) {
        const id = event.target.dataset.id;
        this.count ++ ;

        this.sessionOptions.forEach(ev => {
            console.log('Ev=> ',JSON.stringify(ev));
            if (ev.Id === id) {
                ev.Quantity = Number(ev.Quantity) + 1;
                ev.TotalPrice = ev.Quantity * Number(ev.Price__c);
            }
        });

        this.sessionOptions = [...this.sessionOptions];
        this.notifyParentPaymentState();
        console.log('After Increment => ',JSON.stringify(this.sessionOptions));
    }

    handleDecrement(event) {
        const id = event.target.dataset.id;
        if(this.count > 0 ) {
            this.count --;
        }
        this.sessionOptions.forEach(ev => {
            if (ev.Id === id && ev.Quantity > 0) {
                ev.Quantity = Number(ev.Quantity) - 1;
                ev.TotalPrice = ev.Quantity * (ev.Price__c);
            }
        });

        this.sessionOptions = [...this.sessionOptions];
        this.notifyParentPaymentState();
    }

    handleChange(event) {
        const name = event.target.name;
        const value = event.target.type === 'number' ? Number(event.target.value) : event.target.value;
        switch (name) {
            case 'firstName':
                this.firstName = value;
                break;
            case 'lastName':
                this.lastName = value;
                break;
            case 'email':
                this.email = value;
                break;
            case 'phone':
                this.phone = value;
                break;
            case 'skills':
                this.skills = value;
                break;
            case 'eventSession':
                this.showSessionList = value === 'bookSession'? true: false;
                break;
            case 'company':
                this.company = value;
                break;
            default:
                break;
        }
    }

    validateForm() {
        const errors = [];
        if (!this.firstName || !this.firstName.trim()) errors.push('firstName');
        if (!this.lastName || !this.lastName.trim()) errors.push('lastName');
        if (!this.email || !this.email.trim()) errors.push('email');
        if (!this.eventSession || !this.eventSession.trim()) errors.push('eventSession');
        if (!this.company || !this.company.trim()) errors.push('company');
        return errors;
    }

    get options() {
        return [
            { label: 'Book Full Event', value: 'bookEvent' },
            { label: 'Book Session', value: 'bookSession' },
        ];
    }

    get totalAmount() {
        return this.sessionOptions.reduce((TotalPrice, item) => {
            const price = parseFloat(item.TotalPrice) || 0;
            return TotalPrice + price;
        }, 0);
    }

    get customerName() {
        return this.req.firstName + ' ' + this.req.lastName;
    }

    get hasAnyQuantity() {
        console.log('has any quantity => ',this.sessionOptions?.some(item => Number(item.Quantity) > 0));
        return this.sessionOptions?.some(item => Number(item.Quantity) > 0);
    }

    get makePaymentButtonVisible() {
        return !(this.count !== 0);
    }
}