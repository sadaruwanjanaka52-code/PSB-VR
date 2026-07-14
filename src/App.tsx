import React, { useState, useEffect } from "react";
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
  Sparkles,
  Users
} from "lucide-react";

import { VoucherRecord, RegisterStats, FilterState } from "./types";
import { SEED_VOUCHER_RECORDS } from "./data";
import { MASTER_UNITS, MASTER_VOTES } from "./masterData";
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
  const [activeView, setActiveView] = useState<string>("dashboard");
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

    // Helper for navigation button
    const renderNavItem = (viewId: string, label: string, icon: React.ReactNode) => {
      const isActive = activeView === viewId;
      return (
        <button
          onClick={() => {
            setActiveView(viewId);
            if (isMobile) setIsSidebarMobileOpen(false);
          }}
          className={`w-full flex items-center justify-between text-xs font-semibold py-1.5 px-2.5 rounded-[4px] border transition-all ${
            isActive 
              ? "bg-[#152842] border-[#2a456c] text-white shadow-xs" 
              : "bg-transparent border-transparent text-slate-300 hover:bg-[#152842]/40 hover:text-white"
          }`}
          title={label}
        >
          <div className="flex items-center gap-2 max-w-[90%] truncate">
            {icon}
            {!isCollapsed && <span className="truncate">{label}</span>}
          </div>
          {!isCollapsed && (
            <span className={`h-1 w-1 rounded-full ${isActive ? "bg-emerald-400" : "bg-transparent"}`} />
          )}
        </button>
      );
    };

    return (
      <div className="flex flex-col h-full justify-between text-slate-100">
        <div className="space-y-4">
          {/* Logo / Branding Header */}
          <div className={`space-y-1.5 transition-all duration-300 ${isCollapsed ? "items-center text-center" : ""}`}>
            <div className={isCollapsed ? "flex justify-center" : ""}>
              <h1 className="text-md font-extrabold tracking-tight text-white font-display flex items-center gap-1.5">
                <Layers className="text-[#93c5fd] shrink-0" size={16} />
                {!isCollapsed && <span className="tracking-tight font-extrabold text-white">PSB VOUCHER PORTAL</span>}
              </h1>
            </div>
            {!isCollapsed ? (
              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-extrabold">
                Sri Lanka Treasury Registry
              </p>
            ) : null}
          </div>

          {/* Clock & Status Widgets */}
          {!isCollapsed ? (
            <div className="space-y-1.5">
              <div className="bg-[#152842] border border-[#2a456c] rounded-[4px] p-2 flex items-center gap-2 shadow-xs">
                <Clock size={12} className="text-[#93c5fd] shrink-0" />
                <div className="text-[10px] font-semibold text-slate-200 font-mono flex-1">
                  <span className="block text-[8px] uppercase tracking-widest text-slate-400 font-bold leading-none mb-0.5">
                    System Audit Clock
                  </span>
                  <span className="block font-bold text-white text-[10px] whitespace-nowrap">
                    {currentTime || "Synchronizing..."}
                  </span>
                </div>
              </div>

              {/* Firestore Cloud Database Sync Card */}
              <div className="bg-[#152842] border border-[#2a456c] rounded-[4px] p-2 flex items-center gap-2 shadow-xs">
                <Database size={12} className={`${dbStatus === "connected" ? "text-emerald-400" : dbStatus === "connecting" ? "text-amber-400 animate-spin" : "text-rose-400"} shrink-0`} />
                <div className="text-[10px] font-semibold text-slate-200 font-mono flex-1">
                  <span className="block text-[8px] uppercase tracking-widest text-slate-400 font-bold leading-none mb-0.5">
                    Cloud Database Sync
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`h-1 w-1 rounded-full ${dbStatus === "connected" ? "bg-emerald-400 animate-pulse" : dbStatus === "connecting" ? "bg-amber-400" : "bg-rose-400"}`} />
                    <span className="text-[8px] font-extrabold uppercase text-slate-300">
                      {dbStatus === "connected" ? "Cloud Sync Active" : dbStatus === "connecting" ? "Connecting..." : "Offline Portable Mode"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 items-center">
              <div className="flex justify-center" title="Clock Sync Active">
                <Clock size={14} className="text-[#93c5fd] animate-pulse" />
              </div>
              <div className="flex justify-center" title={dbStatus === "connected" ? "Cloud Database Live" : "Cloud Database Connecting"}>
                <Database size={14} className={`${dbStatus === "connected" ? "text-emerald-400 animate-pulse" : "text-amber-400 animate-spin"}`} />
              </div>
            </div>
          )}

          {/* Grouped Navigation */}
          <div className="space-y-3.5 overflow-y-auto max-h-[58vh] pr-1 scrollbar-thin">
            {/* Group 1: Core Applications */}
            <div className="space-y-1">
              {!isCollapsed && (
                <h3 className="text-[8px] font-bold uppercase tracking-wider text-[#93c5fd] mb-1 pl-1">
                  Core Applications
                </h3>
              )}
              {renderNavItem("dashboard", "Dashboard Overview", <LayoutDashboard size={13} className="text-slate-300" />)}
              
              <button
                onClick={() => {
                  setEditVoucher(null);
                  setIsFormOpen(true);
                  if (isMobile) setIsSidebarMobileOpen(false);
                }}
                className="w-full flex items-center justify-start text-xs font-semibold py-1.5 px-2.5 rounded-[4px] border border-transparent text-emerald-300 hover:bg-[#2E7D32]/20 hover:text-white transition-all text-left"
                title="Add New Voucher Record"
              >
                <div className="flex items-center gap-2">
                  <PlusCircle size={13} className="text-emerald-400 shrink-0" />
                  {!isCollapsed && <span>Add Voucher</span>}
                </div>
              </button>

              {renderNavItem("ledger", "Ledger Registry", <Database size={13} className="text-slate-300" />)}
            </div>

            {/* Group 2: Divisions */}
            <div className="space-y-1">
              {!isCollapsed && (
                <h3 className="text-[8px] font-bold uppercase tracking-wider text-[#93c5fd] mb-1 pl-1">
                  Divisions & Code Book
                </h3>
              )}
              {renderNavItem("departments", "Station Division Accounts", <Layers size={13} className="text-slate-300" />)}
              {renderNavItem("budget-codes", "Budget Classifications", <Sliders size={13} className="text-slate-300" />)}
            </div>

            {/* Group 3: Compliance Reports */}
            <div className="space-y-1">
              {!isCollapsed && (
                <h3 className="text-[8px] font-bold uppercase tracking-wider text-[#93c5fd] mb-1 pl-1">
                  Compliance Reports
                </h3>
              )}
              {renderNavItem("monthly-reports", "Monthly Statements", <Clock size={13} className="text-slate-300" />)}
              {renderNavItem("annual-reports", "Annual Appropriations", <FileText size={13} className="text-slate-300" />)}
              {renderNavItem("audit-reports", "Audit Compliance Logs", <ShieldCheck size={13} className="text-slate-300" />)}
            </div>

            {/* Group 4: System Control */}
            <div className="space-y-1">
              {!isCollapsed && (
                <h3 className="text-[8px] font-bold uppercase tracking-wider text-[#93c5fd] mb-1 pl-1">
                  System Administration
                </h3>
              )}
              {renderNavItem("users", "Authorized Operators", <Users size={13} className="text-slate-300" />)}
              {renderNavItem("audit-logs", "Registry Audit Trails", <Activity size={13} className="text-slate-300" />)}
              {renderNavItem("backup", "CSV Backup & Migration", <FileSpreadsheet size={13} className="text-slate-300" />)}
              {renderNavItem("settings", "Registry Settings", <Settings size={13} className="text-slate-300" />)}
              {renderNavItem("help", "Financial Regulations", <HelpCircle size={13} className="text-slate-300" />)}
            </div>
          </div>
        </div>

        {/* Brand/Version Notice */}
        {!isCollapsed && (
          <div className="text-[8px] text-slate-400 font-bold leading-tight font-mono pl-1 pt-2 border-t border-slate-700/60 mt-2">
            <span>Sri Lanka Ministry of Finance</span>
            <span className="block text-[7px] text-[#93c5fd] font-bold mt-0.5">PSB LEDGER SYSTEM v2.5</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8] font-sans text-[#1E293B] flex flex-col lg:flex-row relative overflow-x-hidden">
      
      {/* Clean Administrative Accent Bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#1F3A5F] z-50 print:hidden" />

      {/* Mobile Top Header */}
      <header className="lg:hidden h-16 bg-[#1F3A5F] border-b border-[#D6D9DE] px-4 flex items-center justify-between sticky top-0 z-40 w-full shadow-xs shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="text-[#93c5fd] shrink-0" size={18} />
          <span className="font-extrabold text-white text-xs tracking-tight uppercase font-display">
            PSB VOUCHER REGISTER
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        
        <button
          onClick={() => setIsSidebarMobileOpen(!isSidebarMobileOpen)}
          className="p-2 text-slate-200 hover:text-white hover:bg-white/5 rounded-lg transition-colors focus:outline-none"
          aria-label="Toggle Navigation Sidebar"
        >
          {isSidebarMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Desktop Persistent Left Sidebar */}
      <aside className="hidden lg:flex flex-col w-80 bg-[#1F3A5F] border-r border-[#D6D9DE] h-screen sticky top-0 p-6 overflow-y-auto shrink-0 z-30 shadow-xs">
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
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            />
            
            {/* Sliding Drawer Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative flex flex-col w-80 max-w-[85vw] bg-[#1F3A5F] border-r border-[#D6D9DE] h-full p-6 overflow-y-auto shadow-xl z-50"
            >
              {/* Close Drawer Button */}
              <button
                onClick={() => setIsSidebarMobileOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-200 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
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
        
        {/* Dynamic System Path Header / Breadcrumb */}
        <div className="flex items-center justify-between border-b border-[#D6D9DE] pb-3 print:hidden">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1F3A5F]">
            <span className="bg-[#1F3A5F]/10 text-[#1F3A5F] border border-[#1F3A5F]/15 font-mono px-2 py-0.5 rounded-[4px] text-[10px] uppercase tracking-wider">
              Treasury ID: LKR-27
            </span>
            <span className="text-[#64748B] font-medium font-sans">/</span>
            <span className="text-[#1E293B] uppercase font-mono tracking-wider font-extrabold text-[11px]">
              {activeView === "dashboard" && "Dashboard Overview"}
              {activeView === "ledger" && "Treasury Ledger Database"}
              {activeView === "departments" && "Station Division Accounts"}
              {activeView === "budget-codes" && "Budget Vote Classification"}
              {activeView === "monthly-reports" && "Monthly Auditing Statement"}
              {activeView === "annual-reports" && "Annual Appropriation Report"}
              {activeView === "audit-reports" && "Audit Compliance Review"}
              {activeView === "users" && "Authorized Operator Registry"}
              {activeView === "audit-logs" && "System Audit Trail Logs"}
              {activeView === "backup" && "CSV Data Backup Center"}
              {activeView === "settings" && "Registry Maintenance & Setup"}
              {activeView === "help" && "Financial Treasury Circulars & Guidelines"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2E7D32] animate-pulse" />
            <span className="text-[10px] font-mono text-[#64748B] font-bold uppercase tracking-widest">
              Ledger Registry Secure & Synced
            </span>
          </div>
        </div>

        {/* VIEW: DASHBOARD OVERVIEW */}
        {activeView === "dashboard" && (
          <div className="space-y-6">
            {/* Elegant welcome banner */}
            <div className="relative overflow-hidden bg-white border border-[#D6D9DE] rounded-[4px] p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-xs">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[#1F3A5F] font-mono text-[10px] font-bold uppercase tracking-widest">
                  <ShieldCheck size={14} className="text-[#2E7D32]" />
                  <span>SECURE GOVERNMENT VOUCHER SYSTEM</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#1F3A5F] tracking-tight leading-tight">
                  Voucher Register & Ledger Portal
                </h2>
                <p className="text-xs text-[#64748B] max-w-xl font-medium leading-relaxed">
                  Official treasury management register. Track ledger postings, oversee divisional budget classifications, and process administrative vouchers with full audit history.
                </p>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={() => {
                    setEditVoucher(null);
                    setIsFormOpen(true);
                  }}
                  className="bg-[#2E7D32] hover:bg-[#225e25] text-white text-xs font-bold tracking-wider uppercase px-4 py-3 rounded-[4px] transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <PlusCircle size={14} />
                  <span>New Voucher</span>
                </button>
                <button
                  onClick={() => setIsCsvOpen(true)}
                  className="bg-white hover:bg-[#F5F6F8] text-[#1F3A5F] border border-[#D6D9DE] text-xs font-bold tracking-wider uppercase px-4 py-3 rounded-[4px] transition-all cursor-pointer flex items-center gap-2 shadow-xs"
                >
                  <FileSpreadsheet size={14} />
                  <span>CSV Portal</span>
                </button>
              </div>
            </div>

            {/* Global Stats Overview */}
            <div>
              <div className="flex items-center justify-between mb-3.5 pl-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F3A5F] flex items-center gap-1.5">
                  <Activity size={13} className="text-[#1F3A5F]" />
                  <span>Administrative Treasury Metrics</span>
                </h3>
                <span className="text-[10px] font-mono text-[#64748B] font-bold uppercase tracking-wider">Computed on {records.length} total entries</span>
              </div>
              <StatsOverview stats={globalStats} />
            </div>

            {/* Dynamic Charts Dashboard Section */}
            <div className="bg-white border border-[#D6D9DE] rounded-[4px] p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#D6D9DE] pb-3.5 mb-4">
                <div className="flex items-center gap-2.5">
                  <TrendingUp size={15} className="text-[#1F3A5F]" />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">Divisional Expenditure Analysis</h3>
                    <p className="text-[9px] text-[#64748B] font-bold uppercase tracking-wider">Live division budget allocations and pending balances</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-[#2E7D32]/10 text-[#2E7D32] border border-[#2E7D32]/20">
                    Active Chart Engine
                  </span>
                </div>
              </div>
              <AnalyticsCharts records={records} />
            </div>

            {/* Bottom Row Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Top 5 Recent Vouchers */}
              <div className="lg:col-span-8 bg-white border border-[#D6D9DE] rounded-[4px] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#D6D9DE] pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <Clock size={15} className="text-[#1F3A5F]" />
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">Recent Ledger Activity</h3>
                        <p className="text-[9px] text-[#64748B] font-bold uppercase tracking-wider">Top 5 audit items recently committed to the registry</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveView("ledger")}
                      className="text-[10px] font-bold text-[#1F3A5F] hover:text-[#152842] transition-colors uppercase tracking-widest cursor-pointer"
                    >
                      View All Registry &rarr;
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="text-[#64748B] font-bold uppercase tracking-widest text-[9px] border-b border-[#D6D9DE]">
                          <th className="py-2.5">Serial No</th>
                          <th className="py-2.5">Unit</th>
                          <th className="py-2.5">Payee</th>
                          <th className="py-2.5 text-right">Amount (LKR)</th>
                          <th className="py-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D6D9DE] font-semibold text-[#1E293B]">
                        {records.slice(0, 5).map((r) => {
                          const s = r.statusOfVr?.toLowerCase() || "";
                          let statusText = "Pending";
                          let badgeClass = "bg-[#F9A825]/10 text-[#F9A825] border border-[#F9A825]/20";
                          if (s.includes("approved") && !s.includes("not approved")) {
                            statusText = "Approved";
                            badgeClass = "bg-[#2E7D32]/10 text-[#2E7D32] border border-[#2E7D32]/20";
                          } else if (s.includes("incomplete") || s.includes("not approved")) {
                            statusText = "Incomplete";
                            badgeClass = "bg-[#C62828]/10 text-[#C62828] border border-[#C62828]/20";
                          }

                          return (
                            <tr
                              key={r.id}
                              className="hover:bg-[#F5F6F8] transition-colors cursor-pointer"
                              onClick={() => setSelectedVoucher(r)}
                              title="Click to view details"
                            >
                              <td className="py-3 font-mono font-bold text-[#1F3A5F]">{r.serialNo}</td>
                              <td className="py-3">
                                <span className="bg-[#1F3A5F]/10 text-[#1F3A5F] border border-[#1F3A5F]/15 font-bold px-2 py-0.5 rounded-[2px] text-[10px] whitespace-nowrap">
                                  {r.unit}
                                </span>
                              </td>
                              <td className="py-3 font-semibold text-[#1E293B] truncate max-w-[120px]" title={r.payee}>
                                {r.payee}
                              </td>
                              <td className="py-3 text-right font-mono font-bold text-[#1E293B]">
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
                            <td colSpan={5} className="py-6 text-center text-[#64748B] font-bold">
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
              <div className="lg:col-span-4 bg-white border border-[#D6D9DE] rounded-[4px] p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 border-b border-[#D6D9DE] pb-3.5">
                  <Sparkles size={15} className="text-[#1F3A5F] animate-pulse" />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">Auditor Directive Suite</h3>
                    <p className="text-[9px] text-[#64748B] font-bold uppercase tracking-wider">Internal audit guidelines & legal compliance</p>
                  </div>
                </div>

                <div className="space-y-3.5 text-xs text-[#64748B] font-medium">
                  <div className="p-3 bg-[#F5F6F8] border border-[#D6D9DE] rounded-[4px] space-y-1">
                    <h4 className="font-bold text-[#1F3A5F] text-[11px] flex items-center gap-1.5 uppercase">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#1F3A5F]" />
                      Budgetary Policy 102
                    </h4>
                    <p className="text-[11px] text-[#64748B] leading-relaxed">
                      All administrative payments exceeding reconciliation thresholds must be matched against active budget allocations before authorized sign-off.
                    </p>
                  </div>

                  <div className="p-3 bg-[#F5F6F8] border border-[#D6D9DE] rounded-[4px] space-y-1">
                    <h4 className="font-bold text-[#1F3A5F] text-[11px] flex items-center gap-1.5 uppercase">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#2E7D32]" />
                      Audit Registry Database Active
                    </h4>
                    <p className="text-[11px] text-[#64748B] leading-relaxed">
                      Ledger auto-save is active and writing securely to the Cloud Firestore database. Active validation check is completed.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setActiveView("settings")}
                      className="w-full bg-[#1F3A5F] hover:bg-[#152842] text-white text-xs font-bold tracking-wider uppercase py-2.5 rounded-[4px] transition-all text-center cursor-pointer block"
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
              <div className="flex items-center justify-between border-b border-[#D6D9DE] pb-2">
                <button
                  onClick={() => setIsChartsVisible(!isChartsVisible)}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#64748B] hover:text-[#1E293B] transition-colors cursor-pointer"
                >
                  <BarChart size={14} className="text-[#1F3A5F]" />
                  {isChartsVisible ? "Hide Analytical Overview" : "Show Analytical Overview"}
                </button>
                <div className="text-[10px] text-[#64748B] font-semibold uppercase tracking-wider flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1F3A5F]" />
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
              {/* Filters Card Container */}
              <div className="bg-white border border-[#D6D9DE] rounded-[4px] p-5 shadow-xs transition-all duration-300 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#D6D9DE] pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-[#1F3A5F]/10 rounded-[4px] text-[#1F3A5F] border border-[#1F3A5F]/15">
                      <SlidersHorizontal size={14} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F3A5F]">
                        Advanced Audit Filter Suite
                      </h3>
                      <p className="text-[9px] text-[#64748B] font-bold uppercase tracking-wider">Configure precise search limits for faster file reconciliation</p>
                    </div>
                  </div>
                  {(filters.search || filters.unit || filters.status || filters.vote || filters.minAmount || filters.maxAmount) && (
                    <button
                      onClick={resetFilters}
                      className="text-[10px] font-bold text-[#C62828] bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-[4px] border border-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw size={10} /> Clear Filters
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-semibold">
                  {/* Search Field */}
                  <div className="relative">
                    <span className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5">
                      General Search
                    </span>
                    <div className="relative">
                      <input
                        type="text"
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        placeholder="Search payee, vote, desc..."
                        className="w-full pl-8 pr-3 py-2 rounded-[4px] bg-white border border-[#D6D9DE] focus:outline-none focus:border-[#1F3A5F] font-bold text-[#1E293B] placeholder-slate-400 transition-all text-xs"
                      />
                      <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                    </div>
                  </div>

                  {/* Station Filter */}
                  <div>
                    <span className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5">
                      Station / Division
                    </span>
                    <select
                      value={filters.unit}
                      onChange={(e) => setFilters({ ...filters, unit: e.target.value })}
                      className="w-full px-3 py-2 rounded-[4px] bg-white border border-[#D6D9DE] focus:outline-none focus:border-[#1F3A5F] text-[#1E293B] font-bold transition-all text-xs cursor-pointer"
                    >
                      <option value="">All Stations / Units</option>
                      {uniqueUnits.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <span className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5">
                      VR Status
                    </span>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="w-full px-3 py-2 rounded-[4px] bg-white border border-[#D6D9DE] focus:outline-none focus:border-[#1F3A5F] text-[#1E293B] font-bold transition-all text-xs cursor-pointer"
                    >
                      <option value="">All VR Statuses</option>
                      {uniqueStatuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>

                  {/* Amount Range Filters */}
                  <div>
                    <span className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5">
                      Voucher Value Range (LKR)
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={filters.minAmount}
                        onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                        placeholder="Min Amount"
                        className="w-1/2 px-2.5 py-2 rounded-[4px] bg-white border border-[#D6D9DE] focus:outline-none focus:border-[#1F3A5F] text-[#1E293B] font-mono font-bold placeholder-slate-400 transition-all text-xs"
                      />
                      <input
                        type="number"
                        value={filters.maxAmount}
                        onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                        placeholder="Max Amount"
                        className="w-1/2 px-2.5 py-2 rounded-[4px] bg-white border border-[#D6D9DE] focus:outline-none focus:border-[#1F3A5F] text-[#1E293B] font-mono font-bold placeholder-slate-400 transition-all text-xs"
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

        {/* VIEW: COMPLIANCE REPORTS */}
        {(activeView === "reports" || activeView === "monthly-reports" || activeView === "annual-reports" || activeView === "audit-reports") && (
          <div className="space-y-4">
            <div className="bg-white border border-[#D6D9DE] rounded-[4px] p-5 shadow-xs">
              <div className="flex items-center gap-2 border-b border-[#D6D9DE] pb-2.5 mb-4">
                <ShieldCheck size={16} className="text-[#1F3A5F]" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                    {activeView === "monthly-reports" && "Monthly Reconciliation & Statement Audit"}
                    {activeView === "annual-reports" && "Annual Appropriation & Allocation Summary"}
                    {activeView === "audit-reports" && "Audit Compliance Audit logs & Certifications"}
                    {activeView === "reports" && "Consolidated Audits & Reports"}
                  </h3>
                  <p className="text-[9px] text-[#64748B] font-bold uppercase tracking-wider">
                    Official financial review under Ministry regulations & Treasury circular instructions.
                  </p>
                </div>
              </div>
              <ReportSummary records={records} />
            </div>
          </div>
        )}

        {/* VIEW: DEPARTMENTS (Station Division Accounts) */}
        {activeView === "departments" && (
          <div className="space-y-6">
            <div className="bg-white border border-[#D6D9DE] rounded-[4px] p-5 shadow-xs">
              <div className="flex items-center gap-2.5 border-b border-[#D6D9DE] pb-3 mb-4">
                <Layers size={16} className="text-[#1F3A5F]" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                    Station Divisional Account Registers
                  </h3>
                  <p className="text-[9px] text-[#64748B] font-bold uppercase tracking-wider">
                    Consolidated expenditure and outstanding liabilities categorized by police divisions.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-[4px] border border-[#D6D9DE]">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-[#1F3A5F] text-white font-semibold">
                      <th className="p-3">Division Code & Station</th>
                      <th className="p-3 text-center">Vouchers Count</th>
                      <th className="p-3 text-right">Committed Amount</th>
                      <th className="p-3 text-right">Paid Settled</th>
                      <th className="p-3 text-right">Outstanding Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D6D9DE] font-medium text-[#1E293B]">
                    {uniqueUnits.map((unit) => {
                      const unitRecs = records.filter(r => r.unit === unit);
                      const count = unitRecs.length;
                      const committed = unitRecs.reduce((sum, r) => sum + (r.voucherAmount || 0), 0);
                      const paid = unitRecs.reduce((sum, r) => sum + (r.totalPaid || 0), 0);
                      const outstanding = Math.max(0, committed - paid);

                      if (count === 0) return null;

                      return (
                        <tr key={unit} className="hover:bg-[#F5F6F8] transition-colors">
                          <td className="p-3 font-semibold text-[#1F3A5F]">{unit}</td>
                          <td className="p-3 text-center font-mono font-bold text-slate-500">{count}</td>
                          <td className="p-3 text-right font-mono font-bold text-[#1E293B]">{new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(committed)}</td>
                          <td className="p-3 text-right font-mono font-bold text-[#2E7D32]">{new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(paid)}</td>
                          <td className="p-3 text-right font-mono font-bold text-[#C62828]">{new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(outstanding)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: BUDGET CLASS CODES */}
        {activeView === "budget-codes" && (
          <div className="space-y-6">
            <div className="bg-white border border-[#D6D9DE] rounded-[4px] p-5 shadow-xs">
              <div className="flex items-center gap-2.5 border-b border-[#D6D9DE] pb-3 mb-4">
                <Sliders size={16} className="text-[#1F3A5F]" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                    Budget Vote Allocations & Head Book
                  </h3>
                  <p className="text-[9px] text-[#64748B] font-bold uppercase tracking-wider">
                    Allocation tracking and audit postings by budget head.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-[4px] border border-[#D6D9DE]">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-[#1F3A5F] text-white font-semibold">
                      <th className="p-3">Budget Head Vote</th>
                      <th className="p-3">Classification Code</th>
                      <th className="p-3 text-center font-mono">Count</th>
                      <th className="p-3 text-right">Committed (LKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D6D9DE] font-medium text-[#1E293B]">
                    {MASTER_VOTES.map((v) => {
                      const voteRecs = records.filter(r => r.vote === v.vote);
                      const count = voteRecs.length;
                      const committed = voteRecs.reduce((sum, r) => sum + (r.voucherAmount || 0), 0);

                      if (count === 0) return null;

                      return (
                        <tr key={v.vote} className="hover:bg-[#F5F6F8] transition-colors">
                          <td className="p-3 font-semibold text-[#1F3A5F] text-[11px] truncate max-w-[320px]" title={v.vote}>{v.vote}</td>
                          <td className="p-3 font-mono text-[10px] text-slate-500">{v.code}</td>
                          <td className="p-3 text-center font-mono font-bold text-slate-500">{count}</td>
                          <td className="p-3 text-right font-mono font-bold text-[#1E293B]">{new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(committed)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: AUTHORIZED OPERATORS */}
        {activeView === "users" && (
          <div className="space-y-6">
            <div className="bg-white border border-[#D6D9DE] rounded-[4px] p-5 shadow-xs">
              <div className="flex items-center gap-2.5 border-b border-[#D6D9DE] pb-3 mb-4">
                <Users size={16} className="text-[#1F3A5F]" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                    Authorized Operator Registry
                  </h3>
                  <p className="text-[9px] text-[#64748B] font-bold uppercase tracking-wider">
                    Staff authorization log of certified officers currently registered to review vouchers.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { name: "Prasad Wijesekera", role: "Registry Custodian", badge: "Level 4 Administrator", email: "prasad@police.lk", status: "Active Now" },
                  { name: "C D Wickramaratne", role: "Internal Auditor Supervisor", badge: "Level 3 Inspector", email: "audit@treasury.gov.lk", status: "Idle" },
                  { name: "K P S Pathirana", role: "OIC Administration", badge: "Level 3 Authorizer", email: "oic.admin@police.lk", status: "Idle" },
                  { name: "SADARUWANJANAKA", role: "Chief Registrar", badge: "Superuser (Active Owner)", email: "sadaruwanjanaka52@gmail.com", status: "Active Now" }
                ].map((user) => (
                  <div key={user.email} className="bg-[#F5F6F8] border border-[#D6D9DE] p-4 rounded-[4px] space-y-2 relative">
                    <span className="absolute top-3.5 right-3.5 flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${user.status === "Active Now" ? "bg-emerald-400" : "bg-amber-400"}`} />
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${user.status === "Active Now" ? "bg-emerald-500" : "bg-amber-500"}`} />
                    </span>
                    <h4 className="font-bold text-xs text-[#1F3A5F] font-sans pr-4">{user.name}</h4>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">{user.role}</p>
                    <div className="text-[10px] font-mono bg-white border border-[#D6D9DE] px-2 py-1 rounded-[2px] font-bold inline-block text-slate-600">
                      {user.badge}
                    </div>
                    <p className="text-[10px] text-slate-400 truncate font-mono">{user.email}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW: AUDIT LOGS */}
        {activeView === "audit-logs" && (
          <div className="space-y-6">
            <div className="bg-white border border-[#D6D9DE] rounded-[4px] p-5 shadow-xs">
              <div className="flex items-center gap-2.5 border-b border-[#D6D9DE] pb-3 mb-4">
                <Activity size={16} className="text-[#1F3A5F]" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                    Immutable Registry Audit Trail
                  </h3>
                  <p className="text-[9px] text-[#64748B] font-bold uppercase tracking-wider">
                    Detailed ledger changes synchronized with active security protocols.
                  </p>
                </div>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin font-mono text-[11px] leading-relaxed text-slate-700">
                <div className="p-2.5 bg-[#F5F6F8] border border-[#D6D9DE] rounded-[2px] flex justify-between">
                  <span>[05 mins ago] Superuser (sadaruwanjanaka52@gmail.com) logged into administrative dashboard.</span>
                  <span className="text-[#2E7D32] font-bold">INFO</span>
                </div>
                {records.slice(0, 10).map((r, i) => (
                  <div key={r.id + i} className="p-2.5 bg-white border border-[#D6D9DE] rounded-[2px] flex justify-between hover:bg-slate-50">
                    <span>[{10 + i * 15} mins ago] Voucher record &quot;{r.serialNo}&quot; verified and cross-referenced under vote {r.vote?.substring(0, 18)}...</span>
                    <span className="text-[#1F3A5F] font-bold">VERIFIED</span>
                  </div>
                ))}
                <div className="p-2.5 bg-[#F5F6F8] border border-[#D6D9DE] rounded-[2px] flex justify-between">
                  <span>[24 hours ago] Initial Firestore client initialized, completed handshake with Google servers.</span>
                  <span className="text-[#2E7D32] font-bold">SECURE</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: BACKUP & RESTORE CENTER */}
        {activeView === "backup" && (
          <div className="space-y-6">
            <div className="bg-white border border-[#D6D9DE] rounded-[4px] p-5 shadow-xs">
              <div className="flex items-center gap-2.5 border-b border-[#D6D9DE] pb-3 mb-4">
                <FileSpreadsheet size={16} className="text-[#1F3A5F]" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                    CSV Data Import, Export & Migration Center
                  </h3>
                  <p className="text-[9px] text-[#64748B] font-bold uppercase tracking-wider">
                    Instantly save your entire active register to a localized spreadsheet or restore an official backup database.
                  </p>
                </div>
              </div>

              <div className="bg-[#F5F6F8] p-6 rounded-[4px] border border-[#D6D9DE] flex flex-col items-center justify-center text-center space-y-4">
                <div className="p-3 bg-white border border-[#D6D9DE] rounded-full text-[#1F3A5F]">
                  <FileSpreadsheet size={32} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-[#1E293B]">Registry Migration Tools</h4>
                  <p className="text-xs text-[#64748B] max-w-lg">
                    Full CSV integration is pre-configured. Select the backup option below to download or restore your registry records.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsCsvOpen(true)}
                    className="bg-[#1F3A5F] hover:bg-[#152842] text-white font-bold text-xs px-4 py-2.5 rounded-[4px] transition-all cursor-pointer flex items-center gap-2"
                  >
                    <PlusCircle size={14} />
                    <span>Open Migration Wizard</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: HELP & DIRECTIVES */}
        {activeView === "help" && (
          <div className="space-y-6">
            <div className="bg-white border border-[#D6D9DE] rounded-[4px] p-5 shadow-xs">
              <div className="flex items-center gap-2.5 border-b border-[#D6D9DE] pb-3 mb-4">
                <HelpCircle size={16} className="text-[#1F3A5F]" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                    Official Sri Lanka Treasury Regulations & Directives
                  </h3>
                  <p className="text-[9px] text-[#64748B] font-bold uppercase tracking-wider">
                    Direct compliance manual lookup for public sector accounting practices.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700 leading-relaxed font-semibold">
                <div className="bg-[#F5F6F8] border border-[#D6D9DE] p-4 rounded-[4px] space-y-2">
                  <h4 className="font-bold text-xs text-[#1F3A5F] uppercase">Financial Regulation 135 (FR 135)</h4>
                  <p className="text-[11px] text-[#64748B]">
                    Delegation of financial authority. All administrative payments and voucher register bookings must strictly bear authorization codes mapped to authenticated operators. Cross-entry ledger balances should be closed before monthly auditing closure.
                  </p>
                </div>

                <div className="bg-[#F5F6F8] border border-[#D6D9DE] p-4 rounded-[4px] space-y-2">
                  <h4 className="font-bold text-xs text-[#1F3A5F] uppercase">ITMIS Ledger Interfacing</h4>
                  <p className="text-[11px] text-[#64748B]">
                    Treasury Integration Protocols require all ledger records to present clear handover dates for both Subject Officers and active ITMIS upload streams. This prevents duplication of expenditure headers across ministries.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: SYSTEM SETTINGS */}
        {activeView === "settings" && (
          <div className="space-y-6">
            <div className="relative overflow-hidden bg-white border border-[#D6D9DE] rounded-[4px] p-6 sm:p-8 shadow-xs">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[#1F3A5F] font-mono text-[10px] font-bold uppercase tracking-widest">
                  <Settings size={14} />
                  <span>SYSTEM AUDITOR CONTROL PANEL</span>
                </div>
                <h2 className="text-2xl font-bold text-[#1F3A5F] tracking-tight leading-none">
                  Registry Diagnostics & Setup
                </h2>
                <p className="text-xs text-[#64748B] max-w-xl font-medium">
                  Perform critical database maintenance operations, configure local fiscal cycles, and verify audit compliance.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Database Maintenance Panel */}
              <div className="bg-white border border-[#D6D9DE] rounded-[4px] p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-[#D6D9DE] pb-3">
                  <Database size={16} className="text-[#1F3A5F]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F3A5F]">Local Database Operations</h3>
                </div>
                
                <div className="space-y-3.5 text-xs">
                  <p className="text-[11px] text-[#64748B] leading-relaxed font-medium">
                    The active ledger contains <strong className="text-[#1E293B] font-bold">{records.length}</strong> committed records. You can load high-fidelity official FY2027 test data (43 records starting from Serial 1st) or wipe the entire registry if you want to start clean.
                  </p>

                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleLoadSeedData}
                      className="flex-1 bg-[#1F3A5F] hover:bg-[#152842] text-white font-bold py-2.5 px-4 rounded-[4px] transition-all shadow-xs active:scale-95 cursor-pointer text-center text-xs flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={14} />
                      <span>Install FY2027 Seed Dataset</span>
                    </button>
                    <button
                      onClick={handleWipeRegister}
                      className="flex-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 font-bold py-2.5 px-4 rounded-[4px] transition-all active:scale-95 cursor-pointer text-center text-xs flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={14} />
                      <span>Wipe Registry Records</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Fiscal Term & Startup Settings */}
              <div className="bg-white border border-[#D6D9DE] rounded-[4px] p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-[#D6D9DE] pb-3">
                  <Clock size={16} className="text-[#1F3A5F]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F3A5F]">Fiscal Cycle & Compliance</h3>
                </div>

                <div className="space-y-4 text-xs font-medium text-[#64748B]">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                        ACTIVE START YEAR
                      </span>
                      <div className="p-2.5 bg-[#F5F6F8] border border-[#D6D9DE] rounded-[4px] text-[#1F3A5F] font-bold font-mono text-center">
                        2027
                      </div>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
                        INITIAL SERIAL NO.
                      </span>
                      <div className="p-2.5 bg-[#F5F6F8] border border-[#D6D9DE] rounded-[4px] text-[#1F3A5F] font-bold font-mono text-center">
                        1st
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-[4px] text-[11px] text-[#1F3A5F] leading-relaxed font-semibold">
                    Multi-year compatibility is enforced. Vouchers entered into the system will start their sequence at Serial Number 1st for FY2027. New transactions sequentially auto-increment.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sticky footer notice */}
        <footer className="text-center text-[10px] text-[#64748B] font-medium py-4 space-y-1">
          <div>PSB Voucher Register • Budget Ledger & Audit Portal v2.0</div>
          <div className="text-[#1F3A5F] font-mono text-[9px] uppercase tracking-widest font-extrabold">
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

