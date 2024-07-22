# Client Side Data

This is all data stored on the XAMPP server support the front-end of the PPI.  Much of these files consist of HTML files and their associated JavaScript files to manage user interactions and input data.  The only files that are reused across multiple pages include cascading stylesheets and pre-downloaded scripts to implement the Microsoft login.

## About the Microsoft Login

Apart of implementing this into Build 2, I've also had to configure an Application ID via Azure App Registration.  This configuration includes matching the domain of Build 2 to the Redirect URI in the App Registration Settings.  If these don't match, this creates an error where users view the PPI homepage through the pop-up window.  If users ask about this, please redirect them to the correct domain.
