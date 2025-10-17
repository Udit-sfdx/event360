public with sharing class AccountApprovalHandler {

    public static void createCommunityUsers(List<Id> contactIds) {
        if (contactIds == null || contactIds.isEmpty()) {
            return;
        }
        
        try {
            List<Contact> contacts = [
                SELECT Id, FirstName, LastName, Email, AccountId, Account.Name
                FROM Contact
                WHERE Id IN :contactIds
                AND Email != null
            ];

            Profile communityProfile = [
                SELECT Id
                FROM Profile
                WHERE Name = 'Customer Community Plus Login User Publisher'
                LIMIT 1
            ];
            
            List<User> usersToCreate = new List<User>();
            
            for (Contact c : contacts) {
                String username = c.Email + '.' + System.currentTimeMillis() + '@example.com';
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
            
            if (!usersToCreate.isEmpty()) {
                    insert usersToCreate;
            }
        } catch (Exception e) {
            System.debug('Error creating community users: ' + e.getMessage());
            System.debug(e.getStackTraceString());
        }
    }
}