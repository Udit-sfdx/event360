public without sharing class EventListController {
    
    // Wrapper for returning event details with date + time separated
    public class EventWrapper {
        @AuraEnabled public Id Id { get; set; }
        @AuraEnabled public String Name { get; set; }
        @AuraEnabled public Date EventDate { get; set; }
        @AuraEnabled public String EventTime { get; set; }
        @AuraEnabled public String Venue { get; set; }
        @AuraEnabled public String Price { get; set; }
        @AuraEnabled public String Description { get; set; }
        @AuraEnabled public String ImageUrl { get; set; }
    }
    
    @AuraEnabled(cacheable=true)
    public static List<EventWrapper> getEventDetails() {
        String userId = UserInfo.getUserId();
        List<User> userDetail  = [SELECT Id,AccountId,Account.Name FROM User WHERE Id =:userId AND profile.name = 'Customer Community Plus Login User Publisher'];
        System.debug('AccountId => '+userDetail);
        List<EventDetail__c> evtDetail = new List<EventDetail__c>(); 
        if(userDetail.isEmpty()) {
            evtDetail = [
                SELECT Id, Name, StartDateTime__c, Venue__c, Price__c, Description__c, Image_URL__c 
                FROM EventDetail__c 
                WHERE isActive__c = true
            ];
        }
        else{
            evtDetail = [
                SELECT Id, Name, StartDateTime__c, Venue__c, Price__c, Description__c, Image_URL__c,Account__c  
                FROM EventDetail__c 
                WHERE isActive__c = true AND Account__c =:userDetail[0].accountId
            ];
        }
        
        
        List<EventWrapper> results = new List<EventWrapper>();
        
        for (EventDetail__c ev : evtDetail) {
            EventWrapper wrap = new EventWrapper();
            wrap.Id = ev.Id;
            wrap.Name = ev.Name;
            
            if (ev.StartDateTime__c != null) {
                wrap.EventDate = ev.StartDateTime__c.date(); // Extract Date
                wrap.EventTime = ev.StartDateTime__c.format('HH:mm'); // Extract Time as String
            }
            
            wrap.Venue = ev.Venue__c;
            wrap.Price = ev.Price__c;
            wrap.Description = ev.Description__c;
            wrap.ImageUrl = ev.Image_URL__c;
            
            results.add(wrap);
        }
        
        return results;
    }
}
