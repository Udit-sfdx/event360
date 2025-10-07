import { LightningElement,api } from 'lwc';

export default class Footer extends LightningElement {
    @api language = 'en';


    get year() {
        return new Date().getFullYear();
    }


    handleLangChange(event) {
        this.language = event.target.value;
        // dispatch a custom event so parent can react to language change
        this.dispatchEvent(new CustomEvent('languagechange', { detail: { language: this.language } }));
    }
}