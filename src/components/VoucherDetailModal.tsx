import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Printer, 
  Tag, 
  Building2, 
  DollarSign, 
  Briefcase, 
  Calendar, 
  FileCheck2, 
  CheckCircle, 
  AlertTriangle,
  Clock
} from "lucide-react";
import { VoucherRecord } from "../types";

interface VoucherDetailModalProps {
  voucher: VoucherRecord | null;
  onClose: () => void;
  onEdit: (voucher: VoucherRecord) => void;
}

export default function VoucherDetailModal({ voucher, onClose, onEdit }: VoucherDetailModalProps) {
  if (!voucher) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 2,
    }).format(val);
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("approved") && !s.includes("not approved")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-bold bg-[#2E7D32]/10 text-[#2E7D32] border border-[#2E7D32]/20">
          <CheckCircle size={12} /> Approved
        </span>
      );
    } else if (s.includes("incomplete") || s.includes("not approved")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-bold bg-[#C62828]/10 text-[#C62828] border border-[#C62828]/20">
          <AlertTriangle size={12} /> Incomplete / Rejected
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-bold bg-[#F9A825]/10 text-[#7B5B00] border border-[#F9A825]/20">
          <Clock size={12} /> Pending VR Verification
        </span>
      );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div id="voucher-detail-modal-root" className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        
        {/* Professional, printer-friendly custom CSS injection */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            /* Hide the main dashboard interface entirely */
            #app-main-content {
              display: none !important;
            }
            
            /* Unset backdrop and stretch modal wrapper to full paper width */
            #voucher-detail-modal-root {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              height: auto !important;
              background: white !important;
              color: black !important;
              backdrop-filter: none !important;
              z-index: 10000 !important;
              padding: 0 !important;
              margin: 0 !important;
              display: block !important;
              overflow: visible !important;
            }

            /* Hide the visual dark-themed modal card */
            #voucher-modal-card {
              display: none !important;
            }

            /* Reset HTML and Body styles for pristine black-and-white printing */
            body, html {
              background: white !important;
              color: black !important;
              font-family: 'Inter', -apple-system, sans-serif !important;
              margin: 0 !important;
              padding: 0 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            /* Stylized official form container */
            #voucher-print-section {
              display: block !important;
              width: 100% !important;
              padding: 1.5cm !important;
              box-sizing: border-box !important;
              background: white !important;
              color: black !important;
            }

            .print-header {
              text-align: center;
              margin-bottom: 25px;
              border-bottom: 3px double #000;
              padding-bottom: 12px;
            }

            .gov-crest {
              font-size: 11pt;
              font-weight: 800;
              letter-spacing: 1.5px;
              text-transform: uppercase;
              color: #111;
              margin-bottom: 3px;
            }

            .print-main-title {
              font-size: 17pt;
              font-weight: 900;
              letter-spacing: 0.5px;
              text-transform: uppercase;
              color: #000;
              margin-bottom: 5px;
            }

            .print-serial {
              font-size: 10pt;
              font-weight: bold;
              font-family: monospace;
              color: #333;
            }

            .print-grid {
              display: grid;
              grid-template-cols: 1fr 1fr;
              gap: 20px;
            }

            .print-box {
              border: 1px solid #000;
              padding: 12px;
              margin-bottom: 15px;
              background: #fff;
            }

            .print-box-title {
              font-size: 9pt;
              font-weight: bold;
              text-transform: uppercase;
              border-bottom: 1.5px solid #000;
              padding-bottom: 3px;
              margin-bottom: 8px;
              letter-spacing: 0.5px;
            }

            .print-info-table {
              width: 100%;
              border-collapse: collapse;
            }

            .print-info-table td {
              padding: 4px 0;
              font-size: 9pt;
              vertical-align: top;
            }

            .print-label {
              color: #333;
              font-weight: 600;
              width: 45%;
            }

            .print-val {
              text-align: right;
              color: #000;
            }

            .print-financial-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 5px;
            }

            .print-financial-table th {
              background-color: #f2f2f2 !important;
              border: 1.5px solid #000;
              padding: 6px 10px;
              font-size: 9pt;
              font-weight: bold;
              text-transform: uppercase;
            }

            .print-financial-table td {
              border: 1px solid #000;
              padding: 6px 10px;
              font-size: 9pt;
            }

            .print-total-row {
              font-weight: bold;
              background-color: #f9f9f9 !important;
            }

            .print-total-row td {
              border-top: 2px solid #000 !important;
              border-bottom: 2px double #000 !important;
            }

            .print-remarks {
              font-size: 9pt;
              font-style: italic;
              color: #111;
              line-height: 1.4;
              padding: 6px;
              background: #fafafa;
              border: 1px dashed #000;
            }

            .print-footer-notice {
              font-size: 7.5pt;
              color: #555;
              text-align: center;
              margin-top: 30px;
              border-top: 1px solid #ccc;
              padding-top: 8px;
            }

            .print-signatures-area {
              margin-top: 50px;
              display: grid;
              grid-template-cols: repeat(4, 1fr);
              gap: 15px;
            }

            .print-sig-box {
              text-align: center;
            }

            .sig-line {
              border-top: 1px dashed #000;
              margin-bottom: 5px;
              width: 85%;
              margin-left: auto;
              margin-right: auto;
            }

            .sig-title {
              font-size: 8pt;
              font-weight: bold;
              color: #222;
            }
          }

          @media screen {
            #voucher-print-section {
              display: none !important;
            }
          }
        ` }} />

        {/* Modal Card for on-screen viewing */}
        <motion.div
          id="voucher-modal-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-white border border-[#D6D9DE] shadow-xl rounded-[4px] w-full max-w-4xl overflow-hidden"
        >
          {/* Modal Header */}
          <div className="bg-[#1F3A5F] text-white px-6 py-4 flex items-center justify-between border-b border-[#D6D9DE]">
            <div className="flex items-center gap-3">
              <FileCheck2 className="text-white" size={22} />
              <div>
                <h2 className="text-base font-bold tracking-wider uppercase">Voucher Details Slip</h2>
                <p className="text-xs text-white/90 font-mono">S/NO: {voucher.serialNo}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 bg-[#2F4F4F] hover:bg-[#1f3535] rounded-[4px] text-white transition-colors flex items-center gap-1.5 text-xs font-bold shadow-sm"
                title="Print Audit Jacket"
              >
                <Printer size={16} />
                <span className="hidden sm:inline">Print Slip</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-[#152842] rounded-[4px] text-white/80 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto max-h-[75vh] space-y-6 bg-white">
            
            {/* Primary Status Banner */}
            <div className="bg-[#F5F6F8] border border-[#D6D9DE] rounded-[4px] p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Current Ledger Status</span>
                <div className="flex items-center gap-3">
                  {getStatusBadge(voucher.statusOfVr)}
                  {voucher.paidVrStatus && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-xs font-bold bg-[#1F3A5F]/10 text-[#1F3A5F] border border-[#1F3A5F]/20">
                      {voucher.paidVrStatus}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Net Payable Amount</span>
                <span className="text-2xl font-bold font-sans text-[#1E293B]">{formatCurrency(voucher.voucherAmount)}</span>
              </div>
            </div>

            {/* Grid Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Section 1: Core Identification */}
              <div className="border border-[#D6D9DE] rounded-[4px] p-4 bg-[#F5F6F8]/40 space-y-3">
                <h3 className="text-xs font-bold text-[#1F3A5F] uppercase tracking-wider flex items-center gap-2 border-b border-[#D6D9DE] pb-2">
                  <Calendar size={14} className="text-[#1F3A5F]" />
                  General Identification
                </h3>
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
                  <div>
                    <span className="text-[#64748B] font-semibold block mb-0.5">S/NO (System ID)</span>
                    <span className="font-bold text-[#1E293B] font-mono">{voucher.serialNo}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] font-semibold block mb-0.5">Date Generated</span>
                    <span className="font-bold text-[#1E293B]">{voucher.date || "-"}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] font-semibold block mb-0.5">Unit VR NO</span>
                    <span className="font-bold text-[#1E293B] font-mono">{voucher.unitVrNo || "-"}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] font-semibold block mb-0.5">Received Date</span>
                    <span className="font-bold text-[#1E293B]">{voucher.receivedDate || "-"}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Payee & Accounting */}
              <div className="border border-[#D6D9DE] rounded-[4px] p-4 bg-[#F5F6F8]/40 space-y-3">
                <h3 className="text-xs font-bold text-[#1F3A5F] uppercase tracking-wider flex items-center gap-2 border-b border-[#D6D9DE] pb-2">
                  <Building2 size={14} className="text-[#1F3A5F]" />
                  Payee & Budget Station
                </h3>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[#64748B] font-semibold block mb-0.5">Payee Designation / Name</span>
                    <span className="font-bold text-[#1E293B]">{voucher.payee || "-"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[#64748B] font-semibold block mb-0.5">Department / Unit</span>
                      <span className="font-bold text-[#1E293B]">{voucher.unit || "-"}</span>
                    </div>
                    <div>
                      <span className="text-[#64748B] font-semibold block mb-0.5">Description</span>
                      <span className="font-bold text-[#1E293B] uppercase tracking-wide">{voucher.description || "-"}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[#64748B] font-semibold block mb-1">Vote Ledger Allocation</span>
                    <span className="font-bold text-[#1F3A5F] bg-[#1F3A5F]/5 border border-[#1F3A5F]/15 rounded-[4px] px-2 py-1.5 block leading-relaxed">
                      {voucher.vote || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Accounting & Ledger Valuation */}
              <div className="border border-[#D6D9DE] rounded-[4px] p-4 bg-[#F5F6F8]/40 space-y-3 md:col-span-2">
                <h3 className="text-xs font-bold text-[#1F3A5F] uppercase tracking-wider flex items-center gap-2 border-b border-[#D6D9DE] pb-2">
                  <DollarSign size={14} className="text-[#1F3A5F]" />
                  Accounting Ledger & Valuation
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
                  <div className="p-2.5 bg-white rounded-[4px] border border-[#D6D9DE]">
                    <span className="text-[#64748B] font-semibold block mb-1">Voucher Amount</span>
                    <span className="font-bold text-[#1E293B] font-mono">{formatCurrency(voucher.voucherAmount)}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-[4px] border border-[#D6D9DE]">
                    <span className="text-[#64748B] font-semibold block mb-1">Total Schedule Value</span>
                    <span className="font-bold text-[#1E293B] font-mono">{formatCurrency(voucher.totalScheduleValue)}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-[4px] border border-[#D6D9DE]">
                    <span className="text-[#64748B] font-semibold block mb-1">Cheque Value</span>
                    <span className="font-bold text-[#1E293B] font-mono">{formatCurrency(voucher.chequeValue)}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-[4px] border border-[#D6D9DE]">
                    <span className="text-[#64748B] font-semibold block mb-1">Cross Entry Adjustment</span>
                    <span className="font-bold text-[#1E293B] font-mono">{formatCurrency(voucher.crossEntry)}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-[4px] border border-[#D6D9DE] bg-[#2E7D32]/5 border-[#2E7D32]/20">
                    <span className="text-[#2E7D32] font-bold block mb-1">Total Paid (Settle)</span>
                    <span className="font-bold text-[#2E7D32] font-mono">{formatCurrency(voucher.totalPaid)}</span>
                  </div>
                </div>
              </div>

              {/* Section 4: ITMIS Treasury Tracking */}
              <div className="border border-[#D6D9DE] rounded-[4px] p-4 bg-[#F5F6F8]/40 space-y-3">
                <h3 className="text-xs font-bold text-[#1F3A5F] uppercase tracking-wider flex items-center gap-2 border-b border-[#D6D9DE] pb-2">
                  <Briefcase size={14} className="text-[#1F3A5F]" />
                  ITMIS Treasury System Integration
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#64748B] font-semibold block mb-0.5">Handover Date to Subject</span>
                    <span className="font-bold text-[#1E293B]">{voucher.handOverDateToSubject || "-"}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] font-semibold block mb-0.5">Handover Date to ITMIS</span>
                    <span className="font-bold text-[#1E293B]">{voucher.handOverDateToItmis || "-"}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] font-semibold block mb-0.5">ITMIS EV Number</span>
                    <span className="font-bold text-[#1E293B] font-mono">{voucher.itmisEvNo || "-"}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] font-semibold block mb-0.5">Status of Payment</span>
                    <span className="font-bold text-[#1E293B]">{voucher.statusOfPmt || "-"}</span>
                  </div>
                </div>
              </div>

              {/* Section 5: Cheque & Settlement Details */}
              <div className="border border-[#D6D9DE] rounded-[4px] p-4 bg-[#F5F6F8]/40 space-y-3">
                <h3 className="text-xs font-bold text-[#1F3A5F] uppercase tracking-wider flex items-center gap-2 border-b border-[#D6D9DE] pb-2">
                  <Tag size={14} className="text-[#1F3A5F]" />
                  Cheque & Settlement Specifications
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#64748B] font-semibold block mb-0.5">Paid Date</span>
                    <span className="font-bold text-[#1E293B]">{voucher.paidDate || "-"}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] font-semibold block mb-0.5">Schedule Number</span>
                    <span className="font-bold text-[#1E293B] font-mono">{voucher.scheduleNo || "-"}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] font-semibold block mb-0.5">Cheque Number</span>
                    <span className="font-bold text-[#1E293B] font-mono">{voucher.chequeNo || "-"}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] font-semibold block mb-0.5">Handover Designation</span>
                    <span className="font-bold text-[#1E293B]">{voucher.handoverTo || "-"}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] font-semibold block mb-0.5">Handover Date</span>
                    <span className="font-bold text-[#1E293B]">{voucher.handOverDate || "-"}</span>
                  </div>
                </div>
              </div>

              {/* Section 6: Optional user notes */}
              {voucher.notes && (
                <div className="border border-[#1F3A5F]/20 rounded-[4px] p-4 bg-[#1F3A5F]/5 md:col-span-2 text-xs space-y-1">
                  <span className="font-bold text-[#1F3A5F] uppercase tracking-wider block">Registrar Notes & Comments</span>
                  <p className="text-[#1E293B] leading-relaxed font-semibold italic">"{voucher.notes}"</p>
                </div>
              )}

            </div>
          </div>

          {/* Modal Footer */}
          <div className="bg-[#F5F6F8] border-t border-[#D6D9DE] px-6 py-4 flex flex-col sm:flex-row gap-3 sm:justify-between items-center">
            <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider">Department of Public Service Budgets • Internal Voucher Jacket</span>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(voucher)}
                className="px-4 py-2 rounded-[4px] text-xs font-bold text-white bg-[#1F3A5F] hover:bg-[#152842] transition-colors shadow-sm"
              >
                Modify Voucher Fields
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-[4px] text-xs font-bold text-[#1E293B] bg-white hover:bg-slate-50 border border-[#D6D9DE] transition-colors"
              >
                Close Slip
              </button>
            </div>
          </div>
        </motion.div>

        {/* Printable Section (Hidden on screen, styled beautifully on @media print) */}
        <div id="voucher-print-section" className="hidden">
          <div className="print-header">
            <div className="gov-crest">DEPARTMENT OF PUBLIC SERVICE BUDGETS — TREASURY DIVISION</div>
            <div className="print-main-title">OFFICIAL PAYMENT VOUCHER & AUDIT JACKET</div>
            <div className="print-serial">SYSTEM ID: {voucher.serialNo}</div>
          </div>

          <div className="print-grid">
            <div className="print-box">
              <div className="print-box-title">I. IDENTIFICATION DETAILS</div>
              <table className="print-info-table">
                <tbody>
                  <tr>
                    <td className="print-label">Serial Number (S/NO):</td>
                    <td className="print-val font-mono">{voucher.serialNo}</td>
                  </tr>
                  <tr>
                    <td className="print-label">Creation Date:</td>
                    <td className="print-val">{voucher.date || "-"}</td>
                  </tr>
                  <tr>
                    <td className="print-label">Unit VR Number:</td>
                    <td className="print-val font-mono">{voucher.unitVrNo || "-"}</td>
                  </tr>
                  <tr>
                    <td className="print-label">Received Date:</td>
                    <td className="print-val">{voucher.receivedDate || "-"}</td>
                  </tr>
                  <tr>
                    <td className="print-label">Status of VR:</td>
                    <td className="print-val font-bold">{voucher.statusOfVr || "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="print-box">
              <div className="print-box-title">II. PAYEE & BUDGETARY STATION</div>
              <table className="print-info-table">
                <tbody>
                  <tr>
                    <td className="print-label">Name of the Payee:</td>
                    <td className="print-val font-bold">{voucher.payee || "-"}</td>
                  </tr>
                  <tr>
                    <td className="print-label">Unit / Station:</td>
                    <td className="print-val">{voucher.unit || "-"}</td>
                  </tr>
                  <tr>
                    <td className="print-label">Description:</td>
                    <td className="print-val uppercase">{voucher.description || "-"}</td>
                  </tr>
                  <tr>
                    <td className="print-label">Budget Vote Allocation:</td>
                    <td className="print-val text-xs">{voucher.vote || "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="print-box mt-4">
            <div className="print-box-title">III. FINANCIAL STATEMENT & VALUATION</div>
            <table className="print-financial-table">
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>LEDGER CATEGORY</th>
                  <th style={{ textAlign: "right" }}>VALUATION (LKR)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>VOUCHER TOTAL VALUE (Gross Amount)</td>
                  <td style={{ textAlign: "right" }} className="print-val font-mono font-bold">{formatCurrency(voucher.voucherAmount)}</td>
                </tr>
                <tr>
                  <td>TOTAL SCHEDULE VALUE (Breakdown)</td>
                  <td style={{ textAlign: "right" }} className="print-val font-mono">{formatCurrency(voucher.totalScheduleValue)}</td>
                </tr>
                <tr>
                  <td>CHEQUE AMOUNT ISSUED</td>
                  <td style={{ textAlign: "right" }} className="print-val font-mono">{formatCurrency(voucher.chequeValue)}</td>
                </tr>
                <tr>
                  <td>CROSS ENTRY ADJUSTMENT VALUE</td>
                  <td style={{ textAlign: "right" }} className="print-val font-mono">{formatCurrency(voucher.crossEntry)}</td>
                </tr>
                <tr className="print-total-row">
                  <td>TOTAL SETTLED / PAID AMOUNT (Net Settlement)</td>
                  <td style={{ textAlign: "right" }} className="print-val font-mono font-bold">{formatCurrency(voucher.totalPaid)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="print-grid mt-4">
            <div className="print-box">
              <div className="print-box-title">IV. CORE SYSTEM INTEGRATION</div>
              <table className="print-info-table">
                <tbody>
                  <tr>
                    <td className="print-label">Handover to Subject Date:</td>
                    <td className="print-val">{voucher.handOverDateToSubject || "-"}</td>
                  </tr>
                  <tr>
                    <td className="print-label">Handover to Treasury Date:</td>
                    <td className="print-val">{voucher.handOverDateToItmis || "-"}</td>
                  </tr>
                  <tr>
                    <td className="print-label">Treasury EV Number:</td>
                    <td className="print-val font-mono">{voucher.itmisEvNo || "-"}</td>
                  </tr>
                  <tr>
                    <td className="print-label">Treasury Payment Status:</td>
                    <td className="print-val font-bold">{voucher.statusOfPmt || "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="print-box">
              <div className="print-box-title">V. CHEQUE & SETTLEMENT DETAILS</div>
              <table className="print-info-table">
                <tbody>
                  <tr>
                    <td className="print-label">Treasury Paid Date:</td>
                    <td className="print-val">{voucher.paidDate || "-"}</td>
                  </tr>
                  <tr>
                    <td className="print-label">Schedule Number:</td>
                    <td className="print-val font-mono">{voucher.scheduleNo || "-"}</td>
                  </tr>
                  <tr>
                    <td className="print-label">Cheque / Reference Number:</td>
                    <td className="print-val font-mono">{voucher.chequeNo || "-"}</td>
                  </tr>
                  <tr>
                    <td className="print-label">Handover Recipient:</td>
                    <td className="print-val">{voucher.handoverTo || "-"} {voucher.handOverDate ? `(${voucher.handOverDate})` : ""}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {voucher.notes && (
            <div className="print-box mt-4">
              <div className="print-box-title">VI. REGISTRAR AUDIT REMARKS</div>
              <div className="print-remarks">"{voucher.notes}"</div>
            </div>
          )}

          <div className="print-footer-notice">
            Audit Trail Verification Token: PSB-SECURE-{voucher.id}-{voucher.serialNo?.replace(/\//g, "-")}. Generated on {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()} by authorized personnel.
          </div>

          <div className="print-signatures-area">
            <div className="print-sig-box">
              <div className="sig-line"></div>
              <div className="sig-title">Prepared By (Subject Clerk)</div>
            </div>
            <div className="print-sig-box">
              <div className="sig-line"></div>
              <div className="sig-title">Checked By (Internal Auditor)</div>
            </div>
            <div className="print-sig-box">
              <div className="sig-line"></div>
              <div className="sig-title">Authorized By (Accountant)</div>
            </div>
            <div className="print-sig-box">
              <div className="sig-line"></div>
              <div className="sig-title">Approval Signature (Registrar)</div>
            </div>
          </div>
        </div>

      </div>
    </AnimatePresence>
  );
}
