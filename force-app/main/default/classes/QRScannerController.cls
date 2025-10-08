public with sharing class QRScannerController {
    @AuraEnabled
    public static String markAttendance(String ticketQrValue) {
        System.debug('TicketQrValue => '+ ticketQrValue);
        if (String.isBlank(ticketQrValue)) {
            return 'Invalid QR Code';
        }
        ticketQrValue = ticketQrValue.trim();

        try {
            List<Event_Subscriber__c> subs = [
                SELECT Id, HasAttended__c, TicketQR__c
                FROM Event_Subscriber__c
                WHERE TicketQR__c LIKE :('%' + ticketQrValue + '%')
                LIMIT 1
            ];

            if (subs.isEmpty()) {
                return 'No matching Event Subscriber found for scanned QR';
            }

            Event_Subscriber__c subscriber = subs[0];

            if (subscriber.HasAttended__c == true) {
                return 'Attendance was already marked for Subscriber: ' + subscriber.Id;
            }

            subscriber.HasAttended__c = true;
            update subscriber;

            return 'Attendance marked successfully for Subscriber: ' + subscriber.Id;

        } catch (DmlException dmx) {
            return 'DML error: ' + dmx.getMessage();
        } catch (Exception ex) {
            return 'Error: ' + ex.getMessage();
        }
    }
}
