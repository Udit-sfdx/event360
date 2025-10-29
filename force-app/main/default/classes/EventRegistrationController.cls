public without sharing class EventRegistrationController {

    public class RegistrationWrapper {
        @AuraEnabled public String firstName { get; set; }
        @AuraEnabled public String lastName { get; set; }
        @AuraEnabled public String email { get; set; }
        @AuraEnabled public String phone { get; set; }
        @AuraEnabled public String skills { get; set; }
        @AuraEnabled public String eventSession { get; set; }
        @AuraEnabled public Integer quantity { get; set; }
        @AuraEnabled public String company { get; set; }
        @AuraEnabled public String eventId { get; set; }
    }

    @AuraEnabled
    public static Void saveRegistration(RegistrationWrapper registrationEventDetail) {
        try {
            System.debug('registrationEventDetail => '+ registrationEventDetail);
            String recordTypeId = [SELECT id,name FROM RecordType where DeveloperName  = 'Subscriber_Contact' LIMIT 1].Id;

            Contact con = new Contact();       
            con.FirstName = registrationEventDetail.firstName;
            con.LastName = registrationEventDetail.lastName;
            con.Email = registrationEventDetail.email;
            con.MobilePhone = registrationEventDetail.phone;
            con.RecordTypeId = recordTypeId;
            insert con;

            Event_Subscriber__c reg = new Event_Subscriber__c();
            reg.Contact__c = con.Id;
            reg.EventDetail__c = registrationEventDetail.eventId;
            // reg.Quantity__c = (registrationEventDetail.quantity == null || registrationEventDetail.quantity < 1) ? 1 : registrationEventDetail.quantity;
            // reg.Company__c = registrationEventDetail.company;
            if (registrationEventDetail.eventSession != null) {
                reg.Event_Session__c = registrationEventDetail.eventSession;
            }
            if (registrationEventDetail.eventId != null) {
                reg.EventDetail__c = registrationEventDetail.eventId;
            }

            insert  reg ;

        } catch (Exception ex) {
            // throw new Exception(ex);
        }
    }


    @AuraEnabled
    public static List<Event_Session__c> getSessionsForEvent(Id eventId) {
        if (eventId == null) {
            return new List<Event_Session__c>();
        }
        return [SELECT Id, Name,Speaker__c,EventDetail__c FROM Event_Session__c WHERE EventDetail__c  = :eventId];
    }

}
