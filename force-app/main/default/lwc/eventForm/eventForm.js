import { LightningElement, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import { CurrentPageReference } from 'lightning/navigation';
import getUserAccountId from '@salesforce/apex/EventFormController.getUserAccountId';
import createEventDetail from '@salesforce/apex/EventFormController.createEventDetail';

export default class EventForm extends NavigationMixin(LightningElement) {
    @track eventDetail = {
        Name:'',
        Subject__c: '',
        StartDateTime__c: null,
        DurationInMinutes__c: 60,
        Type__c: '',
        Location__c: '',
        Venue__c: '',
        Price__c: 0,
        Image_URL__c: '',
        IsAllDayEvent__c: false,
        isActive__c: false,
        Description__c: '',
        Account__c: ''
    };
    
    @track isLoading = false;
    @track error;
    
    @wire(CurrentPageReference)
    pageRef;
    
    connectedCallback() {
        // Get the current user's account ID when component loads
        this.fetchUserAccountId();
    }
    
    fetchUserAccountId() {
        this.isLoading = true;
        getUserAccountId()
            .then(result => {
                if (result) {
                    this.eventDetail.Account__c = result;
                } else {
                    this.showToast('Warning', 'No associated account found for the current user.', 'warning');
                }
            })
            .catch(error => {
                this.error = error;
                this.showToast('Error', 'Error retrieving account information: ' + this.reduceErrors(error), 'error');
            })
            .finally(() => {
                this.isLoading = false;
            });
    }
    
    handleInputChange(event) {
        const field = event.target.name;
        const value = event.target.value;
        this.eventDetail = { ...this.eventDetail, [field]: value };
    }
    
    handleCheckboxChange(event) {
        const field = event.target.name;
        const value = event.target.checked;
        this.eventDetail = { ...this.eventDetail, [field]: value };
    }
    
    handleSaveEvent() {
        // Validate form
        if (!this.validateForm()) {
            return;
        }
        
        this.isLoading = true;
        
        createEventDetail({ eventDetailJson: JSON.stringify(this.eventDetail) })
            .then(result => {
                this.showToast('Success', 'Event created successfully!', 'success');
                
                // Navigate to the event detail page
                this[NavigationMixin.Navigate]({
                    type: 'standard__namedPage',
                    attributes: {
                        url: 'event-page'
                    }
                });
            })
            .catch(error => {
                this.error = error;
                this.showToast('Error', 'Error creating event: ' + this.reduceErrors(error), 'error');
            })
            .finally(() => {
                this.isLoading = false;
            });
    }
    
    handleCancel() {
        // Reset the form or navigate back
        const homePageRef = {
            type: 'standard__namedPage',
            attributes: {
                pageName: 'home'
            }
        };
        this[NavigationMixin.Navigate](homePageRef);
    }
    
    validateForm() {
        const allValid = [...this.template.querySelectorAll('lightning-input, lightning-textarea')]
            .reduce((validSoFar, inputField) => {
                inputField.reportValidity();
                return validSoFar && inputField.checkValidity();
            }, true);
            
        if (!allValid) {
            this.showToast('Error', 'Please complete all required fields.', 'error');
        }
        
        return allValid;
    }
    
    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant
            })
        );
    }
    
    // Helper method to extract error messages
    reduceErrors(errors) {
        if (!Array.isArray(errors)) {
            errors = [errors];
        }
        
        return errors
            .filter(error => !!error)
            .map(error => {
                if (typeof error === 'string') {
                    return error;
                } else if (error.message) {
                    return error.message;
                } else if (error.body && error.body.message) {
                    return error.body.message;
                } else {
                    return JSON.stringify(error);
                }
            })
            .join(', ');
    }
}