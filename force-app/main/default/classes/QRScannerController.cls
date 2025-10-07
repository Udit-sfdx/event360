public with sharing class QRScannerController {
    @AuraEnabled
    public static String markAttendance(String ticketQrValue) {
        if (String.isBlank(ticketQrValue)) {
            return 'Invalid QR Code';
        }

        // normalize scanned value
        ticketQrValue = ticketQrValue.trim();

        try {
            // If TicketQR__c is a rich text or contains HTML, LIKE with % helps find embedded values.
            // If you have a plain text field (recommended) named TicketQR_Text__c, replace condition with = :ticketQrValue
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
