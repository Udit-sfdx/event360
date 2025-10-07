/**
 * Controller for the eventForm Lightning Web Component
 * Handles retrieving the current user's account and creating event details
 */
public with sharing class EventFormController {
    
    /**
     * Get the Account ID of the current user
     * @return String The Account ID associated with the current user
     */
    @AuraEnabled
    public static String getUserAccountId() {
        try {
            // Get the current user's ID
            Id userId = UserInfo.getUserId();
            
            // Query for the Contact associated with the current user
            User currentUser = [SELECT ContactId FROM User WHERE Id = :userId LIMIT 1];
            
            if (currentUser.ContactId != null) {
                // Query for the Account associated with the Contact
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
    
    /**
     * Create a new EventDetail__c record
     * @param eventDetailJson JSON string representation of the EventDetail__c record
     * @return String The ID of the created EventDetail__c record
     */
    @AuraEnabled
    public static String createEventDetail(String eventDetailJson) {
        try {
            // Deserialize the JSON string into a map
            Map<String, Object> eventDetailMap = (Map<String, Object>) JSON.deserializeUntyped(eventDetailJson);
            System.debug('event Detail Map--> '+ JSON.serializePretty(eventDetailMap));
            // Create a new EventDetail__c record
            EventDetail__c newEvent = new EventDetail__c();
            
            // Set the fields from the map
            newEvent.Name = (String) eventDetailMap.get('name');

            newEvent.Subject__c = (String) eventDetailMap.get('subject');
            newEvent.Description__c = (String) eventDetailMap.get('description');
            
            // Handle date conversion
            if (eventDetailMap.get('startDateTime') != null) {
                newEvent.StartDateTime__c = DateTime.valueOfGmt(((String) eventDetailMap.get('startDateTime')).replace('T', ' ').replace('Z', ''));
            }
            
            // Handle numeric fields
            if (eventDetailMap.get('durationInMinutes') != null) {
                newEvent.DurationInMinutes__c = Double.valueOf(eventDetailMap.get('durationInMinutes'));
            }
            
            if (eventDetailMap.get('price') != null) {
                newEvent.Price__c = String.valueOf(eventDetailMap.get('price'));
            }
            
            newEvent.Type__c = (String) eventDetailMap.get('type');
            // newEvent.Location__c = (String) eventDetailMap.get('Location__c');
            newEvent.Venue__c = (String) eventDetailMap.get('venue');
            newEvent.Image_URL__c = (String) eventDetailMap.get('Image_URL__c');
            newEvent.IsAllDayEvent__c = (Boolean) eventDetailMap.get('isAllDayEvent');
            newEvent.isActive__c = (Boolean) eventDetailMap.get('isActive');
            
            // Set the Account relationship
            if (eventDetailMap.get('Account__c') != null) {
                newEvent.Account__c = (String) eventDetailMap.get('Account__c');
            } else {
                // If no account was provided, try to get the current user's account
                String accountId = getUserAccountId();
                if (accountId != null) {
                    newEvent.Account__c = accountId;
                }
            }
            
            // Insert the record with sharing rules enforced
            insert newEvent;
            
            return newEvent.Id;
        } catch (Exception e) {
            throw new AuraHandledException('Error creating event: ' + e.getMessage());
        }
    }
}