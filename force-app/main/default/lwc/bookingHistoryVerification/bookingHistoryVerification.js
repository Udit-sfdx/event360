import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import checkContactEmail from '@salesforce/apex/BookingHistoryController.checkContactEmail';
import sendVerificationCode from '@salesforce/apex/BookingHistoryController.sendVerificationCode';

export default class BookingHistoryVerification extends LightningElement {
    @track email = '';
    @track verificationCode = '';
    @track enteredCode = '';
    @track isEmailVerified = false;
    @track isCodeSent = false;
    @track isLoading = false;
    @track contactId = '';
    @track errorMessage = '';
    
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
                this.sendCode();
            } else {
                this.errorMessage = result.message;
                this.isLoading = false;
            }
        } catch (error) {
            this.handleError(error);
        }
    }
    
    async sendCode() {
        try {
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
    
    verifyCode() {
        if (!this.enteredCode) {
            this.errorMessage = 'Please enter the verification code';
            return;
        }
        
        if (this.enteredCode === this.verificationCode) {
            this.isEmailVerified = true;
            this.errorMessage = '';
            this.showToast('Success', 'Email verified successfully', 'success');
        } else {
            this.errorMessage = 'Invalid verification code. Please try again.';
        }
    }
    
    resendCode() {
        this.isLoading = true;
        this.sendCode();
    }
    
    handleError(error) {
        this.isLoading = false;
        let message = 'Unknown error';
        if (error.body && error.body.message) {
            message = error.body.message;
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
}