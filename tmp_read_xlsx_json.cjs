const fs = require('fs');
const xlsx = require('xlsx');
try {
    const workbook = xlsx.readFile('SRS Inputs from STLA.xlsx');
    const out = { Sheets: workbook.SheetNames, Data: {} };
    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        out.Data[sheetName] = xlsx.utils.sheet_to_json(sheet).slice(0, 5); // first 5 rows
    }
    fs.writeFileSync('tmp_output_xlsx.json', JSON.stringify(out, null, 2));
} catch (e) { console.error(e); }
