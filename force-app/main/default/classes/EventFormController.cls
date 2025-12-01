public with sharing class EventFormController {
    
    @AuraEnabled
    public static String getUserAccountId() {
        try {
            Id userId = UserInfo.getUserId();
            User currentUser = [SELECT ContactId FROM User WHERE Id = :userId LIMIT 1];
            if (currentUser.ContactId != null) {
                Contact userContact = [SELECT AccountId FROM Contact WHERE Id = :currentUser.ContactId LIMIT 1];
                if (userContact.AccountId != null) {
                    return userContact.AccountId;
                }
            }
            return null;
        } catch (Exception e) {
            throw new AuraHandledException('Error retrieving user account: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static String createEventDetail(String eventDetailJson , String eventSessionJSON,String fileJson) {
        try {
            Map<String, Object> eventDetailMap = (Map<String, Object>) JSON.deserializeUntyped(eventDetailJson);
            List<Object> eventSessionList = (List<Object>) JSON.deserializeUntyped(eventSessionJSON);
            Map<String, Object> sessionMap = (Map<String, Object>) eventSessionList[0];
            system.debug('Session Map => '+sessionMap);
            EventDetail__c newEvent = new EventDetail__c();
            newEvent.Account__c = (String) eventDetailMap.get('Account__c'); 
            newEvent.Name = (String) eventDetailMap.get('Name');
            newEvent.Subject__c = (String) eventDetailMap.get('Subject__c');
            newEvent.Description__c = (String) eventDetailMap.get('Description__c');
            // newEvent.StartDateTime__c = sessionMap.get('startDate') != null ? DateTime.valueOfGmt(((String) sessionMap.get('startTime')).replace('T', ' ').replace('Z', '')) : null;
            String dateStr = (String)sessionMap.get('startDate');
            String timeStr = (String)sessionMap.get('startTime');
            if (!String.isBlank(dateStr) && !String.isBlank(timeStr)) {
                timeStr = timeStr.replace('T',' ').replace('Z','').trim();
                if (timeStr.contains('.')) timeStr = timeStr.substring(0, timeStr.indexOf('.'));
                newEvent.StartDateTime__c  = DateTime.valueOfGmt(dateStr + ' ' + timeStr);
            } else {
                newEvent.StartDateTime__c  = null;
            }

            newEvent.DurationInMinutes__c = eventDetailMap.get('DurationInMinutes__c') != null ? Double.valueOf(eventDetailMap.get('DurationInMinutes__c')) : null;
            newEvent.Price__c = (Decimal) eventDetailMap.get('Price__c');
            newEvent.Type__c = (String) eventDetailMap.get('Type__c');
            // newEvent.Location__c = (String) eventDetailMap.get('Location__c');
            newEvent.Venue__c = (String) eventDetailMap.get('Venue__c');
            newEvent.isActive__c = ((String) eventDetailMap.get('Status__c') == 'Active');
            insert newEvent;
            System.debug('eventSessionJSON = > '+ eventSessionJSON);
            if(fileJson != null && !String.isBlank(fileJson)) {
                uploadFileToApex(newEvent.Id,fileJson);
            }
            createEventSession(newEvent.Id,eventSessionJSON);
            return newEvent.Id;
        } catch (Exception e) {
            throw new AuraHandledException('Error creating event: ' + e.getMessage());
        }
    } 

    private static void uploadFileToApex(String recordId, String fileJson) {
        try {

            Map<String, Object> fileMap = (Map<String, Object>) JSON.deserializeUntyped(fileJson);

            String fileName = (String) fileMap.get('fileName');
            String base64Data = (String) fileMap.get('base64Data');
            String contentType = (String) fileMap.get('contentType');

            if (String.isBlank(fileName) || String.isBlank(base64Data)) {
                throw new AuraHandledException('Invalid file data: missing file name or content.');
            }

            ContentVersion cv = new ContentVersion();
            cv.Title = fileName;
            cv.PathOnClient = fileName;
            cv.VersionData = EncodingUtil.base64Decode(base64Data);
            insert cv;

            ContentDocumentLink cdl = new ContentDocumentLink();
            cdl.ContentDocumentId = [
                SELECT ContentDocumentId 
                FROM ContentVersion 
                WHERE Id = :cv.Id
            ].ContentDocumentId;
            cdl.LinkedEntityId = recordId;
            cdl.ShareType = 'V';
            insert cdl;

        } catch (Exception ex) {
            System.debug('Error in uploadFileToApex: ' + ex.getMessage());
            throw new AuraHandledException('File upload failed: ' + ex.getMessage());
        }
    }

    
    private static void createEventSession(String eventId,String eventSessionJSON) {
        try{
            System.debug('eventSessionJSON = > '+ eventSessionJSON);
            System.debug('EventId = > '+ eventId);
            List<Object> eventSessionList = (List<Object>) JSON.deserializeUntyped(eventSessionJSON);
            List<Event_Session__c> newEventSessionList = new List<Event_Session__c>();
            for (Object obj : eventSessionList) {
                Map<String, Object> sessionMap = (Map<String, Object>) obj;
                Event_Session__c newEventSession = new Event_Session__c();
                newEventSession.EventDetail__c = eventId;
                newEventSession.Name = (String) sessionMap.get('sessionName');
                newEventSession.Speaker__c = (String) sessionMap.get('speaker');
                // newEventSession.Start_Time__c = (sessionMap.get('startDate') != null && sessionMap.get('startTime') != null) ? DateTime.valueOfGmt((String)sessionMap.get('startDate') + ' ' + (String)sessionMap.get('startTime')) : null;
                String dateStr = (String)sessionMap.get('startDate');
                String timeStr = (String)sessionMap.get('startTime');
                if (!String.isBlank(dateStr) && !String.isBlank(timeStr)) {
                    timeStr = timeStr.replace('T',' ').replace('Z','').trim();
                    if (timeStr.contains('.')) timeStr = timeStr.substring(0, timeStr.indexOf('.'));
                    newEventSession.Start_Time__c = DateTime.valueOfGmt(dateStr + ' ' + timeStr);
                } else {
                    newEventSession.Start_Time__c = null;
                }

                newEventSession.Duration__c = (String) sessionMap.get('duration');
                newEventSession.Price__c = sessionMap.get('price') != null ? Decimal.valueOf(String.valueOf(sessionMap.get('price'))) : null;
                newEventSessionList.add(newEventSession);
            }
            if(!newEventSessionList.isEmpty()) {
                insert newEventSessionList;
            }
        } catch(Exception e) {
            System.debug('Error creating event sessions: ' + e.getMessage());
        }
    }

}