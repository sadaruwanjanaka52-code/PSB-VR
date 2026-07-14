import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Eye, 
  Edit3, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  ChevronsUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { VoucherRecord } from "../types";

interface VoucherTableProps {
  records: VoucherRecord[];
  onViewDetails: (record: VoucherRecord) => void;
  onEdit: (record: VoucherRecord) => void;
  onDelete: (recordId: string) => void;
  searchQuery?: string;
}

type SortField = "serialNo" | "date" | "payee" | "voucherAmount" | "unit" | "statusOfVr";
type SortOrder = "asc" | "desc";

export default function VoucherTable({ records, onViewDetails, onEdit, onDelete, searchQuery = "" }: VoucherTableProps) {
  // Sort state
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 2,
    }).format(val);
  };

  const highlightText = (text: string, query: string = ""): React.ReactNode => {
    if (!text) return "";
    if (!query || query.trim() === "") return text;

    const escapedQuery = query.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escapedQuery})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.trim().toLowerCase() ? (
            <mark key={i} className="bg-yellow-100 text-yellow-800 rounded-sm px-0.5 py-px border border-yellow-200 font-medium">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ChevronsUpDown size={12} className="text-white/65 shrink-0 ml-1" />;
    return sortOrder === "asc" 
      ? <ChevronUp size={12} className="text-white shrink-0 ml-1" />
      : <ChevronDown size={12} className="text-white shrink-0 ml-1" />;
  };

  // Status badge styling helper
  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("approved") && !s.includes("not approved")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] text-[10px] font-bold bg-[#2E7D32]/10 text-[#2E7D32] border border-[#2E7D32]/20">
          <CheckCircle size={10} /> Approved
        </span>
      );
    } else if (s.includes("incomplete") || s.includes("not approved")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] text-[10px] font-bold bg-[#C62828]/10 text-[#C62828] border border-[#C62828]/20">
          <AlertTriangle size={10} /> Incomplete
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] text-[10px] font-bold bg-[#F9A825]/10 text-[#B7791F] border border-[#F9A825]/20">
          <Clock size={10} /> Pending
        </span>
      );
    }
  };

  // Helper to parse dates formatted as "DD/MM/YYYY" for sorting
  const parseDateForSort = (dateStr: string) => {
    if (!dateStr) return 0;
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day).getTime();
    }
    return 0;
  };

  // Apply sorting
  const sortedRecords = [...records].sort((a, b) => {
    let aField = a[sortField];
    let bField = b[sortField];

    if (sortField === "date") {
      const aTime = parseDateForSort(a.date);
      const bTime = parseDateForSort(b.date);
      return sortOrder === "asc" ? aTime - bTime : bTime - aTime;
    }

    if (typeof aField === "string" && typeof bField === "string") {
      return sortOrder === "asc" 
        ? aField.localeCompare(bField)
        : bField.localeCompare(aField);
    }

    if (typeof aField === "number" && typeof bField === "number") {
      return sortOrder === "asc" ? aField - bField : bField - aField;
    }

    return 0;
  });

  // Apply pagination
  const totalEntries = sortedRecords.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRecords = sortedRecords.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div 
      id="voucher-register-table-wrapper" 
      className="bg-white border border-[#D6D9DE] rounded-[6px] shadow-sm overflow-hidden flex flex-col justify-between"
    >
      
      {/* Table grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#1F3A5F] text-white font-bold uppercase tracking-wider border-b border-[#D6D9DE]">
              <th 
                onClick={() => handleSort("serialNo")}
                className="px-6 py-4 cursor-pointer hover:bg-[#152842] transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">S/NO {getSortIcon("serialNo")}</div>
              </th>
              <th 
                onClick={() => handleSort("date")}
                className="px-4 py-4 cursor-pointer hover:bg-[#152842] transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">Date {getSortIcon("date")}</div>
              </th>
              <th 
                onClick={() => handleSort("unit")}
                className="px-4 py-4 cursor-pointer hover:bg-[#152842] transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">Division / Unit {getSortIcon("unit")}</div>
              </th>
              <th 
                onClick={() => handleSort("payee")}
                className="px-4 py-4 cursor-pointer hover:bg-[#152842] transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">Payee Designation {getSortIcon("payee")}</div>
              </th>
              <th className="px-4 py-4 text-white/80">Expenditure Description</th>
              <th 
                onClick={() => handleSort("voucherAmount")}
                className="px-4 py-4 cursor-pointer hover:bg-[#152842] transition-colors select-none text-right"
              >
                <div className="flex items-center justify-end gap-1.5">Amount (LKR) {getSortIcon("voucherAmount")}</div>
              </th>
              <th 
                onClick={() => handleSort("statusOfVr")}
                className="px-4 py-4 cursor-pointer hover:bg-[#152842] transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">Status {getSortIcon("statusOfVr")}</div>
              </th>
              <th className="px-6 py-4 text-center text-white/80">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D6D9DE] font-medium text-[#1E293B]">
            {paginatedRecords.length > 0 ? (
              paginatedRecords.map((r, idx) => (
                <tr 
                  key={r.id} 
                  id={`table-row-${r.id}`}
                  className={`${idx % 2 === 0 ? "bg-white" : "bg-[#F5F6F8]"} hover:bg-slate-100 border-b border-[#D6D9DE] last:border-none transition-all duration-200`}
                >
                  <td className="px-6 py-3.5 font-bold font-mono text-[#1E293B] select-all">{highlightText(r.serialNo, searchQuery)}</td>
                  <td className="px-4 py-3.5 text-[#64748B] whitespace-nowrap">{r.date}</td>
                  <td className="px-4 py-3.5">
                    <span className="bg-[#1F3A5F]/10 text-[#1F3A5F] border border-[#1F3A5F]/20 font-bold px-2 py-0.5 rounded-[4px] text-[10px] whitespace-nowrap">
                      {highlightText(r.unit, searchQuery)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-bold text-[#1E293B] truncate max-w-[150px]" title={r.payee}>
                    {highlightText(r.payee, searchQuery)}
                  </td>
                  <td className="px-4 py-3.5 text-[#64748B] truncate max-w-[140px] uppercase text-[10px]" title={r.description}>
                    {highlightText(r.description, searchQuery)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-bold text-[#1E293B] whitespace-nowrap">
                    {r.voucherAmount > 0 ? formatCurrency(r.voucherAmount) : <span className="text-slate-400">-</span>}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">{getStatusBadge(r.statusOfVr)}</td>
                  <td className="px-6 py-3.5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onViewDetails(r)}
                        className="p-1.5 text-[#64748B] hover:text-[#1F3A5F] hover:bg-[#1F3A5F]/10 border border-transparent hover:border-[#1F3A5F]/20 rounded-[4px] transition-all"
                        title="View Full Ledger Slip"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => onEdit(r)}
                        className="p-1.5 text-[#64748B] hover:text-[#2E7D32] hover:bg-[#2E7D32]/10 border border-transparent hover:border-[#2E7D32]/20 rounded-[4px] transition-all"
                        title="Edit Voucher"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => onDelete(r.id)}
                        className="p-1.5 text-[#64748B] hover:text-[#C62828] hover:bg-[#C62828]/10 border border-transparent hover:border-[#C62828]/20 rounded-[4px] transition-all"
                        title="Delete from Register"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-[#64748B] font-bold">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search size={24} className="text-[#64748B]" />
                    <span>No register matches found. Adjust your search filters.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <div className="bg-[#F5F6F8] border-t border-[#D6D9DE] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-[#64748B] shrink-0">
        <div className="flex items-center gap-2.5">
          <span>Displaying size</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 rounded-[4px] border border-[#D6D9DE] bg-white text-[#1E293B] focus:outline-none focus:border-[#1F3A5F] font-bold transition-all cursor-pointer text-xs"
          >
            <option value={10}>10 records</option>
            <option value={25}>25 records</option>
            <option value={50}>50 records</option>
          </select>
          <span className="hidden sm:inline">
            of <strong className="text-[#1E293B]">{totalEntries}</strong> ledger entries
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-[#64748B]">
            Page <strong className="text-[#1E293B]">{currentPage}</strong> of <strong className="text-[#1E293B]">{totalPages}</strong>
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-1.5 rounded-[4px] border border-[#D6D9DE] bg-white hover:bg-slate-50 text-[#1E293B] transition-colors ${
                currentPage === 1 ? "opacity-30 cursor-not-allowed" : ""
              }`}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-1.5 rounded-[4px] border border-[#D6D9DE] bg-white hover:bg-slate-50 text-[#1E293B] transition-colors ${
                currentPage === totalPages ? "opacity-30 cursor-not-allowed" : ""
              }`}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
