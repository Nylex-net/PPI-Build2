 function atLeastOne() {
	var projMgr = document.getElementById('projMgr').value;
	var keywords = document.querySelectorAll('input[name="key"]:checked').length;
	var otherKeys = document.getElementsByName('Otherkey');
	var officeLoc = document.getElementById('office').value;
	var promoType = document.getElementById('promo-type').value;
	var QAQC = document.getElementById('qaqc').value;
	var service = document.getElementById('service').value;
	var profile = document.getElementById('code').value;

	otherKeys.forEach((newKey)=> {
		// Code below for testing purposes
		// alert(newKey.value);
		if(newKey.value != "") {
			keywords++;
		}
	});
	// Code below for testing purposes
	// alert("keywords: " + keywords);
	
	if(keywords <= 0 || projMgr == 0 || officeLoc == 0 || promoType == 0 || QAQC == 0 || service == 0 || profile == 0) {
		event.preventDefault();
		alert("Please fill out all required fields.");
		return;
	}
	
}

function createIDs() {
	let proj = "0";
	if(document.getElementById("office").value == "Eureka/Arcata (Corporate)") {
		proj += 0;
	}
	else if(document.getElementById("office").value == "KF") {
		proj += 2;
	}
	else if(document.getElementById("office").value == "Willits/FB") {
		proj += 4;
	}
	else if(document.getElementById("office").value == "Redding") {
		proj += 5;
	}
	else {
		proj += 6;
	}
	
	proj += new Date().getFullYear()[2] + new Date().getFullYear()[3];
	let promo = proj;
}
/*
const element = document.querySelector('form');
element.addEventListener('submit', event => {
	event.preventDefault();
	atLeastOne();
	});*/