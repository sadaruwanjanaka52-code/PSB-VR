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
  TrendingDown,
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
            <mark key={i} className="bg-yellow-500/30 text-yellow-200 rounded-sm px-0.5 py-px border border-yellow-500/20 font-medium">
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
    if (sortField !== field) return <ChevronsUpDown size={12} className="text-slate-600 shrink-0 ml-1" />;
    return sortOrder === "asc" 
      ? <ChevronUp size={12} className="text-indigo-400 shrink-0 ml-1" />
      : <ChevronDown size={12} className="text-indigo-400 shrink-0 ml-1" />;
  };

  // Status badge styling helper
  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("approved") && !s.includes("not approved")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle size={10} /> Approved
        </span>
      );
    } else if (s.includes("incomplete") || s.includes("not approved")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <AlertTriangle size={10} /> Incomplete
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
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
      className="bg-[#101014]/65 backdrop-blur-md border border-white/5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:border-white/10 transition-all duration-300 overflow-hidden flex flex-col justify-between"
    >
      
      {/* Table grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#0A0C10]/75 backdrop-blur-sm text-slate-300 font-bold uppercase tracking-wider border-b border-slate-800/80">
              <th 
                onClick={() => handleSort("serialNo")}
                className="px-6 py-4 cursor-pointer hover:bg-slate-800/40 hover:text-white transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">S/NO {getSortIcon("serialNo")}</div>
              </th>
              <th 
                onClick={() => handleSort("date")}
                className="px-4 py-4 cursor-pointer hover:bg-slate-800/40 hover:text-white transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">Date {getSortIcon("date")}</div>
              </th>
              <th 
                onClick={() => handleSort("unit")}
                className="px-4 py-4 cursor-pointer hover:bg-slate-800/40 hover:text-white transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">Division / Unit {getSortIcon("unit")}</div>
              </th>
              <th 
                onClick={() => handleSort("payee")}
                className="px-4 py-4 cursor-pointer hover:bg-slate-800/40 hover:text-white transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">Payee Designation {getSortIcon("payee")}</div>
              </th>
              <th className="px-4 py-4 text-slate-400">Expenditure Description</th>
              <th 
                onClick={() => handleSort("voucherAmount")}
                className="px-4 py-4 cursor-pointer hover:bg-slate-800/40 hover:text-white transition-colors select-none text-right"
              >
                <div className="flex items-center justify-end gap-1.5">Amount (LKR) {getSortIcon("voucherAmount")}</div>
              </th>
              <th 
                onClick={() => handleSort("statusOfVr")}
                className="px-4 py-4 cursor-pointer hover:bg-slate-800/40 hover:text-white transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">Status {getSortIcon("statusOfVr")}</div>
              </th>
              <th className="px-6 py-4 text-center text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40 font-medium text-slate-300">
            {paginatedRecords.length > 0 ? (
              paginatedRecords.map((r) => (
                <tr 
                  key={r.id} 
                  id={`table-row-${r.id}`}
                  className="hover:bg-slate-800/25 border-b border-slate-800/30 last:border-none transition-all duration-200"
                >
                  <td className="px-6 py-3.5 font-bold font-mono text-white select-all">{highlightText(r.serialNo, searchQuery)}</td>
                  <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap">{r.date}</td>
                  <td className="px-4 py-3.5">
                    <span className="bg-[#1e2330]/80 text-slate-200 border border-slate-700/40 font-bold px-2 py-0.5 rounded text-[10px] whitespace-nowrap">
                      {highlightText(r.unit, searchQuery)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-bold text-white truncate max-w-[150px]" title={r.payee}>
                    {highlightText(r.payee, searchQuery)}
                  </td>
                  <td className="px-4 py-3.5 text-slate-400 truncate max-w-[140px] uppercase text-[10px]" title={r.description}>
                    {highlightText(r.description, searchQuery)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-bold text-white whitespace-nowrap">
                    {r.voucherAmount > 0 ? formatCurrency(r.voucherAmount) : <span className="text-slate-700">-</span>}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">{getStatusBadge(r.statusOfVr)}</td>
                  <td className="px-6 py-3.5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onViewDetails(r)}
                        className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20 rounded-lg transition-all"
                        title="View Full Ledger Slip"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => onEdit(r)}
                        className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 rounded-lg transition-all"
                        title="Edit Voucher"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => onDelete(r.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/25 rounded-lg transition-all"
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
                <td colSpan={8} className="px-6 py-12 text-center text-slate-500 font-bold">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search size={24} className="text-slate-600" />
                    <span>No register matches found. Adjust your search filters.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <div className="bg-[#0A0C10]/75 backdrop-blur-sm border-t border-slate-800/60 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-400 shrink-0">
        <div className="flex items-center gap-2.5">
          <span>Displaying size</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 rounded-xl border border-white/5 bg-[#101014]/80 backdrop-blur-sm focus:outline-none focus:border-indigo-500/50 font-bold text-slate-200 transition-all cursor-pointer text-[11px]"
          >
            <option value={10} className="bg-[#101014]">10 records</option>
            <option value={25} className="bg-[#101014]">25 records</option>
            <option value={50} className="bg-[#101014]">50 records</option>
          </select>
          <span className="hidden sm:inline">
            of <strong className="text-white">{totalEntries}</strong> ledger entries
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[11px] text-slate-500">
            Page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{totalPages}</strong>
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-1.5 rounded-lg border border-slate-800 bg-[#161920]/80 hover:bg-slate-800 text-slate-200 transition-colors ${
                currentPage === 1 ? "opacity-30 cursor-not-allowed" : ""
              }`}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-1.5 rounded-lg border border-slate-800 bg-[#161920]/80 hover:bg-slate-800 text-slate-200 transition-colors ${
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
