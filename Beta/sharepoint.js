const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const http = require('https');
const webpack = require('webpack');

module.exports = {
    plugins: [
      new webpack.DefinePlugin({
        'process.env.tenant_id': JSON.stringify('tenant_id'),
        'process.env.client_id': JSON.stringify('client_id')
      }),
    ],
  };

const tenant_id = process.env.tenant_id;
console.log(tenant_id);
const url = `https://login.microsoftonline.com/${tenant_id}/oauth2/v2.0/authorize`;

const params = {
    client_id: process.env.client_id,
    response_type: 'code',
    scope: 'user.read sites.readwrite.all',
    response_mode: 'query',
    redirect_uri: 'http://localhost',
    state: 12345,
    code_challenge: '',
    code_challenge_method: 'S256'
};

// Function to build the URL
function buildUrl(baseUrl, params) {
    const url = new URL(baseUrl);
    for (const key in params) {
      url.searchParams.append(key, params[key]);
    }
    return url.toString();
  }

  function generateCodeVerifier(length) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let verifier = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      verifier += charset[randomIndex];
    }
    return verifier;
  }
  
  // Calculate the code challenge from the code verifier
  function generateCodeChallenge(codeVerifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    return crypto.subtle.digest('SHA-256', data).then((buffer) => {
      const challenge = Array.from(new Uint8Array(buffer))
        .map((byte) => String.fromCharCode(byte))
        .join('');
      return btoa(challenge)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    });
  }
  
  // Generate a code verifier and code challenge
  async function generatePKCEChallenge() {
    const codeVerifier = generateCodeVerifier(128); // Adjust the length as needed
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    return { codeVerifier, codeChallenge };
  }
  
  // Usage
  generatePKCEChallenge().then((pkce) => {
    console.log('Code Verifier:', pkce.codeVerifier);
    console.log('Code Challenge:', pkce.codeChallenge);
    const myURL = buildUrl(url, params);
    console.log(myURL);
    // const request = https.request();
  });