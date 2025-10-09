public with sharing class WhatsAppGraphApiService {

    public static HttpResponse sendTextMessage(WhatsAppGraphApiServiceRequest request) {

        List<Event_Subscriber__c> eventSubdetail = [SELECT Id,name,TicketQR__c FROM Event_Subscriber__c Order By CreatedDate DESC LIMIT 1];
        String recipientPhone = request.recipientPhone;
        String textBody = request.textBody;
        String endpoint = 'https://graph.facebook.com/' + 'v22.0' + '/' + '802604299598954' + '/messages';
        HttpRequest req = new HttpRequest();
        req.setEndpoint(endpoint);
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setHeader('Authorization', 'Bearer ' + 'EAAZAZAmhcrsNYBPZAaZAd79w8QZBbEsSBETCXkWA8baVa9ZA8rpr0ZAeLaC1XCZAb1MFs0wdEcfCHWhyJy2Yv8pp5p9VcTdByJzZAl2km8nA5QltUvAejKmDurthUmtfEefMTMG3MnYe8x5SbOQxNRdOYNG0mTbQh1VlM5SOsWOM55PmSukMMJYyjzmZBUG4C97gZDZD');

        String link = eventSubdetail[0].TicketQR__c.replace('&amp;', '&');
        String message = (String.isBlank(textBody)) ? 'Welcome to Thinkvibes \n ' + 'Here is your Booking Id - ' + eventSubdetail[0].name + ' \n Qr for entry \n' +  link.replaceAll('.*src="([^"]+)".*', '$1') : textBody;

        Map<String, Object> payload = new Map<String, Object>{
            'messaging_product' => 'whatsapp',
            'to' => recipientPhone,
            'type' => 'text',
            'text' => new Map<String, Object>{ 'body' => message }
        };
        req.setBody(JSON.serialize(payload));

        Http http = new Http();
        HttpResponse res;
        try {
            res = http.send(req);
            System.debug('WhatsApp API response: ' + res.getStatus() + ' | ' + res.getBody());
            return res;
        } catch(Exception e) {
            System.debug('Callout failed: ' + e.getMessage());
            throw e;
        }
    }
}