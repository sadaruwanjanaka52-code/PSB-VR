import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileSpreadsheet, 
  PlusCircle, 
  RotateCcw, 
  SlidersHorizontal, 
  BarChart, 
  Clock, 
  Database, 
  Search, 
  Filter, 
  RefreshCw, 
  HelpCircle, 
  X,
  Menu,
  LayoutDashboard,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Layers,
  FileText,
  ChevronLeft,
  ChevronRight,
  Settings,
  Activity,
  ShieldCheck,
  TrendingUp,
  Sparkles
} from "lucide-react";

import { VoucherRecord, RegisterStats, FilterState } from "./types";
import { SEED_VOUCHER_RECORDS } from "./data";
import { MASTER_UNITS } from "./masterData";
import StatsOverview from "./components/StatsOverview";
import AnalyticsCharts from "./components/AnalyticsCharts";
import VoucherTable from "./components/VoucherTable";
import VoucherForm from "./components/VoucherForm";
import VoucherDetailModal from "./components/VoucherDetailModal";
import CsvImportExport from "./components/CsvImportExport";
import ReportSummary from "./components/ReportSummary";

// Firebase imports
import { db } from "./firebase";
import { collection, doc, getDocs, setDoc, deleteDoc, writeBatch } from "firebase/firestore";

// Helper to convert 2025 records to 2027 start sequential records starting from 1
const convertTo2027Records = (oldRecords: VoucherRecord[]): VoucherRecord[] => {
  return oldRecords.map((r, index) => {
    const seqNum = String(index + 1).padStart(5, "0");
    const newSerial = `27/${seqNum}`;
    
    let newDate = r.date;
    if (newDate && newDate.includes("/2025")) {
      newDate = newDate.replace("/2025", "/2027");
    } else if (newDate && newDate.includes("/25")) {
      newDate = newDate.replace("/25", "/27");
    }
    
    let newUnitVrNo = r.unitVrNo;
    if (newUnitVrNo && newUnitVrNo.endsWith("/25")) {
      newUnitVrNo = newUnitVrNo.substring(0, newUnitVrNo.length - 3) + "/27";
    }

    let newHandOverSubject = r.handOverDateToSubject;
    if (newHandOverSubject && newHandOverSubject.startsWith("25-")) {
      newHandOverSubject = "27-" + newHandOverSubject.substring(3);
    }
    
    let newHandOverItmis = r.handOverDateToItmis;
    if (newHandOverItmis && newHandOverItmis.startsWith("25-")) {
      newHandOverItmis = "27-" + newHandOverItmis.substring(3);
    }

    let newPaidDate = r.paidDate;
    if (newPaidDate && newPaidDate.startsWith("25-")) {
      newPaidDate = "27-" + newPaidDate.substring(3);
    } else if (newPaidDate && newPaidDate.includes("/2025")) {
      newPaidDate = newPaidDate.replace("/2025", "/2027");
    }

    let newHandOverDate = r.handOverDate;
    if (newHandOverDate && newHandOverDate.startsWith("25-")) {
      newHandOverDate = "27-" + newHandOverDate.substring(3);
    }

    let newReceivedDate = r.receivedDate;
    if (newReceivedDate && newReceivedDate.startsWith("25-")) {
      newReceivedDate = "27-" + newReceivedDate.substring(3);
    }

    return {
      ...r,
      serialNo: newSerial,
      date: newDate,
      unitVrNo: newUnitVrNo,
      handOverDateToSubject: newHandOverSubject,
      handOverDateToItmis: newHandOverItmis,
      paidDate: newPaidDate,
      handOverDate: newHandOverDate,
      receivedDate: newReceivedDate,
    };
  });
};

