import { LightningElement, wire, track } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import basePath from '@salesforce/community/basePath';
import EVENT_IMAGE from '@salesforce/resourceUrl/EventImage';
import getEventDetailWithPerms from '@salesforce/apex/EventDetailController.getEventDetailWithPerms';
import getSubEvents from '@salesforce/apex/EventDetailController.getSubEvents';
import deleteEvent from '@salesforce/apex/EventDetailController.deleteEvent';
import isGuestUserApex from '@salesforce/apex/EventDetailController.isGuestUser';

export default class EventDetail extends NavigationMixin(LightningElement) {

    @track eventId;
    @track eventDetail;
    @track subEvents = [];
    @track openModal = false;
    @track isopen = false;
    @track isLoading = false;
    isGuestUser = false;
    dataSaved = false;
    imageUrl = EVENT_IMAGE;

    @wire(CurrentPageReference)
    pageReference({ state }) {
        if (state && state.data) {
            this.eventId = atob(state.data);
        }
    }

    connectedCallback() {
        this.handleLoadEvent();
        this.checkGuestStatus();
    }

    checkGuestStatus() {
        isGuestUserApex()
            .then(result => {
                this.isGuestUser = !!result;
            })
            .catch(error => {
                console.error('Error checking guest status', error);
                this.isGuestUser = false;
            });
    }

    handleLoadEvent() {
        if (!this.eventId) return;
        this.isLoading = true;

        getEventDetailWithPerms({ eventId: this.eventId })
            .then(result => {
                if (!result) {
                    this.eventDetail = {};
                    return;
                }
                const priceValue = result.Price != null ? Number(result.Price) : 0;

                this.eventDetail = {
                    ...result,
                    displayPrice: priceValue === 0 ? 'Free' : `INR ${priceValue}/-`
                };

                this.loadSubEvents();
            })
            .catch(error => {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Error loading event',
                    message: error?.body?.message || error.message || JSON.stringify(error),
                    variant: 'error'
                }));
            })
            .finally(() => {
                this.isLoading = false;
            });
    }

    loadSubEvents() {
        getSubEvents({ eventId: this.eventId })
            .then(result => {
                console.log('Result => ',JSON.stringify(result));
                
                this.subEvents = result.map(ev => ({
                    ...ev,
                    displayPrice: ev.Price__c ? `INR ${ev.Price__c}/-` : 'Free',
                    displayTime: ev.Start_Time__c && ev.Duration__c
                        ? `${this.formatTime(ev.Start_Time__c)} - ${this.formatTime(this.calculateEndTime(ev.Start_Time__c, ev.Duration__c))}`
                        : '',
                }));
                console.log('Display Time => ',displayTime);
                
            })
            .catch(error => {
                console.error('Error loading sub-events', error);
            });
    }

    formatTime(datetime) {
        if (!datetime) return '';
        const date = new Date(datetime);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    calculateEndTime(startTime, durationInHours) {
        try {
            const start = new Date(startTime);
            if (isNaN(start)) throw new Error('Invalid start time');
            const end = new Date(start.getTime() + durationInHours * 60 * 60 * 1000);
            return end.toISOString();
        } catch (error) {
            console.error('Error calculating end time:', error);
            return null;
        }
    }

    handleEdit() {
        if (!this.eventDetail || !this.eventDetail.Id) return;
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: `/addevent?eventId=${this.eventDetail.Id}`
            }
        });
    }

    handleDelete() {
        if (!this.eventDetail || !this.eventDetail.Id) return;
        if (!confirm('Are you sure you want to delete this event?')) return;

        this.isLoading = true;

        deleteEvent({ eventId: this.eventDetail.Id })
            .then(() => {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Deleted',
                    message: 'Event deleted successfully',
                    variant: 'success'
                }));

                this.eventDetail = null;
                this[NavigationMixin.Navigate]({
                    type: 'standard__webPage',
                    attributes: { url: `${basePath}/` }
                });
            })
            .catch(error => {
                const message = error?.body?.message || error.message || JSON.stringify(error);
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Delete failed',
                    message,
                    variant: 'error'
                }));
            })
            .finally(() => {
                this.isLoading = false;
            });
    }

    openOriginal() {
        this.openModal = true;
        this.isopen = true;
    }

    handleChildValue(event) {
        if (typeof event.detail === 'boolean') {
            this.openModal = event.detail;
            if (event.detail === false) {
                this.dataSaved = true;
            }
        }
        this.closeModal();
    }

    closeModal() {
        this.openModal = false;
    }
}
