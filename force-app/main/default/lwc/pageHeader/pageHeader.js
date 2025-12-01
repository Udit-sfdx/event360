import { LightningElement, api, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import basePath from '@salesforce/community/basePath';
import isGuestUserApex from '@salesforce/apex/EventDetailController.isGuestUser';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

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
    @track isSubmitting = false; // submission state for modal footer
    @track isSubmitDisabled = false;
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

    async handleRegisterEvent() {
        // call child component's public method submitRegistration()
        const child = this.template.querySelector('c-community-registration');
        if (!child || typeof child.submitRegistration !== 'function') {
            console.warn('c-community-registration not found or submitRegistration not exposed.');
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: 'Registration form not available.',
                variant: 'error'
            }));
            return;
        }

        try {
            this.isSubmitting = true;
            this.isSubmitDisabled = true;

            const result = await child.submitRegistration(); // resolves with contactId or result object
            this.dispatchEvent(new ShowToastEvent({
                title: 'Success',
                message: 'Organization registered successfully.',
                variant: 'success'
            }));

            // close modal after successful registration
            this.closeModal();

            // optional: if you want to navigate after registration, uncomment below:
            // this[NavigationMixin.Navigate]({ type: 'standard__webPage', attributes: { url: `${basePath}/` } });

            return result;
        } catch (err) {
            console.error('Error saving registration from modal footer:', err);
            this.dispatchEvent(new ShowToastEvent({
                title: 'Registration failed',
                message: (err && err.message) ? err.message : 'Something went wrong.',
                variant: 'error'
            }));
            throw err;
        } finally {
            this.isSubmitting = false;
            this.isSubmitDisabled = false;
        }
    }

    handleResetFromModal() {
        const child = this.template.querySelector('c-community-registration');
        if (child && typeof child.resetForm === 'function') {
            child.resetForm();
            this.dispatchEvent(new ShowToastEvent({
                title: 'Reset',
                message: 'Form cleared.',
                variant: 'info'
            }));
        } else {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Reset',
                message: 'Unable to reset (child method not found).',
                variant: 'warning'
            }));
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
