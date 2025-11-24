public without sharing class BookingHistoryDataController {

    @AuraEnabled
    public static List<Map<String, Object>> getBookingHistory(String email) {
        List<Map<String, Object>> bookingHistory = new List<Map<String, Object>>();
        
        try {
            List<Event_Subscriber__c> bookings = [
                SELECT Id, Name, Event_Session__c, EventDetail__r.Name,
                        EventDetail__r.StartDateTime__c,Event_Session__r.Name,
                        EventDetail__c, EventDetail__r.Description__c, 
                        EventDetail__r.Venue__c,EventDetail__r.Image_URL__c,
                        TicketQR__c, HasAttended__c
                FROM Event_Subscriber__c 
                WHERE Contact__r.Email  = :email
                ORDER BY Event_Session__r.EventDetail__r.StartDateTime__c DESC
            ];
            
            for (Event_Subscriber__c booking : bookings) {
                Map<String, Object> bookingData = new Map<String, Object>();
                bookingData.put('id', booking.Id);
                bookingData.put('name', booking.Name);
                bookingData.put('sessionId', booking.Event_Session__c);
                bookingData.put('eventId', booking.Event_Session__r.EventDetail__c);
                bookingData.put('eventName', booking.EventDetail__r.Name);
                bookingData.put('eventDescription', booking.EventDetail__r.Description__c);
                bookingData.put('eventImageUrl', booking.EventDetail__r.Image_URL__c);
                bookingData.put('eventStartDate', booking.EventDetail__r.StartDateTime__c);
                // bookingData.put('eventLocation', booking.Event_Session__r.EventDetail__r.Location__c);
                bookingData.put('eventVenue', booking.EventDetail__r.Venue__c);
                bookingData.put('ticketQR', booking.TicketQR__c);
                bookingData.put('hasAttended', booking.HasAttended__c);
                
                bookingHistory.add(bookingData);
            }
            
            return bookingHistory;
        } catch (Exception e) {
            throw new AuraHandledException('Error retrieving booking history: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static List<Map<String, Object>> getEventAttachments(String recordId) {
        List<Map<String, Object>> attachments = new List<Map<String, Object>>();
        
        try {
            List<ContentDocumentLink> contentLinks = [
                SELECT ContentDocumentId, LinkedEntityId
                FROM ContentDocumentLink
                WHERE LinkedEntityId = :recordId
            ];
            
            Set<Id> contentDocumentIds = new Set<Id>();
            for (ContentDocumentLink link : contentLinks) {
                contentDocumentIds.add(link.ContentDocumentId);
            }

            if (!contentDocumentIds.isEmpty()) {
                List<ContentVersion> contentVersions = [
                    SELECT Id, Title, FileExtension, ContentDocumentId
                    FROM ContentVersion
                    WHERE ContentDocumentId IN :contentDocumentIds
                    AND IsLatest = true
                ];
                
                for (ContentVersion version : contentVersions) {
                    Map<String, Object> attachment = new Map<String, Object>();
                    attachment.put('id', version.Id);
                    attachment.put('title', version.Title);
                    attachment.put('fileExtension', version.FileExtension);
                    attachment.put('contentDocumentId', version.ContentDocumentId);
                    
                    attachments.add(attachment);
                }
            }
            
            return attachments;
        } catch (Exception e) {
            throw new AuraHandledException('Error retrieving event attachments: ' + e.getMessage());
        }
    }
}