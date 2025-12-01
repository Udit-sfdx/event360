import { LightningElement, track, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import registerOrganization from '@salesforce/apex/CommunityRegistrationController.registerOrganization';
import isEmailInUse from '@salesforce/apex/CommunityRegistrationController.isEmailInUse';
import basePath from '@salesforce/community/basePath';

export default class CommunityRegistration extends NavigationMixin(LightningElement) {
    
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

    // public method to submit registration (callable by parent)
    @api
    async submitRegistration() {
        // returns a promise that resolves with contactId / result, or rejects with error
        return this._doRegistration({ navigateOnSuccess: false });
    }

    // internal registration logic used by both public API and local form submit
    async _doRegistration({ navigateOnSuccess = true } = {}) {
        this.error = '';
        this.isSuccess = false;

        if (!this.validateFields()) {
            return Promise.reject(new Error(this.error || 'Validation failed'));
        }

        if (this.emailError) {
            this.error = 'Please fix the email issue before submitting.';
            return Promise.reject(new Error(this.error));
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

            // emit event for parent to listen to
            this.dispatchEvent(new CustomEvent('registration', {
                detail: { success: true, contactId }
            }));

            // navigate only if requested (i.e., when user submitted from the child's own form)
            if (navigateOnSuccess) {
                this[NavigationMixin.Navigate]({
                    type: 'standard__webPage',
                    attributes: { url: `${basePath}/` }
                });
            }

            return contactId;
        } catch (err) {
            this.error = 'Error during registration: ' + this.reduceErrors(err);
            this.isSubmitting = false;
            this.dispatchEvent(new ShowToastEvent({
                title: 'Registration Failed',
                message: this.error,
                variant: 'error'
            }));
            return Promise.reject(err);
        }
    }

    // wired to the form submit button inside the child template
    async handleRegistration(event) {
        if (event) event.preventDefault();
        // call internal logic but allow navigation after success
        try {
            await this._doRegistration({ navigateOnSuccess: true });
        } catch (err) {
            // errors already handled inside _doRegistration
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

    // public reset method for parent to call
    @api
    resetForm() {
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
        this.isSubmitting = false;

        const inputFields = this.template.querySelectorAll('lightning-input, lightning-textarea');
        inputFields.forEach(field => {
            try { field.value = ''; field.reportValidity(); } catch (e) {}
        });
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
