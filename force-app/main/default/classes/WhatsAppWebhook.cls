@RestResource(urlMapping='/whatsapp/webhooks/v1/*')
global class WhatsAppWebhook {
	
    private static Final String SIGNATURE_VALID_MESSAGE = 'Signature Verified';
    private static Final String SIGNATURE_NOT_VALID_MESSAGE = 'Signature Could Not Be Verified';
    
    @HttpGet
    global static void doGet() {
        RestResponse response = RestContext.response;
        RestRequest request = RestContext.request;
        if(request.params.get('hub.verify_token') == 'WHATSAPPTOKEN') {
            response.responseBody = Blob.valueOf(request.params.get('hub.challenge'));
        }
    }
    
    @HttpPost
    global static void handleWhatsappPost() {
        RestRequest req = RestContext.request;
        String requestBody = req.requestBody.toString();

        try {
            	
            Map<String, Object> mapReq = (Map<String, Object>) JSON.deserializeUntyped(requestBody);
            
            RestContext.response.statusCode = 200;
            RestContext.response.responseBody = Blob.valueOf('{"status":"success"}');
            WhatsappWebhookHandler.sendMessageToUser(mapReq);
			
        } catch(Exception e) {
            System.debug('Error parsing WhatsApp webhook payload: ' + e.getMessage());

            RestContext.response.statusCode = 400;
            RestContext.response.responseBody = Blob.valueOf('{"status":"error","message":"' + e.getMessage() + '"}');
        }
    }


    
    private static string validatewhatsAppSignature(RestRequest request,String responseString) {
        Map<String,String> headers = request.headers;
        String whatsAppSignature = headers.get('X-Hub-Signature-256');
        String whatsAppPayload = RestContext.request.requestBody.toString();
        String whatsAppSecret = System.Label.App_secret_for_whats_app_integration;
        Blob signedPayLoad = Crypto.generateMac('hmacSHA26',Blob.valueOf(whatsAppPayLoad),Blob.valueOf(whatsAppSecret));
        String encodedPayload = 'sha256='+EncodingUtil.convertToHex(signedPayLoad);
        String response = (encodedPayLoad == whatsAppSignature) ? SIGNATURE_VALID_MESSAGE : SIGNATURE_NOT_VALID_MESSAGE;
        return response;
    }
}