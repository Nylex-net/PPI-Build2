// Define the URL to the SharePoint site and the file path
const sharepointSite = "https://nylexnet.sharepoint.com";
const filePath = '/sites/nylex.net/Shared Documents/dummy.txt'; // The destination path

// The URL for the SharePoint file endpoint
const fileEndpoint = `${sharepointSite}/_api/web/getfolderbyserverrelativeurl('${filePath}')/files/add(overwrite=true)`;

// Define the file content
const fileContent = 'This is the content of the file.';

const accessToken = ''

// Define the request headers, including the Access Token
const headers = {
  Authorization: `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
};

// Define the request options https://nylexnet.sharepoint.com/:t:/r/sites/nylex.net/Shared%20Documents/dummy.txt?csf=1&web=1&e=cbMaZM
const options = {
  method: 'POST',
  headers: headers,
  body: JSON.stringify({ Content: fileContent }),
};

// Make the API request to upload the file
fetch(fileEndpoint, options)
  .then((response) => {
    if (response.ok) {
      console.log('File uploaded successfully.');
    } else {
      console.error('Error:', response.status, response.statusText);
    }
  })
  .catch((error) => {
    console.error('Error:', error);
  });