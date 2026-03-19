const xlsx = require('xlsx');
try {
    const workbook = xlsx.readFile('SRS Inputs from STLA.xlsx');
    const sheetName = workbook.SheetNames[0];
    console.log("SheetName: ", sheetName);
    const sheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(sheet);
    console.log(JSON.stringify(jsonData.slice(0, 10), null, 2));
} catch (e) { console.error(e); }
