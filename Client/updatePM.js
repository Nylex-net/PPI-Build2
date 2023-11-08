const HOST = 'e-hv-ppi';
var submitting = false;

document.getElementById('projForm').addEventListener('submit', function (e) {
    e.preventDefault();
    submitting = true;
    signIn();
});

async function verify(id) {
    const response = await fetch('https://'+HOST+'.shn-engr.com:3001/verify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ID:id})
    });
    return response.json();
}

function starter(res) {
    const promiseMe = verify(res.account.homeAccountId.split('.')[0]);
    promiseMe.then((response) => {
        console.log(response);
        const result = response.result;
        if(result && submitting) { // User is authorized.
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
        else if(!result) {
            submitting = false;
            document.getElementById('response').innerHTML = "You're not authorized to upload files to SharePoint.";
        }
    }).catch((err) =>{
        console.error(err);
        document.getElementById('response').innerHTML = "Something went wrong. Try again or contact help.";
    });
}