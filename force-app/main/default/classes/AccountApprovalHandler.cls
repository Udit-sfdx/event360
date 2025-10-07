/**
 * Handler class for Account approval processes
 * Handles creating community users for approved accounts
 */
public with sharing class AccountApprovalHandler {
    
    /**
     * Creates community users for the provided contact IDs
     * @param contactIds List of Contact IDs to create users for
     */
    public static void createCommunityUsers(List<Id> contactIds) {
        if (contactIds == null || contactIds.isEmpty()) {
            return;
        }
        
        try {
            // Query for the contacts with their account info
            List<Contact> contacts = [
                SELECT Id, FirstName, LastName, Email, AccountId, Account.Name
                FROM Contact
                WHERE Id IN :contactIds
                AND Email != null
            ];
            
            // Get the community profile ID - adjust the name as needed for your org
            Profile communityProfile = [
                SELECT Id
                FROM Profile
                WHERE Name = 'Customer Community Plus Login User Publisher'
                LIMIT 1
            ];
            
            // Create user records
            List<User> usersToCreate = new List<User>();
            
            for (Contact c : contacts) {
                // Generate a unique username (email + timestamp)
                String username = c.Email + '.' + System.currentTimeMillis() + '@example.com';
                
                // Create the user record
                User newUser = new User(
                    ContactId = c.Id,
                    Username = username,
                    Email = c.Email,
                    FirstName = c.FirstName,
                    LastName = c.LastName,
                    ProfileId = communityProfile.Id,
                    Alias = (c.FirstName != null && c.FirstName.length() > 0 ? c.FirstName.substring(0, 1) : 'A') + 
                            (c.LastName != null && c.LastName.length() > 0 ? c.LastName.substring(0, 4) : 'User'),
                    TimeZoneSidKey = 'America/Los_Angeles',
                    LocaleSidKey = 'en_US',
                    EmailEncodingKey = 'UTF-8',
                    LanguageLocaleKey = 'en_US',
                    IsActive = true
                );
                
                usersToCreate.add(newUser);
            }
            
            // Insert the users with mixed DML handling
            if (!usersToCreate.isEmpty()) {
                    insert usersToCreate;
                
                // Send welcome emails (optional)
                // This would typically be done via a separate process
            }
        } catch (Exception e) {
            // Log the error - in a real implementation, use a proper logging framework
            System.debug('Error creating community users: ' + e.getMessage());
            System.debug(e.getStackTraceString());
        }
    }
}