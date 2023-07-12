# PPI-Build2
Build 2 of the Project and Promo Initiation Project. This is a continuation of the SHN-Project-Initiation, which is currently a private repository under the organization. For context, here's a copy of it's README.md description:

Creating a new Project/Promo Initiation system (PPI) for the company SHN Engineers & Geologists, Inc.. The creator of their old system was no longer around, so it became my task to create a new version that conformed to their requirements as close as possible.

This form makes most use of JavaScript and Node.js. The file SHNserver.js is the script that runs using Node.js to send recieve all requests by both the Project and Promo Initiation forms. SHNserver.js retrieves the information from a Microsoft Access Database that holds the dynamically changing information. When a user sends data, it updates the database with the users' inputs, creates a folder structure for the company's file system, creates a PDF listing all of the users' inputs, and emails personnel of the initiation.

The initiation froms dynamically update the webpage by redacting and inserting new HTML into the webpage. It essentially behaves as if the form is made up of multiple pages. The requests the forms make are to update the options based on who currently works for SHN, what keywords are available, and what profile codes are currently available. Linked to the forms is a page to search for projects with similar descriptions, projects with same project numbers, or both if needed. The last page shows a summary of what the user inputted into the system. Once the information sends correctly, it will prompt the user of the form's success of submitting, and asks the user whether to initialize another project or promo, or to go back to the home page.

Other functionalities include adding billing groups to pre-initialized projects, converting a promo to a project, searching the database, and editing Promos and Projects.
