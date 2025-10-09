trigger ContactAfterInsert on Contact (after insert) {
   	String contactPhone = [select id,MobilePhone from contact where RecordTypeId = '012NS000008h08DYAQ' Order By CreatedDate DESC LIMIT 1].MobilePhone;
    if (String.isNotBlank(contactPhone)) {
        WhatsAppController.sendWhatsAppMessage(contactPhone);
	}
}