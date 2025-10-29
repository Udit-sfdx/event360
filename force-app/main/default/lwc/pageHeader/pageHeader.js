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
    @api firstButtonName;
    @api firstButtonLabel;
    @api secondButtonName;
    @api secondButtonLabel;

    handleButtonClick(e){
        const name = e.target.name;
        let url;

        if(name === 'login'){
           url = `${basePath}/login`;
        }
        else if(name === 'signUp'){
            url = `${basePath}/publisherreg`;
        }
        else if(name === 'addEvent'){
            url = `${basePath}/addevent`;
        }
        console.log('url', url);
        
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