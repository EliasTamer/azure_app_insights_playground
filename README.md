# What is this project?
This is a playground that helps me initialize azure application insights in my backend app to gather some analytics.

# Note
run this azure command using azure cli to create a role based access with a contributor role that allows you to push changes to app service, once you run the command, you will get a JSON response, extract the needed fields from it and replace it in the command accordignly.

```
az ad sp create-for-rbac --name "github-actions-app-service" --role contributor --scopes /subscriptions/{subscription_id}/resourceGroups/{resource_group_name}/providers/Microsoft.Web/sites/{app_service_name} --sdk-auth
```