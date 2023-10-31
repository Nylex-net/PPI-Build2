function upload() {
    const formData = new FormData();
    formData.append('file', document.getElementById('task1').files[0]);
    fetch('https://e-dt-usertest.shn-engr.com:3001/upload', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
    })
    .catch(error => {
        console.error(error);
    });
}