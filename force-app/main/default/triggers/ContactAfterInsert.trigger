trigger ContactAfterInsert on Contact (after insert) {
    String recordTypeId = [SELECT id,name FROM RecordType where DeveloperName  = 'Subscriber_Contact' LIMIT 1].Id;
   	List <Contact> contactList = [select id,MobilePhone from contact where RecordTypeId =: recordTypeId Order By CreatedDate DESC LIMIT 1];
    String mobileNumber = contactList.MobilePhone;
    if (String.isNotBlank(mobileNumber)) {
        WhatsAppController.sendWhatsAppMessage(mobileNumber);
	}
}