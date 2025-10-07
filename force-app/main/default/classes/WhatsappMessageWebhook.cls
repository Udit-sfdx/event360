public class WhatsappMessageWebhook {
    
    public String field;	//messages
    public cls_value value;
    class cls_value {
        public String messaging_product;	//whatsapp
        public cls_metadata metadata;
        public cls_contacts[] contacts;
        public cls_messages[] messages;
    }
    class cls_metadata {
        public String display_phone_number;	//16505551111
        public String phone_number_id;	//123456123
    }
    class cls_contacts {
        public cls_profile profile;
        public String wa_id;	//16315551181
    }
    class cls_profile {
        public String name;	//test user name
    }
    class cls_messages {
        public String from1;	//16315551181
        public String id;	//ABGGFlA5Fpa
        public String timestamp;	//1504902988
        public String type1;	//text
        public cls_text text;
    }
    class cls_text {
        public String body;	//this is a text message
    }
    
    public static WhatsappMessageWebhook parse(String json){
        return (WhatsappMessageWebhook) System.JSON.deserialize(json, WhatsappMessageWebhook.class);
    }
}