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
      setStatusMessage({ type: "error", text: "Please paste valid CSV content into the workspace." });
      return;
    }

    try {
      const parsedLines = parseCSV(csvText);
      if (parsedLines.length < 2) {
        setStatusMessage({ type: "error", text: "Invalid format. CSV must contain a header row and at least one data row." });
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
        setStatusMessage({ type: "error", text: "No valid voucher data could be parsed. Check your layout formatting." });
        return;
      }

      onImport(newRecords, overrideData);
      setStatusMessage({ 
        type: "success", 
        text: `Successfully imported ${newRecords.length} records into the voucher register database.` 
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
        setStatusMessage({ type: "success", text: `File "${file.name}" loaded. Click "Execute Import" below to apply changes.` });
      }
    };
    reader.readAsText(file);
  };

  return (
    <AnimatePresence>
      <div id="csv-io-overlay" className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.15 }}
          className="bg-white border border-[#D6D9DE] shadow-xl rounded-[6px] w-full max-w-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-[#1F3A5F] text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="text-white opacity-90" size={20} />
              <div>
                <h2 className="text-base font-bold tracking-tight">Data Backup & Migration Utility</h2>
                <p className="text-xs text-slate-200">Import or export financial registers via standard formats</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-[4px] text-white/80 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5 text-sm overflow-y-auto max-h-[70vh]">
            
            {/* Export Card */}
            <div className="border border-[#D6D9DE] rounded-[6px] p-4 bg-[#F5F6F8] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-bold text-[#1E293B] text-sm mb-1">Export Voucher Database</h3>
                <p className="text-[#64748B] text-xs leading-relaxed">
                  Export the current register containing {records.length} records into a comma-separated values (.csv) format for backup or external auditing.
                </p>
              </div>
              <button
                onClick={handleExport}
                className="px-4 py-2 text-xs font-semibold bg-[#1F3A5F] hover:bg-[#152842] text-white rounded-[6px] transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Download size={14} />
                Export CSV
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-[#D6D9DE]" />
              </div>
              <div className="relative flex justify-center text-xs font-semibold uppercase tracking-wider">
                <span className="bg-white px-3 text-[#64748B]">Import Records</span>
              </div>
            </div>

            {/* Status alerts */}
            {statusMessage && (
              <div className={`p-3 rounded-[6px] border flex items-start gap-2.5 text-xs ${
                statusMessage.type === "success" 
                ? "bg-green-50 border-green-200 text-[#2E7D32]" 
                : "bg-red-50 border-red-200 text-[#C62828]"
              }`}>
                {statusMessage.type === "success" ? (
                  <CheckCircle2 size={16} className="text-[#2E7D32] shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={16} className="text-[#C62828] shrink-0 mt-0.5" />
                )}
                <span className="font-medium">{statusMessage.text}</span>
              </div>
            )}

            {/* Paste Box Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-[#1E293B] block">Paste Raw CSV Data or Select File</label>
                <label className="cursor-pointer text-[#1F3A5F] hover:underline font-semibold flex items-center gap-1 text-xs">
                  <Upload size={13} />
                  Upload Local File (.csv)
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
                placeholder={`Paste spreadsheet rows here. Expected column alignment:
25/120061,02/12/2025,185/25,M P C S YAKKALAMULLA,FUEL,225-1-1-0-1202-009 Pool Vehicle Fuel,"11,960.00",25-12-02,Approved`}
                className="w-full px-3 py-2 bg-white rounded-[6px] border border-[#D6D9DE] font-mono text-xs text-[#1E293B] focus:outline-none focus:border-[#1F3A5F] placeholder-slate-400 leading-relaxed"
              />
            </div>

            {/* Override checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="override-checkbox"
                checked={overrideData}
                onChange={(e) => setOverrideData(e.target.checked)}
                className="w-4 h-4 text-[#1F3A5F] border-[#D6D9DE] rounded focus:ring-[#1F3A5F]"
              />
              <label htmlFor="override-checkbox" className="font-medium text-[#1E293B] cursor-pointer">
                Wipe the active register and replace entirely with the imported records
              </label>
            </div>

            {/* Format instructions */}
            <div className="bg-[#F5F6F8] border border-[#D6D9DE] rounded-[6px] p-4 text-[#64748B] text-xs space-y-1.5">
              <span className="font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-1.5 text-[10px]">
                <HelpCircle size={13} className="text-[#1F3A5F]" /> Formatting Guidelines
              </span>
              <p className="leading-relaxed">
                Ensure rows match the government register database schema:
                <strong className="block mt-1 font-mono text-[10px] text-[#1E293B]">S/NO, Date, Unit VR No, Payee, Description, Vote, Unit, Voucher Amount, Hand Over Date, Status</strong>
                Wrap complex descriptions containing commas in standard double quotes.
              </p>
            </div>

          </div>

          {/* Footer */}
          <div className="bg-[#F5F6F8] border-t border-[#D6D9DE] px-6 py-4 flex items-center justify-end gap-3 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold bg-white border border-[#D6D9DE] text-[#1E293B] hover:bg-[#E2E8F0] rounded-[6px] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#2E7D32] hover:bg-[#235E26] rounded-[6px] transition-colors flex items-center gap-1.5"
            >
              <FileCheck size={14} />
              Execute Import
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
