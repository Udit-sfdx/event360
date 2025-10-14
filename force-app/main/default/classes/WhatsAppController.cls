public with sharing class WhatsAppController {
    @future(callout=true)
    public static void sendWhatsAppMessage(String recipientPhone) {

        WhatsAppGraphApiServiceRequest req = new WhatsAppGraphApiServiceRequest();
        req.recipientPhone = recipientPhone;
        HttpResponse res = WhatsAppGraphApiService.sendTextMessage(req);
    }

    @AuraEnabled
    public static List<Event_Subscriber__c >  methodName(){
        return [SELECT Id,name,TicketQR__c FROM Event_Subscriber__c Order By CreatedDate DESC LIMIT 1];
    }
}