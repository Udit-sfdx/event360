/**
 * Controller for handling community registration logic
 * @author CodeGenie
 */
public without sharing class CommunityRegistrationController {
    
    /**
     * Creates an Account and Contact record for community registration
     * @param accountName Name of the organization/account
     * @param accountPhone Phone number of the organization
     * @param accountWebsite Website of the organization
     * @param accountDescription Description of the organization
     * @param contactFirstName First name of the contact
     * @param contactLastName Last name of the contact
     * @param contactEmail Email of the contact
     * @param contactPhone Phone number of the contact
     * @param contactTitle Title/Role of the contact
     * @return Id of the created Contact record
     */
    @AuraEnabled
    public static String registerOrganization(
        String accountName,
        String accountPhone,
        String accountWebsite,
        String accountDescription,
        String contactFirstName,
        String contactLastName,
        String contactEmail,
        String contactPhone,
        String contactTitle
    ) {
        try {
            // Create Account record
            Account newAccount = new Account(
                Name = accountName,
                Phone = accountPhone,
                Website = accountWebsite,
                Description = accountDescription,
                Approval_Status__c = 'Pending' // Default status is pending
            );
            
            // Insert with sharing rules enforced
            insert newAccount;
            
            // Create Contact record linked to the Account
            Contact newContact = new Contact(
                FirstName = contactFirstName,
                LastName = contactLastName,
                Email = contactEmail,
                Phone = contactPhone,
                Title = contactTitle,
                AccountId = newAccount.Id
            );
            
            // Insert with sharing rules enforced
            insert newContact;
            
            return newContact.Id;
        } catch (Exception e) {
            throw new AuraHandledException('Error during registration: ' + e.getMessage());
        }
    }
    
    /**
     * Checks if an email is already in use by another Contact
     * @param email Email to check
     * @return Boolean indicating if email is in use
     */
    @AuraEnabled
    public static Boolean isEmailInUse(String email) {
        try {
            Integer contactCount = [SELECT COUNT() FROM Contact WHERE Email = :email];
            return contactCount > 0;
        } catch (Exception e) {
            throw new AuraHandledException('Error checking email: ' + e.getMessage());
        }
    }
}