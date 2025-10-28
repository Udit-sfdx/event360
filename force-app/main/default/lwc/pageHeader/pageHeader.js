import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import basePath from '@salesforce/community/basePath';

export default class PageHeader extends NavigationMixin(LightningElement) {
    @api title;
    @api subtitle;
    @api backgroundResource; 
    @api backgroundFile = 'banner.jpg'; 
    @api bannerHeight = '500';
    @api logoResource; 
    
    handleLogin() {
    this[NavigationMixin.Navigate]({
            type : 'standard__webPage',
            attributes: {
                url: `${basePath}/login`,
            },
        })
    }
    
    handleSignup() {
    this[NavigationMixin.Navigate]({
            type : 'standard__webPage',
            attributes: {
                url: `${basePath}/publisherreg`,
            },
        })
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