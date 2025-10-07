import { LightningElement, track } from 'lwc';
import markAttendance from '@salesforce/apex/QRScannerController.markAttendance';

export default class QrAttendanceScanner extends LightningElement {
    @track scannedValue = '';
    @track resultMessage = '';

    handleSuccess(event) {
        // inspect the whole event first
        console.log('barcode success event:', event);

        // most docs and examples show the scanned value on event.detail.value
        const value = event?.detail?.value ?? event?.detail ?? null;
        console.log('scanned raw value:', value);

        if (!value) {
            this.resultMessage = 'No scanned value returned by scanner.';
            return;
        }

        this.scannedValue = value;
        this.resultMessage = 'Processing...';

        markAttendance({ ticketQrValue: this.scannedValue })
            .then(result => {
                console.log('Apex result:', result);
                this.resultMessage = result || 'Attendance marked successfully';
            })
            .catch(error => {
                console.error('Apex error:', error);
                // try to show a friendly message
                const msg = error?.body?.message ?? error?.message ?? JSON.stringify(error);
                this.resultMessage = 'Error: ' + msg;
            });
    }

    handleError(event) {
        console.error('scanner error event:', event);
        const msg = event?.detail?.message ?? JSON.stringify(event);
        this.resultMessage = 'Scanning failed: ' + msg;
    }
}
