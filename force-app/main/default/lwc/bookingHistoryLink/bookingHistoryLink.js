import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class BookingHistoryLink extends NavigationMixin(LightningElement) {
    @api linkText = 'Want to view your past booking details? Click here';
    
    navigateToBookingHistory() {
        
        this[NavigationMixin.Navigate]({
                type: 'comm__namedPage',
                attributes: {
                    name: 'BookingHistory__c'
                },
            })
    }
}