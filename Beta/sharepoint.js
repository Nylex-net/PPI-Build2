// Define the URL to the SharePoint site and the file path
const sharepointSite = "https://nylexnet.sharepoint.com";
const filePath = '/sites/nylex.net/Shared Documents/dummy.txt'; // The destination path

// The URL for the SharePoint file endpoint
const fileEndpoint = `${sharepointSite}/_api/web/getfolderbyserverrelativeurl('${filePath}')/files/add(overwrite=true)`;

// Define the file content
const fileContent = 'This is the content of the file.';

const accessToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IjlHbW55RlBraGMzaE91UjIybXZTdmduTG83WSIsImtpZCI6IjlHbW55RlBraGMzaE91UjIybXZTdmduTG83WSJ9.eyJhdWQiOiJodHRwczovL255bGV4bmV0LnNoYXJlcG9pbnQuY29tIiwiaXNzIjoiaHR0cHM6Ly9zdHMud2luZG93cy5uZXQvYWNiMTQyMTYtNDNhYy00OTYyLWIyNWItMTg5ZmYxMTUyMTg4LyIsImlhdCI6MTY5ODQyMDc5NywibmJmIjoxNjk4NDIwNzk3LCJleHAiOjE2OTg0MjQ2OTcsImFpbyI6IkUyRmdZT0NZOSttemJkMGxqcjlGdTRUL1p5ZGJBd0E9IiwiYXBwX2Rpc3BsYXluYW1lIjoiU2hhcmVQb2ludCBUZXN0IiwiYXBwaWQiOiJiOGQ3NDU1Ni0yOWU0LTQ3YmItOTQ2MS1mYTA0M2IzNDQ0Y2MiLCJhcHBpZGFjciI6IjEiLCJpZHAiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC9hY2IxNDIxNi00M2FjLTQ5NjItYjI1Yi0xODlmZjExNTIxODgvIiwiaWR0eXAiOiJhcHAiLCJvaWQiOiJlYmE2MGFjZS0yZTZlLTRhM2ItYmU4ZS1jMjEyNjc3ZjNmNzciLCJyaCI6IjAuQVNrQUZrS3hyS3hEWWtteVd4aWY4UlVoaUFNQUFBQUFBUEVQemdBQUFBQUFBQUFwQUFBLiIsInJvbGVzIjpbIlNpdGVzLlJlYWRXcml0ZS5BbGwiXSwic2lkIjoiMTE4MjM3M2QtOWNlMC00YmM2LTk0YWYtZGMzYmZkMzNkY2MwIiwic3ViIjoiZWJhNjBhY2UtMmU2ZS00YTNiLWJlOGUtYzIxMjY3N2YzZjc3IiwidGlkIjoiYWNiMTQyMTYtNDNhYy00OTYyLWIyNWItMTg5ZmYxMTUyMTg4IiwidXRpIjoidnhDY1JpTzdXVVc4b3FFRUVqQWVBQSIsInZlciI6IjEuMCJ9.A3dv_xzFD9x4JeVXlnChkmHUd4gCgzIXC8XavSQqcJ94yKXqXtUJK93jj684bMWEm6fDEMzG55owAhuJBbShRfwrqfo4b4blfs2zBN-AsErfemMVayUmQ-ViupzXpCgJAkfzWb4jbPHOgPULIvRa_tB9b04triEnvngMGdPKrvw80sSvyUXEMSQHaCJGYt0h0PH49VZpo4opSyep0kOtI_4f9cWMKk0_a6LOyoVpTNmFXfTpWVjFMBnMPcVA31kgQ2Q8vfafx_i7YnpzAAWAudznLQYdqlMFs6tga86aS5h3rbkBe7ATauJmSqJjM61H97XRSNSgkuI2H_2eoFyoyw';

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