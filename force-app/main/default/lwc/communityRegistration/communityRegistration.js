import { LightningElement, track } from 'lwc';
import registerOrganization from '@salesforce/apex/CommunityRegistrationController.registerOrganization';
import isEmailInUse from '@salesforce/apex/CommunityRegistrationController.isEmailInUse';

export default class CommunityRegistration extends LightningElement {
    // Account fields
    @track accountName = '';
    @track accountPhone = '';
    @track accountWebsite = '';
    @track accountDescription = '';
    
    // Contact fields
    @track contactFirstName = '';
    @track contactLastName = '';
    @track contactEmail = '';
    @track contactPhone = '';
    @track contactTitle = '';
    
    // State variables
    @track isSubmitting = false;
    @track isSuccess = false;
    @track error = '';
    @track emailError = '';
    
    // Handle input field changes
    handleInputChange(event) {
        const field = event.target.name;
        const value = event.target.value;
        
        // Update the appropriate field
        this[field] = value;
        
        // Clear email error if email field is changed
        if (field === 'contactEmail') {
            this.emailError = '';
        }
    }
    
    // Validate email to check if it's already in use
    validateEmail() {
        if (this.contactEmail) {
            isEmailInUse({ email: this.contactEmail })
                .then(result => {
                    if (result) {
                        this.emailError = 'This email is already in use. Please use a different email.';
                    } else {
                        this.emailError = '';
                    }
                })
                .catch(error => {
                    this.emailError = 'Error checking email: ' + this.reduceErrors(error);
                });
        }
    }
    
    // Handle registration submission
    handleRegistration() {
        // Validate required fields
        if (!this.validateFields()) {
            return;
        }
        
        // Set submitting state
        this.isSubmitting = true;
        this.error = '';
        
        // Call Apex method to create Account and Contact
        registerOrganization({
            accountName: this.accountName,
            accountPhone: this.accountPhone,
            accountWebsite: this.accountWebsite,
            accountDescription: this.accountDescription,
            contactFirstName: this.contactFirstName,
            contactLastName: this.contactLastName,
            contactEmail: this.contactEmail,
            contactPhone: this.contactPhone,
            contactTitle: this.contactTitle
        })
            .then(result => {
                // Registration successful
                this.isSuccess = true;
                this.isSubmitting = false;
                
                // Dispatch event for parent components if needed
                this.dispatchEvent(new CustomEvent('registration', {
                    detail: {
                        success: true,
                        contactId: result
                    }
                }));
            })
            .catch(error => {
                // Handle error
                this.error = 'Error during registration: ' + this.reduceErrors(error);
                this.isSubmitting = false;
            });
    }
    
    // Validate required fields
    validateFields() {
        const allValid = [...this.template.querySelectorAll('lightning-input, lightning-textarea')]
            .reduce((validSoFar, inputField) => {
                inputField.reportValidity();
                return validSoFar && inputField.checkValidity();
            }, true);
        
        if (!allValid) {
            this.error = 'Please complete all required fields.';
        }
        
        if (this.emailError) {
            return false;
        }
        
        return allValid;
    }
    
    // Helper method to reduce error messages
    reduceErrors(errors) {
        if (!Array.isArray(errors)) {
            errors = [errors];
        }
        
        return errors
            .filter(error => !!error)
            .map(error => {
                // UI API read errors
                if (Array.isArray(error.body)) {
                    return error.body.map(e => e.message).join(', ');
                }
                // UI API DML, Apex and network errors
                else if (error.body && typeof error.body.message === 'string') {
                    return error.body.message;
                }
                // JS errors
                else if (typeof error.message === 'string') {
                    return error.message;
                }
                // Unknown error shape so try JSON stringifying it
                return JSON.stringify(error);
            })
            .join(', ');
    }
}