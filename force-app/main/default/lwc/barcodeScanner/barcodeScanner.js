import { LightningElement, track } from 'lwc';
import markAttendance from '@salesforce/apex/QRScannerController.markAttendance';

export default class QrAttendanceScanner extends LightningElement {
    @track scannedValue;
    @track resultMessage;

    handleSuccess(event) {
        this.scannedValue = event.detail.value;
        
        markAttendance({ ticketQrValue: this.scannedValue })
            .then(result => {
                this.resultMessage = result;
            })
            .catch(error => {
                this.resultMessage = 'Error: ' + JSON.stringify(error);
            });
    }

    handleError(event) {
        this.resultMessage = 'Scanning failed: ' + event.detail.message;
    }
}
