import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Upload, 
  Download, 
  FileSpreadsheet, 
  HelpCircle, 
  AlertCircle,
  CheckCircle2,
  FileCheck
} from "lucide-react";
import { VoucherRecord } from "../types";

interface CsvImportExportProps {
  records: VoucherRecord[];
  onImport: (newRecords: VoucherRecord[], override: boolean) => void;
  onClose: () => void;
}

export default function CsvImportExport({ records, onImport, onClose }: CsvImportExportProps) {
  const [csvText, setCsvText] = useState("");
  const [overrideData, setOverrideData] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Advanced robust CSV parser taking quotes and commas into account
  const parseCSV = (text: string): string[][] => {
    const result: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let entry = "";

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          entry += '"'; // escaped quote
          i++;
        } else {
          inQuotes = !inQuotes; // toggle quotes
        }
      } else if (char === ',' && !inQuotes) {
        row.push(entry.trim());
        entry = "";
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++; // skip next linefeed
        }
        row.push(entry.trim());
        if (row.some(field => field !== "")) {
          result.push(row);
        }
        row = [];
        entry = "";
      } else {
        entry += char;
      }
    }
    // Pick up any leftover entries
    if (entry || row.length > 0) {
      row.push(entry.trim());
      result.push(row);
    }
    return result;
  };

  const handleExport = () => {
    // Generate valid CSV rows with headers
    const headers = [
      "S/NO", "DATE", "UNIT VR NO", "NAME OF THE PAYEE", "DESCRIPTION", "VOTE", "UNIT", 
      "VOUCHER AMOUNT", "HAND OVER DATE TO SUBJECT", "STATUS OF THE VR", "VOUCHER AMOUNT SEC", 
      "TOTAL SCHEDULE VALUE", "CHEQUE VALUE", "CROSS ENTRY", "TOTAL PAID", "HAND OVER DATE TO ITMIS", 
      "ITMIS EV NO", "STATUS OF THE PMT", "PAID DATE", "SCHEDULE NO.", "CHEQUE NO.", "HANDOVER TO", 
      "HAND OVER DATE", "PAID VR STATUS", "RECEIVED DATE"
    ];

    const csvRows = [headers.join(",")];

    records.forEach(r => {
      const values = [
        `"${r.serialNo}"`,
        `"${r.date}"`,
        `"${r.unitVrNo}"`,
        `"${r.payee.replace(/"/g, '""')}"`,
        `"${r.description.replace(/"/g, '""')}"`,
        `"${r.vote.replace(/"/g, '""')}"`,
        `"${r.unit.replace(/"/g, '""')}"`,
        `"${r.voucherAmount.toFixed(2)}"`,
        `"${r.handOverDateToSubject}"`,
        `"${r.statusOfVr.replace(/"/g, '""')}"`,
        `"${r.voucherAmountSec.toFixed(2)}"`,
        `"${r.totalScheduleValue.toFixed(2)}"`,
        `"${r.chequeValue.toFixed(2)}"`,
        `"${r.crossEntry.toFixed(2)}"`,
        `"${r.totalPaid.toFixed(2)}"`,
        `"${r.handOverDateToItmis}"`,
        `"${r.itmisEvNo}"`,
        `"${r.statusOfPmt}"`,
        `"${r.paidDate}"`,
        `"${r.scheduleNo}"`,
        `"${r.chequeNo}"`,
        `"${r.handoverTo}"`,
        `"${r.handOverDate}"`,
        `"${r.paidVrStatus}"`,
        `"${r.receivedDate}"`
      ];
      csvRows.push(values.join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `PSB_Voucher_Register_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = () => {
    if (!csvText.trim()) {
      setStatusMessage({ type: "error", text: "Please paste valid CSV content into the box." });
      return;
    }

    try {
      const parsedLines = parseCSV(csvText);
      if (parsedLines.length < 2) {
        setStatusMessage({ type: "error", text: "Invalid file. CSV must contain a header row and at least one data row." });
        return;
      }

      // Check if first line matches key columns, otherwise skip headers
      let startIndex = 1;
      const firstLineHeader = parsedLines[0].join(" ").toLowerCase();
      if (!firstLineHeader.includes("payee") && !firstLineHeader.includes("voucher") && !firstLineHeader.includes("s/no")) {
        startIndex = 0; // No header row detected
      }

      const newRecords: VoucherRecord[] = [];
      
      for (let i = startIndex; i < parsedLines.length; i++) {
        const line = parsedLines[i];
        if (line.length < 5 || line.every(val => val === "")) continue; // empty line

        // Safe index helper
        const getField = (idx: number, fallback = "") => {
          return line[idx] !== undefined ? line[idx].trim() : fallback;
        };

        const cleanAmount = (valStr: string) => {
          if (!valStr || valStr === "-") return 0;
          return parseFloat(valStr.replace(/,/g, "").trim()) || 0;
        };

        const serial = getField(0) || `25/${Math.floor(120000 + Math.random() * 1000)}`;
        
        newRecords.push({
          id: `vr-import-${Date.now()}-${i}`,
          serialNo: serial,
          date: getField(1) || new Date().toLocaleDateString(),
          unitVrNo: getField(2) || "-",
          payee: getField(3) || "UNNAMED PAYEE",
          description: getField(4) || "-",
          vote: getField(5) || "-",
          unit: getField(6) || "-",
          voucherAmount: cleanAmount(getField(7)),
          handOverDateToSubject: getField(8) || "-",
          statusOfVr: getField(9) || "Pending",
          voucherAmountSec: cleanAmount(getField(10)),
          totalScheduleValue: cleanAmount(getField(11)),
          chequeValue: cleanAmount(getField(12)),
          crossEntry: cleanAmount(getField(13)),
          totalPaid: cleanAmount(getField(14)),
          handOverDateToItmis: getField(15) || "-",
          itmisEvNo: getField(16) || "-",
          statusOfPmt: getField(17) || "-",
          paidDate: getField(18) || "-",
          scheduleNo: getField(19) || "-",
          chequeNo: getField(20) || "-",
          handoverTo: getField(21) || "-",
          handOverDate: getField(22) || "-",
          paidVrStatus: getField(23) || "-",
          receivedDate: getField(24) || "-"
        });
      }

      if (newRecords.length === 0) {
        setStatusMessage({ type: "error", text: "No valid voucher data could be parsed. Check your format." });
        return;
      }

      onImport(newRecords, overrideData);
      setStatusMessage({ 
        type: "success", 
        text: `Successfully imported ${newRecords.length} records into the register!` 
      });
      setCsvText("");
    } catch (err: any) {
      setStatusMessage({ type: "error", text: `Parsing Error: ${err.message || "Invalid layout formatting."}` });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setCsvText(text);
        setStatusMessage({ type: "success", text: `File "${file.name}" loaded into workspace. Press "Import" below to execute.` });
      }
    };
    reader.readAsText(file);
  };

  return (
    <AnimatePresence>
      <div id="csv-io-overlay" className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-[#161920] border border-slate-800 shadow-2xl rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-[#0A0C10] text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="text-emerald-400" size={20} />
              <div>
                <h2 className="text-sm font-extrabold uppercase tracking-wide">Data Import / Export Center</h2>
                <p className="text-[11px] text-slate-400">Migrate and back up your PSB register database</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-800/80 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5 text-xs overflow-y-auto max-h-[75vh]">
            
            {/* Export Card */}
            <div className="border border-slate-800/60 rounded-xl p-4 bg-[#0A0C10]/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-extrabold text-white text-sm mb-0.5">Export Active Ledger</h3>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Download all {records.length} registered vouchers as a standard `.csv` file compatible with Microsoft Excel, Numbers, and Google Sheets.
                </p>
              </div>
              <button
                onClick={handleExport}
                className="px-4 py-2 text-slate-300 bg-slate-800 hover:bg-slate-700 font-bold rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Download size={14} />
                Export Ledger
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs font-semibold uppercase tracking-wider">
                <span className="bg-[#161920] px-3 text-slate-500">or Import New Data</span>
              </div>
            </div>

            {/* Status alerts */}
            {statusMessage && (
              <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                statusMessage.type === "success" 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                : "bg-rose-500/10 border-rose-500/20 text-rose-400"
              }`}>
                {statusMessage.type === "success" ? (
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                )}
                <span className="font-medium">{statusMessage.text}</span>
              </div>
            )}

            {/* Paste Box Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-extrabold text-slate-400 block">Paste Raw CSV String or Upload File</label>
                <label className="cursor-pointer text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1">
                  <Upload size={13} />
                  Choose File
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <textarea
                rows={5}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={`Paste spreadsheet rows here. For example:
25/120061,02/12/2025,185/25,M P C S YAKKALAMULLA,FUEL,225-1-1-0-1202-009 Pool Vehicle Fuel,"11,960.00",25-12-02,Approved`}
                className="w-full px-3 py-2 bg-[#0A0C10] rounded-xl border border-slate-800 font-mono text-[10px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-600 leading-relaxed"
              />
            </div>

            {/* Override checkbox & Info */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="override-checkbox"
                checked={overrideData}
                onChange={(e) => setOverrideData(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-800 bg-[#0A0C10]"
              />
              <label htmlFor="override-checkbox" className="font-bold text-slate-400 cursor-pointer">
                Wipe register and replace entirely with this data
              </label>
            </div>

            {/* format instructions */}
            <div className="bg-slate-800/20 border border-slate-800 rounded-xl p-3.5 space-y-1.5 text-slate-400">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle size={12} /> Instructions for standard imports
              </span>
              <p className="text-[10px] leading-relaxed">
                We support copy-pasting directly from excel grids. Ensure columns are ordered: 
                <strong> S/NO, Date, Unit VR No, Payee, Description, Vote, Unit, Voucher Amount, Hand Over Date, Status.</strong> Values with commas must be wrapped in quotation marks.
              </p>
            </div>

          </div>

          {/* Footer */}
          <div className="bg-[#0A0C10] border-t border-slate-800 px-6 py-4 flex items-center justify-end gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleImport}
              className="px-4 py-2 rounded-lg text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center gap-1.5 shadow-sm shadow-indigo-950/20"
            >
              <FileCheck size={14} />
              Import Data
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
