import { LightningElement } from 'lwc';
import headerImage from '@salesforce/resourceUrl/HomePageBanner'; 

export default class HomePageBanner extends LightningElement {
    imageUrl = headerImage;
}