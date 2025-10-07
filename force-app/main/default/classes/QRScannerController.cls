public with sharing class QRScannerController {
    
    /**
     * Fetches the Contact Name by Id.
     * @param contactId - Contact Id.
     * @return Contact Name if found, otherwise null.
     */
    @AuraEnabled(cacheable=true)
    public static String getContactNameById(Id contactId) {
        if (contactId == null) {
            return null;
        }

        try {
            // Query Contact by Id
            List<Contact> contacts = [
                SELECT Name 
                FROM Contact 
                WHERE Id = :contactId
                LIMIT 1
            ];

            // Return Name if found, else null
            return contacts.isEmpty() ? null : contacts[0].Name;

        } catch (Exception ex) {
            System.debug(LoggingLevel.ERROR, 'Error fetching Contact Name: ' + ex.getMessage());
            return null;
        }
    }
}
