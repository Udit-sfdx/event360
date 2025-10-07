import { LightningElement } from 'lwc';
import { getBarcodeScanner } from 'lightning/mobileCapabilities';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class BarcodeScanner extends LightningElement {
    scannedBarcode = '';
    scanButtonDisabled = false; 
    
    connectedCallback() {
        this.myScanner = getBarcodeScanner(); 
        if (this.myScanner == null || !this.myScanner.isAvailable()) {
            this.scanButtonDisabled = true;
        }
    }

    handleBarcodeClick(event){ 
        this.scannedBarcode = '';
        if(this.myScanner.isAvailable() || this.myScanner != null) {
            
            const scanningOptions = {
                barcodeTypes: [this.myScanner.barcodeTypes.QR, 
                                this.myScanner.barcodeTypes.UPC_E,
                                this.myScanner.barcodeTypes.EAN_13,
                                this.myScanner.barcodeTypes.CODE_39 ],
                instructionText: 'Scan a QR , UPC , EAN 13, Code 39',
                successText: 'Scanning complete.'
            }; 
            this.myScanner.beginCapture(scanningOptions)
            .then((result) => { 

                this.scannedBarcode = result.value;  
                console.log('scannedBarcode => ',this.scannedBarcode);
            })
            .catch((error) => { 
                this.showError('error',error);
            })
            .finally(() => {
                this.myScanner.endCapture();
            }); 
        }else {

            const event = new ShowToastEvent({
                title: 'Error',
                message: 'This Device does not support a scanner.',
                error : 'error'
            });
            this.dispatchEvent(event);
        }
    }

}