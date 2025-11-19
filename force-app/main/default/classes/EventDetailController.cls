public without sharing class EventDetailController {
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
        @AuraEnabled public Boolean canEdit { get; set; }
        @AuraEnabled public Boolean canDelete { get; set; }
        @AuraEnabled public Boolean isAuthenticated { get; set; }
        @AuraEnabled public Boolean isOwner { get; set; }
        @AuraEnabled public String type { get; set; }
        @AuraEnabled public Id ownerId { get; set; }
        @AuraEnabled public Boolean isActive { get; set; }
    }

    @AuraEnabled
    public static EventWrapper getEventDetailWithPerms(String eventId) {
        if (String.isBlank(eventId)) return null;

        EventDetail__c evtDetail = [
            SELECT Id, Name, StartDateTime__c, Venue__c, Price__c,isActive__c ,Description__c, Image_URL__c, DurationInMinutes__c, OwnerId,Type__c
            FROM EventDetail__c
            WHERE Id = :eventId
            LIMIT 1
        ];

        EventWrapper evt = new EventWrapper();
        evt.Id = evtDetail.Id;
        evt.Name = evtDetail.Name;
        evt.EventDate = evtDetail.StartDateTime__c != null ? evtDetail.StartDateTime__c.date() : null;
        evt.EventTime = evtDetail.StartDateTime__c != null ? evtDetail.StartDateTime__c.format('HH:mm') : null;
        evt.Venue = evtDetail.Venue__c;
        evt.Price = evtDetail.Price__c;
        evt.Description = evtDetail.Description__c;
        evt.ImageUrl = evtDetail.Image_URL__c;
        evt.Duration = evtDetail.DurationInMinutes__c;
        evt.isActive = evtDetail.isActive__c;
        evt.type = evtDetail.Type__c;

        String userType = UserInfo.getUserType();
        Id currentUserId = UserInfo.getUserId();
        evt.isAuthenticated = userType != 'Guest' && currentUserId != null;
        evt.ownerId = evtDetail.OwnerId;
        evt.isOwner = evt.ownerId == currentUserId;

        Boolean objectUpdateable = Schema.sObjectType.EventDetail__c.isUpdateable();
        Boolean objectDeletable = Schema.sObjectType.EventDetail__c.isDeletable();

        evt.canEdit = evt.isAuthenticated && (objectUpdateable || evt.isOwner);
        evt.canDelete = evt.isAuthenticated && (objectDeletable || evt.isOwner);

        return evt;
    }

    @AuraEnabled
    public static void deleteEvent(String eventId) {
        
        if (eventId == null) throw new AuraHandledException('Invalid Event Id');

        Boolean objectDeletable = Schema.sObjectType.EventDetail__c.isDeletable();
        EventDetail__c evt = [SELECT Id, OwnerId FROM EventDetail__c WHERE Id = :eventId LIMIT 1];
        Boolean isOwner = evt.OwnerId == UserInfo.getUserId();

        if (!objectDeletable && !isOwner) 
            throw new AuraHandledException('You do not have permission to delete this event.');

        try {
            delete evt;
        } catch (DmlException e) {
            throw new AuraHandledException('Could not delete event: ' + e.getMessage());
        }
    }

    @AuraEnabled()
    public static Boolean isGuestUser() {
        try {
            User currentUser = [SELECT Id, Profile.Name FROM User WHERE Id = :UserInfo.getUserId()];
            if(currentUser.Profile.Name == 'Customer Community Plus Login User Publisher')
                return false;
            else {
                return true;
            }
        } catch (Exception e) {
            return false;
        }
    }

    @AuraEnabled
    public static List<Event_Session__c> getSubEvents(Id eventId) {
        System.debug('Get Dub Events => ' + eventId);
        return [
            SELECT Id, Name, Start_Time__c, Price__c,Duration__c,Speaker__c
            FROM Event_Session__c
            WHERE EventDetail__c = :eventId
            ORDER BY Start_Time__c ASC
        ];
    }

    @AuraEnabled
