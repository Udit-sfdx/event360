public without sharing class EventRegistrationController {

    // Wrapper for registration data
    public class RegistrationWrapper {
        @AuraEnabled public String firstName { get; set; }
        @AuraEnabled public String lastName { get; set; }
        @AuraEnabled public String email { get; set; }
        @AuraEnabled public String phone { get; set; }
        @AuraEnabled public String skills { get; set; }
        @AuraEnabled public String company { get; set; }
        @AuraEnabled public String eventId { get; set; }

        // Array of session objects
        @AuraEnabled public List<SessionWrapper> eventSession { get; set; }
    }

    // Separate top-level sibling class (not nested inside RegistrationWrapper)
    public class SessionWrapper {
        @AuraEnabled public String Id { get; set; }
        @AuraEnabled public String Name { get; set; }
        @AuraEnabled public Integer Quantity { get; set; }
    }


    // public class RegistrationWrapper {
    //     @AuraEnabled public String firstName { get; set; }
    //     @AuraEnabled public String lastName { get; set; }
    //     @AuraEnabled public String email { get; set; }
    //     @AuraEnabled public String phone { get; set; }
    //     @AuraEnabled public String skills { get; set; }
    //     @AuraEnabled public List<SessionWrapper> eventSession { get; set; }
    //     @AuraEnabled public Integer quantity { get; set; }
    //     @AuraEnabled public String company { get; set; }
    //     @AuraEnabled public String eventId { get; set; }
        
    // }

    // public class SessionWrapper {
    //     @AuraEnabled public String Id { get; set; }
    //     @AuraEnabled public String Name { get; set; }
    //     @AuraEnabled public Integer Quantity { get; set; }
    // }

    @AuraEnabled
public static Id saveRegistration(RegistrationWrapper registrationEventDetail) {
    Id contactId;

    try {
        // --- Safe RecordType lookup ---
        List<RecordType> rtList = [
            SELECT Id 
            FROM RecordType 
            WHERE DeveloperName = 'Subscriber_Contact' 
            LIMIT 1
        ];
        Id recordTypeId = (rtList.isEmpty()) ? null : rtList[0].Id;

        if (recordTypeId == null) {
            throw new AuraHandledException('RecordType "Subscriber_Contact" not found. Please create it first.');
        }

        // --- Safe Contact lookup by email ---
        List<Contact> conList = [
            SELECT Id, Email 
            FROM Contact 
            WHERE Email = :registrationEventDetail.email 
            LIMIT 1
        ];

        if (!conList.isEmpty()) {
            // Use existing contact
            contactId = conList[0].Id;
        } else {
            // Create new contact
            Contact newContact = new Contact(
                FirstName = registrationEventDetail.firstName,
                LastName  = registrationEventDetail.lastName,
                Email     = registrationEventDetail.email,
                MobilePhone = registrationEventDetail.phone,
                RecordTypeId = recordTypeId
            );
            insert newContact;
            contactId = newContact.Id;
        }

        // --- Create Event Subscriber record ---
        Event_Subscriber__c reg = new Event_Subscriber__c(
            Contact__c = contactId,
            EventDetail__c = registrationEventDetail.eventId
        );
        insert reg;

        // --- Create Event Session Booking records ---
        if (registrationEventDetail.eventSession != null && !registrationEventDetail.eventSession.isEmpty()) {
            List<Event_Session_Booking__c> sessionBookings = new List<Event_Session_Booking__c>();
            for (SessionWrapper sw : registrationEventDetail.eventSession) {
                sessionBookings.add(new Event_Session_Booking__c(
                    Quantity__c = sw.Quantity,
                    Event_Subscriber__c = reg.Id,
                    Event_Session__c = sw.Id
                ));
            }
            insert sessionBookings;
        }

        return contactId;

    } catch (Exception ex) {
        System.debug('Error in saveRegistration: ' + ex.getMessage());
        throw new AuraHandledException('Error while saving registration: ' + ex.getMessage());
    }
}


    // @AuraEnabled
    // public static Id saveRegistration(RegistrationWrapper registrationEventDetail) {
    //     Id contactId;
    //     try {
    //         // Fetch record type for Subscriber_Contact
    //         Id recordTypeId = [
    //             SELECT Id 
    //             FROM RecordType 
    //             WHERE DeveloperName = 'Subscriber_Contact' 
    //             LIMIT 1
    //         ].Id;

    //         // Check if a contact with the given email already exists
    //         Contact existingContact = [
    //             SELECT Id, Email 
    //             FROM Contact 
    //             WHERE Email = :registrationEventDetail.email 
    //             LIMIT 1
    //         ];

    //         if (existingContact != null) {
    //             contactId = existingContact.Id;
    //         } else {
    //             // Create new contact if not found
    //             Contact newContact = new Contact(
    //                 FirstName = registrationEventDetail.firstName,
    //                 LastName  = registrationEventDetail.lastName,
    //                 Email     = registrationEventDetail.email,
    //                 MobilePhone = registrationEventDetail.phone,
    //                 RecordTypeId = recordTypeId
    //             );
    //             insert newContact;
    //             contactId = newContact.Id;
    //         }

    //         // Create the Event_Subscriber__c record
    //         Event_Subscriber__c reg = new Event_Subscriber__c(
    //             Contact__c = contactId,
    //             EventDetail__c = registrationEventDetail.eventId
    //             // Event_Session__c = registrationEventDetail.eventSession
    //         );
    //         insert reg;

    //         Id subId = reg.id;
    //         List<Event_Session_Booking__c> sessionBookings = new List<Event_Session_Booking__c>();
    //         for(SessionWrapper sw: registrationEventDetail.eventSession){
    //             sessionBookings.add(new Event_Session_Booking__c(Quantity__c = sw.Quantity, Event_Subscriber__c = subId, Event_Session__c = sw.Id));
    //         }
    //         insert sessionBookings;

    //         return contactId;

    //     } catch (Exception ex) {
    //         System.debug('Error in saveRegistration: ' + ex.getMessage());
    //         throw new AuraHandledException('Error while saving registration: ' + ex.getMessage());
    //     }
    // }


    @AuraEnabled
    public static List<Event_Session__c> getSessionsForEvent(Id eventId) {
        if (eventId == null) {
            return new List<Event_Session__c>();
        }
        return [SELECT Id, Name,Speaker__c,Price__c, EventDetail__c, EventDetail__r.Name FROM Event_Session__c WHERE EventDetail__c  = :eventId];
    }

    @AuraEnabled
    public static Event_Subscriber__c getQrForRegistration(String contactId) {
        if(contactId == '') {
            return null;
        }
        return [SELECT Id,Name,Contact__c,TicketQR__c,EventDetail__r.Name FROM Event_Subscriber__c WHERE Contact__c =:contactId LIMIT 1];
    }

    private static String escapeHtml(String input) {
        if (input == null) return '';
        String out = input;
        out = out.replace('&', '&amp;');
        out = out.replace('<', '&lt;');
        out = out.replace('>', '&gt;');
        out = out.replace('"', '&quot;');
        out = out.replace('\'', '&#39;');
        return out;
    }

    @AuraEnabled
    public static void sendRegistrationEmail(String contactId, String qrUrl) {
        if (contactId == null) {
            throw new AuraHandledException('contactId is required');
        }
        try {
            Contact c = [SELECT Id, FirstName, LastName, Email FROM Contact WHERE Id = :contactId LIMIT 1];
            if (String.isBlank(c.Email)) {
                throw new AuraHandledException('Contact does not have an email address.');
            }
            Event_Subscriber__c reg = null;
            try {
                reg = [SELECT Id, Name, TicketQR__c, EventDetail__r.Name FROM Event_Subscriber__c WHERE Contact__c = :contactId LIMIT 1];
            } catch (Exception e) {
            }

            String bookingId = (reg != null && reg.Name != null) ? reg.Name : '';
            String eventName = (reg != null && reg.EventDetail__r != null && reg.EventDetail__r.Name != null) ? reg.EventDetail__r.Name : '';

            String firstName = c.FirstName != null ? c.FirstName : '';
            String subject = 'Your Event Registration Confirmation' + (eventName != '' ? ' — ' + eventName : '');
            String bodyHtml = '<p>Hi ' + escapeHtml(firstName) + ',</p>';
            bodyHtml += '<p>Thank you for registering';
            if (eventName != '') {
                bodyHtml += ' for <strong>' + escapeHtml(eventName) + '</strong>';
            }
            
            bodyHtml += '.</p>';

            if (bookingId != '') {
                bodyHtml += '<p><strong>Booking ID:</strong> ' + escapeHtml(bookingId) + '</p>';
            }

            if (qrUrl != null && qrUrl != '') {
                bodyHtml += '<p>Your QR code (please save this for event check-in):</p>';
                bodyHtml += '<p><img src="' + escapeHtml(qrUrl) + '" alt="QR Code" /></p>';
            }

            bodyHtml += '<p>Regards,<br/>Event Team</p>';

            Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
            mail.setToAddresses(new String[] { c.Email });
            mail.setSubject(subject);
            mail.setHtmlBody(bodyHtml);
            mail.setSaveAsActivity(false);

            mail.setOrgWideEmailAddressId([
                            SELECT Id FROM OrgWideEmailAddress 
                            WHERE Address = 'udit.goyal@thinkvibes.com' 
                            LIMIT 1
                        ].Id);
            Messaging.sendEmail(new Messaging.SingleEmailMessage[] { mail });

        } catch (Exception ex) {
            System.debug('Error in sendRegistrationEmail: ' + ex.getMessage());
            throw new AuraHandledException('Failed to send email: ' + ex.getMessage());
        }
    }
}