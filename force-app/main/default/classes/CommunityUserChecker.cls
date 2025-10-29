public with sharing class CommunityUserChecker {
    @AuraEnabled(cacheable=true)
    public static Boolean isCommunityUser() {
        User u = [SELECT Id, UserType FROM User WHERE Id = :UserInfo.getUserId()];
        return u.UserType == 'Customer Community Plus Login User Publisher';
    }
}
