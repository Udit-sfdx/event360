public with sharing class WhatsAppGraphApiService {

    public static HttpResponse sendTextMessage(WhatsAppGraphApiServiceRequest request) {
        String recipientPhone = request.recipientPhone;
        String textBody = request.textBody;
        String endpoint = 'https://graph.facebook.com/' + 'v22.0' + '/' + '802604299598954' + '/messages';
        HttpRequest req = new HttpRequest();
        req.setEndpoint(endpoint);
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setHeader('Authorization', 'Bearer ' + 'EAAZAZAmhcrsNYBPZAaZAd79w8QZBbEsSBETCXkWA8baVa9ZA8rpr0ZAeLaC1XCZAb1MFs0wdEcfCHWhyJy2Yv8pp5p9VcTdByJzZAl2km8nA5QltUvAejKmDurthUmtfEefMTMG3MnYe8x5SbOQxNRdOYNG0mTbQh1VlM5SOsWOM55PmSukMMJYyjzmZBUG4C97gZDZD');

        String message = (String.isBlank(textBody)) ? 'Welcome to Thinkvibes' : textBody;

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