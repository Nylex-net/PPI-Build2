// function upload() {
//     const formData = new FormData();
//     formData.append('file', document.getElementById('task1').files[0]);
//     formData.append('file', document.getElementById('task5').files[0]);
//     formData.append('file', document.getElementById('task10').files[0]);
//     fetch('https://e-dt-usertest.shn-engr.com:3001/upload', {
//         method: 'POST',
//         body: formData,
//     })
//     .then(response => response.json())
//     .then(data => {
//         console.log(data);
//     })
//     .catch(error => {
//         console.error(error);
//     });
// }

document.getElementById('projForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append('file', document.getElementById('task1').files[0]);
    formData.append('file', document.getElementById('task5').files[0]);
    formData.append('file', document.getElementById('task10').files[0]);

    fetch('https://e-dt-usertest.shn-engr.com:3001/upload', {
        method: 'POST',
        body: formData,
    })
    .then(response => console.log(response))
    .catch(error => {
        console.error(error);
    });
});
