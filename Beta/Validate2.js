function atLeastOne() {
	let mySelects = document.getElementsByTagName('select');
	for(selected of mySelects) {
		if(selected.value == 0) {
			preventDefault();
			alert("Please fill out all required fields.");
			return;
		}
	}
	mySelects = document.getElementsByTagName('input[name="key"]:checked').length;
	otherKeys = document.getElementsByName('Otherkey');
	
	otherKeys.forEach((newKey)=> {
		// Code below for testing purposes
		// alert(newKey.value);
		if(newKey.value != "") {
			mySelects++;
		}
	});
	
	if(mySelects <= 0) {
		preventDefault();
		alert("Please fill out all required fields.");
		return;
	}
	
}

function customAmount() {
	if(document.getElementById('retainer').value == 'enterAmt') {
		document.getElementById('custAmount').innerHTML = '<input type="text" id="newAmount" name="newAmount" required>'
	}
	else {
		document.getElementById('custAmount').innerHTML = '';
	}
}

function getData() {
    var response = $.ajax({
        url: "/SHN.py",
    });

	alert(response);
}



function getEmpl() {

	const pg = require('pg'); // This line keeps causing problems, because browsers can't recognise Node.js methods
	
	// const client = pg.Client(config);
	
	client.connect(err => {
		if (err) throw err;
		else {
			console.log('Connection success!');
		}
	});

	const query = 'SELECT ID, Name FROM StaffList WHERE Name IS NOT NULL;';

	client
		.then(res => {
			const rows = res.rows;

			rows.map(row => {
				console.log(`Read: ${JSON.stringify(row)}`);
			});

			process.exit();
		})
		.catch(err => {
			console.log(err);
		});

	// $.ajax({
	// 	driver: "Microsoft Access Driver (*.mdb, *.accdb)",
	// 	url: "N:\Database\\New folder\SHN_Projects.mdb",
	// 	success: function (record) {
	// 		console.log(record);
	// 	},
	// 	Error: function(message) {
	// 		console.log(message);
	// 	}
	// });
}

// window.addEventListener("load", getEmpl(), false);

if(typeof window !== "undefined") {
	getEmpl();
}