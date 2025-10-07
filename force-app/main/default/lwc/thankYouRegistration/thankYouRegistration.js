import { LightningElement } from 'lwc';
import URL from '@salesforce/resourceUrl/image';
import { NavigationMixin } from "lightning/navigation";


export default class ThankYouRegistration extends NavigationMixin(LightningElement) {
    imageUrl = URL;

    handleBack(){
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: '/',
            },
        });
    }
}   