import { LightningElement,wire,track } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import EVENT_IMAGE from '@salesforce/resourceUrl/EventImage';
import getEventDetail from '@salesforce/apex/EventDetailController.getEventDetail';

export default class EventDetail extends LightningElement {
    @track eventId;
    imageUrl = EVENT_IMAGE;
    eventDetail;
    dataSaved=false;
    @track openModal = false;
    @track isopen = false;

    @wire(CurrentPageReference)
    pageReference({ state }) {
        if(state && state.data) {
            this.eventId = atob(state.data);
        }
    }

    connectedCallback() {
        this.handleLoadEvent();
    }

    handleLoadEvent() {
        getEventDetail({eventId:this.eventId}).then((result)=>{
            this.eventDetail = result;
        });
    }

    openOriginal() {
        this.openModal = true;
        this.isopen = true;
    }

    handleChildValue(event) {
        this.openModal = event.detail;
        console.log('this.openModal ',this.openModal);
        if(this.openModal === false) {
            this.dataSaved = true;
        }
    }

    openRegistrationModal(eventId) {
        this.eventId = eventId;
        this.openModal = true;
    }

    closeModal() {
        this.openModal = false;
    }

    handleChildValue(event) {
        console.log('Received from child:', event.detail);
        this.closeModal();
    }

    get displayPrice() {
        if(this.eventDetail.Price === '0') {
            return 'FREE';
        }
        else{
            return this.eventDetail.Price
        }
    }
    
}