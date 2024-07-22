# Server Side Scripts

Any files and scripts that are meant to run on the server side is kept in this folder.  The most important files her are SHNserver.js and SHNserver2.js.  These are the files that run using Node.js on the PPI server 24/7 to handle requests.  Most other files you may see here involve scripts written to transfer data from my previous PPI's Access database to the newer MSSQL database.  This especially includes mssqlPop.js, mssqlPop2.js, mssqlPop2-1.js, and populateRolodex.js.

## About the database Transfer Scripts

My biggest priority with Build 2 was to steer SHN away from using their old layout of their SHN database to a more structured one, because some of their older data had been stored in a very unstructured format within a single SQL table.  This made it rather difficult to manage some of their data when something needed to be created, edited, deleted, and pulled from.  For field values that involve a various amount of entries, I gave them a separate table linking to the primary user entry.  However, this also meant that I needed an easy way to transfer data from the old format to the new one.  That's where these transfer scripts came in.
