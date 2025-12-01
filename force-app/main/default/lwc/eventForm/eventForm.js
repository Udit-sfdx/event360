import { LightningElement, track, wire, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import { CurrentPageReference } from 'lightning/navigation';
import getUserAccountId from '@salesforce/apex/EventFormController.getUserAccountId';
import createEventDetail from '@salesforce/apex/EventFormController.createEventDetail';
import getGeneratedEventDescription from '@salesforce/apex/PromptTemplateController.getGeneratedEventDescription';
import getEventDetailWithPerms from '@salesforce/apex/EventDetailController.getEventDetailWithPerms';
import saveEventWithSessions from '@salesforce/apex/EventDetailController.saveEventWithSessions';
import basePath from '@salesforce/community/basePath';
import getSubEvents from '@salesforce/apex/EventDetailController.getSubEvents'
import LightningPrompt from 'lightning/prompt';

export default class EventForm extends NavigationMixin(LightningElement) {

    @track eventDetail = {
        Id:'',
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

    acceptedFormats = ['.jpg', '.jpeg', '.png', '.pdf'];
    @track fileDataJson = null;
    @track sessions = [
        { id: Date.now(), sessionName: '', speaker: '', startTime: '', duration: 0, location: '', price: 0,endTime:'' }
    ];
    @track isLoading = false;
    @track error;
    @track description = '';
    @track generatedDescription = '';
    // @track isSpinnerLoading = false;
    @track count = 1;

    statusOptions = [
        { label: 'Draft', value: 'Draft' },
        { label: 'Active', value: 'Active' }
    ];

    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
        if (currentPageReference) {
            this.eventId = currentPageReference.state.eventId;
            if (this.eventId) {
                this.isEditMode = true;
                this.loadEventDetails();
            }
        }
    }
    
    connectedCallback() {
        console.log('Type of event session => ',typeof(this.sessions) , ' event detail session type => ', typeof(this.eventDetail));
        this.fetchUserAccountId();
    }

    async handleIconClick() {
        if (!this.eventDetail.Name || !this.eventDetail.Type__c || !this.eventDetail.Venue__c)  {
            this.showToast('It looks like the Name, Type, or Start Date field is still incomplete. Please fill them in before using Einstein suggestions.');
            return;
        }

        // this.isSpinnerLoading = true;
        this.generatedDescription = '';

        try {
            const result = await getGeneratedEventDescription({
                userInputDescription: JSON.stringify(this.eventDetail)
                
            });
            console.log('Generated result >>>', this.eventDetail);
            this.generatedDescription = result;
            const promptResult = await LightningPrompt.open({
                message: 'Einstein refined your description. You can edit it before saving:',
                label: 'AI Description Suggestion',
                defaultValue: this.generatedDescription,
                theme: 'info',
            });

            if (promptResult) {
                this.eventDetail.Description__c = promptResult;
                console.log('Final description selected by user:', promptResult);
            } else {
                console.log('Prompt cancelled by user.');
            }

        } catch (error) {
            this.generatedDescription = 'An error occurred while generating the description.';
            this.showToast('Error', 'Failed to generate AI description.', 'error');
        } finally {
            // this.isSpinnerLoading = false;
        }
    }

    loadEventDetails() {
        
        getEventDetailWithPerms({ eventId: this.eventId })
            .then((result) => {
                const startDate = result.EventDate; 
                const startTime = result.EventTime; 
                
                let StartDateTime = '';
                if (startDate && startTime) {
                    let cleanTime = startTime;
                    if (cleanTime.includes('Z')) {
                        cleanTime = cleanTime.replace('Z', '').substring(0, 8); 
                    }
                    if (cleanTime.length === 5) {
                        cleanTime = `${cleanTime}:00`;
                    }
                    StartDateTime = `${startDate}T${cleanTime}`;
                }
                this.eventDetail = {
                    Id: result.Id,
                    Name: result.Name,
                    Venue__c: result.Venue,
                    Price__c: result.Price,
                    Description__c: result.Description,
                    Image_URL__c: result.ImageUrl,
                    DurationInMinutes__c: result.Duration,
                    StartDateTime__c : StartDateTime,
                    Type__c : result.type,
                    Status__c: result.isActive ? 'Active' : 'Draft'
                };
                
            })
            .catch((error) => {
                console.error('Error loading event:', error);
        });

        getSubEvents({ eventId: this.eventId })
            .then((result) => {
                
                this.sessions = (result || []).map((item, index) => this.mapSession(item, index));
                if (this.sessions.length === 0) {
                    this.sessions = [this.createEmptySession()];
                }
            })
            .catch((error) => {
                console.error('Error loading sub-events:', error);
                if (!this.sessions || this.sessions.length === 0) {
                    this.sessions = [this.createEmptySession()];
                }
        });
    }

    mapSession(item, index) {
        return {
            id: item.Id || Date.now(),
            sessionName: item.Name || 'Session '+ ++index,
            speaker: item.Speaker__c || '',
            startDate: item.Start_Time__c ? new Date(item.Start_Time__c).toISOString().split('T')[0] : '',
            startTime: item.Start_Time__c ? new Date(item.Start_Time__c).toISOString().split('T')[1].substring(0, 5) : '',
            duration: item.Duration__c || item.Duration || '',
            location: item.Location__c || item.Location || '',
            price: item.Price__c || item.Price || 0,
            apexRecord: item
        };
    }

    createEmptySession() {
        return {
            id: Date.now(),
            sessionName: '',
            speaker: '',
            startDate: '',
            startTime: '',
            duration: '',
            location: '',
            price: 0,
            apexRecord: null
        };
    }

    handleInputChange(event) {
        const { name, value } = event.target;
        if (name) {
            this.eventDetail = { ...this.eventDetail, [name]: value };
        }
        if (name === 'StartDateTime__c') this.validateStartDate(event.target);
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

    handleSessionChange(event) {
        const index = Number(event.target.dataset.index);
        const { name, value } = event.target;
        if (Number.isNaN(index) || index < 0 || index >= this.sessions.length) return;

        const updated = [...this.sessions];
        updated[index] = { ...updated[index], [name]: value };
        this.sessions = updated;

        if (name === 'duration') {
            this.validateSessionDuration(event.target, value);
        }
        console.log('Session details => ',JSON.stringify(this.sessions));
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
        this.count++;
        this.updateEventDetailsFromSessions();
    }

    handleRemoveSession(event) {
        if (this.sessions.length <= 1) {
            this.showToast('Warning', 'At least one session must be present for the event.', 'warning');
            return;
        }
        const index = Number(event.target.dataset.index);
        this.sessions = this.sessions.filter((_, i) => i !== index);
        this.updateEventDetailsFromSessions();
    }

    handleFileUpload(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            this.fileDataJson = JSON.stringify({
                fileName: file.name,
                base64Data: base64,
                contentType: file.type
            });
        };
        reader.readAsDataURL(file);
    }

    @api
    save() {
        this.handleSaveEvent();
    }

    handleSaveEvent() {
        if (!this.validateForm()) return;
        this.isLoading = true;
        if(this.eventDetail.Id == '') {
            createEventDetail({
                eventDetailJson: JSON.stringify(this.eventDetail),
                eventSessionJSON: JSON.stringify(this.sessions),
                fileJson: this.fileDataJson
            })
            .then((result) => {
                if (result) {
                    this.recordId = result;
                    console.log('record Id => ',JSON.stringify(result));
                    this[NavigationMixin.Navigate]({
                    type: 'standard__webPage',
                    attributes: { 
                        url: `${basePath}/` 
                    }
                });
                }
                this.showToast('Success', 'Event created successfully!', 'success');
            })
            .catch(error => {
                console.error('Error creating event:', error);
                this.showToast('Error', 'Error creating event: ' + this.reduceErrors(error), 'error');
            })
            .finally(() => {
                this.isLoading = false;
                
            });
        }
        else {
            this.isLoading = false;
            saveEventWithSessions({ eventJson: JSON.stringify(this.eventDetail), sessionsJson: JSON.stringify(this.sessions) })
            .then(() => {
                this.showToast('Success', 'Event and sessions saved successfully', 'success');
                this[NavigationMixin.Navigate]({
                    type: 'standard__webPage',
                    attributes: { 
                        url: `${basePath}/` 
                    }
                });
            })
            .catch(error => {
                console.error('Error saving event:', error);
                this.showToast('Error', error.body.message, 'error');
            });
        }
    }

    handleCancel() {
        this[NavigationMixin.Navigate] ({
             type: 'standard__namedPage', 
             attributes: { 
                pageName: 'home' 
            } 
        });
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
        if (Number.isNaN(duration) || duration < 1 || duration > 8) {
            inputField.setCustomValidity('Duration must be between 1 and 8 hours.');
        } else {
            inputField.setCustomValidity('');
        }
        inputField.reportValidity();
    }

    validateForm() {
        const allFields = Array.from(this.template.querySelectorAll('lightning-input, lightning-textarea, lightning-combobox'));
        const allValid = allFields.reduce((valid, field) => {
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
                if (Number.isNaN(val) || val < 1 || val > 8) {
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
                try { input.focus(); } catch (e) { /* ignore */ }
                return;
            }
        }
    }

    reduceErrors(errors) {
        if (!Array.isArray(errors)) errors = [errors];
        return errors.filter(Boolean).map(e => e.message || JSON.stringify(e)).join(', ');
    }

    async fetchUserAccountId() {
        // this.isLoading = true;
        try {
            const result = await getUserAccountId();
            if (result) this.eventDetail = { ...this.eventDetail, Account__c: result };
        } catch (error) {
            this.error = error;
            this.showToast('Error', 'Error retrieving account information: ' + this.reduceErrors(error), 'error');
        } finally {
            // this.isLoading = false;
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
        return tomorrow.toISOString().slice(0, 16);
    }

    get accordingSectionName() {
        return 'Event Session ' + this.count;
    }
}
