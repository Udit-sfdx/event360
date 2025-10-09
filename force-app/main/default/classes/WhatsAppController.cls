public with sharing class WhatsAppController {
    @future(callout=true)
    public static void sendWhatsAppMessage(String recipientPhone) {

        WhatsAppGraphApiServiceRequest req = new WhatsAppGraphApiServiceRequest();
        req.recipientPhone = recipientPhone;
        HttpResponse res = WhatsAppGraphApiService.sendTextMessage(req);
    }
}