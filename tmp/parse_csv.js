const fs = require("fs");
const path = require("path");

function parseCSVLine(line) {
  const result = [];
  let entry = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(entry.trim());
      entry = "";
    } else {
      entry += char;
    }
  }
  result.push(entry.trim());
  return result;
}

const csvFile = "/tmp/new_vouchers.csv";
const lines = fs.readFileSync(csvFile, "utf-8").split(/\r?\n/);

const records = [];

for (let i = 2; i < lines.length; i++) { // Skip header and blank line
  const lineStr = lines[i].trim();
  if (!lineStr) continue;
  
  const columns = parseCSVLine(lineStr);
  if (columns.length < 5) continue;
  
  const serialNo = columns[0];
  if (!serialNo) continue; // Skip if no serial number

  const cleanNum = (val) => {
    if (!val || val === "-" || val.trim() === "") return 0;
    return parseFloat(val.replace(/,/g, "").trim()) || 0;
  };

  const getField = (idx, fallback = "-") => {
    const val = columns[idx];
    if (val === undefined || val === null || val.trim() === "" || val.trim() === "-") return fallback;
    return val.trim();
  };

  records.push({
    id: `seeded-${1000 + i}`,
    serialNo: serialNo,
    date: getField(1),
    unitVrNo: getField(2),
    payee: getField(3),
    description: getField(4),
    vote: getField(5),
    unit: getField(6),
    voucherAmount: cleanNum(columns[7]),
    handOverDateToSubject: getField(8),
    statusOfVr: getField(9),
    voucherAmountSec: cleanNum(columns[10]),
    totalScheduleValue: cleanNum(columns[11]),
    chequeValue: cleanNum(columns[12]),
    crossEntry: cleanNum(columns[13]),
    totalPaid: cleanNum(columns[14]),
    handOverDateToItmis: getField(15),
    itmisEvNo: getField(16),
    statusOfPmt: getField(17),
    paidDate: getField(18),
    scheduleNo: getField(19),
    chequeNo: getField(20),
    handoverTo: getField(21),
    handOverDate: getField(22),
    paidVrStatus: getField(23),
    receivedDate: getField(24)
  });
}

console.log(`Parsed ${records.length} records successfully.`);

const tsContent = `import { VoucherRecord } from "./types";

export const SEED_VOUCHER_RECORDS: VoucherRecord[] = ${JSON.stringify(records, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, "../src/data.ts"), tsContent, "utf-8");
console.log("Wrote parsed data successfully to src/data.ts");
