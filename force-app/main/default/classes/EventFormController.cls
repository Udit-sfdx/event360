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
    public static String createEventDetail(String eventDetailJson) {
        try {
            Map<String, Object> eventDetailMap = (Map<String, Object>) JSON.deserializeUntyped(eventDetailJson);
            System.debug('event Detail Map--> '+ JSON.serializePretty(eventDetailMap));
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
            // newEvent.Image_URL__c = (String) eventDetailMap.get('Image_URL__c');
            newEvent.isActive__c = ((String) eventDetailMap.get('Status__c') == 'Active');
            insert newEvent;
            
            return newEvent.Id;
        } catch (Exception e) {
            throw new AuraHandledException('Error creating event: ' + e.getMessage());
        }
    }
}