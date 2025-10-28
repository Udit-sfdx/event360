public without sharing class EventDetailController {

    public class EventWrapper {
        @AuraEnabled public Id Id { get; set; }
        @AuraEnabled public String Name { get; set; }
        @AuraEnabled public Date EventDate { get; set; }
        @AuraEnabled public String EventTime { get; set; }
        @AuraEnabled public String Venue { get; set; }
        @AuraEnabled public Decimal Price { get; set; }
        @AuraEnabled public String Description { get; set; }
        @AuraEnabled public String ImageUrl { get; set; }
        @AuraEnabled public Decimal Duration { get; set; }
    }

    @AuraEnabled
    public static EventWrapper getEventDetail(String eventId) {
        if(eventId == null) {
            return null;
        }

        System.debug('Event Id => '+eventId);
        EventDetail__c evtDetail = [SELECT Id, Name, StartDateTime__c, Venue__c, Price__c, Description__c, Image_URL__c,DurationInMinutes__c FROM EventDetail__c WHERE Id = :eventId ];
        System.debug('Event Id => '+ evtDetail);
        EventWrapper evt = new EventWrapper();
        evt.Id = evtDetail.Id;
        evt.Name = evtDetail.Name;
        evt.EventDate = evtDetail.StartDateTime__c.date();
        evt.EventTime = evtDetail.StartDateTime__c.format('HH:mm');
        evt.Venue = evtDetail.Venue__c;
        evt.Price = evtDetail.Price__c;
        evt.Description = evtDetail.Description__c;
        evt.ImageUrl = evtDetail.Image_URL__c;
        evt.Duration = evtDetail.DurationInMinutes__c;
        return evt;
    }
}