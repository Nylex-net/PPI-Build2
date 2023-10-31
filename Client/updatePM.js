function upload() {
    const formData = new FormData();
    formData.append('file1', document.getElementById('task1').files[0]);
    formData.append('file5', document.getElementById('task5').files[0]);
    formData.append('file10', document.getElementById('task10').files[0]);
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