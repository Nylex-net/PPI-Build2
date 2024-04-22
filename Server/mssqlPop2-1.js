const sql = require('mssql');
const ADODB = require('node-adodb');
const DATABASE_PATH = "C:\\Users\\administrator\\Documents\\SHN_Project_Backup.mdb;";
const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source='+DATABASE_PATH);
const jsonData = require('./config.json');