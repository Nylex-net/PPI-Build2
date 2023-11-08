const HOST = 'e-hv-ppi';

document.getElementById('projForm').addEventListener('submit', function (e) {
    e.preventDefault();
    signIn();
});

function verify(id) {
    signIn();
}

async function starter(res) {
    const response = await fetch('https://'+HOST+'.shn-engr.com:3001/verify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ID:res.account.homeAccountId.split('.')[0]})
    });
    if(await response.json().result) {
        const formData = new FormData();
        formData.append('file', document.getElementById('task1').files[0]);
        formData.append('file', document.getElementById('task5').files[0]);
        formData.append('file', document.getElementById('task10').files[0]);

        fetch('https://'+HOST+'.shn-engr.com:3001/upload', {
            method: 'POST',
            body: formData,
        })
        .then(response => {
            console.log(response);
            document.getElementById('response').innerHTML = "Successful response. Double check the SharePoint site to make sure your files uploaded.";
        })
        .catch(error => {
            console.error(error);
            document.getElementById('response').innerHTML = "An error ocurred.";
        });
    }
    else {
        document.getElementById('response').innerHTML = "You're not authorized to upload files to SharePoint.";
    }
}