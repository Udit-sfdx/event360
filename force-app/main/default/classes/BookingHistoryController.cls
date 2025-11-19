public without sharing class BookingHistoryController {
    
    /**
     * Checks if a contact exists with the given email and has booking history
     * @param email The email address to check
     * @return Boolean indicating if the contact exists with booking history
     */
    @AuraEnabled
    public static Map<String, Object> checkContactEmail(String email) {
        Map<String, Object> result = new Map<String, Object>();
        result.put('isValid', false);
        result.put('message', '');
        
        if (String.isBlank(email)) {
            result.put('message', 'Email address is required');
            return result;
        }
        
        // Check if contact exists with the email
        List<Contact> contacts = [SELECT Id, Email FROM Contact WHERE Email = :email LIMIT 1];
        
        if (contacts.isEmpty()) {
            result.put('message', 'No contact found with this email address. Please enter a valid email address with previous bookings.');
            return result;
        }
        
        // Check if contact has any event subscriptions (bookings)
        List<Event_Subscriber__c> bookings = [SELECT Id FROM Event_Subscriber__c WHERE Contact__c = :contacts[0].Id LIMIT 1];
        
        if (bookings.isEmpty()) {
            result.put('message', 'No booking history found for this email address.');
            return result;
        }
        
        result.put('isValid', true);
        result.put('contactId', contacts[0].Id);
        return result;
    }
    
    /**
     * Generates and sends a verification code to the provided email
     * @param email The email address to send the code to
     * @return String containing the verification code (in real implementation, this would not return the code)
     */
    @AuraEnabled
    public static String sendVerificationCode(String email, String contactId) {
        // Generate a random 6-digit verification code
        Integer randomCode = Math.round(Math.random() * (999999 - 100000) + 100000);
        String verificationCode = String.valueOf(randomCode);
        
        // In a real implementation, you would store this code in a custom object with expiration time
        // For demo purposes, we're just returning the code
        
        // Send email with verification code
        try {
            Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
            String[] toAddresses = new String[] {email};
            mail.setToAddresses(toAddresses);
            mail.setSubject('Your Booking History Verification Code');
            mail.setPlainTextBody('Your verification code is: ' + verificationCode + 
                                 '\n\nThis code will expire in 10 minutes. Please do not share this code with anyone.');
            mail.setHtmlBody('<h2>Your Booking History Verification Code</h2>' +
                            '<p>Your verification code is: <strong>' + verificationCode + '</strong></p>' +
                            '<p>This code will expire in 10 minutes. Please do not share this code with anyone.</p>');
            mail.setOrgWideEmailAddressId([
                            SELECT Id FROM OrgWideEmailAddress 
                            WHERE Address = 'udit.goyal@thinkvibes.com' 
                            LIMIT 1
                        ].Id);
            
            Messaging.sendEmail(new Messaging.SingleEmailMessage[] { mail });
            
            return verificationCode;
        } catch (Exception e) {
            throw new AuraHandledException('Error sending verification code: ' + e.getMessage());
        }
    }
}