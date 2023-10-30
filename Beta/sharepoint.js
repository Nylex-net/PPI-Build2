// const Msal = require('msal');
const client = require('@microsoft/microsoft-graph-client');
function accessSharePoint(token) {
  // Define the URL to the SharePoint site and the file path
  const sharepointSite = 'https://nylexnet.sharepoint.com';
  const filePath = '/Shared Documents'; // The destination path

  // The URL for the SharePoint file endpoint
  const fileEndpoint = `${sharepointSite}/_api/web/getfolderbyserverrelativeurl('${filePath}')/ListItemAllFields`;

  // Define the file content
  const fileContent = 'This is the content of the file.';

  const accessToken = token;

  // Define the request headers, including the Access Token
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json;odata=verbose',
  };

  const options = {
    method: 'GET',
    headers: headers
    // body: JSON.stringify({ Content: fileContent }),
  };

  // Make the API request to upload the file
  fetch(fileEndpoint, options)
    .then((response) => {
      if (response.ok) {
        console.log('Yeah Baby!!');
      } else {
        console.error('Error:', response.status, response.statusText);
      }
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}

function graphMe(token) {
  const headers = {
    Authorization: `Bearer ${token}`,
    Host: 'graph.microsoft.com'
  };

  fetch("https://graph.microsoft.com/v1.0/users", {headers:headers})
  .then((response) => {
    if (response.ok) {
      console.log('Das Right!!');
    } else {
      console.error('Error:', response.status, response.statusText);
    }
  })
  .catch((error) => {
    console.error('Error:', error);
  });
}

async function getAccessToken() {
  // Define the request headers, including the Access Token
  const headers = {
    'Host': 'login.microsoftonline.com',
    'Content-Type': 'application/x-www-form-urlencoded'
  };

  const confData = require("./config.json");
  const formData = new URLSearchParams();
  formData.append("grant_type","client_credentials");
  formData.append("client_id",confData.sharepoint.client_id);
  formData.append("scope",confData.sharepoint.scope + "/.default");
  formData.append("client_secret",confData.sharepoint.client_secret);

  // Define the request options.
  const options = {
    method: 'POST',
    headers: headers,
    body: formData.toString(),
  };

  const response = await fetch('https://login.microsoftonline.com/'+confData.sharepoint.tenant_id+'/oauth2/v2.0/token', options);
  return response.json();
}

getAccessToken().then((token) => {
  if(token.access_token != undefined) {
    // accessSharePoint(token.access_token);
    graphMe(token.access_token);
  }
  else {
    console.error(token);
  }
});