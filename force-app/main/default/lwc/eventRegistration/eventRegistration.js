import { LightningElement, track , api } from 'lwc';
import getSessionsForEvent from '@salesforce/apex/EventRegistrationController.getSessionsForEvent';
import saveRegistration from '@salesforce/apex/EventRegistrationController.saveRegistration';

export default class EventRegistration extends LightningElement {

    @api eventId;
    @track firstName = '';
    @track lastName = '';
    @track email = '';
    @track phone = '';
    @track skills = '';
    @track eventSession = '';
    @track quantity = 1;
    @track company = '';
    @track showSessionList = false;
    @track sessionOptions = [];

    connectedCallback() {
        this.handleEventSession();
    }

    handleEventSession() {
        getSessionsForEvent({ eventId: this.eventId })
            .then(result=> {
                this.sessionOptions = result;
            })
            .catch(error => {
                console.error('Error fetching event sessions:', error);
            });
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
                this.eventSession = value;
                break;
            case 'quantity':
                this.quantity = value && value > 0 ? value : 1;
                break;
            case 'company':
                this.company = value;
                break;
            default:
                break;
        }
    }

    handleSave() {
        const allInputs = this.template.querySelectorAll('lightning-input');
        let allValid = true;

        allInputs.forEach((input) => {
            if (!input.reportValidity()) {
                allValid = false;
            }
        });

        if (!allValid) return;
        const req = {
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            phone: this.phone,
            skills: this.skills,
            eventSession: this.selectedSessionId,
            quantity: this.quantity,
            company: this.company,
            eventId: this.eventId
        };

        console.log('Req => ',(JSON.stringify(req)));

        saveRegistration({ registrationEventDetail: req })
        // .then((result) => {
        //     if (result && result.success) {
        //         console.log('Saved registration id =>', result.recordId);
        //         this.showToast('Success', 'Your registration details have been saved.', 'success');
        //     } else {
        //         const msg = (result && result.message) ? result.message : 'Unknown error while saving';
        //         this.showToast('Error', msg, 'error');
        //     }
        // })
        // .catch((error) => {
        //     console.error('Error saving registration: ', error);
        //     const errMsg = (error && error.body && error.body.message) ? error.body.message : JSON.stringify(error);
        //     this.showToast('Error', errMsg, 'error');
        // });
    }

    handleReset() {
        this.firstName = '';
        this.lastName = '';
        this.email = '';
        this.phone = '';
        this.skills = '';
        this.eventSession = '';
        this.quantity = 1;
        this.company = '';
    }

    validateForm() {
        const errors = [];
        if (!this.firstName || !this.firstName.trim()) errors.push('firstName');
        if (!this.lastName || !this.lastName.trim()) errors.push('lastName');
        if (!this.email || !this.email.trim()) errors.push('email');
        if (!this.eventSession || !this.eventSession.trim()) errors.push('eventSession');
        if (!this.company || !this.company.trim()) errors.push('company');
        if (!this.quantity || this.quantity < 1) errors.push('quantity');
        return errors;
    }

    openSessionPicker() {
        this.showSessionList = true;
        this.activeSessionIndex = -1;
        this.template.querySelectorAll('.session-list').forEach(el => {
            if (el && el.querySelector('.session-item')) {
                el.focus();
            }
        });
    }

    selectSession(event) {
        let selectedEventSessionId = event.currentTarget;
        const value = selectedEventSessionId.dataset.value;
        const option = this.sessionOptions.find(opt => opt.Id === value);

        if (option) {
            this.eventSession = option.Name;
            this.selectedSessionId = option.Id; 
        }
        this.showSessionList = false;
    }

    onSessionKeydown(event) {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (!this.showSessionList) this.openSessionPicker();
            this.activeSessionIndex = 0;
            this.focusSessionItem(this.activeSessionIndex);
        } else if (event.key === 'Escape') {
            this.showSessionList = false;
        }
    }

    focusSessionItem(index) {
        const items = Array.from(this.template.querySelectorAll('.session-item'));
        if (items[index]) {
            items[index].focus();
        }
    }
}

