import { LightningElement, api } from 'lwc';

export default class EventPreview extends LightningElement {
    @api eventData; // expected object passed from parent

    get hasSessions() {
        return Array.isArray(this.eventData?.sessions) && this.eventData.sessions.length > 0;
    }

    handleClose() {
        this.dispatchEvent(new CustomEvent('closepreview'));
    }

    handleEdit() {
        // signal parent to allow editing (close preview)
        this.dispatchEvent(new CustomEvent('editrequest'));
    }

    handleSave() {
        // pass full payload to parent to save via Apex
        this.dispatchEvent(new CustomEvent('save', { detail: this.eventData }));
    }

    handleDelete() {
        // if recordId present, delete; otherwise inform parent to discard draft
        const recId = this.eventData?.Id;
        this.dispatchEvent(new CustomEvent('delete', { detail: { recordId: recId } }));
    }
}
