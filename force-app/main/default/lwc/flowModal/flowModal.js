import { LightningElement, api } from 'lwc';

export default class FlowModal extends LightningElement {
    @api flowApiName = 'Sf_Event_360_Flow';
    @api modalHeader = 'Run Flow';
    @api isOpen;
    @api eventId;
    @api toastMessage = 'EVENT CREATED SUCCESSFULLY!!!!.';

    @api openModal() {
        this.isOpen = true;
    }

    get inputVariables() {
        return [
            {
                name: 'eventId',
                type: 'String',
                value: this.eventId
            }
        ];
    }
    
    closeModal(showToast = true) {
        this.isOpen = false;
        const myEvent = new CustomEvent('sendvalue', {
            detail: this.isOpen
        });
        this.dispatchEvent(myEvent);

        if (showToast) {
            this.showSuccessToast(this.toastMessage);
        }

    }

    handleStatusChange(event) {
        if (event.detail.status === "FINISHED") {
            this.closeModal();
            this.dispatchEvent(new CustomEvent("flowfinished"));
        }
    }
}