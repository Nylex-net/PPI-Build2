// console.log('26     , 515 || 99 || 69  , 420'.split(/,| \|\| /g).filter(mem => {return mem.trim() != '' && !isNaN(mem);}));
// console.log(!isNaN('050 '));

const winPermissionsManager = require('win-permissions-js');

const folderPath = 'U:/Nylex/test/test2.txt';
const permissions = new winPermissionsManager({folderPath});
let accessString = 'GA';
const domain = 'SHN-ENGR';
let name = 'Domain Admins';
permissions.addRight({domain, name, accessString});
name = 'Domain users';
accessString = 'GR';
permissions.addRight({domain, name, accessString});
permissions.applyRights({disableInheritance:true});