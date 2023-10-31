async function accessSharePoint(token) {
  // Define the URL to the SharePoint site and the file path
  const sharepointSite = `https://graph.microsoft.com/v1.0/sites/${require("./config.json").SHNpoint.scope}:/sites/ProjectManagementPublic`;

  // Define the request headers, including the Access Token
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };

  const options = {
    method: 'GET',
    headers: headers
    // body: JSON.stringify({ Content: fileContent }),
  };

  // Make the API request to upload the file
  const response = await fetch(sharepointSite, options);
  return response.json();
}

async function driveID(token, site_id) {
  const site = `https://graph.microsoft.com/v1.0/sites/${site_id}/Drives`;

  // Define the request headers, including the Access Token
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };

  const options = {
    method: 'GET',
    headers: headers
    // body: JSON.stringify({ Content: fileContent }),
  };

  // Make the API request to upload the file
  const response = await fetch(site, options);
  return response.json();
}

async function getAccessToken() {
  // Define the request headers, including the Access Token
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded'
  };

  const confData = require("./config.json");
  const formData = new URLSearchParams();
  formData.append("grant_type","client_credentials");
  formData.append("client_id",confData.SHNpoint.client_id);
  formData.append("scope","https://graph.microsoft.com/.default");
  formData.append("client_secret",confData.SHNpoint.client_secret);

  // Define the request options.
  const options = {
    method: 'POST',
    headers: headers,
    body: formData.toString(),
  };

  const response = await fetch('https://login.microsoftonline.com/'+confData.SHNpoint.tenant_id+'/oauth2/v2.0/token', options);
  return response.json();
}

async function listContents(token, drive_id) {
  const url = `https://graph.microsoft.com/v1.0/Drives/${drive_id}/root:/PM Tools spreadsheets:/Children`;

  // Define the request headers, including the Access Token
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };

  const options = {
    method: 'GET',
    headers: headers
    // body: JSON.stringify({ Content: fileContent }),
  };

  // Make the API request to upload the file
  const response = await fetch(url, options);
  return response.json();
}

async function uploadLocal(token, drive_id) {
  const url = `https://graph.microsoft.com/v1.0/Drives/${drive_id}/root:/PM Tools spreadsheets/dummy.txt:/content`;

  // Define the request headers, including the Access Token
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };

  const fileContent = 'This is a test file.';

  const options = {
    method: 'PUT',
    headers: headers,
    body: JSON.stringify({ Content: fileContent }),
  };

  // Make the API request to upload the file
  const response = await fetch(url, options);
  return response.json();
}

getAccessToken().then((token) => {
  if(token.access_token != undefined) {
    // console.log(token);
    accessSharePoint(token.access_token).then((result) => 
    {
      const SITE_ID = result.id.split(',')[1];
      console.log(SITE_ID);
      driveID(token.access_token, SITE_ID).then((data) => {
        // listContents(token.access_token, data.value[0].id).then((PM_files) => {
        //   console.log(PM_files);
        // });
        console.log(data.value[0].id);
        uploadLocal(token.access_token, data.value[0].id).then((meme) => {
          console.log("Done");
        });
      });
    });
  }
  else {
    console.error(token);
  }
});