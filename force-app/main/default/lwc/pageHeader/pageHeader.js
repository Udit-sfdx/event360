import { LightningElement, api, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import basePath from '@salesforce/community/basePath';
import isGuestUserApex from '@salesforce/apex/EventDetailController.isGuestUser';

export default class PageHeader extends NavigationMixin(LightningElement) {
    @api title;
    @api subtitle;
    @api backgroundResource; 
    @api backgroundFile = 'banner.jpg'; 
    @api bannerHeight = '500';
    @api logoResource; 
    @api firstButtonName;
    @api firstButtonLabel;
    @api secondButtonName;
    @api secondButtonLabel;
    @track openModal = false;
    @track isBookingHistory = false;
    @track openModalForAddEvent = false;
    @track isSpinnerLoading = false;
    isGuestUser = false;

    connectedCallback() {
        this.checkGuestStatus();
    }

    handleButtonClick(e){
        console.log('Event => ',JSON.stringify(e));
        
        const name = e.target.name;
        let url;

        if(name === 'login'){
           url = `${basePath}/login`;
        }
        else if(name === 'signUp'){
            this.openModal = true;
        }
        else if(name === 'addEvent'){
            this.isSpinnerLoading = true;
            setTimeout(() => {
                this.isSpinnerLoading= false;
                this.openModalForAddEvent = true;
            }, 2000);
            
        }
        
        if(url != undefined){
            this[NavigationMixin.Navigate]({
                type : 'standard__webPage',
                attributes: {
                    url: url,
                },
            })
        }
        console.log('log', name);

        if(name === 'logout'){
            this[NavigationMixin.Navigate]({
            type : 'comm__loginPage',
            attributes: {
                actionName: 'logout'
            },
        })
        }
    }

    checkGuestStatus() {
        isGuestUserApex()
            .then(result => {
                console.log('Result is guest user => ',JSON.stringify(result));
                this.isGuestUser = !!result;
            })
            .catch(error => {
                console.error('Error checking guest status', error);
                this.isGuestUser = false;
            });
    }

    handlePreviousBooking() {
        this.isBookingHistory = true;
    }

    navigateToHome() {
        this[NavigationMixin.Navigate]({
            type: 'standard__namedPage',
            attributes: {
                pageName: 'home'
            }
        });
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
        this.openModalForAddEvent = false;
        this.isBookingHistory = false;
    }

    get showBanner() {
        return this.title || this.subtitle;
    }
    
    get backgroundStyle() {
        const bgImage = `background-image: url('/sfsites/c/resource/${this.backgroundResource}/${this.backgroundFile}');`;
        const height = `height: ${this.bannerHeight}px;`;
        return `${bgImage} ${height}`;
    }
    
    get logoUrl() {
        return `/sfsites/c/resource/${this.logoResource}`;
    }
}