import { LightningElement, track } from 'lwc';
import saveRegistration from '@salesforce/apex/EventRegistrationController.saveRegistration';

export default class EventRegistration extends LightningElement {
    @track firstName = '';
    @track lastName = '';
    @track email = '';
    @track phone = '';
    @track skills = '';
    @track eventSession = '';
    @track quantity = 1;
    @track company = '';

    @track showSessionList = false;

    sessionOptions = [
        { label: 'Morning Workshop — UX Design', value: 's1', meta: '09:00 - 11:00' },
        { label: 'Cloud Integration — Hands-on', value: 's2', meta: '11:30 - 13:00' },
        { label: 'Afternoon Keynote', value: 's3', meta: '15:00 - 16:00' }
    ];

    handleChange(event) {
        const name = event.target.name;
        const value = event.target.value;
        switch (name) {
            case 'firstName':
                this.firstName = value; break;
            case 'lastName':
                this.lastName = value; break;
            case 'email':
                this.email = value; break;
            case 'phone':
                this.phone = value; break;
            case 'skills':
                this.skills = value; break;
            case 'eventSession':
                this.eventSession = value; break;
            case 'quantity':
                this.quantity = value && parseInt(value, 10) > 0 ? parseInt(value, 10) : 1;
                break;
            case 'company':
                this.company = value; break;
            default:
                break;
        }
    }

    openSessionPicker() {
        this.showSessionList = !this.showSessionList;
    }

    selectSession(event) {
        const val = event.currentTarget.dataset.value;
        const opt = this.sessionOptions.find(s => s.value === val);
        if (opt) {
            this.eventSession = opt.label + ' (' + opt.meta + ')';
            this.showSessionList = false;
        }
    }

    handleNext(evt) {
        evt.preventDefault();
        if (!this.firstName || !this.lastName || !this.email || !this.company || !this.eventSession) {
            alert('Please fill required fields: First Name, Last Name, E-Mail, Event Session and Company Name.');
            return;
        }

        // Build payload
        const payload = {
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            phone: this.phone,
            skills: this.skills,
            eventSession: this.eventSession,
            quantity: this.quantity,
            company: this.company
        };

        // Dispatch event to parent or call apex as needed
        this.dispatchEvent(new CustomEvent('next', { detail: payload }));
    }
}
