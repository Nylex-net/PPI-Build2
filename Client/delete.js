function closeProject() {
    const ID = document.getElementById('proj').value.trim();
    if(/[0,2,4,5,6][0-9][0-9][0-9][0-9][0-9]A?/g.test(ID)) {
        if(confirm("Are you absolutely sure you want to delete this project with ID " + ID)) {
            deleter(ID, true);
        }
    }
    else {
        alert("That's not even a project number.");
    }
}

function closePromo() {
    const ID = document.getElementById('promo').value.trim();
    if(/[0,2,4,5,6][0-9][0-9]000.[0-9][0-9][0-9]A?/g.test(ID)) {
        if(confirm("Are you absolutely sure you want to delete this promo with ID " + document.getElementById('promo').value)) {
            deleter(ID, false);
        }
    }
    else {
        alert("That's not even a promo number.");
    }
}

function deleter(id, isProject) {
    document.getElementById((isProject?'projMsg':'promoMsg')).innerHTML = "Please wait...";
    const postData = {
        ID: id,
        Project: isProject
    };
    fetch('https://e-hv-ppi.shn-engr.com:3001/delete', {
        method: 'post',
        headers: {
            "Content-Type": "application/json"
    },
        body: JSON.stringify(postData)
    }).then(response => {
        if (!response.ok) {
            // document.getElementById((isProject?'projMsg':'promoMsg')).innerHTML = "Aw man, an error happened.";
            const message = 'Error with Status Code: ' + response.status;
            // alert(message);
            throw new Error(message);
        }
        else {
            document.getElementById((isProject?'proj':'promo')).value = '';
            document.getElementById((isProject?'projMsg':'promoMsg')).innerHTML = "Deleted " + (isProject?"project # ":"promo # ") + id + "!";
        }
    }).catch(err => {
        document.getElementById((isProject?'projMsg':'promoMsg')).innerHTML = "Aw man, an error happened.";
        const message = "This error occurred:\n" + err;
        alert(message);
        throw new Error(message);
    });
}