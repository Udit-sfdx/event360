public with sharing class EventRegistrationController {

    public class RegistrationWrapper {
        @AuraEnabled public String firstName { get; set; }
        @AuraEnabled public String lastName { get; set; }
        @AuraEnabled public String email { get; set; }
        @AuraEnabled public String phone { get; set; }
        @AuraEnabled public String skills { get; set; }
        @AuraEnabled public String eventSession { get; set; }
        @AuraEnabled public Integer quantity { get; set; }
        @AuraEnabled public String company { get; set; }
    }

    @AuraEnabled
    public static Id saveRegistration(RegistrationWrapper wrapper) {
        try {
            Event_Registration__c reg = new Event_Registration__c();
            reg.First_Name__c = wrapper.firstName;
            reg.Last_Name__c = wrapper.lastName;
            reg.Email__c = wrapper.email;
            reg.Phone__c = wrapper.phone;
            reg.Skills__c = wrapper.skills;
            reg.Event_Session__c = wrapper.eventSession;
            reg.Quantity__c = wrapper.quantity;
            reg.Company__c = wrapper.company;

            insert reg;
            return reg.Id;

        } catch (Exception e) {
            throw new AuraHandledException('Error saving registration: ' + e.getMessage());
        }
    }
}
