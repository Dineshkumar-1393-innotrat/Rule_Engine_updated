const xlsx = require('xlsx');
try {
    const workbook = xlsx.readFile('SRS Inputs from STLA.xlsx');
    console.log("Sheets:", workbook.SheetNames);
    for (const sheetName of workbook.SheetNames) {
        console.log(`\n\n--- Sheet: ${sheetName} ---`);
        const sheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(sheet);
        console.log(JSON.stringify(jsonData.slice(0, 2), null, 2));
    }
} catch (e) { console.error(e); }
