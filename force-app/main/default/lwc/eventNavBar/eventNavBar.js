import { LightningElement, track } from 'lwc';

export default class EventNavbar extends LightningElement {
    @track activeTab = 'for-you';
    @track searchValue = '';
    city = 'Gurugram';
    region = 'Haryana';

    tabClassFor(name) {
        return `tab ${this.activeTab === name ? 'active' : ''}`;
    }

    handleTabClick(e) {
        const tab = e.currentTarget.dataset.tab;
        this.activeTab = tab;
        // dispatch event if parent wants to react
        this.dispatchEvent(new CustomEvent('tabchange', { detail: { tab } }));
    }

    handleSearchInput(e) {
        this.searchValue = e.target.value;
    }

    handleKeyDown(e) {
        if (e.key === 'Enter') {
            this.dispatchEvent(new CustomEvent('search', { detail: { q: this.searchValue } }));
        }
    }

    handleLocationClick() {
        this.dispatchEvent(new CustomEvent('openlocation'));
    }

    handleLogin() {
        this.dispatchEvent(new CustomEvent('login'));
    }

    handleSignup() {
        this.dispatchEvent(new CustomEvent('signup'));
    }

    handleProfile() {
        this.dispatchEvent(new CustomEvent('profile'));
    }

    handleMicClick() {
        // placeholder: integrate voice later
        this.dispatchEvent(new CustomEvent('voice'));
    }
}