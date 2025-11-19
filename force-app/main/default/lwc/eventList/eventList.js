import { LightningElement, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getEventDetails from '@salesforce/apex/EventListController.getEventDetails';
import EVENT_IMAGE from '@salesforce/resourceUrl/EventImage';
import basePath from '@salesforce/community/basePath';
import isGuestUserApex from '@salesforce/apex/EventDetailController.isGuestUser';

export default class EventList extends NavigationMixin(LightningElement) {
    @track events = [];
    @track error;
    @track loading = false;
    @track isAllSelected = true;
    @track isFreeSelected = false;
    @track isPaidSelected = false;
    @track openModal = false;
    @track selectedEventId = null;
    @track selectedPriceFilter = 'All';
    @track searchName = '';
    @track searchCity = '';
    @track imageUrl = EVENT_IMAGE;
    @track isGuestUser = false;
    @track offset = 0;
    @track limitSize = 6;
    @track showMoreButton = true;
    @track showFilterSection = false;
    @track isLoaded = false;

    connectedCallback() {
        this.checkGuestStatus();
        this.loadEvents(false);
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

    loadEvents(append = false) {
        this.loading = true;
        getEventDetails({
            priceFilter: this.selectedPriceFilter,
            limitSize: this.limitSize,
            offsetSize: this.offset,
            nameFilter: this.searchName
        })
        .then(result => {
            const baseIndex = append ? this.events.length : 0;
            const formatted = (result || []).map((event, idx) => {
                const priceValue = event.Price != null ? Number(event.Price) : 0;
                let formattedDateTime = '';
                if (event.EventDate) {
                    const dateObj = new Date(event.EventDate);
                    const optionsDay = { weekday: 'short' };
                    const optionsMonth = { month: 'short' };
                    const day = dateObj.toLocaleDateString('en-US', optionsDay);
                    const date = dateObj.getDate();
                    const month = dateObj.toLocaleDateString('en-US', optionsMonth);
                    let hours = dateObj.getHours();
                    const minutes = dateObj.getMinutes();
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    hours = hours % 12;
                    hours = hours ? hours : 12;
                    const formattedTime = minutes === 0 ? `${hours}${ampm}` : `${hours}:${minutes < 10 ? '0' + minutes : minutes}${ampm}`;
                    formattedDateTime = `${day} ${date} ${month}, ${formattedTime}`;
                }

                const overallIndex = baseIndex + idx;
                // First item = top recommended, second item = most popular
                const isTopRecommended = overallIndex === 0;
                const isPopular = overallIndex === 1;

                // Compose card class based on flags (avoid duplicate assignment)
                let cardClass = 'card';
                if (isTopRecommended || isPopular) {
                    cardClass = 'card recommended';
                }

                return {
                    ...event,
                    displayPrice: priceValue === 0 ? 'Free' : `₹${priceValue.toLocaleString()}`,
                    formattedDateTime,
                    cardClass,
                    isTopRecommended,
                    isPopular,
                    imageUrl: event.Image_URL__c || this.imageUrl
                };
            });

            if (append) {
                this.events = [...this.events, ...formatted];
                this.offset += formatted.length;
            } else {
                this.events = formatted;
                this.offset = formatted.length;
            }

            this.showMoreButton = (formatted.length === this.limitSize);

            // small UI fade-in effect flag (optional)
            setTimeout(() => {
                this.events = this.events.map(evt => ({ ...evt, fadeIn: false }));
            }, 500);
        })
        .catch(err => {
            console.error('Error in getEventDetails', err);
            this.error = err?.body?.message || err?.message || JSON.stringify(err);
            this.events = [];
            this.showMoreButton = false;
            this.offset = 0;
        })
        .finally(() => {
            this.loading = false;
        });
    }

    showMore() {
        this.loadEvents(true);
    }

    onBookTicketsHandler(event) {
        const id = event.currentTarget?.dataset?.id || event.target?.dataset?.id;
        if (!id) return;
        this.openModal = true;
        this.selectedEventId = id;
    }

    onDetailsHandler(event) {
        const id = event.currentTarget?.dataset?.id || event.target?.dataset?.id;
        if (!id) return;
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: `${basePath}/event-detail?data=${btoa(id)}`
            }
        });
    }

    handleImageError(evt) {
        if (evt && evt.target) {
            evt.target.src = 'https://via.placeholder.com/300x180?text=No+Image';
        }
    }

    openRegistrationModal() {
        this.openModal = true;
    }

    closeModal() {
        this.openModal = false;
    }

    handleChildValue(event) {
        console.log('Received from child:', event.detail);
        this.closeModal();
    }

    toggleFilterSection() {
        this.showFilterSection = !this.showFilterSection;
    }

    renderedCallback() {
        if (this.isLoaded) return;
        const rootDiv = this.template.querySelector('div'); 
        if (rootDiv) { 
            this.isLoaded = true; 
            const style = document.createElement('style'); 
            style.innerText = `
                .orangecolor,
                .orangecolor button {
                    background-color: #FF7F50 !important;
                    color: #ffffff !important;
                }`;
            rootDiv.appendChild(style); 
        }
    }

    handlePricingTypeClick(event) {
        // find the button stateful element reliably
        let btn = null;
        try {
            btn = event.target && event.target.closest ? event.target.closest('lightning-button-stateful') : null;
        } catch (e) {
            // fallback
            btn = event.currentTarget;
        }
        if (!btn) btn = event.currentTarget;

        const clicked = btn.dataset.name;

        this.isAllSelected = false;
        this.isFreeSelected = false;
        this.isPaidSelected = false;

        this.template.querySelectorAll('lightning-button-stateful')
            .forEach(b => b.classList.remove('orangecolor'));

        if (clicked === 'free') {
            this.isFreeSelected = true;
            this.selectedPriceFilter = 'Free';
        } else if (clicked === 'paid') {
            this.isPaidSelected = true;
            this.selectedPriceFilter = 'Paid';
        } else {
            this.isAllSelected = true;
            this.selectedPriceFilter = 'All';
        }

        try { btn.classList.add('orangecolor'); } catch(e) {}

        this.offset = 0;
        this.showMoreButton = true;
        this.loadEvents(false);
    }

    handleNameSearch(event) {
        this.searchName = event.target.value;
        if (event.key === 'Enter') {
            this.offset = 0;
            this.events = [];
            this.showMoreButton = true;
            this.loadEvents(false);
        }
    }

    handleCitySearch(event) {
        this.searchCity = event.target.value;
        if (event.key === 'Enter') {
            this.offset = 0;
            this.events = [];
            this.showMoreButton = true;
            this.loadEvents(false);
        }
    }

    get hasEvents() {
        return Array.isArray(this.events) && this.events.length > 0;
    }

    get hasNoEvents() {
        const empty = !Array.isArray(this.events) || this.events.length === 0;
        return !this.loading && empty;
    }

    get noError() {
        return !this.error;
    }

}
