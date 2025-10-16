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
    public static String createEventDetail(String eventDetailJson , String eventSessionJSON) {
        try {
            Map<String, Object> eventDetailMap = (Map<String, Object>) JSON.deserializeUntyped(eventDetailJson);
            EventDetail__c newEvent = new EventDetail__c();
            newEvent.Name = (String) eventDetailMap.get('Name');
            newEvent.Subject__c = (String) eventDetailMap.get('Subject__c');
            newEvent.Description__c = (String) eventDetailMap.get('Description__c');
            newEvent.StartDateTime__c = eventDetailMap.get('StartDateTime__c') != null ? DateTime.valueOfGmt(((String) eventDetailMap.get('StartDateTime__c')).replace('T', ' ').replace('Z', '')) : null;
            newEvent.DurationInMinutes__c = eventDetailMap.get('DurationInMinutes__c') != null ? Double.valueOf(eventDetailMap.get('DurationInMinutes__c')) : null;
            newEvent.Price__c = eventDetailMap.get('Price__c') != null ? String.valueOf(eventDetailMap.get('Price__c')) : null;
            newEvent.Type__c = (String) eventDetailMap.get('Type__c');
            // newEvent.Location__c = (String) eventDetailMap.get('Location__c');
            newEvent.Venue__c = (String) eventDetailMap.get('Venue__c');
            newEvent.isActive__c = ((String) eventDetailMap.get('Status__c') == 'Active');
            insert newEvent;

            createEventSession(newEvent.Id,eventSessionJSON);
            return newEvent.Id;
        } catch (Exception e) {
            throw new AuraHandledException('Error creating event: ' + e.getMessage());
        }
    } 
    
    private static void createEventSession(String eventId,String eventSessionJSON) {
        try{
            List<Object> eventSessionList = (List<Object>) JSON.deserializeUntyped(eventSessionJSON);
            List<Event_Session__c> newEventSessionList = new List<Event_Session__c>();

            for (Object obj : eventSessionList) {
                Map<String, Object> sessionMap = (Map<String, Object>) obj;
                Event_Session__c newEventSession = new Event_Session__c();
                newEventSession.EventDetail__c = eventId;
                newEventSession.Name = (String) sessionMap.get('Name');
                newEventSession.Speaker__c = (String) sessionMap.get('speaker');
                newEventSession.Start_Time__c = sessionMap.get('startDime') != null ? DateTime.valueOfGmt(((String) sessionMap.get('startDime')).replace('T', ' ').replace('Z', '')) : null;
                newEventSession.Duration__c = (String) sessionMap.get('duration');
                newEventSession.Price__c = sessionMap.get('Price__c') != null ? Decimal.valueOf(String.valueOf(sessionMap.get('Price__c'))) : null;
                newEventSessionList.add(newEventSession);
            }
            if(!newEventSessionList.isEmpty()) {
                insert newEventSessionList;
            }
        } catch(Exception e) {
            System.debug('Error creating event sessions: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static string uploadFile(String eventId,String recordId,String fileName,String base64Data,String contentType){
        
    }
}