trigger ContactAfterInsert on Contact (after insert) {
    String recordTypeId = [SELECT id,name FROM RecordType where DeveloperName  = 'Subscriber_Contact' LIMIT 1].Id;
   	List <Contact> contactList = [select id,MobilePhone,RecordTypeId from contact Order By CreatedDate DESC LIMIT 1];
    if(contactList[0].RecordTypeId == recordTypeId && String.isNotBlank(contactList[0].MobilePhone) ) {
        WhatsAppController.sendWhatsAppMessage(contactList[0].MobilePhone);
	}
}