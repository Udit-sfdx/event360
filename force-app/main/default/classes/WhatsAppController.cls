public with sharing class WhatsAppController {
    @AuraEnabled
    public static void sendWhatsAppMessage(String recipientPhone) {
        WhatsAppGraphApiServiceRequest req = new WhatsAppGraphApiServiceRequest();
        req.recipientPhone = recipientPhone;
        HttpResponse res = WhatsAppGraphApiService.sendTextMessage(req);
    }
}