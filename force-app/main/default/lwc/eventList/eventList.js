import { LightningElement, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getEventDetails from '@salesforce/apex/EventListController.getEventDetails';
import EVENT_IMAGE from '@salesforce/resourceUrl/EventImage';
import basePath from '@salesforce/community/basePath';

export default class EventList extends NavigationMixin(LightningElement) {
  @track events = [];
  @track error;
  @track loading = false;
  imageUrl = EVENT_IMAGE;

  connectedCallback() {
    this.loadAllEvents();
  }

  loadAllEvents() {
    this.loading = true;
    this.error = undefined;
    getEventDetails()
      .then((result) => {
        this.events = result || [];
        console.log('this.events', JSON.stringify(this.events));
        
      })
      .catch((err) => {
        this.error = err?.body?.message || err.message || JSON.stringify(err);
        this.events = [];
      })
      .finally(() => {
        this.loading = false;
      });
  }

  onDetailsHandler(event) {
    const id = event.currentTarget.dataset.id;
    this[NavigationMixin.Navigate]({
			type : 'standard__webPage',
			attributes: {
                url: `${basePath}/event-detail?data=${btoa(id)}`,
            },
		})
  }

  handleImageError(evt) {
    evt.target.src = 'https://via.placeholder.com/300x180?text=No+Image';
  }

  get hasEvents() {
    return this.events && this.events.length > 0;
  }
}