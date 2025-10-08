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
        Status__c: 'Active', // default
        Description__c: '',
        Account__c: ''
    };

    @track isLoading = false;
    @track error;

    // Dropdown options
    statusOptions = [
        { label: 'Draft', value: 'Draft' },
        { label: 'Active', value: 'Active' }
    ];

    @wire(CurrentPageReference)
    pageRef;

    connectedCallback() {
        this.fetchUserAccountId();
    }

    fetchUserAccountId() {
        this.isLoading = true;
        getUserAccountId()
            .then(result => {
                if (result) {
                    this.eventDetail.Account__c = result;
                }
            })
            .catch(error => {
                this.error = error;
                this.showToast('Error', 'Error retrieving account information: ' + this.reduceErrors(error), 'error');
            })
            .finally(() => this.isLoading = false);
    }

    handleInputChange(event) {
        const field = event.target.name;
        const value = event.target.value;

        // Clone the object
        this.eventDetail = { ...this.eventDetail, [field]: value };

        // Validate Start Date & Time
        if (field === 'StartDateTime__c') {
            const inputCmp = event.target;
            const selectedDate = new Date(value);
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            if (selectedDate < tomorrow) {
                inputCmp.setCustomValidity('Start Date must be a future date.');
            } else {
                inputCmp.setCustomValidity('');
            }
            inputCmp.reportValidity(); // show error immediately
        }
    }


    handleCheckboxChange(event) {
        const field = event.target.name;
        const value = event.target.checked;
        this.eventDetail = { ...this.eventDetail, [field]: value };
    }

    handleFileUpload(event) {
        const uploadedFiles = event.detail.files;
        if (uploadedFiles && uploadedFiles.length > 0) {
            // Assuming the first file for preview
            this.eventDetail.Image_URL__c = `/sfc/servlet.shepherd/version/download/${uploadedFiles[0].documentId}`;
        }
    }

    handleSaveEvent() {
        if (!this.validateForm()) return;

        this.isLoading = true;
        createEventDetail({ eventDetailJson: JSON.stringify(this.eventDetail) })
            .then(() => this.showToast('Success', 'Event created successfully!', 'success'))
            .catch(error => this.showToast('Error', 'Error creating event: ' + this.reduceErrors(error), 'error'))
            .finally(() => this.isLoading = false);
    }

    handleFileUpload(event) {
        const uploadedFiles = event.detail.files;
        if (uploadedFiles && uploadedFiles.length > 0) {
            // Assuming the first file for preview
            this.eventDetail.Image_URL__c = `/sfc/servlet.shepherd/version/download/${uploadedFiles[0].documentId}`;
        }
    }

    handleCancel() {
        const homePageRef = {
            type: 'standard__namedPage',
            attributes: { pageName: 'home' }
        };
        this[NavigationMixin.Navigate](homePageRef);
    }

    validateForm() {
        const allValid = [...this.template.querySelectorAll('lightning-input, lightning-textarea, lightning-combobox')]
            .reduce((validSoFar, inputField) => {
                inputField.reportValidity();
                return validSoFar && inputField.checkValidity();
            }, true);

        if (!allValid) this.showToast('Error', 'Please complete all required fields.', 'error');
        return allValid;
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }

    reduceErrors(errors) {
        if (!Array.isArray(errors)) errors = [errors];
        return errors
            .filter(error => !!error)
            .map(error => error.message || JSON.stringify(error))
            .join(', ');
    }

    // Preview getters
    get previewTitle() { return this.eventDetail.Name || 'Event Title'; }
    get previewSub() { return this.eventDetail.Type__c || this.eventDetail.Subject__c || ''; }
    get previewLocation() { return this.eventDetail.Location__c || '—'; }
    get formattedPrice() { return this.eventDetail.Price__c ? `$${this.eventDetail.Price__c}` : 'Free'; }
    get shortDescription() { return this.eventDetail.Description__c || 'No description yet'; }
    get imagePreviewStyle() { 
        return `background-image: url(${this.eventDetail.Image_URL__c || 'https://via.placeholder.com/400x200'})`;
    }

    get minDateTime() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0,0,0,0);
        return tomorrow.toISOString().slice(0,16);
    }
}
