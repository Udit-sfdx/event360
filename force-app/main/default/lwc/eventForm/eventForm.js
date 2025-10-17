import { LightningElement, track, wire , api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import { CurrentPageReference } from 'lightning/navigation';
import getUserAccountId from '@salesforce/apex/EventFormController.getUserAccountId';
import createEventDetail from '@salesforce/apex/EventFormController.createEventDetail';

export default class EventForm extends NavigationMixin(LightningElement) {
    @api recordId;
    @track eventDetail = {
        Name: '',
        Subject__c: '',
        StartDateTime__c: null,
        DurationInMinutes__c: 0,
        Type__c: '',
        Location__c: '',
        Venue__c: '',
        Price__c: 0,
        Image_URL__c: '',
        IsAllDayEvent__c: false,
        Status__c: 'Active',
        Description__c: '',
        Account__c: ''
    };
    acceptedFormats = ['.jpg','.jpeg','.png','.pdf']; 
    @track sessions = [
        { id: Date.now(), sessionName: '', speaker: '', startDate: '', startTime: '', duration: 0, location: '', price: 0 }
    ];
    @track isLoading = false;
    @track error;

    statusOptions = [
        { label: 'Draft', value: 'Draft' },
        { label: 'Active', value: 'Active' }
    ];

    @wire(CurrentPageReference) pageRef;

    connectedCallback() {
        console.log('Record type id => ',this.recordId);
        this.fetchUserAccountId();
    }

    handleInputChange(event) {
        const { name, value } = event.target;
        this.eventDetail[name] = value;

        if (name === 'StartDateTime__c') this.validateStartDate(event.target);
    }

    handleSessionChange(event) {
        const index = event.target.dataset.index;
        const { name, value } = event.target;
        this.sessions[index] = { ...this.sessions[index], [name]: value };
        if (name === 'duration') {
            this.validateSessionDuration(event.target, value);
        }
        this.updateEventDetailsFromSessions();
    }

    handleAddSession() {
        if (this.sessions.length > 0) {
            const lastIndex = this.sessions.length - 1;
            const ok = this.isSessionValid(lastIndex);
            if (!ok) {
                this.showToast('Warning', 'Please complete all required fields in the current session before adding a new one.', 'warning');
                this.focusFirstInvalidField(lastIndex);
                return;
            }
        }
        this.sessions = [
            ...this.sessions,
            { id: Date.now(), sessionName: '', speaker: '', startDate: '', startTime: '', duration: 0, location: '', price: 0 }
        ];
        this.updateEventDetailsFromSessions();
    }

    handleRemoveSession(event) {
        if (this.sessions.length <= 1) {
            this.showToast('Warning', 'At least one session must be present for the event.', 'warning');
            return;
        }
        const index = event.target.dataset.index;
        this.sessions = this.sessions.filter((_, i) => i != index);
        this.updateEventDetailsFromSessions();
    }

    handleFileUpload(event) {
        const file = event.detail.files[0]; 
        this.showToast('Success', `${file.name} uploaded successfully.`, 'success');
        
    }

    handleSaveEvent() {
        if (!this.validateForm()) return;
        this.isLoading = true;
        createEventDetail({ eventDetailJson: JSON.stringify(this.eventDetail) , eventSessionJSON: JSON.stringify(this.sessions) })
            .then((result) => {
                console.log('Event detail id=> ',result);
                // this.eventDetail.Id = result;
                this.showToast('Success', 'Event created successfully!', 'success')
            })
            .catch(error => this.showToast('Error', 'Error creating event: ' + this.reduceErrors(error), 'error'))
            .finally(() => this.isLoading = false); 
    }

    handleCancel() {
        this[NavigationMixin.Navigate]({ type: 'standard__namedPage', attributes: { pageName: 'home' } });
    }

    validateStartDate(inputCmp) {
        const selectedDate = new Date(inputCmp.value);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        inputCmp.setCustomValidity(selectedDate < tomorrow ? 'Start Date must be a future date.' : '');
        inputCmp.reportValidity();
    }

    validateSessionDuration(inputField, value) {
        const duration = Number(value);
        if (duration < 1 || duration > 8) {
            inputField.setCustomValidity('Duration must be between 1 and 8 hours.');
        } else {
            inputField.setCustomValidity('');
        }
        inputField.reportValidity();
    }

    validateForm() {
        const allValid = [...this.template.querySelectorAll('lightning-input, lightning-textarea, lightning-combobox')]
            .reduce((valid, field) => {
                field.reportValidity();
                return valid && field.checkValidity();
            }, true);

        if (!allValid) this.showToast('Error', 'Please complete all required fields.', 'error');
        return allValid;
    }

    updateEventDetailsFromSessions() {
        const totalDuration = this.sessions.reduce((sum, s) => sum + (Number(s.duration) || 0), 0);
        const totalPrice = this.sessions.reduce((sum, s) => sum + (Number(s.price) || 0), 0);

        this.eventDetail = { 
            ...this.eventDetail, 
            DurationInMinutes__c: totalDuration, 
            Price__c: totalPrice 
        };
    }

    isSessionValid(index) {
        const sessionSelector = `.session-card[data-session-index="${index}"]`;
        const inputs = this.template.querySelectorAll(`${sessionSelector} lightning-input, ${sessionSelector} lightning-combobox, ${sessionSelector} lightning-textarea`);
        if (!inputs || inputs.length === 0) {
            return false;
        }

        let allValid = true;
        inputs.forEach(input => {
            if (input.name === 'duration') {
                const val = Number(input.value || 0);
                if (val < 1 || val > 8) {
                    input.setCustomValidity('Duration must be between 1 and 8 hours.');
                } else {
                    input.setCustomValidity('');
                }
            }

            input.reportValidity();
            if (!input.checkValidity()) allValid = false;
        });

        return allValid;
    }

    focusFirstInvalidField(index) {
        const sessionSelector = `.session-card[data-session-index="${index}"]`;
        const inputs = this.template.querySelectorAll(`${sessionSelector} lightning-input, ${sessionSelector} lightning-combobox, ${sessionSelector} lightning-textarea`);
        for (const input of inputs) {
            if (!input.checkValidity()) {
                try { input.focus(); } catch (e) {}
                return;
            }
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }

    reduceErrors(errors) {
        if (!Array.isArray(errors)) errors = [errors];
        return errors.filter(Boolean).map(e => e.message || JSON.stringify(e)).join(', ');
    }

    async fetchUserAccountId() {
        this.isLoading = true;
        try {
            const result = await getUserAccountId();
            if (result) this.eventDetail.Account__c = result;
        } catch (error) {
            this.error = error;
            this.showToast('Error', 'Error retrieving account information: ' + this.reduceErrors(error), 'error');
        } finally {
            this.isLoading = false;
        }
    }

    get previewTitle() { 
        return this.eventDetail.Name || 'Event Title'; 
    }

    get previewSub() { 
        return this.eventDetail.Type__c || this.eventDetail.Subject__c || ''; 
    }
    get previewLocation() { 
        return this.eventDetail.Location__c || '—'; 
    }
    get formattedPrice() { 
        return this.eventDetail.Price__c ? `$${this.eventDetail.Price__c}` : 'Free'; 
    }
    get shortDescription() { 
        return this.eventDetail.Description__c || 'No description yet'; 
    }
    get imagePreviewStyle() { 
        return `background-image: url(${this.eventDetail.Image_URL__c || 'https://via.placeholder.com/400x200'})`; 
    }

    get isOnlyOne() {
        return !this.sessions || this.sessions.length <= 1;
    }

    get minDateTime() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow.toISOString().slice(0,16);
    }
}
