import { LightningElement, track } from 'lwc';
import registerOrganization from '@salesforce/apex/CommunityRegistrationController.registerOrganization';
import isEmailInUse from '@salesforce/apex/CommunityRegistrationController.isEmailInUse';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class CommunityRegistration extends LightningElement {
    
    @track accountName = '';
    @track accountPhone = '';
    @track accountWebsite = '';
    @track accountDescription = '';
    @track contactFirstName = '';
    @track contactLastName = '';
    @track contactEmail = '';
    @track contactPhone = '';
    @track contactTitle = '';
    @track isSubmitting = false;
    @track isSuccess = false;
    @track error = '';
    @track emailError = '';

    emailDebounceTimer;

    get submitLabel() {
        return this.isSubmitting ? 'Submitting...' : 'Register';
    }

    get isSubmitDisabled() {
        return this.isSubmitting || !!this.emailError;
    }

    handleInputChange(event) {
        const field = event.target.name;
        const value = event.target.value;
        if (field) {
            this[field] = value;
        }
        if (field === 'contactEmail') {
            this.emailError = '';
            if (this.emailDebounceTimer) clearTimeout(this.emailDebounceTimer);
            this.emailDebounceTimer = setTimeout(() => {
                this.validateEmail();
            }, 700);
        } else {
            this.error = '';
        }
    }

    async validateEmail() {
        if (!this.contactEmail) {
            this.emailError = '';
            return;
        }

        try {
            const result = await isEmailInUse({ email: this.contactEmail });
            if (result) {
                this.emailError = 'This email is already in use. Please use a different email.';
            } else {
                this.emailError = '';
            }
        } catch (err) {
            this.emailError = 'Error checking email.';
            console.error('validateEmail error', this.reduceErrors(err));
        }
    }

    async handleRegistration(event) {
        if (event) event.preventDefault();

        this.error = '';
        this.isSuccess = false;

        if (!this.validateFields()) {
            return;
        }

        if (this.emailError) {
            this.error = 'Please fix the email issue before submitting.';
            return;
        }

        this.isSubmitting = true;
        try {
            const contactId = await registerOrganization({
                accountName: this.accountName,
                accountPhone: this.accountPhone,
                accountWebsite: this.accountWebsite,
                accountDescription: this.accountDescription,
                contactFirstName: this.contactFirstName,
                contactLastName: this.contactLastName,
                contactEmail: this.contactEmail,
                contactPhone: this.contactPhone,
                contactTitle: this.contactTitle
            });

            this.isSuccess = true;
            this.isSubmitting = false;

            this.dispatchEvent(new ShowToastEvent({
                title: 'Registration Submitted',
                message: 'Your registration was successful and is pending approval.',
                variant: 'success'
            }));

            this.dispatchEvent(new CustomEvent('registration', {
                detail: { success: true, contactId }
            }));

            this.resetForm();
        } catch (err) {
            this.error = 'Error during registration: ' + this.reduceErrors(err);
            this.isSubmitting = false;
            this.dispatchEvent(new ShowToastEvent({
                title: 'Registration Failed',
                message: this.error,
                variant: 'error'
            }));
        }
    }

    validateFields() {
        const inputFields = [...this.template.querySelectorAll('lightning-input, lightning-textarea')];
        let allValid = true;
        inputFields.forEach(input => {
            input.reportValidity();
            if (!input.checkValidity()) {
                allValid = false;
            }
        });

        if (!allValid) {
            this.error = 'Please complete all required fields.';
        }

        return allValid;
    }

    resetForm = () => {
        this.accountName = '';
        this.accountPhone = '';
        this.accountWebsite = '';
        this.accountDescription = '';
        this.contactFirstName = '';
        this.contactLastName = '';
        this.contactEmail = '';
        this.contactPhone = '';
        this.contactTitle = '';
        this.error = '';
        this.emailError = '';
        this.isSuccess = false;

        const inputFields = this.template.querySelectorAll('lightning-input, lightning-textarea');
        inputFields.forEach(field => field.reportValidity());
    }

    reduceErrors(errors) {
        if (!errors) return '';
        if (!Array.isArray(errors)) errors = [errors];

        return errors
            .filter(Boolean)
            .map(error => {
                if (error?.body) {
                    if (Array.isArray(error.body)) {
                        return error.body.map(e => e?.message).join(', ');
                    } else if (typeof error.body.message === 'string') {
                        return error.body.message;
                    }
                }
                if (typeof error.message === 'string') {
                    return error.message;
                }
                try {
                    return JSON.stringify(error);
                } catch (e) {
                    return String(error);
                }
            })
            .join(', ');
    }
}
