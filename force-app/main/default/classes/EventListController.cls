public without sharing class EventListController {

    public class EventWrapper {
        @AuraEnabled public Id Id { get; set; }
        @AuraEnabled public String Name { get; set; }
        @AuraEnabled public Date EventDate { get; set; }
        @AuraEnabled public String EventTime { get; set; }
        @AuraEnabled public String Venue { get; set; }
        @AuraEnabled public Decimal Price { get; set; }
        @AuraEnabled public String Description { get; set; }
        @AuraEnabled public String ImageUrl { get; set; }
        @AuraEnabled public Decimal Duration { get; set; }
    }

    @AuraEnabled(cacheable=true)
    public static List<EventWrapper> getEventDetails(String priceFilter, Integer limitSize, Integer offsetSize) {
        String userId = UserInfo.getUserId();
        String pf = (priceFilter == null) ? 'All' : priceFilter;
        List<User> userDetail = [SELECT Id, AccountId, Account.Name 
                                FROM User 
                                WHERE Id = :userId 
                                AND Profile.Name = 'Customer Community Plus Login User Publisher'];

        Id accountId = null;
        if (!userDetail.isEmpty()) {
            accountId = userDetail[0].AccountId;
        }

        String soql = 'SELECT Id, Name, StartDateTime__c, Account__c, Venue__c, Price__c, Description__c, Image_URL__c, DurationInMinutes__c ' +
                    'FROM EventDetail__c ' +
                    'WHERE isActive__c = true';
        if (accountId != null) {
            soql += ' AND Account__c = \'' + String.escapeSingleQuotes(String.valueOf(accountId)) + '\'';
        }
        if (pf == 'Free') {
            soql += ' AND (Price__c = 0 OR Price__c = null)';
        } else if (pf == 'Paid') {
            soql += ' AND Price__c > 0';
        }

        soql += ' ORDER BY StartDateTime__c ASC';
        if (limitSize != null && offsetSize != null) {
            soql += ' LIMIT ' + limitSize + ' OFFSET ' + offsetSize;
        } else if (limitSize != null) {
            soql += ' LIMIT ' + limitSize;
        }

        List<EventDetail__c> evtDetail = Database.query(soql);
        List<EventWrapper> results = new List<EventWrapper>();

        for (EventDetail__c ev : evtDetail) {
            EventWrapper wrap = new EventWrapper();
            wrap.Id = ev.Id;
            wrap.Name = ev.Name;
            wrap.EventDate = (ev.StartDateTime__c != null) ? ev.StartDateTime__c.date() : null;
            wrap.EventTime = (ev.StartDateTime__c != null) ? ev.StartDateTime__c.format('HH:mm') : null;
            wrap.Venue = ev.Venue__c;
            wrap.Price = (ev.Price__c != null) ? ev.Price__c : 0;
            wrap.Description = ev.Description__c;
            wrap.ImageUrl = ev.Image_URL__c;
            wrap.Duration = ev.DurationInMinutes__c;
            results.add(wrap);
        }

        return results;
    }
}
