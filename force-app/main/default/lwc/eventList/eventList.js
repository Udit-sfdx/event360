import { LightningElement, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getEventDetails from '@salesforce/apex/EventListController.getEventDetails';
import EVENT_IMAGE from '@salesforce/resourceUrl/EventImage';
import basePath from '@salesforce/community/basePath';

export default class EventList extends NavigationMixin(LightningElement) {
    @track events = [];
    @track error;
    @track loading = false;
    @track isFlowOpen = false;
    @track selectedEventId = null;
    @track selectedPriceFilter = 'All';
    imageUrl = EVENT_IMAGE;

    offset = 0;      // Tracks number of loaded events
    limitSize = 4;   // Number of events per batch
    showMoreButton = true;

    connectedCallback() {
        this.loadEvents(false);
    }

    loadEvents(append = false) {
        this.loading = true;

        getEventDetails({
            priceFilter: this.selectedPriceFilter,
            limitSize: this.limitSize,
            offsetSize: this.offset
        })
        .then(result => {
            const formatted = result.map(event => {
                const priceValue = event.Price != null ? Number(event.Price) : 0;
                return {
                    ...event,
                    displayPrice: priceValue === 0 ? 'Free' : `$${priceValue.toLocaleString()}`,
                    fadeIn: true,
                    cardClass: 'card fade-in' // precompute class
                };
            });

            if (append) {
                this.events = [...this.events, ...formatted];
            } else {
                this.events = formatted;
                this.offset = 0; // reset offset for new filter
            }

            // Update offset
            this.offset += formatted.length;

            // Show More button logic
            this.showMoreButton = formatted.length === this.limitSize;

            // Remove fade-in after animation
            setTimeout(() => {
                this.events = this.events.map(evt => ({
                    ...evt,
                    cardClass: 'card', // remove fade-in class
                    fadeIn: false
                }));
            }, 500);
        })
        .catch(err => {
            this.error = err?.body?.message || err.message || JSON.stringify(err);
            this.events = [];
            this.showMoreButton = false;
        })
        .finally(() => this.loading = false);
    }

    showMore() {
        this.loadEvents(true);
    }

    handleFilterChange(event) {
        this.selectedPriceFilter = event.detail.value;
        this.offset = 0;
        this.showMoreButton = true;
        this.loadEvents(false);
    }

    get hasEvents() {
        return this.events && this.events.length > 0;
    }

    onBookTicketsHandler(event) {
        const id = event.currentTarget?.dataset?.id;
        if (!id) return;
        this.selectedEventId = id;
        this.isFlowOpen = true;
    }

    onDetailsHandler(event) {
        const id = event.currentTarget.dataset.id;
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: `${basePath}/event-detail?data=${btoa(id)}`,
            },
        });
    }

    handleImageError(evt) {
        evt.target.src = 'https://via.placeholder.com/300x180?text=No+Image';
    }

    handleModalClose() {
        this.isFlowOpen = false;
        this.selectedEventId = null;
    }

    handleChildValue(event) {
        console.log('Value from child flow/modal:', event.detail);
        this.isFlowOpen = false;
        this.selectedEventId = null;
    }

    get priceFilterOptions() {
        return [
            { label: 'All', value: 'All' },
            { label: 'Free', value: 'Free' },
            { label: 'Paid', value: 'Paid' },
        ];
    }
}
