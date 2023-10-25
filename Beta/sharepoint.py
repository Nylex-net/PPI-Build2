import requests
import adal
import os
import environ

# Define your SharePoint site URL and API endpoint
site_url = "https://nylexnet.sharepoint.com"
api_url = f"{site_url}/_api/web"

# Define your Azure AD app's details
tenant_id = os.environ.get('tenant_id')
client_id = os.environ.get('client_id')
client_secret = os.environ.get('client_secret')
# print(f'{tenant_id} {client_id} {client_secret}')
resource = "https://graph.microsoft.com"  # Resource URL for SharePoint

# Authenticate and obtain an access token
authority_url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/authorize"
context = adal.AuthenticationContext(authority_url)
token = context.acquire_token_with_client_credentials(
    resource, client_id, client_secret)

# Make a GET request to the SharePoint API
headers = {
    "Authorization": f"Bearer {token['accessToken']}",
    "Accept": "application/json;odata=verbose",
}
response = requests.get(api_url, headers=headers)

# Check if the request was successful
if response.status_code == 200:
    # Print the response content
    print(response.json())
else:
    print(f"Request failed with status code {response.status_code}: {response.text}")