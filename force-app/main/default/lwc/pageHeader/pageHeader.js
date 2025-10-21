import { LightningElement, api } from 'lwc';

export default class PageHeader extends LightningElement {
    // Banner properties
    @api title;
    @api subtitle;
    @api backgroundResource; // expects Static Resource name
    @api backgroundFile = 'banner.jpg'; // optional, file inside the static resource
    @api bannerHeight = '500'; // default height in pixels
    
    // Logo properties
    @api logoResource; // Static resource name for the logo
    
    // Computed properties
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
    
    // Event handlers for login and signup buttons
    handleLogin() {
        // Handle login button click
        this.dispatchEvent(new CustomEvent('login'));
    }
    
    handleSignup() {
        // Handle signup button click
        this.dispatchEvent(new CustomEvent('signup'));
    }
}