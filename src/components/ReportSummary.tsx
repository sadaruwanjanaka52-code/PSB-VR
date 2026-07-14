import { useState } from "react";
import { motion } from "motion/react";
import { VoucherRecord } from "../types";
import { 
  TrendingUp, 
  Calendar, 
  Printer, 
  Copy, 
  Check, 
  Download, 
  CalendarDays, 
  Layers, 
  Users
} from "lucide-react";

interface ReportSummaryProps {
  records: VoucherRecord[];
}

export default function ReportSummary({ records }: ReportSummaryProps) {
  // Extract all unique years present in records, fallback to include 2027 by default
  const availableYears = Array.from(
    new Set(
      records.map((r) => {
        // Parse year from date string (format "DD/MM/YYYY" or "YYYY-MM-DD" or similar)
        if (!r.date) return "";
        if (r.date.includes("/")) {
          const p = r.date.split("/");
          return p[2] || "";
        } else if (r.date.includes("-")) {
          const p = r.date.split("-");
          return p[0] || "";
        }
        return "";
      })
    )
  )
    .filter((y) => y && y.length === 4)
    .sort();

  // If 2027 isn't in the list (e.g., list is empty), let's ensure 2027 is the default and shown
  if (!availableYears.includes("2027")) {
    availableYears.push("2027");
    availableYears.sort();
  }

  const [selectedYear, setSelectedYear] = useState<string>("2027");
  const [copied, setCopied] = useState(false);

  // Filter records matching the selected year
  const yearRecords = records.filter((r) => {
    if (!r.date) return false;
    if (r.date.includes("/")) {
      return r.date.split("/")[2] === selectedYear;
    } else if (r.date.includes("-")) {
      return r.date.split("-")[0] === selectedYear;
    }
    return false;
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // 12 Months layout helper
  const monthsList = [
    { name: "January", index: 1 },
    { name: "February", index: 2 },
    { name: "March", index: 3 },
    { name: "April", index: 4 },
    { name: "May", index: 5 },
    { name: "June", index: 6 },
    { name: "July", index: 7 },
    { name: "August", index: 8 },
    { name: "September", index: 9 },
    { name: "October", index: 10 },
    { name: "November", index: 11 },
    { name: "December", index: 12 },
  ];

  // Process data for monthly grid
  const monthlyData = monthsList.map((m) => {
    const monthRecs = yearRecords.filter((r) => {
      if (!r.date) return false;
      let monthNum = 0;
      if (r.date.includes("/")) {
        monthNum = parseInt(r.date.split("/")[1], 10);
      } else if (r.date.includes("-")) {
        monthNum = parseInt(r.date.split("-")[1], 10);
      }
      return monthNum === m.index;
    });

    const totalAmount = monthRecs.reduce((sum, r) => sum + (r.voucherAmount || 0), 0);
    const totalPaid = monthRecs.reduce((sum, r) => sum + (r.totalPaid || 0), 0);
    const outstanding = Math.max(0, totalAmount - totalPaid);
    const count = monthRecs.length;

    return {
      name: m.name,
      monthNum: m.index,
      totalAmount,
      totalPaid,
      outstanding,
      count,
    };
  });

  // Calculate annual sums
  const annualTotalAmount = monthlyData.reduce((sum, m) => sum + m.totalAmount, 0);
  const annualTotalPaid = monthlyData.reduce((sum, m) => sum + m.totalPaid, 0);
  const annualOutstanding = Math.max(0, annualTotalAmount - annualTotalPaid);
  const annualCount = yearRecords.length;

  // Peak month
  const peakMonthObj = [...monthlyData].sort((a, b) => b.totalAmount - a.totalAmount)[0];
  const peakMonth = peakMonthObj && peakMonthObj.totalAmount > 0 ? peakMonthObj.name : "N/A";
  const peakMonthAmt = peakMonthObj ? peakMonthObj.totalAmount : 0;

  // Top Payee for the year
  const payeeMap: Record<string, number> = {};
  yearRecords.forEach((r) => {
    const name = r.payee?.trim().toUpperCase() || "UNKNOWN";
    if (name && name !== "-") {
      payeeMap[name] = (payeeMap[name] || 0) + (r.voucherAmount || 0);
    }
  });
  const topPayeeEntry = Object.entries(payeeMap).sort((a, b) => b[1] - a[1])[0];
  const topPayeeName = topPayeeEntry ? topPayeeEntry[0] : "No Records";
  const topPayeeAmount = topPayeeEntry ? topPayeeEntry[1] : 0;

  // Top Unit for the year
  const unitMap: Record<string, number> = {};
  yearRecords.forEach((r) => {
    const unitName = r.unit?.trim().toUpperCase() || "UNKNOWN";
    if (unitName && unitName !== "-") {
      unitMap[unitName] = (unitMap[unitName] || 0) + 1; // count vouchers
    }
  });
  const topUnitEntry = Object.entries(unitMap).sort((a, b) => b[1] - a[1])[0];
  const topUnitName = topUnitEntry ? topUnitEntry[0] : "No Records";
  const topUnitCount = topUnitEntry ? topUnitEntry[1] : 0;

  // Copy report to clipboard
  const handleCopyTextReport = () => {
    let text = `=========================================\n`;
    text += `PSB AUDIT FINANCIAL REPORT - FISCAL YEAR ${selectedYear}\n`;
    text += `=========================================\n\n`;
    text += `ANNUAL SUMMARY:\n`;
    text += `- Total Vouchers Audited: ${annualCount}\n`;
    text += `- Total Voucher Expenditure: ${formatCurrency(annualTotalAmount)}\n`;
    text += `- Total Settled Payments: ${formatCurrency(annualTotalPaid)}\n`;
    text += `- Total Outstanding Balance: ${formatCurrency(annualOutstanding)}\n\n`;
    text += `PERFORMANCE HIGHLIGHTS:\n`;
    text += `- Peak Expenditure Month: ${peakMonth} (${formatCurrency(peakMonthAmt)})\n`;
    text += `- Leading Vendor/Payee: ${topPayeeName} (${formatCurrency(topPayeeAmount)})\n`;
    text += `- Highest Volume Unit: ${topUnitName} (${topUnitCount} vouchers)\n\n`;
    text += `MONTHLY BREAKDOWN:\n`;
    text += `-------------------------------------------------------------\n`;
    text += `Month        | Count | Total Amount      | Paid Amount       | Outstanding\n`;
    text += `-------------------------------------------------------------\n`;
    monthlyData.forEach((m) => {
      const monthPad = m.name.padEnd(12, " ");
      const countPad = String(m.count).padEnd(5, " ");
      const amtPad = formatCurrency(m.totalAmount).padEnd(18, " ");
      const paidPad = formatCurrency(m.totalPaid).padEnd(18, " ");
      const outPad = formatCurrency(m.outstanding);
      text += `${monthPad} | ${countPad} | ${amtPad} | ${paidPad} | ${outPad}\n`;
    });
    text += `-------------------------------------------------------------\n`;
    text += `Report generated dynamically on ${new Date().toLocaleString()}.\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export year report to CSV
  const handleExportYearCsv = () => {
    const headers = ["Month", "Voucher Count", "Total Amount (LKR)", "Settled Paid (LKR)", "Outstanding Balance (LKR)"];
    const csvRows = [headers.join(",")];

    monthlyData.forEach((m) => {
      const row = [
        `"${m.name}"`,
        m.count,
        m.totalAmount.toFixed(2),
        m.totalPaid.toFixed(2),
        m.outstanding.toFixed(2)
      ];
      csvRows.push(row.join(","));
    });

    // Add annual sum row
    csvRows.push([
      `"ANNUAL TOTAL"`,
      annualCount,
      annualTotalAmount.toFixed(2),
      annualTotalPaid.toFixed(2),
      annualOutstanding.toFixed(2)
    ].join(","));

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `PSB_Financial_Report_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Configuration & Controls */}
      <div className="bg-white p-4 rounded-[6px] border border-[#D6D9DE] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#1F3A5F]/5 text-[#1F3A5F] rounded-[4px] border border-[#1F3A5F]/15">
            <CalendarDays size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Yearly & Monthly Financial Auditing</h3>
            <p className="text-xs text-[#64748B]">Generate, print, and export official financial summaries for any fiscal period</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Year selector dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Fiscal Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 bg-white border border-[#D6D9DE] rounded-[4px] text-xs font-semibold text-[#1F3A5F] focus:outline-none focus:border-[#1F3A5F]"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  FY {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Quick buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyTextReport}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-[#1E293B] rounded-[4px] text-xs font-semibold border border-[#D6D9DE] transition-colors flex items-center gap-1.5"
              title="Copy Summary Report"
            >
              {copied ? <Check size={13} className="text-[#2E7D32]" /> : <Copy size={13} />}
              <span>{copied ? "Copied" : "Copy Report"}</span>
            </button>

            <button
              onClick={handleExportYearCsv}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-[#1E293B] rounded-[4px] text-xs font-semibold border border-[#D6D9DE] transition-colors flex items-center gap-1.5"
              title="Export Report to CSV"
            >
              <Download size={13} />
              <span>CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-[#1F3A5F] hover:bg-[#152842] text-white rounded-[4px] text-xs font-semibold transition-all flex items-center gap-1.5"
              title="Print Financial Statement"
            >
              <Printer size={13} />
              <span>Print Statement</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Report Document Sheet (Interactive and beautifully styled for print) */}
      <div id="printable-report-sheet" className="bg-white rounded-[6px] border border-[#D6D9DE] p-6 space-y-6 print:p-0 print:border-none print:shadow-none">
        
        {/* Print Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#D6D9DE] pb-4 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#1F3A5F]/10 text-[#1F3A5F] border border-[#1F3A5F]/15 text-[10px] font-bold uppercase rounded-[4px] tracking-widest print:hidden">
                Official Statement
              </span>
              <span className="hidden print:inline-block font-bold text-xs text-slate-500">POLICE STAFF BUREAU (PSB)</span>
            </div>
            <h2 className="text-xl font-bold text-[#1E293B] mt-1 font-sans flex items-center gap-1.5">
              <span>Financial Ledger Audit Report</span>
              <span className="text-[#1F3A5F] font-normal font-mono text-base">({selectedYear})</span>
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              A comprehensive analytical overview of parsed treasury vouchers, settlement dates, and budget categories.
            </p>
          </div>
          <div className="text-right md:text-right w-full md:w-auto font-mono text-xs text-[#64748B]">
            <div>Report ID: FY{selectedYear}-PSB</div>
            <div>Generated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
          </div>
        </div>

        {/* Annual KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:grid-cols-4">
          <div className="bg-[#F5F6F8] p-4 rounded-[6px] border border-[#D6D9DE] space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">Total Transactions</span>
            <div className="text-xl font-bold text-[#1E293B] font-sans">{annualCount} Vouchers</div>
            <p className="text-[10px] text-[#64748B]">Total processed items in FY {selectedYear}</p>
          </div>

          <div className="bg-[#F5F6F8] p-4 rounded-[6px] border border-[#D6D9DE] space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">Total Expenditure</span>
            <div className="text-xl font-bold text-[#2E7D32] font-sans">{formatCurrency(annualTotalAmount)}</div>
            <p className="text-[10px] text-[#64748B]">Sum of voucher face value</p>
          </div>

          <div className="bg-[#F5F6F8] p-4 rounded-[6px] border border-[#D6D9DE] space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">Settled Payments</span>
            <div className="text-xl font-bold text-[#1F3A5F] font-sans">{formatCurrency(annualTotalPaid)}</div>
            <p className="text-[10px] text-[#64748B]">Total successfully paid to ITMIS</p>
          </div>

          <div className="bg-[#F5F6F8] p-4 rounded-[6px] border border-[#D6D9DE] space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">Outstanding Balance</span>
            <div className={`text-xl font-bold font-sans ${annualOutstanding > 0 ? "text-[#C62828]" : "text-[#64748B]"}`}>
              {formatCurrency(annualOutstanding)}
            </div>
            <p className="text-[10px] text-[#64748B]">Awaiting processing or clearance</p>
          </div>
        </div>

        {/* Visual Insights Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3">
          <div className="bg-[#F5F6F8] p-4 rounded-[6px] border border-[#D6D9DE] flex items-center gap-3.5">
            <div className="p-2 bg-[#1F3A5F]/10 text-[#1F3A5F] rounded-[4px] shrink-0">
              <TrendingUp size={16} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider block">Peak Spending Month</span>
              <span className="text-xs font-bold text-[#1E293B] block">{peakMonth}</span>
              <span className="text-xs font-mono text-[#1F3A5F] font-semibold block">{formatCurrency(peakMonthAmt)}</span>
            </div>
          </div>

          <div className="bg-[#F5F6F8] p-4 rounded-[6px] border border-[#D6D9DE] flex items-center gap-3.5">
            <div className="p-2 bg-[#2E7D32]/10 text-[#2E7D32] rounded-[4px] shrink-0">
              <Users size={16} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider block">Top Payee / Supplier</span>
              <span className="text-xs font-bold text-[#1E293B] block truncate max-w-[170px]">{topPayeeName}</span>
              <span className="text-xs font-mono text-[#2E7D32] font-semibold block">{formatCurrency(topPayeeAmount)}</span>
            </div>
          </div>

          <div className="bg-[#F5F6F8] p-4 rounded-[6px] border border-[#D6D9DE] flex items-center gap-3.5">
            <div className="p-2 bg-[#2F4F4F]/10 text-[#2F4F4F] rounded-[4px] shrink-0">
              <Layers size={16} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider block">Highest Volume Unit</span>
              <span className="text-xs font-bold text-[#1E293B] block truncate max-w-[170px]">{topUnitName}</span>
              <span className="text-xs font-mono text-[#2F4F4F] font-semibold block">{topUnitCount} Vouchers Submitted</span>
            </div>
          </div>
        </div>

        {/* Monthly Breakdown Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#1E293B] flex items-center gap-1.5">
              <Calendar size={13} className="text-[#1F3A5F]" />
              <span>12-Month Auditing Breakdown</span>
            </h3>
            <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-widest font-mono">LKR Base</span>
          </div>

          <div className="overflow-x-auto rounded-[6px] border border-[#D6D9DE]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#1F3A5F] text-white font-semibold border-b border-[#D6D9DE]">
                  <th className="px-4 py-3">Month Name</th>
                  <th className="px-4 py-3 text-center">Vouchers</th>
                  <th className="px-4 py-3 text-right">Total Amount</th>
                  <th className="px-4 py-3 text-right">Paid Settled</th>
                  <th className="px-4 py-3 text-right">Outstanding</th>
                  <th className="px-4 py-3 pl-6 w-48 print:hidden">Annual Share %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D6D9DE]">
                {monthlyData.map((m, idx) => {
                  const sharePct = annualTotalAmount > 0 ? (m.totalAmount / annualTotalAmount) * 100 : 0;
                  return (
                    <tr key={m.name} className={`${idx % 2 === 0 ? "bg-white" : "bg-[#F5F6F8]"} hover:bg-slate-100 transition-colors`}>
                      <td className="px-4 py-2.5 font-semibold text-[#1E293B]">{m.name}</td>
                      <td className="px-4 py-2.5 text-center font-mono font-medium text-[#64748B]">
                        {m.count > 0 ? m.count : <span className="text-slate-400">-</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-[#1E293B]">
                        {m.totalAmount > 0 ? formatCurrency(m.totalAmount) : <span className="text-slate-400">-</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-[#2E7D32]">
                        {m.totalPaid > 0 ? formatCurrency(m.totalPaid) : <span className="text-slate-400">-</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-[#C62828]">
                        {m.outstanding > 0 ? formatCurrency(m.outstanding) : <span className="text-slate-400">-</span>}
                      </td>
                      <td className="px-4 py-2.5 pl-6 w-48 print:hidden">
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 bg-slate-200 rounded-[4px] overflow-hidden">
                            <div 
                              className="h-full bg-[#1F3A5F] rounded-[4px]"
                              style={{ width: `${sharePct}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10px] text-[#64748B] w-8 text-right">{sharePct.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* Totals Row */}
                <tr className="bg-[#1F3A5F]/10 font-bold text-[#1E293B] border-t border-[#D6D9DE]">
                  <td className="px-4 py-3 text-xs uppercase font-bold text-[#1F3A5F]">Annual Ledger Totals</td>
                  <td className="px-4 py-3 text-center font-mono text-xs">{annualCount}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-[#1E293B]">{formatCurrency(annualTotalAmount)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-[#2E7D32]">{formatCurrency(annualTotalPaid)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-[#C62828]">{formatCurrency(annualOutstanding)}</td>
                  <td className="px-4 py-3 pl-6 print:hidden">
                    <span className="text-[10px] text-[#64748B] font-bold uppercase">100% Consolidated</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Signatures & Audit Footers (Print-only helper) */}
        <div className="hidden print:grid grid-cols-2 gap-12 pt-16 text-center text-[10px] text-slate-600">
          <div className="space-y-1">
            <div className="border-b border-black/40 w-48 mx-auto h-4" />
            <p className="font-bold">Subject Officer (PSB Audits)</p>
            <p className="text-[9px]">Date: ________________________</p>
          </div>
          <div className="space-y-1">
            <div className="border-b border-black/40 w-48 mx-auto h-4" />
            <p className="font-bold">OIC Administration (Auditing Approval)</p>
            <p className="text-[9px]">Date: ________________________</p>
          </div>
        </div>

        {/* Dynamic styling for print optimization */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body {
              background: white !important;
              color: black !important;
            }
            #printable-report-sheet {
              background: white !important;
              color: black !important;
              padding: 0 !important;
              border: none !important;
            }
            table {
              border-color: #000 !important;
            }
          }
        `}} />

      </div>
    </div>
  );
}
