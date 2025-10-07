public with sharing class WhatsappWebhookHandler {
    public static void sendMessageToUser(Map<String, Object> mapReq) {
        WhatsAppGraphApiServiceRequest req = new WhatsAppGraphApiServiceRequest();
        String profileName;
       	if (mapReq.containsKey('entry')) {
            List<Object> entries = (List<Object>) mapReq.get('entry');
            for (Object eObj : entries) {
                Map<String, Object> entry = (Map<String, Object>) eObj;

                if (entry.containsKey('changes')) {
                    List<Object> changes = (List<Object>) entry.get('changes');
                    for (Object cObj : changes) {
                        Map<String, Object> change = (Map<String, Object>) cObj;

                        if (change.containsKey('value')) {
                            Map<String, Object> value = (Map<String, Object>) change.get('value');
                            if (value.containsKey('contacts')) {
                                List<Object> contacts = (List<Object>) value.get('contacts');
                                if (!contacts.isEmpty()) {
                                    Map<String, Object> contact = (Map<String, Object>) contacts[0];
                                    if (contact.containsKey('profile')) {
                                        Map<String, Object> profile = (Map<String, Object>) contact.get('profile');
                                        profileName = (String) profile.get('name');
                                    }
                                }
                            }


                            if (value.containsKey('messages')) {
                                List<Object> messages = (List<Object>) value.get('messages');
                                for (Object mObj : messages) {
                                    Map<String, Object> message = (Map<String, Object>) mObj;
                                    String fromPhone = (String) message.get('from');
                                    req.recipientPhone = fromPhone;
                                    

                                    if (message.containsKey('text')) {
                                        Map<String, Object> text = (Map<String, Object>) message.get('text');
                                        String body = (String) text.get('body');

                                        if (body != null && body.trim().toLowerCase() == 'hi') {
                                            req.textBody = 'Hi '+ profileName + ' How may I Help you';
                                            WhatsAppGraphApiService.sendTextMessage(req); 
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}