public static void saveEventWithSessions(String eventJson, String sessionsJson) {
    try {
        if (String.isBlank(eventJson)) {
            throw new AuraHandledException('Missing Event Details');
        }

        // Deserialize event JSON
        Map<String, Object> eMap = (Map<String, Object>) JSON.deserializeUntyped(eventJson);
        EventDetail__c ev;

        // Check if existing event or new one
        if (eMap.containsKey('Id') && eMap.get('Id') != null && String.valueOf(eMap.get('Id')).trim() != '') {
            String existingIdStr = String.valueOf(eMap.get('Id')).trim();
            ev = [SELECT Id, Name, StartDateTime__c, Venue__c, Price__c, isActive__c, 
                         Description__c, Image_URL__c, DurationInMinutes__c, OwnerId,Type__c
                  FROM EventDetail__c WHERE Id = :existingIdStr LIMIT 1];
        } else {
            ev = new EventDetail__c();
        }

        // Map event fields (use put for potentially ambiguous typed fields)
        if (eMap.containsKey('Name')) ev.Name = (String) eMap.get('Name');
        if (eMap.containsKey('Venue__c')) ev.Venue__c = (String) eMap.get('Venue__c');

        if (eMap.containsKey('Price__c')) {
            Object p = eMap.get('Price__c');
            if (p == null) ev.put('Price__c', null);
            else {
                // keep as Decimal where possible
                try { ev.put('Price__c', Decimal.valueOf(String.valueOf(p))); }
                catch (Exception ex) { ev.put('Price__c', String.valueOf(p)); }
            }
        }

        if (eMap.containsKey('Description__c')) ev.Description__c = (String) eMap.get('Description__c');
        if (eMap.containsKey('Type__c')) ev.Type__c = (String) eMap.get('Type__c');
        if (eMap.containsKey('ImageUrl')) ev.Image_URL__c = (String) eMap.get('ImageUrl');

        if (eMap.containsKey('DurationInMinutes__c')) {
            Object d = eMap.get('DurationInMinutes__c');
            if (d == null) ev.put('DurationInMinutes__c', null);
            else {
                try { ev.put('DurationInMinutes__c', Decimal.valueOf(String.valueOf(d))); }
                catch (Exception ex) { ev.put('DurationInMinutes__c', String.valueOf(d)); }
            }
        }

        // Date + Time handling for event
        Date evtDate = null;
        if (eMap.containsKey('EventDate') && eMap.get('EventDate') != null) {
            try { evtDate = Date.valueOf(String.valueOf(eMap.get('EventDate')).trim()); }
            catch (Exception ex) { evtDate = null; }
        }

        Time evtTime = null;
        if (eMap.containsKey('EventTime') && eMap.get('EventTime') != null) {
            String t = String.valueOf(eMap.get('EventTime')).trim();
            if (t != null && t != '' && t != 'null') {
                List<String> parts = t.split(':');
                if (parts.size() == 2) parts.add('00');
                if (parts.size() >= 3) {
                    try {
                        evtTime = Time.newInstance(
                            Integer.valueOf(parts[0]),
                            Integer.valueOf(parts[1]),
                            Integer.valueOf(parts[2]),
                            0
                        );
                    } catch (Exception ex) { evtTime = null; }
                }
            }
        }

        if (evtDate != null && evtTime != null) {
            ev.StartDateTime__c = Datetime.newInstance(evtDate, evtTime);
        }

        // Save event (insert or update)
        if (ev.Id == null) insert ev; else update ev;

        // Handle sessions
        List<Event_Session__c> toInsert = new List<Event_Session__c>();
        List<Event_Session__c> toUpdate = new List<Event_Session__c>();
        Set<Id> payloadIds = new Set<Id>();
        Set<Id> insertedIds = new Set<Id>();

        if (!String.isBlank(sessionsJson)) {
            List<Object> sList = (List<Object>) JSON.deserializeUntyped(sessionsJson);
            for (Object o : sList) {
                Map<String, Object> sMap = (Map<String, Object>) o;
                Event_Session__c srec = new Event_Session__c();

                // Update existing record if Id provided
                if (sMap.containsKey('Id') && sMap.get('Id') != null && String.valueOf(sMap.get('Id')).trim() != '') {
                    try {
                        Id sid = Id.valueOf(String.valueOf(sMap.get('Id')).trim());
                        srec.Id = sid;
                        payloadIds.add(sid);
                    } catch (Exception ignore) {}
                }

                // Map simple string fields
                if (sMap.containsKey('sessionName')) srec.Name = (String) sMap.get('sessionName');

                // Price__c - use put to avoid type mismatch compile-time errors
                if (sMap.containsKey('price')) {
                    Object p2 = sMap.get('price');
                    if (p2 == null) srec.put('Price__c', null);
                    else {
                        try { srec.put('Price__c', Decimal.valueOf(String.valueOf(p2))); }
                        catch (Exception ex) { srec.put('Price__c', String.valueOf(p2)); }
                    }
                }

                // Duration__c - use put to avoid Decimal->String compile error if field is text
                if (sMap.containsKey('duration')) {
                    Object dd = sMap.get('duration');
                    if (dd == null) srec.put('Duration__c', null);
                    else {
                        try { srec.put('Duration__c', Decimal.valueOf(String.valueOf(dd))); }
                        catch (Exception ex) { srec.put('Duration__c', String.valueOf(dd)); }
                    }
                }

                // Handle Start_Date__c + Start_Time__c safely
                Date sDate = null;
                if (sMap.containsKey('startDate') && sMap.get('startDate') != null) {
                    try { sDate = Date.valueOf(String.valueOf(sMap.get('startDate')).trim()); }
                    catch (Exception ex) { sDate = null; }
                }

                Time sTime = null;
                if (sMap.containsKey('startTime') && sMap.get('startTime') != null) {
                    String st = String.valueOf(sMap.get('startTime')).trim();
                    if (st != null && st != '' && st != 'null') {
                        List<String> parts = st.split(':');
                        if (parts.size() == 2) parts.add('00');
                        if (parts.size() >= 3) {
                            try {
                                sTime = Time.newInstance(
                                    Integer.valueOf(parts[0]),
                                    Integer.valueOf(parts[1]),
                                    Integer.valueOf(parts[2]),
                                    0
                                );
                            } catch (Exception ex) { sTime = null; }
                        }
                    }
                }

                if (sDate != null && sTime != null) {
                    srec.Start_Time__c = Datetime.newInstance(sDate, sTime);
                }

                // Link to parent
                srec.EventDetail__c = ev.Id;

                if (srec.Id == null) toInsert.add(srec);
                else toUpdate.add(srec);
            }
        }

        // Perform DML operations with partial success handling
        List<String> errors = new List<String>();

        if (!toInsert.isEmpty()) {
            Database.SaveResult[] insRes = Database.insert(toInsert, false);
            for (Database.SaveResult sr : insRes) {
                if (sr.isSuccess()) insertedIds.add(sr.getId());
                else {
                    for (Database.Error e : sr.getErrors()) errors.add('Insert session error: ' + e.getMessage());
                }
            }
        }

        if (!toUpdate.isEmpty()) {
            Database.SaveResult[] updRes = Database.update(toUpdate, false);
            for (Integer i = 0; i < updRes.size(); i++) {
                if (!updRes[i].isSuccess()) {
                    for (Database.Error e : updRes[i].getErrors()) {
                        errors.add('Update failed (' + toUpdate[i].Id + '): ' + e.getMessage());
                    }
                }
            }
        }

        // Delete removed sessions (those that exist in DB but not in final payload)
        Set<Id> finalIds = new Set<Id>();
        finalIds.addAll(payloadIds);
        finalIds.addAll(insertedIds);

        List<Event_Session__c> existing = [
            SELECT Id, Name, Start_Time__c, Price__c,Duration__c,Speaker__c FROM Event_Session__c WHERE EventDetail__c = :ev.Id
        ];
        List<Event_Session__c> toDelete = new List<Event_Session__c>();
        for (Event_Session__c s : existing) {
            if (!finalIds.contains(s.Id)) toDelete.add(s);
        }
        if (!toDelete.isEmpty()) {
            try {
                delete toDelete;
            } catch (Exception delEx) {
                // collect message and continue
                errors.add('Delete failed: ' + delEx.getMessage());
            }
        }

        if (!errors.isEmpty()) {
            throw new AuraHandledException('Errors: ' + String.join(errors, '; '));
        }

    } catch (Exception ex) {
        throw new AuraHandledException(ex.getMessage());
    }
}

}