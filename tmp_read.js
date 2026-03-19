const fs = require('fs');
const pdfParse = require('pdf-parse');
const xlsx = require('xlsx');

async function readFiles() {
    try {
        console.log("--- PDF CONTENT ---");
        const pdfFile = fs.readFileSync('TE 01_STLA_M6 Jeep Migration_NorthBound_API_Interface_Specification_V1.3.pdf');
        const pdfData = await pdfParse(pdfFile);
        console.log(pdfData.text.substring(0, 3000)); // Print first 3000 chars to avoid overwhelming output

        console.log("\n\n--- XLSX CONTENT ---");
        const workbook = xlsx.readFile('SRS Inputs from STLA.xlsx');
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(sheet);
        console.log(JSON.stringify(jsonData.slice(0, 50), null, 2)); // Print first 50 rows
    } catch (err) {
        console.error("Error reading files:", err);
    }
}

readFiles();
