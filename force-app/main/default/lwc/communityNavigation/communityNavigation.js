import { LightningElement, wire, track } from 'lwc';
import isCommunityUser from '@salesforce/apex/CommunityUserChecker.isCommunityUser';
import { NavigationMixin } from 'lightning/navigation';

export default class CommunityNavigation extends NavigationMixin(LightningElement) {
    @track showNavigation = false;

    @wire(isCommunityUser)
    wiredUser({ error, data }) {
        if (data) {
            this.showNavigation = data;
        } else if (error) {
            console.error('Error checking user type:', error);
        }
    }

    navigateToPage(event) {
        const pageName = event.currentTarget.dataset.page;
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                name: pageName
            }
        });
    }
}