export default function App() {
  // 1. Core State
  const [records, setRecords] = useState<VoucherRecord[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherRecord | null>(null);
  const [editVoucher, setEditVoucher] = useState<VoucherRecord | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCsvOpen, setIsCsvOpen] = useState(false);
  const [isChartsVisible, setIsChartsVisible] = useState(true);
  const [activeView, setActiveView] = useState<"dashboard" | "ledger" | "reports" | "settings">("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Real-time tick for system audit display
  const [currentTime, setCurrentTime] = useState("");
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);

  // Firestore DB status and saving state
  const [dbStatus, setDbStatus] = useState<"connecting" | "connected" | "error">("connecting");
  const [isSaving, setIsSaving] = useState(false);

  // 2. Filters State
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    unit: "",
    status: "",
    vote: "",
    payee: "",
    startDate: "",
    endDate: "",
    minAmount: "",
    maxAmount: ""
  });

  // 3. Load initial data from Cloud Firestore
  useEffect(() => {
    const loadFromFirestore = async () => {
      try {
        setDbStatus("connecting");
        const querySnapshot = await getDocs(collection(db, "vouchers"));
        const fetched: VoucherRecord[] = [];
        querySnapshot.forEach((docSnap) => {
          fetched.push(docSnap.data() as VoucherRecord);
        });
        
        setRecords(fetched);
        localStorage.setItem("psb_voucher_register_real_2027", JSON.stringify(fetched));
        setDbStatus("connected");
      } catch (err) {
        console.error("Failed to load from Firestore, falling back to localStorage:", err);
        setDbStatus("error");
        
        // Fallback to localStorage backup
        const saved = localStorage.getItem("psb_voucher_register_real_2027");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              setRecords(parsed);
            }
          } catch (e) {
            setRecords([]);
          }
        }
      }
    };

    loadFromFirestore();

    // System clock tick
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleString("en-US", { 
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Save changes helper (local state + local backup)
  const saveRecordsLocal = (updatedRecords: VoucherRecord[]) => {
    setRecords(updatedRecords);
    localStorage.setItem("psb_voucher_register_real_2027", JSON.stringify(updatedRecords));
  };

  // 4. Register CRUD Operations synced with Firestore
  const handleSaveVoucher = async (savedRecord: VoucherRecord) => {
    setIsSaving(true);
    try {
      // 1. Save to Firestore
      await setDoc(doc(db, "vouchers", savedRecord.id), savedRecord);
      
      // 2. Save locally
      const exists = records.some((r) => r.id === savedRecord.id);
      let updated: VoucherRecord[];
      if (exists) {
        updated = records.map((r) => (r.id === savedRecord.id ? savedRecord : r));
      } else {
        updated = [savedRecord, ...records];
      }
      saveRecordsLocal(updated);
      
      setIsFormOpen(false);
      setEditVoucher(null);
    } catch (err) {
      console.error("Error saving voucher to Firestore:", err);
      alert("Failed to auto-save to Cloud Database. Please check your internet connection.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteVoucher = async (recordId: string) => {
    const target = records.find(r => r.id === recordId);
    if (!target) return;

    if (window.confirm(`Are you sure you want to permanently delete voucher "${target.serialNo}" for ${target.payee} from the registry?`)) {
      setIsSaving(true);
      try {
        // 1. Delete from Firestore
        await deleteDoc(doc(db, "vouchers", recordId));
        
        // 2. Delete locally
        const updated = records.filter((r) => r.id !== recordId);
        saveRecordsLocal(updated);
        
        if (selectedVoucher?.id === recordId) {
          setSelectedVoucher(null);
        }
      } catch (err) {
        console.error("Error deleting voucher from Firestore:", err);
        alert("Failed to delete voucher from Cloud Database. Please try again.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleImportCsv = async (newRecords: VoucherRecord[], override: boolean) => {
    setIsSaving(true);
    try {
      if (override) {
        // Clear all existing documents in Firestore
        const querySnapshot = await getDocs(collection(db, "vouchers"));
        const batch = writeBatch(db);
        querySnapshot.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
      }
      
      // Upload new documents in batches
      let batch = writeBatch(db);
      let count = 0;
      
      for (const record of newRecords) {
        const ref = doc(db, "vouchers", record.id);
        batch.set(ref, record);
        count++;
        
        if (count === 400) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }
      if (count > 0) {
        await batch.commit();
      }
      
      const updated = override ? newRecords : [...newRecords, ...records];
      saveRecordsLocal(updated);
    } catch (err) {
      console.error("Error importing data to Firestore:", err);
      alert("Failed to import and sync data to Cloud Database.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleWipeRegister = async () => {
    if (window.confirm("WARNING: This will permanently delete all voucher records in the register. This action cannot be undone. Proceed?")) {
      setIsSaving(true);
      try {
        const querySnapshot = await getDocs(collection(db, "vouchers"));
        const batch = writeBatch(db);
        querySnapshot.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
        
        saveRecordsLocal([]);
      } catch (err) {
        console.error("Error wiping Firestore:", err);
        alert("Failed to wipe Cloud Database.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleLoadSeedData = async () => {
    if (window.confirm("This will load the official 43-record dataset into the register, formatted for Fiscal Year 2027 starting from Serial 1st. Proceed?")) {
      setIsSaving(true);
      try {
        const converted = convertTo2027Records(SEED_VOUCHER_RECORDS);
        
        // Write to Firestore in batches
        let batch = writeBatch(db);
        let count = 0;
        
        for (const record of converted) {
          const ref = doc(db, "vouchers", record.id);
          batch.set(ref, record);
          count++;
          
          if (count === 400) {
            await batch.commit();
            batch = writeBatch(db);
            count = 0;
          }
        }
        if (count > 0) {
          await batch.commit();
        }
        
        const updated = [...converted, ...records];
        saveRecordsLocal(updated);
      } catch (err) {
        console.error("Error loading seed data to Firestore:", err);
        alert("Failed to seed Cloud Database.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  // 5. Gather Filter Dropdown Options
  const uniqueUnits = Array.from(new Set([...MASTER_UNITS, ...records.map((r) => r.unit?.trim() as string)]))
    .filter(Boolean)
    .filter(u => u !== "-")
    .sort() as string[];

  const uniqueVotes = Array.from(new Set(records.map((r) => r.vote?.trim() as string).filter(Boolean)))
    .filter(v => v !== "-")
    .sort() as string[];

  const uniqueStatuses = Array.from(new Set(records.map((r) => r.statusOfVr?.trim() as string).filter(Boolean)))
    .filter(s => s !== "-")
    .sort() as string[];

  // 6. Filter Records
  const filteredRecords = records.filter((r) => {
    // Search fields query matching Payee, Description, Vote, Serial No
    if (filters.search) {
      const query = filters.search.toLowerCase();
      const matchSerial = r.serialNo?.toLowerCase().includes(query);
      const matchPayee = r.payee?.toLowerCase().includes(query);
      const matchDesc = r.description?.toLowerCase().includes(query);
      const matchVote = r.vote?.toLowerCase().includes(query);
      if (!matchSerial && !matchPayee && !matchDesc && !matchVote) return false;
    }

    // Direct filters
    if (filters.unit && r.unit !== filters.unit) return false;
    if (filters.status && r.statusOfVr !== filters.status) return false;
    if (filters.vote && r.vote !== filters.vote) return false;

    // Amount range
    const amount = r.voucherAmount || 0;
    if (filters.minAmount && amount < parseFloat(filters.minAmount)) return false;
    if (filters.maxAmount && amount > parseFloat(filters.maxAmount)) return false;

    return true;
  });

  // 7. Calculate Stats
  const stats: RegisterStats = (() => {
    let totalVoucherAmount = 0;
    let totalPaidAmount = 0;
    let totalChequeValue = 0;
    let totalCrossEntry = 0;
    let approvedCount = 0;
    let pendingCount = 0;
    let incompleteCount = 0;

    filteredRecords.forEach((r) => {
      totalVoucherAmount += r.voucherAmount || 0;
      totalPaidAmount += r.totalPaid || 0;
      totalChequeValue += r.chequeValue || 0;
      totalCrossEntry += r.crossEntry || 0;

      const status = r.statusOfVr?.toLowerCase() || "";
      if (status.includes("approved") && !status.includes("not approved")) {
        approvedCount++;
      } else if (status.includes("incomplete") || status.includes("not approved")) {
        incompleteCount++;
      } else {
        pendingCount++;
      }
    });

    const totalPendingAmount = Math.max(0, totalVoucherAmount - totalPaidAmount);

    return {
      totalCount: filteredRecords.length,
      totalVoucherAmount,
      totalPaidAmount,
      totalChequeValue,
      totalCrossEntry,
      totalPendingAmount,
      approvedCount,
      pendingCount,
      incompleteCount
    };
  })();

  // Global stats for Dashboard view
  const globalStats: RegisterStats = (() => {
    let totalVoucherAmount = 0;
    let totalPaidAmount = 0;
    let totalChequeValue = 0;
    let totalCrossEntry = 0;
    let approvedCount = 0;
    let pendingCount = 0;
    let incompleteCount = 0;

    records.forEach((r) => {
      totalVoucherAmount += r.voucherAmount || 0;
      totalPaidAmount += r.totalPaid || 0;
      totalChequeValue += r.chequeValue || 0;
      totalCrossEntry += r.crossEntry || 0;

      const status = r.statusOfVr?.toLowerCase() || "";
      if (status.includes("approved") && !status.includes("not approved")) {
        approvedCount++;
      } else if (status.includes("incomplete") || status.includes("not approved")) {
        incompleteCount++;
      } else {
        pendingCount++;
      }
    });

    const totalPendingAmount = Math.max(0, totalVoucherAmount - totalPaidAmount);

    return {
      totalCount: records.length,
      totalVoucherAmount,
      totalPaidAmount,
      totalChequeValue,
      totalCrossEntry,
      totalPendingAmount,
      approvedCount,
      pendingCount,
      incompleteCount
    };
  })();

  const resetFilters = () => {
    setFilters({
      search: "",
      unit: "",
      status: "",
      vote: "",
      payee: "",
      startDate: "",
      endDate: "",
      minAmount: "",
      maxAmount: ""
    });
  };

  const renderSidebarContent = (isMobile: boolean = false) => {
    // Calculate status counts for live counters
    const statusCounts = (() => {
      let total = records.length;
      let approved = 0;
      let pending = 0;
      let incomplete = 0;

      records.forEach((r) => {
        const status = r.statusOfVr?.toLowerCase() || "";
        if (status.includes("approved") && !status.includes("not approved")) {
          approved++;
        } else if (status.includes("incomplete") || status.includes("not approved")) {
          incomplete++;
        } else {
          pending++;
        }
      });

      return { total, approved, pending, incomplete };
    })();

    const isCollapsed = !isMobile && isSidebarCollapsed;

    return (
      <div className="flex flex-col h-full justify-between text-slate-300">
        <div className="space-y-6">
          {/* Logo / Branding Header */}
          <div className={`space-y-3 transition-all duration-300 ${isCollapsed ? "items-center text-center" : ""}`}>
            <div className={isCollapsed ? "flex justify-center" : ""}>
              <h1 className="text-xl font-black tracking-tight text-white font-display flex items-center gap-2">
                <Layers className="text-indigo-500 shrink-0" size={20} />
                {!isCollapsed && <span className="tracking-tighter font-extrabold text-indigo-400">PSB VOUCHER REGISTER</span>}
              </h1>
            </div>
            {!isCollapsed ? (
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold mt-0.5">
                Audit & Ledger Register
              </p>
            ) : null}
            {!isCollapsed && (
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                Secure budget tracking, internal ledger management, and regulatory voucher verification.
              </p>
            )}
          </div>

          {/* Clock Widget */}
          {!isCollapsed ? (
            <div className="space-y-3">
              <div className="bg-[#101014]/80 border border-white/5 backdrop-blur-md rounded-2xl p-3.5 flex items-center gap-3 shadow-lg">
                <Clock size={15} className="text-indigo-400 shrink-0" />
                <div className="text-xs font-semibold text-slate-400 font-mono flex-1">
                  <span className="block text-[8px] uppercase tracking-widest text-slate-500 font-extrabold leading-none mb-1">
                    System Audit Clock (LST)
                  </span>
                  <span className="block font-extrabold text-slate-200 text-[11px] whitespace-nowrap mt-0.5">
                    {currentTime || "Synchronizing..."}
                  </span>
                </div>
              </div>

              {/* Firestore Cloud Database Sync Card */}
              <div className="bg-[#101014]/80 border border-white/5 backdrop-blur-md rounded-2xl p-3.5 flex items-center gap-3 shadow-lg">
                <Database size={15} className={`${dbStatus === "connected" ? "text-emerald-400" : dbStatus === "connecting" ? "text-amber-400 animate-spin" : "text-rose-500"} shrink-0`} />
                <div className="text-xs font-semibold text-slate-400 font-mono flex-1">
                  <span className="block text-[8px] uppercase tracking-widest text-slate-500 font-extrabold leading-none mb-1">
                    Cloud Firestore DB
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${dbStatus === "connected" ? "bg-emerald-400 animate-pulse" : dbStatus === "connecting" ? "bg-amber-400" : "bg-rose-500"}`} />
                    <span className={`text-[10px] font-extrabold uppercase ${dbStatus === "connected" ? "text-emerald-400" : dbStatus === "connecting" ? "text-amber-400 animate-pulse" : "text-rose-500"}`}>
                      {dbStatus === "connected" ? "LIVE SYNC ACTIVE" : dbStatus === "connecting" ? "CONNECTING..." : "OFFLINE FALLBACK"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 items-center">
              <div className="flex justify-center" title="Clock Sync Active">
                <Clock size={16} className="text-indigo-400 animate-pulse" />
              </div>
              <div className="flex justify-center" title={dbStatus === "connected" ? "Cloud Database Live" : "Cloud Database Connecting"}>
                <Database size={16} className={`${dbStatus === "connected" ? "text-emerald-400 animate-pulse" : "text-amber-400 animate-spin"}`} />
              </div>
            </div>
          )}

          {/* Action Center */}
          <div className="space-y-2">
            {!isCollapsed && (
              <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5 pl-1">
                Primary Actions
              </h3>
            )}
            
            <button
              onClick={() => {
                setEditVoucher(null);
                setIsFormOpen(true);
                if (isMobile) setIsSidebarMobileOpen(false);
              }}
              className={`w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-lg shadow-indigo-900/20 flex items-center gap-2 cursor-pointer active:scale-95 justify-center`}
              title="Add Voucher Record"
            >
              <PlusCircle size={15} />
              {!isCollapsed && <span>Add Voucher</span>}
            </button>
            
            <button
              onClick={() => {
                setIsCsvOpen(true);
                if (isMobile) setIsSidebarMobileOpen(false);
              }}
              className={`w-full bg-[#101014]/60 hover:bg-[#15151b] text-slate-200 border border-white/5 font-extrabold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer`}
              title="CSV Portal Integration"
            >
              <FileSpreadsheet size={15} />
              {!isCollapsed && <span>CSV Portals Center</span>}
            </button>
          </div>

          {/* Section Navigation / Toggles */}
          <div className="space-y-1.5">
            {!isCollapsed && (
              <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5 pl-1">
                Navigation Menu
              </h3>
            )}

            {/* View Dashboard Button */}
            <button
              onClick={() => {
                setActiveView("dashboard");
                if (isMobile) setIsSidebarMobileOpen(false);
              }}
              className={`w-full flex items-center justify-between text-xs font-bold py-3 px-3.5 rounded-xl border transition-all ${
                activeView === "dashboard" 
                  ? "bg-indigo-600/15 border-indigo-500/30 text-indigo-300 shadow-inner" 
                  : "bg-transparent border-transparent text-slate-400 hover:bg-[#101014]/60 hover:text-slate-200"
              }`}
              title="Dashboard Overview"
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard size={15} className={activeView === "dashboard" ? "text-indigo-400" : "text-slate-400"} />
                {!isCollapsed && <span>Dashboard Overview</span>}
              </div>
              {!isCollapsed && (
                <span className={`h-1.5 w-1.5 rounded-full ${activeView === "dashboard" ? "bg-emerald-400 animate-pulse" : "bg-slate-700"}`} />
              )}
            </button>
            
            <button
              onClick={() => {
                setActiveView("ledger");
                if (isMobile) setIsSidebarMobileOpen(false);
              }}
              className={`w-full flex items-center justify-between text-xs font-bold py-3 px-3.5 rounded-xl border transition-all ${
                activeView === "ledger" 
                  ? "bg-indigo-600/15 border-indigo-500/30 text-indigo-300 shadow-inner" 
                  : "bg-transparent border-transparent text-slate-400 hover:bg-[#101014]/60 hover:text-slate-200"
              }`}
              title="Ledger Registry"
            >
              <div className="flex items-center gap-2.5">
                <Database size={15} className={activeView === "ledger" ? "text-indigo-400" : "text-slate-400"} />
                {!isCollapsed && <span>Ledger Registry</span>}
              </div>
              {!isCollapsed && (
                <span className={`h-1.5 w-1.5 rounded-full ${activeView === "ledger" ? "bg-emerald-400 animate-pulse" : "bg-slate-700"}`} />
              )}
            </button>

            <button
              onClick={() => {
                setActiveView("reports");
                if (isMobile) setIsSidebarMobileOpen(false);
              }}
              className={`w-full flex items-center justify-between text-xs font-bold py-3 px-3.5 rounded-xl border transition-all ${
                activeView === "reports" 
                  ? "bg-indigo-600/15 border-indigo-500/30 text-indigo-300 shadow-inner" 
                  : "bg-transparent border-transparent text-slate-400 hover:bg-[#101014]/60 hover:text-slate-200"
              }`}
              title="Monthly & Yearly Audits"
            >
              <div className="flex items-center gap-2.5">
                <FileText size={15} className={activeView === "reports" ? "text-indigo-400" : "text-slate-400"} />
                {!isCollapsed && <span>Monthly & Yearly Audits</span>}
              </div>
              {!isCollapsed && (
                <span className={`h-1.5 w-1.5 rounded-full ${activeView === "reports" ? "bg-indigo-400 animate-pulse" : "bg-slate-700"}`} />
              )}
            </button>

            {/* Settings button */}
            <button
              onClick={() => {
                setActiveView("settings");
                if (isMobile) setIsSidebarMobileOpen(false);
              }}
              className={`w-full flex items-center justify-between text-xs font-bold py-3 px-3.5 rounded-xl border transition-all ${
                activeView === "settings" 
                  ? "bg-indigo-600/15 border-indigo-500/30 text-indigo-300 shadow-inner" 
                  : "bg-transparent border-transparent text-slate-400 hover:bg-[#101014]/60 hover:text-slate-200"
              }`}
              title="System Settings"
            >
              <div className="flex items-center gap-2.5">
                <Settings size={15} className={activeView === "settings" ? "text-indigo-400" : "text-slate-400"} />
                {!isCollapsed && <span>System Settings</span>}
              </div>
              {!isCollapsed && (
                <span className={`h-1.5 w-1.5 rounded-full ${activeView === "settings" ? "bg-indigo-400 animate-pulse" : "bg-slate-700"}`} />
              )}
            </button>
          </div>

          {/* Status Filters Sidebar Widget */}
          {!isCollapsed && activeView === "ledger" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between pl-1">
                <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Filter Ledger List
                </h3>
                {filters.status && (
                  <button
                    onClick={() => setFilters({ ...filters, status: "" })}
                    className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="space-y-1 max-h-56 overflow-y-auto scrollbar-thin">
                {/* All Statuses Button */}
                <button
                  onClick={() => {
                    setFilters({ ...filters, status: "" });
                    if (isMobile) setIsSidebarMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between py-2.5 px-3 rounded-lg text-xs font-semibold transition-colors ${
                    filters.status === ""
                      ? "bg-indigo-600/15 text-indigo-300 border-l-2 border-indigo-500 pl-2.5"
                      : "text-slate-400 hover:bg-[#101014]/60 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    <span className="truncate">All Ledger Records</span>
                  </div>
                  <span className="bg-[#101014] border border-white/5 text-[10px] text-slate-400 px-1.5 py-0.5 rounded-md font-mono font-bold">
                    {records.length}
                  </span>
                </button>

                {/* Dynamic Status Buttons */}
                {uniqueStatuses.map((status) => {
                  const count = records.filter(r => r.statusOfVr === status).length;
                  const isActive = filters.status === status;
                  
                  // Color coding
                  const lower = status.toLowerCase();
                  let dotColor = "bg-amber-400";
                  if (lower.includes("approved") && !lower.includes("not approved")) {
                    dotColor = "bg-emerald-400";
                  } else if (lower.includes("incomplete") || lower.includes("not approved")) {
                    dotColor = "bg-rose-400";
                  }

                  return (
                    <button
                      key={status}
                      onClick={() => {
                        setFilters({ ...filters, status });
                        if (isMobile) setIsSidebarMobileOpen(false);
                      }}
                      className={`w-full flex items-center justify-between py-2.5 px-3 rounded-lg text-xs font-semibold transition-colors ${
                        isActive
                          ? "bg-indigo-600/15 text-indigo-300 border-l-2 border-indigo-500 pl-2.5"
                          : "text-slate-400 hover:bg-[#101014]/60 hover:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate pr-2" title={status}>
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColor}`} />
                        <span className="truncate text-left">{status}</span>
                      </div>
                      <span className="bg-[#101014] border border-white/5 text-[10px] text-slate-400 px-1.5 py-0.5 rounded-md font-mono font-bold shrink-0">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Dataset maintenance utilities */}
        <div className="space-y-4 pt-4 border-t border-white/5 mt-auto">
          {!isCollapsed ? (
            <>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    handleLoadSeedData();
                    if (isMobile) setIsSidebarMobileOpen(false);
                  }}
                  className="w-full flex items-center gap-2 text-[10px] font-bold text-slate-500 hover:text-indigo-400 transition-colors py-1.5 px-2 hover:bg-[#101014]/60 rounded-lg text-left cursor-pointer"
                  title="Reset ledger to master seeded records"
                >
                  <RefreshCw size={12} />
                  <span>Load Seed Data (43 Items)</span>
                </button>
                
                <button
                  onClick={() => {
                    handleWipeRegister();
                    if (isMobile) setIsSidebarMobileOpen(false);
                  }}
                  className="w-full flex items-center gap-2 text-[10px] font-bold text-slate-500 hover:text-rose-400 transition-colors py-1.5 px-2 hover:bg-[#101014]/60 rounded-lg text-left cursor-pointer"
                  title="Wipe registry database completely"
                >
                  <RotateCcw size={12} />
                  <span>Wipe Local Registry</span>
                </button>
              </div>
              
              <div className="text-[10px] text-slate-600 font-extrabold leading-tight font-mono pl-1">
                <span>Voucher Register Dept</span>
                <span className="block text-[9px] text-slate-700 font-bold mt-0.5">Finance Ledger Portal v2.0</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={handleLoadSeedData}
                className="text-slate-500 hover:text-indigo-400 p-1.5 rounded-lg hover:bg-[#101014]/60 cursor-pointer"
                title="Load Seed Data"
              >
                <RefreshCw size={13} />
              </button>
              <button
                onClick={handleWipeRegister}
                className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-[#101014]/60 cursor-pointer"
                title="Wipe Registry"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0D14] font-sans text-slate-300 flex flex-col lg:flex-row relative overflow-x-hidden">
      
      {/* Immersive Glassmorphism Background Ambient Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-48 -left-48 w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[130px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-1/4 right-12 w-96 h-96 rounded-full bg-purple-600/8 blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute bottom-12 left-1/3 w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[160px] animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-12 left-1/2 w-80 h-80 rounded-full bg-emerald-500/5 blur-[110px]" />
      </div>

      {/* Mobile Top Header */}
      <header className="lg:hidden h-16 bg-[#0A0D14]/75 backdrop-blur-md border-b border-white/5 px-4 flex items-center justify-between sticky top-0 z-40 w-full shadow-lg shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="text-indigo-500 shrink-0" size={18} />
          <span className="font-extrabold text-white text-xs tracking-tight uppercase font-display">
            PSB VOUCHER REGISTER
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        
        <button
          onClick={() => setIsSidebarMobileOpen(!isSidebarMobileOpen)}
          className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors focus:outline-none"
          aria-label="Toggle Navigation Sidebar"
        >
          {isSidebarMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Desktop Persistent Left Sidebar */}
      <aside className="hidden lg:flex flex-col w-80 bg-[#0A0D14]/65 backdrop-blur-xl border-r border-white/5 h-screen sticky top-0 p-6 overflow-y-auto shrink-0 z-30 shadow-[5px_0_30px_rgba(0,0,0,0.3)]">
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Drawer Slide-out Menu Overlay & Panel */}
      <AnimatePresence>
        {isSidebarMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarMobileOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />
            
            {/* Sliding Drawer Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative flex flex-col w-80 max-w-[85vw] bg-[#0A0D14]/85 backdrop-blur-xl border-r border-white/5 h-full p-6 overflow-y-auto shadow-2xl z-50"
            >
              {/* Close Drawer Button */}
              <button
                onClick={() => setIsSidebarMobileOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
                aria-label="Close Sidebar"
              >
                <X size={16} />
              </button>
              
              <div className="h-full pt-4">
                {renderSidebarContent(true)}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Workspace Frame */}
      <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full overflow-y-auto">
        
        {/* Top Tab Switcher */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3 print:hidden">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
            <button
              onClick={() => setActiveView("dashboard")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                activeView === "dashboard"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "bg-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <LayoutDashboard size={13} />
              <span>Dashboard Overview</span>
            </button>

            <button
              onClick={() => setActiveView("ledger")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                activeView === "ledger"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "bg-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Database size={13} />
              <span>Ledger Registry</span>
            </button>
            
            <button
              onClick={() => setActiveView("reports")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                activeView === "reports"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "bg-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <FileText size={13} />
              <span>Monthly & Yearly Audits</span>
            </button>

            <button
              onClick={() => setActiveView("settings")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                activeView === "settings"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "bg-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Settings size={13} />
              <span>System Settings</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest">
              Audit Data Secured
            </span>
          </div>
        </div>

        {/* VIEW: DASHBOARD OVERVIEW */}
        {activeView === "dashboard" && (
          <div className="space-y-6">
            {/* Elegant SaaS welcome banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-[#101014] to-indigo-950/20 border border-white/5 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
              {/* Abstract decorative blur */}
              <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl -z-10" />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-mono text-[10px] font-bold uppercase tracking-widest">
                  <ShieldCheck size={14} />
                  <span>SECURE VOUCHER REGISTRY PLATFORM</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                  Voucher Register
                </h2>
                <p className="text-xs text-slate-400 max-w-xl font-medium">
                  Professional budget tracking, internal ledger management, and financial voucher auditing. Seamlessly manage accounts, track payouts, and generate dynamic reports.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => {
                    setEditVoucher(null);
                    setIsFormOpen(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold tracking-wider uppercase px-4 py-3 rounded-xl transition-all shadow-lg shadow-indigo-900/20 active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <PlusCircle size={14} />
                  <span>New Voucher</span>
                </button>
                <button
                  onClick={() => setIsCsvOpen(true)}
                  className="bg-white/5 hover:bg-white/10 text-slate-200 border border-white/5 text-xs font-extrabold tracking-wider uppercase px-4 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2"
                >
                  <FileSpreadsheet size={14} />
                  <span>CSV Portal</span>
                </button>
              </div>
            </div>

            {/* Global Stats Overview */}
            <div>
              <div className="flex items-center justify-between mb-3.5 pl-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Activity size={13} className="text-indigo-400" />
                  <span>Real-time Treasury Metrics</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">Computed on {records.length} total entries</span>
              </div>
              <StatsOverview stats={globalStats} />
            </div>

            {/* Dynamic Charts Dashboard Section */}
            <div className="bg-[#101014]/65 backdrop-blur-md border border-white/5 rounded-3xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
              <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-4">
                <div className="flex items-center gap-2.5">
                  <TrendingUp size={15} className="text-indigo-400" />
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">Financial Visualizer</h3>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Live division budget allocations and pending balances</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Active Charting Eng
                  </span>
                </div>
              </div>
              <AnalyticsCharts records={records} />
            </div>

            {/* Bottom Row Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Top 5 Recent Vouchers */}
              <div className="lg:col-span-8 bg-[#101014]/65 backdrop-blur-md border border-white/5 rounded-3xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.4)] flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <Clock size={15} className="text-indigo-400" />
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">Recent Ledger Activity</h3>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Top 5 audit items recently committed to the registry</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveView("ledger")}
                      className="text-[10px] font-extrabold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest cursor-pointer text-xs"
                    >
                      View All Registry &rarr;
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="text-slate-400 font-bold uppercase tracking-widest text-[9px] border-b border-white/5">
                          <th className="py-2.5">Serial No</th>
                          <th className="py-2.5">Unit</th>
                          <th className="py-2.5">Payee</th>
                          <th className="py-2.5 text-right">Amount (LKR)</th>
                          <th className="py-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-medium text-slate-300">
                        {records.slice(0, 5).map((r) => {
                          const s = r.statusOfVr?.toLowerCase() || "";
                          let statusText = "Pending";
                          let badgeClass = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
                          if (s.includes("approved") && !s.includes("not approved")) {
                            statusText = "Approved";
                            badgeClass = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                          } else if (s.includes("incomplete") || s.includes("not approved")) {
                            statusText = "Incomplete";
                            badgeClass = "bg-rose-500/10 text-rose-400 border border-rose-500/20";
                          }

                          return (
                            <tr
                              key={r.id}
                              className="hover:bg-white/5 transition-colors cursor-pointer"
                              onClick={() => setSelectedVoucher(r)}
                              title="Click to view details"
                            >
                              <td className="py-3 font-mono font-bold text-white">{r.serialNo}</td>
                              <td className="py-3">
                                <span className="bg-[#1e2330]/80 text-slate-200 border border-slate-700/40 font-bold px-2 py-0.5 rounded text-[10px] whitespace-nowrap">
                                  {r.unit}
                                </span>
                              </td>
                              <td className="py-3 font-semibold text-white truncate max-w-[120px]" title={r.payee}>
                                {r.payee}
                              </td>
                              <td className="py-3 text-right font-mono font-bold text-white">
                                {new Intl.NumberFormat("en-LK", {
                                  style: "currency",
                                  currency: "LKR",
                                  minimumFractionDigits: 2,
                                }).format(r.voucherAmount)}
                              </td>
                              <td className="py-3 text-center whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${badgeClass}`}>
                                  {statusText}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        {records.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-slate-500 font-bold">
                              No ledger entries committed yet. Load seeds or add a voucher!
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column: Treasury Quick Help / Directives */}
              <div className="lg:col-span-4 bg-[#101014]/65 backdrop-blur-md border border-white/5 rounded-3xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.4)] space-y-4">
                <div className="flex items-center gap-2.5 border-b border-white/5 pb-3.5">
                  <Sparkles size={15} className="text-indigo-400 animate-pulse" />
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">Auditor Directive Suite</h3>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Internal audit guidelines & legal compliance</p>
                  </div>
                </div>

                <div className="space-y-3.5 text-xs text-slate-400 font-medium">
                  <div className="p-3 bg-white/5 border border-white/5 rounded-2xl space-y-1">
                    <h4 className="font-extrabold text-white text-[11px] flex items-center gap-1.5 uppercase">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                      Budgetary Policy 102
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      All administrative payments exceeding reconciliation thresholds must be matched against active budget allocations before authorized sign-off.
                    </p>
                  </div>

                  <div className="p-3 bg-white/5 border border-white/5 rounded-2xl space-y-1">
                    <h4 className="font-extrabold text-white text-[11px] flex items-center gap-1.5 uppercase">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Encrypted Database Active
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Ledger auto-save is active and writing securely to your local browser storage engine. Integrity checksum is validated.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setActiveView("settings")}
                      className="w-full bg-[#1e1e24] hover:bg-[#25252d] text-slate-200 text-xs font-extrabold tracking-wider uppercase py-2.5 rounded-xl border border-white/5 transition-all text-center cursor-pointer block"
                    >
                      Audit Controls Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: LEDGER REGISTRY (The Table Grid View with Filters) */}
        {activeView === "ledger" && (
          <div className="space-y-6">
            {/* Dynamic Metrics Cards */}
            <section id="metrics-deck">
              <StatsOverview stats={stats} />
            </section>

            {/* Collapsible Analytics Dashboard Toggle */}
            <section id="analytics-panel-toggle" className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <button
                  onClick={() => setIsChartsVisible(!isChartsVisible)}
                  className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <BarChart size={14} className="text-indigo-400" />
                  {isChartsVisible ? "Hide Analytical Overview" : "Show Analytical Overview"}
                </button>
                <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  <span>Workspace Ledger View</span>
                </div>
              </div>

              <AnimatePresence>
                {isChartsVisible && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <AnalyticsCharts records={filteredRecords} />
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* Master Register Filter & Table Grid */}
            <main className="space-y-4">
              {/* Filters Glassmorphic Card Container */}
              <div className="bg-[#101014]/65 backdrop-blur-md border border-white/5 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:border-white/10 transition-all duration-300 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
                      <SlidersHorizontal size={14} />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                        Advanced Audit Filter Suite
                      </h3>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Configure precise search limits for faster file reconciliation</p>
                    </div>
                  </div>
                  {(filters.search || filters.unit || filters.status || filters.vote || filters.minAmount || filters.maxAmount) && (
                    <button
                      onClick={resetFilters}
                      className="text-[10px] font-extrabold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-2.5 py-1.5 rounded-xl border border-indigo-500/20 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw size={10} className="animate-spin" /> Clear Filters
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-semibold">
                  {/* Search Field */}
                  <div className="relative">
                    <span className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                      General Search
                    </span>
                    <div className="relative">
                      <input
                        type="text"
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        placeholder="Search payee, vote, desc..."
                        className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#0A0C10]/60 backdrop-blur-sm border border-white/5 focus:outline-none focus:border-indigo-500/50 font-bold text-slate-200 placeholder-slate-600 transition-all text-xs"
                      />
                      <Search size={14} className="absolute left-2.5 top-2.5 text-slate-600" />
                    </div>
                  </div>

                  {/* Station Filter */}
                  <div>
                    <span className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                      Station / Division
                    </span>
                    <select
                      value={filters.unit}
                      onChange={(e) => setFilters({ ...filters, unit: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0A0C10]/60 backdrop-blur-sm border border-white/5 focus:outline-none focus:border-indigo-500/50 text-slate-200 font-bold transition-all text-xs cursor-pointer"
                    >
                      <option value="" className="bg-[#101014]">All Stations / Units</option>
                      {uniqueUnits.map(unit => (
                        <option key={unit} value={unit} className="bg-[#101014]">{unit}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <span className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                      VR Status
                    </span>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0A0C10]/60 backdrop-blur-sm border border-white/5 focus:outline-none focus:border-indigo-500/50 text-slate-200 font-bold transition-all text-xs cursor-pointer"
                    >
                      <option value="" className="bg-[#101014]">All VR Statuses</option>
                      {uniqueStatuses.map(status => (
                        <option key={status} value={status} className="bg-[#101014]">{status}</option>
                      ))}
                    </select>
                  </div>

                  {/* Amount Range Filters */}
                  <div>
                    <span className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                      Voucher Value Range (LKR)
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={filters.minAmount}
                        onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                        placeholder="Min Amount"
                        className="w-1/2 px-2.5 py-2 rounded-xl bg-[#0A0C10]/60 backdrop-blur-sm border border-white/5 focus:outline-none focus:border-indigo-500/50 text-slate-200 font-mono font-bold placeholder-slate-600 transition-all text-xs"
                      />
                      <input
                        type="number"
                        value={filters.maxAmount}
                        onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                        placeholder="Max Amount"
                        className="w-1/2 px-2.5 py-2 rounded-xl bg-[#0A0C10]/60 backdrop-blur-sm border border-white/5 focus:outline-none focus:border-indigo-500/50 text-slate-200 font-mono font-bold placeholder-slate-600 transition-all text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Core Voucher Grid */}
              <VoucherTable 
                records={filteredRecords}
                searchQuery={filters.search}
                onViewDetails={(r) => setSelectedVoucher(r)}
                onEdit={(r) => {
                  setEditVoucher(r);
                  setIsFormOpen(true);
                }}
                onDelete={handleDeleteVoucher}
              />
            </main>
          </div>
        )}

        {/* VIEW: MONTHLY & YEARLY AUDITS */}
        {activeView === "reports" && (
          <ReportSummary records={records} />
        )}

        {/* VIEW: SYSTEM SETTINGS */}
        {activeView === "settings" && (
          <div className="space-y-6">
            <div className="relative overflow-hidden bg-[#101014]/65 backdrop-blur-md border border-white/5 rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-mono text-[10px] font-bold uppercase tracking-widest">
                  <Settings size={14} />
                  <span>SYSTEM AUDITOR CONTROL PANEL</span>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight leading-none">
                  Registry Diagnostics & Setup
                </h2>
                <p className="text-xs text-slate-400 max-w-xl font-medium">
                  Perform critical database maintenance operations, configure local fiscal cycles, and verify audit compliance.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Database Maintenance Panel */}
              <div className="bg-[#101014]/65 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.4)] space-y-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                  <Database size={16} className="text-indigo-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">Local Database Operations</h3>
                </div>
                
                <div className="space-y-3.5 text-xs">
                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                    The active ledger contains <strong className="text-white font-extrabold">{records.length}</strong> committed records. You can load high-fidelity official FY2027 test data (43 records starting from Serial 1st) or wipe the entire registry if you want to start clean.
                  </p>

                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleLoadSeedData}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-3 px-4 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer text-center text-xs flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={14} />
                      <span>Install FY2027 Seed Dataset</span>
                    </button>
                    <button
                      onClick={handleWipeRegister}
                      className="flex-1 bg-rose-950/40 hover:bg-rose-950/60 text-rose-400 border border-rose-500/20 font-extrabold py-3 px-4 rounded-xl transition-all active:scale-95 cursor-pointer text-center text-xs flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={14} />
                      <span>Wipe Registry Records</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Fiscal Term & Startup Settings */}
              <div className="bg-[#101014]/65 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.4)] space-y-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                  <Clock size={16} className="text-indigo-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">Fiscal Cycle & Compliance</h3>
                </div>

                <div className="space-y-4 text-xs font-medium text-slate-400">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                        ACTIVE START YEAR
                      </span>
                      <div className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-slate-200 font-extrabold font-mono text-center">
                        2027
                      </div>
                    </div>
                    <div>
                      <span className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                        INITIAL SERIAL NO.
                      </span>
                      <div className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-slate-200 font-extrabold font-mono text-center">
                        1st
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-indigo-950/10 border border-indigo-500/20 rounded-2xl text-[11px] text-indigo-300 leading-relaxed font-semibold">
                    Multi-year compatibility is enforced. Vouchers entered into the system will start their sequence at Serial Number 1st for FY2027. New transactions sequentially auto-increment.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sticky footer notice */}
        <footer className="text-center text-[10px] text-slate-400 font-medium py-4 space-y-1">
          <div>PSB Voucher Register • Budget Ledger & Audit Portal v2.0</div>
          <div className="text-indigo-400 font-mono text-[9px] uppercase tracking-widest font-extrabold">
            Created by Prasad • Security Rules Configured
          </div>
        </footer>

      </div>

      {/* Floating Modal: Form Side-panel */}
      {isFormOpen && (
        <VoucherForm
          voucher={editVoucher}
          onSave={handleSaveVoucher}
          onCancel={() => {
            setIsFormOpen(false);
            setEditVoucher(null);
          }}
          existingUnits={uniqueUnits}
          existingVotes={uniqueVotes}
          existingSerials={records.map(r => r.serialNo)}
        />
      )}

      {/* Floating Modal: Details overlay */}
      {selectedVoucher && (
        <VoucherDetailModal
          voucher={selectedVoucher}
          onClose={() => setSelectedVoucher(null)}
          onEdit={(r) => {
            setSelectedVoucher(null);
            setEditVoucher(r);
            setIsFormOpen(true);
          }}
        />
      )}

      {/* Floating Modal: CSV Backup Center */}
      {isCsvOpen && (
        <CsvImportExport
          records={records}
          onImport={(newRecs, override) => {
            handleImportCsv(newRecs, override);
            setIsCsvOpen(false);
          }}
          onClose={() => setIsCsvOpen(false)}
        />
      )}

    </div>
  );
}

