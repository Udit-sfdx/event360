/**
 * Trigger to handle Account approval status changes
 * Creates community users when an account is approved
 */
trigger AccountApprovalTrigger on Account (after update) {
    // Only process if this is an update
    if (Trigger.isAfter && Trigger.isUpdate) {
        // List to store Contacts that need community users
        List<Id> contactIdsForUsers = new List<Id>();
        
        // Check each account for approval status change
        for (Account acc : Trigger.new) {
            Account oldAcc = Trigger.oldMap.get(acc.Id);
            
            // If approval status changed from something else to 'Approved'
            if (acc.Approval_Status__c == 'Approved' && oldAcc.Approval_Status__c != 'Approved') {
                // Find the primary contact for this account to create a user
                List<Contact> contacts = [
                    SELECT Id, FirstName, LastName, Email
                    FROM Contact
                    WHERE AccountId = :acc.Id
                    LIMIT 1
                ];
                
                if (!contacts.isEmpty()) {
                    contactIdsForUsers.add(contacts[0].Id);
                }
            }
        }
        
        // If we have contacts that need users, call the handler
        if (!contactIdsForUsers.isEmpty()) {
            AccountApprovalHandler.createCommunityUsers(contactIdsForUsers);
        }
    }
}