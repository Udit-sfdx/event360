import { LightningElement, api } from 'lwc';
import headerImage from '@salesforce/resourceUrl/HomePageBanner';

export default class ThemeLayout extends LightningElement {
    imageURL = headerImage;
    // @api footerBg;
    // @api mainBg;
    // @api textColor;

    // connectedCallback() {
    //     if (this.headerBg) this.template.host.style.setProperty('--header-bg', this.headerBg);
    //     if (this.footerBg) this.template.host.style.setProperty('--footer-bg', this.footerBg);
    //     if (this.mainBg) this.template.host.style.setProperty('--main-bg', this.mainBg);
    //     if (this.textColor) this.template.host.style.setProperty('--text-color', this.textColor);
    // }
}
