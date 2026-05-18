const axios = require('axios');
const fs = require('fs');

const url = "https://lb2.cvip-preprod.citroen.in:40543/jeep/files/device/downloadfirmware?filename=MD0_02_00.zip&releaseversion=5314.0&filetype=mcu&category=BATCH&fotaid=e51f4c79-1216-11f1-89a1-23b8ddefd193";

const accessToken = "bf0a4e82-a275-3fe1-937a-32859e2e04b1";

axios({
    method: 'GET',
    url: url,
    responseType: 'stream',
    headers: {
        //"access-token": accessToken
        // or try:
         "Authorization": `Bearer ${accessToken}`
    },
    httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: false
    })
})
.then(response => {
    const writer = fs.createWriteStream("MD0_02_00.zip");
    response.data.pipe(writer);

    writer.on('finish', () => {
        console.log(" File downloaded successfully");
    });

    writer.on('error', err => {
        console.error(" File write error:", err.message);
    });
})
.catch(error => {
    console.error(" Download failed:", error.message);
});
