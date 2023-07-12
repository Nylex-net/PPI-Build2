const signInButton = document.getElementById("SignIn");

function showWelcomeMessage(username) {
    document.getElementById('currUser').innerHTML = `Welcome, ${username}`;
}

