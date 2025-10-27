public with sharing class PromptTemplateController {

    /**
     * Generates or refines Event Description using a Flex Prompt Template.
     * @param userInputDescription The description text entered by the admin (can be blank).
     * @return The AI-generated event description.
     */
    @AuraEnabled(cacheable=false)
    public static String getGeneratedEventDescription(String userInputDescription) {
        try {
            //Query Custom Metadata to get the Prompt Template Name
            Prompt_Template_Configuration__mdt config = [
                SELECT Id,DeveloperName,Label from Prompt_Template_Configuration__mdt where DeveloperName = 'Generate_Event_Description'
                LIMIT 1
            ];

            String promptTemplateName = config.DeveloperName;
            if (String.isBlank(promptTemplateName)) {
                return 'No prompt template name found in custom metadata.';
            }

            //Create generations input
            ConnectApi.EinsteinPromptTemplateGenerationsInput promptInput = new ConnectApi.EinsteinPromptTemplateGenerationsInput();
            promptInput.isPreview = false;

            //Build inputParams map (Free Text input)
            Map<String, ConnectApi.WrappedValue> valueMap = new Map<String, ConnectApi.WrappedValue>();
            ConnectApi.WrappedValue freeTextValue = new ConnectApi.WrappedValue();
            freeTextValue.value = userInputDescription;
            valueMap.put('Input:User_DescriptionInput', freeTextValue);
            promptInput.inputParams = valueMap;

            //Additional configuration
            promptInput.additionalConfig = new ConnectApi.EinsteinLlmAdditionalConfigInput();
            promptInput.additionalConfig.applicationName = 'PromptTemplateGenerationsInvocable';

            //Call the Einstein service using the Prompt Template Name
            ConnectApi.EinsteinPromptTemplateGenerationsRepresentation output =
                ConnectApi.EinsteinLLM.generateMessagesForPromptTemplate(promptTemplateName, promptInput);

            //Return the generated description
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