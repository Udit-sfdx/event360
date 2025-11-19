public with sharing class PromptTemplateController {
    
    @AuraEnabled
    public static String getGeneratedEventDescription(String userInputDescription) {
        try {
            Prompt_Template_Configuration__mdt config = [
                SELECT Id,DeveloperName,Label from Prompt_Template_Configuration__mdt where DeveloperName = 'Generate_Event_Description'
                LIMIT 1
            ];

            String promptTemplateName = config.DeveloperName;
            if (String.isBlank(promptTemplateName)) {
                return 'No prompt template name found in custom metadata.';
            }
            ConnectApi.EinsteinPromptTemplateGenerationsInput promptInput = new ConnectApi.EinsteinPromptTemplateGenerationsInput();
            promptInput.isPreview = false;
            Map<String, ConnectApi.WrappedValue> valueMap = new Map<String, ConnectApi.WrappedValue>();
            ConnectApi.WrappedValue freeTextValue = new ConnectApi.WrappedValue();
            freeTextValue.value = userInputDescription;
            valueMap.put('Input:User_DescriptionInput', freeTextValue);
            promptInput.inputParams = valueMap;

            promptInput.additionalConfig = new ConnectApi.EinsteinLlmAdditionalConfigInput();
            promptInput.additionalConfig.applicationName = 'PromptTemplateGenerationsInvocable';

            ConnectApi.EinsteinPromptTemplateGenerationsRepresentation output =
                ConnectApi.EinsteinLLM.generateMessagesForPromptTemplate(promptTemplateName, promptInput);

            if (output != null && output.generations != null && !output.generations.isEmpty()) {
                return output.generations[0].text;
            }

            return 'No description generated. Please try again.';

        } catch (Exception e) {
            System.debug('Error generating event description: ' + e.getStackTraceString());
            return 'Error generating description: ' + e.getMessage();
        }
    }
}