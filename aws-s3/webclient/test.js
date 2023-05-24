/*
* Web client to upload a binary file to a Codehooks.io AWS S3 API
*/

var URL = 'https://<YOUR_PROJECT_ID_HERE>.api.codehooks.io';
var APIKEY = 'YOUR_API_TOKEN_HERE';

async function uploadFile(file, cb) {
    var myHeaders = new Headers();
    myHeaders.append("x-apikey", APIKEY);
    myHeaders.append("filename", file.name);
    myHeaders.append("content", file.type);
    myHeaders.append("content-type", file.type);
    myHeaders.append("content-length", file.size);

    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: file, // file stream
        redirect: 'follow'
    };

    try {
        var response = await fetch(`${URL}/dev/upload/single`, requestOptions)
        console.log(response.status, response.statusText);
        var result = await response.text();
        console.log(result);
        cb(result);
    } catch (error) {
        console.error(error)
    }
}

// HTML5 file event
function fileChange(theEvent) {
    var theFile = theEvent.target.files[0]; // target the loaded file
    uploadFile(theFile, (result) => {
        var mydiv = document.getElementById("myDiv");
        var aTag = document.createElement('a');
        aTag.setAttribute('href',`${URL}/dev/download/${theFile.name}`);
        aTag.setAttribute('target','_blank');
        aTag.innerText = theFile.name;
        mydiv.appendChild(aTag);
        mydiv.appendChild(document.createElement("br"));
        if (theFile.type.startsWith('image')) {
            var imgTag = document.createElement('img');
            imgTag.setAttribute('src',`${URL}/dev/download/${theFile.name}`);
            imgTag.setAttribute('width','200px');
            mydiv.appendChild(imgTag);
            mydiv.appendChild(document.createElement("br"));
        }
    });    
}
// get html element for file: <input type="file" id="inputFile">
document.getElementById("inputFile").addEventListener("change", fileChange, false); // listener for file upload button