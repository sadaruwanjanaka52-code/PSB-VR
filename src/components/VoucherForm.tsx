import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { 
  X, 
  Save, 
  FileEdit, 
  Coins, 
  Cpu, 
  Check,
  Building,
  Tag,
  ChevronDown
} from "lucide-react";
import { VoucherRecord } from "../types";
import { MASTER_UNITS, MASTER_VOTES, VoteItem } from "../masterData";

interface SearchableSelectProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options?: string[];
  voteOptions?: VoteItem[];
  placeholder: string;
  id: string;
}

function SearchableSelect({ label, value, onChange, options, voteOptions, placeholder, id }: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync typed search term with parent value when dropdown is closed
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm(value);
    }
  }, [value, isOpen]);

  // Click outside detection
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter options
  const filteredOptions = options 
    ? options.filter(opt => opt.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  const filteredVotes = voteOptions
    ? voteOptions.filter(item => {
        const query = searchTerm.toLowerCase();
        return item.vote.toLowerCase().includes(query) || item.code.toLowerCase().includes(query);
      })
    : [];

  const handleSelectOption = (val: string) => {
    onChange(val);
    setSearchTerm(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full" id={`searchable-select-container-${id}`}>
      <label className="block text-[#1E293B] font-bold text-xs mb-1">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            onChange(e.target.value); // also update parent on keystroke for direct custom entries
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-3.5 pr-10 py-2 bg-white rounded-[4px] border border-[#D6D9DE] focus:outline-none focus:border-[#1F3A5F] text-[#1E293B] font-semibold placeholder-slate-400 text-xs transition-all"
          id={`searchable-select-input-${id}`}
        />
        <div className="absolute right-3 top-2.5 flex items-center gap-1 text-[#64748B]">
          <ChevronDown size={15} className={`transition-transform duration-300 ${isOpen ? "rotate-180 text-[#1F3A5F]" : ""}`} />
        </div>
      </div>

      {isOpen && (
        <div 
          id={`searchable-select-dropdown-${id}`}
          className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-[#D6D9DE] rounded-[4px] shadow-md p-1.5 divide-y divide-[#D6D9DE] scrollbar-thin scrollbar-thumb-slate-200"
        >
          {options && (
            <div className="py-1">
              {filteredOptions.length === 0 ? (
                <div className="p-3 text-center text-[#64748B] text-[10px] font-bold uppercase tracking-wide italic">
                  No matching units found. Keep typing to use custom.
                </div>
              ) : (
                filteredOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelectOption(opt)}
                    className="w-full text-left py-2 px-3 hover:bg-[#1F3A5F]/10 hover:text-[#1F3A5F] rounded-[4px] cursor-pointer transition-colors font-bold text-[#1E293B] text-xs flex items-center justify-between"
                  >
                    <span>{opt}</span>
                    {value === opt && <Check size={14} className="text-[#1F3A5F] shrink-0" />}
                  </button>
                ))
              )}
            </div>
          )}

          {voteOptions && (
            <div className="py-1">
              {filteredVotes.length === 0 ? (
                <div className="p-3 text-center text-[#64748B] text-[10px] font-bold uppercase tracking-wide italic">
                  No matching budget votes found. Keep typing to use custom.
                </div>
              ) : (
                filteredVotes.map((item) => (
                  <button
                    key={item.vote}
                    type="button"
                    onClick={() => handleSelectOption(item.vote)}
                    className="w-full text-left py-2 px-3 hover:bg-[#1F3A5F]/10 hover:text-[#1F3A5F] rounded-[4px] cursor-pointer transition-colors text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 border-b border-[#D6D9DE] last:border-b-0"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-bold text-[#1E293B] truncate">{item.vote}</p>
                    </div>
                    {item.code && item.code !== "-" && (
                      <span className="shrink-0 self-start sm:self-center bg-[#1F3A5F]/10 border border-[#1F3A5F]/20 text-[#1F3A5F] text-[9px] font-mono px-2 py-0.5 rounded-[4px] font-bold uppercase tracking-wider shadow-inner">
                        {item.code}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface VoucherFormProps {
  voucher: VoucherRecord | null; // Null means Add mode, otherwise Edit mode
  onSave: (record: VoucherRecord) => void;
  onCancel: () => void;
  existingUnits: string[];
  existingVotes: string[];
  existingSerials?: string[];
}

const PAYEE_PRESETS = [
  {
    payee: "SRI LANKA DIALOG",
    description: "VPN BILL 10/24 TO 10/31",
    vote: "225-1-1-0-1402-Postal and Telecommunication",
    unit: "U26 - KANKASANTHUREI",
    amount: "3100"
  },
  {
    payee: "ELECTRICITY BOARD",
    description: "ELECTRICITY BILL 10/09 TO 11/06",
    vote: "225-1-1-0-1403-Electricity & Water",
    unit: "U26 - KANKASANTHUREI",
    amount: "15241"
  },
  {
    payee: "OIC PSB",
    description: "PETTY CASH",
    vote: "225-1-1-0-1205-Other (Miscellaneous)",
    unit: "U22 - KEBITIGOLLEWA",
    amount: "4000"
  },
  {
    payee: "S R RUTHIRALINGAM",
    description: "RENT 25 NOV",
    vote: "225-1-1-0-1404-Rental and Local Taxes",
    unit: "U26 - KANKASANTHUREI",
    amount: "15000"
  },
  {
    payee: "NANDA HOTEL",
    description: "NEWSPEPAR BILL 25 NOV",
    vote: "225-1-1-0-1205-Other (Miscellaneous)",
    unit: "U22 - KEBITIGOLLEWA",
    amount: "2280"
  },
  {
    payee: "CHAMINDA MOTORS",
    description: "SERVICE BBD 6445",
    vote: "225-1-1-0-1301-Maintenance Vehicles",
    unit: "U48 - RATHNAPURA",
    amount: "5390"
  },
  {
    payee: "AVIGNAA MOTORS",
    description: "SERVICE ABV 2214",
    vote: "225-1-1-0-1301-Maintenance Vehicles",
    unit: "U26 - KANKASANTHUREI",
    amount: "9500"
  },
  {
    payee: "MANA MOTORS",
    description: "SERVICE UZ 0034",
    vote: "225-1-1-0-1301-Maintenance Vehicles",
    unit: "U22 - KEBITIGOLLEWA",
    amount: "5400"
  }
];

export default function VoucherForm({ voucher, onSave, onCancel, existingUnits, existingVotes, existingSerials = [] }: VoucherFormProps) {
  const [activeTab, setActiveTab] = useState<"general" | "finance" | "settlement">("general");

  // Merge official MASTER data with any existing values from the active records
  const mergedUnits = Array.from(new Set([...MASTER_UNITS, ...existingUnits])).filter(Boolean).sort();

  const mergedVotesMap = new Map<string, string>();
  MASTER_VOTES.forEach(v => mergedVotesMap.set(v.vote, v.code));
  existingVotes.forEach(v => {
    if (v && !mergedVotesMap.has(v)) {
      mergedVotesMap.set(v, "-");
    }
  });
  const mergedVotes: VoteItem[] = Array.from(mergedVotesMap.entries()).map(([vote, code]) => ({ vote, code }));

  // Auto-calculation helper for next serial number
  const getNextSerialNo = (serials: string[] = []): string => {
    let maxNum = 0;
    serials.forEach((s) => {
      if (s && s.includes("/")) {
        const parts = s.split("/");
        if (parts.length > 1) {
          const num = parseInt(parts[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    });
    const nextNum = maxNum + 1;
    const seqNum = String(nextNum).padStart(5, "0");
    return `27/${seqNum}`;
  };

  // State fields mirroring the 26 CSV columns
  const [serialNo, setSerialNo] = useState("");
  const [date, setDate] = useState("");
  const [unitVrNo, setUnitVrNo] = useState("");
  const [payee, setPayee] = useState("");
  const [description, setDescription] = useState("");
  const [vote, setVote] = useState("");
  const [unit, setUnit] = useState("");
  
  const [voucherAmount, setVoucherAmount] = useState<string>("0");
  const [totalScheduleValue, setTotalScheduleValue] = useState<string>("0");
  const [chequeValue, setChequeValue] = useState<string>("0");
  const [crossEntry, setCrossEntry] = useState<string>("0");
  const [totalPaid, setTotalPaid] = useState<string>("0");

  const [handOverDateToSubject, setHandOverDateToSubject] = useState("");
  const [statusOfVr, setStatusOfVr] = useState("Pending");
  const [handOverDateToItmis, setHandOverDateToItmis] = useState("");
  const [itmisEvNo, setItmisEvNo] = useState("");
  const [statusOfPmt, setStatusOfPmt] = useState("-");
  const [paidDate, setPaidDate] = useState("-");
  const [scheduleNo, setScheduleNo] = useState("-");
  const [chequeNo, setChequeNo] = useState("-");
  const [handoverTo, setHandoverTo] = useState("");
  const [handOverDate, setHandOverDate] = useState("");
  const [paidVrStatus, setPaidVrStatus] = useState("");
  const [receivedDate, setReceivedDate] = useState("");
  const [notes, setNotes] = useState("");

  const handlePayeeChange = (val: string) => {
    setPayee(val);
    if (!voucher) { // only auto-populate for new vouchers
      const upper = val.toUpperCase().trim();
      const match = PAYEE_PRESETS.find(p => p.payee.includes(upper) || upper.includes(p.payee));
      if (match) {
        if (!description) setDescription(match.description);
        if (!vote) setVote(match.vote);
        if (!unit) setUnit(match.unit);
        if (voucherAmount === "0" || !voucherAmount) {
          setVoucherAmount(match.amount);
          setTotalScheduleValue(match.amount);
          setChequeValue(match.amount);
          setTotalPaid(match.amount);
        }
      }
    }
  };

  const handleAutoGenerateRemaining = () => {
    const today = new Date();
    const formatDate = (d: Date) => {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    };
    const formatIsoDate = (d: Date) => {
      const yy = String(d.getFullYear()).slice(-2);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yy}-${mm}-${dd}`;
    };

    const currentFormattedDate = formatDate(today);
    const isoFormattedDate = formatIsoDate(today);

    // 1. General Info
    if (!serialNo) {
      const nextS = getNextSerialNo(existingSerials);
      setSerialNo(nextS);
    }
    if (!date) {
      setDate(currentFormattedDate);
    }
    
    if (!payee) {
      // Pick a random payee preset
      const randomPreset = PAYEE_PRESETS[Math.floor(Math.random() * PAYEE_PRESETS.length)];
      setPayee(randomPreset.payee);
      setDescription(randomPreset.description);
      setVote(randomPreset.vote);
      setUnit(randomPreset.unit);
      setVoucherAmount(randomPreset.amount);
      setTotalScheduleValue(randomPreset.amount);
      setChequeValue(randomPreset.amount);
      setTotalPaid(randomPreset.amount);
    }
    if (!unitVrNo || unitVrNo === "-") {
      setUnitVrNo(`${Math.floor(100 + Math.random() * 100)}/27`);
    }
    if (!receivedDate || receivedDate === "-") {
      setReceivedDate(isoFormattedDate);
    }

    // 2. Finance
    const amt = parseFloat(voucherAmount) || 12500;
    if (voucherAmount === "0" || !voucherAmount) {
      setVoucherAmount(amt.toString());
    }
    if (totalScheduleValue === "0" || !totalScheduleValue) {
      setTotalScheduleValue(amt.toString());
    }
    if (chequeValue === "0" || !chequeValue) {
      setChequeValue(amt.toString());
    }
    if (totalPaid === "0" || !totalPaid) {
      setTotalPaid(amt.toString());
    }

    // 3. ITMIS & Settlements
    if (!handOverDateToSubject || handOverDateToSubject === "-") {
      setHandOverDateToSubject(isoFormattedDate);
    }
    if (statusOfVr === "Pending") {
      setStatusOfVr("Approved");
    }
    if (!handOverDateToItmis || handOverDateToItmis === "-") {
      setHandOverDateToItmis(isoFormattedDate);
    }
    if (!itmisEvNo || itmisEvNo === "-") {
      setItmisEvNo(`EV-${Math.floor(200000 + Math.random() * 800000)}`);
    }
    if (!statusOfPmt || statusOfPmt === "-") {
      setStatusOfPmt("Setted");
    }
    if (!paidDate || paidDate === "-") {
      setPaidDate(isoFormattedDate);
    }
    if (!scheduleNo || scheduleNo === "-") {
      setScheduleNo(`SCH-${Math.floor(1000 + Math.random() * 9000)}`);
    }
    if (!chequeNo || chequeNo === "-") {
      setChequeNo(`CHQ-${Math.floor(500000 + Math.random() * 499999)}`);
    }
    if (!handoverTo || handoverTo === "-") {
      setHandoverTo("OIC Administration");
    }
    if (!handOverDate || handOverDate === "-") {
      setHandOverDate(isoFormattedDate);
    }
    if (!paidVrStatus || paidVrStatus === "-") {
      setPaidVrStatus("Settled");
    }
    if (!notes) {
      setNotes("Auto-generated and synchronized via ITMIS Auditor portal.");
    }
  };

  // Populate state on load/edit
  useEffect(() => {
    if (voucher) {
      setSerialNo(voucher.serialNo || "");
      setDate(voucher.date || "");
      setUnitVrNo(voucher.unitVrNo || "");
      setPayee(voucher.payee || "");
      setDescription(voucher.description || "");
      setVote(voucher.vote || "");
      setUnit(voucher.unit || "");
      
      setVoucherAmount(voucher.voucherAmount.toString());
      setTotalScheduleValue(voucher.totalScheduleValue.toString());
      setChequeValue(voucher.chequeValue.toString());
      setCrossEntry(voucher.crossEntry.toString());
      setTotalPaid(voucher.totalPaid.toString());

      setHandOverDateToSubject(voucher.handOverDateToSubject || "");
      setStatusOfVr(voucher.statusOfVr || "Pending");
      setHandOverDateToItmis(voucher.handOverDateToItmis || "");
      setItmisEvNo(voucher.itmisEvNo || "");
      setStatusOfPmt(voucher.statusOfPmt || "-");
      setPaidDate(voucher.paidDate || "-");
      setScheduleNo(voucher.scheduleNo || "-");
      setChequeNo(voucher.chequeNo || "-");
      setHandoverTo(voucher.handoverTo || "");
      setHandOverDate(voucher.handOverDate || "");
      setPaidVrStatus(voucher.paidVrStatus || "");
      setReceivedDate(voucher.receivedDate || "");
      setNotes(voucher.notes || "");
    } else {
      // Set defaults for new voucher with smart incremental serial
      const nextS = getNextSerialNo(existingSerials);
      setSerialNo(nextS);
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();
      setDate(`${dd}/${mm}/${yyyy}`);
      setUnitVrNo("");
      setPayee("");
      setDescription("");
      setVote("");
      setUnit("");
      setVoucherAmount("0");
      setTotalScheduleValue("0");
      setChequeValue("0");
      setCrossEntry("0");
      setTotalPaid("0");
      setHandOverDateToSubject("");
      setStatusOfVr("Pending");
      setHandOverDateToItmis("");
      setItmisEvNo("");
      setStatusOfPmt("-");
      setPaidDate("-");
      setScheduleNo("-");
      setChequeNo("-");
      setHandoverTo("");
      setHandOverDate("");
      setPaidVrStatus("");
      setReceivedDate("");
      setNotes("");
    }
  }, [voucher]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!serialNo || !payee) {
      alert("Please fill in required fields: Serial No. and Payee designation.");
      return;
    }

    const savedRecord: VoucherRecord = {
      id: voucher ? voucher.id : `vr-${Date.now()}`,
      serialNo,
      date,
      unitVrNo: unitVrNo || "-",
      payee,
      description: description || "-",
      vote: vote || "-",
      unit: unit || "-",
      voucherAmount: parseFloat(voucherAmount) || 0,
      handOverDateToSubject: handOverDateToSubject || "-",
      statusOfVr,
      voucherAmountSec: parseFloat(voucherAmount) || 0,
      totalScheduleValue: parseFloat(totalScheduleValue) || 0,
      chequeValue: parseFloat(chequeValue) || 0,
      crossEntry: parseFloat(crossEntry) || 0,
      totalPaid: parseFloat(totalPaid) || 0,
      handOverDateToItmis: handOverDateToItmis || "-",
      itmisEvNo: itmisEvNo || "-",
      statusOfPmt: statusOfPmt || "-",
      paidDate: paidDate || "-",
      scheduleNo: scheduleNo || "-",
      chequeNo: chequeNo || "-",
      handoverTo: handoverTo || "-",
      handOverDate: handOverDate || "-",
      paidVrStatus: paidVrStatus || "-",
      receivedDate: receivedDate || "-",
      notes
    };

    onSave(savedRecord);
  };

  const statusOptions = [
    "Approved",
    "Pending",
    "Fuel Type not Approved, Incomplete",
    "Incomplete Documentation",
    "Rejected by ITMIS",
    "Under Auditing Review"
  ];

  return (
    <div id="voucher-form-root" className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-end">
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="bg-white border-l border-[#D6D9DE] h-full w-full max-w-xl flex flex-col shadow-xl overflow-hidden"
      >
        {/* Form Header */}
        <div className="bg-[#1F3A5F] text-white px-6 py-5 flex items-center justify-between border-b border-[#D6D9DE] shrink-0">
          <div className="flex items-center gap-2.5">
            <FileEdit className="text-white" size={20} />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider">
                {voucher ? "Modify Ledger Entry" : "Create New Register Entry"}
              </h2>
              <p className="text-xs text-white/85 font-mono">
                {voucher ? `S/NO: ${voucher.serialNo}` : "Enter voucher specifications carefully"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!voucher && (
              <button
                type="button"
                onClick={handleAutoGenerateRemaining}
                className="px-2.5 py-1.5 bg-[#2E7D32] hover:bg-[#225e25] text-white rounded-[4px] text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 active:scale-95"
                title="Automatically generate a complete set of register fields"
              >
                <span>✨ Auto-Fill</span>
              </button>
            )}
            <button
              onClick={onCancel}
              className="p-1.5 hover:bg-[#152842] rounded-[4px] text-white/80 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="bg-[#F5F6F8] border-b border-[#D6D9DE] px-6 py-2 flex gap-4 text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`pb-2 pt-1 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "general" 
              ? "border-[#1F3A5F] text-[#1F3A5F] font-bold" 
              : "border-transparent text-[#64748B] hover:text-[#1E293B]"
            }`}
          >
            <Building size={14} />
            General Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("finance")}
            className={`pb-2 pt-1 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "finance" 
              ? "border-[#1F3A5F] text-[#1F3A5F] font-bold" 
              : "border-transparent text-[#64748B] hover:text-[#1E293B]"
            }`}
          >
            <Coins size={14} />
            Finance & Value
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("settlement")}
            className={`pb-2 pt-1 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "settlement" 
              ? "border-[#1F3A5F] text-[#1F3A5F] font-bold" 
              : "border-transparent text-[#64748B] hover:text-[#1E293B]"
            }`}
          >
            <Cpu size={14} />
            ITMIS & Settlements
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs bg-white">
          
          {/* TAB 1: GENERAL INFO */}
          {activeTab === "general" && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }} 
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#1E293B] font-bold mb-1">Serial Number (S/NO) *</label>
                  <input
                    type="text"
                    required
                    value={serialNo}
                    onChange={(e) => setSerialNo(e.target.value)}
                    placeholder="e.g., 25/120061"
                    className="w-full px-3 py-2 bg-white rounded-[4px] border border-[#D6D9DE] focus:outline-none focus:border-[#1F3A5F] font-mono font-bold text-[#1E293B] placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-[#1E293B] font-bold mb-1">Creation Date *</label>
                  <input
                    type="text"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="e.g., 02/12/2025"
                    className="w-full px-3 py-2 bg-white rounded-[4px] border border-[#D6D9DE] focus:outline-none focus:border-[#1F3A5F] font-bold text-[#1E293B] placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#1E293B] font-bold mb-1">Unit VR Number</label>
                  <input
                    type="text"
                    value={unitVrNo}
                    onChange={(e) => setUnitVrNo(e.target.value)}
                    placeholder="e.g., 185/25"
                    className="w-full px-3 py-2 bg-white rounded-[4px] border border-[#D6D9DE] focus:outline-none focus:border-[#1F3A5F] font-mono text-[#1E293B] placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-[#1E293B] font-bold mb-1">Received Date</label>
                  <input
                    type="text"
                    value={receivedDate}
                    onChange={(e) => setReceivedDate(e.target.value)}
                    placeholder="e.g., 25-12-05"
                    className="w-full px-3 py-2 bg-white rounded-[4px] border border-[#D6D9DE] focus:outline-none focus:border-[#1F3A5F] text-[#1E293B] placeholder-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#1E293B] font-bold mb-1">Name of the Payee *</label>
                <input
                  type="text"
                  required
                  value={payee}
                  onChange={(e) => handlePayeeChange(e.target.value)}
                  placeholder="e.g., M P C S YAKKALAMULLA"
                  className="w-full px-3 py-2 bg-white rounded-[4px] border border-[#D6D9DE] focus:outline-none focus:border-[#1F3A5F] font-bold text-[#1E293B] placeholder-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <SearchableSelect
                    id="unit-select"
                    label="Expenditure Unit / Station"
                    value={unit}
                    onChange={setUnit}
                    options={mergedUnits}
                    placeholder="e.g., U15 - GALLE"
                  />
                </div>
                <div>
                  <label className="block text-[#1E293B] font-bold mb-1">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., FUEL"
                    className="w-full px-3 py-2 bg-white rounded-[4px] border border-[#D6D9DE] focus:outline-none focus:border-[#1F3A5F] text-[#1E293B] uppercase placeholder-slate-400"
                  />
                </div>
              </div>

              <div>
                <SearchableSelect
                  id="vote-select"
                  label="Budget Vote Ledger Code"
                  value={vote}
                  onChange={setVote}
                  voteOptions={mergedVotes}
                  placeholder="e.g., 225-1-1-0-1202-009 Pool Vehicle Fuel..."
                />
              </div>
            </motion.div>
          )}

          {/* TAB 2: FINANCIAL ACCOUNTING */}
          {activeTab === "finance" && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }} 
              className="space-y-4"
            >
              <div className="bg-[#1F3A5F]/10 border border-[#1F3A5F]/20 rounded-[4px] p-3.5 space-y-1 mb-2">
                <span className="text-[10px] font-bold text-[#1F3A5F] uppercase tracking-wider flex items-center gap-1">
                  <Tag size={12} /> Live Auto Settlement
                </span>
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  Enter ledger balances in numeric format. Decimal fractions are supported.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#1E293B] font-bold mb-1">Voucher Amount (LKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={voucherAmount}
                    onChange={(e) => {
                      setVoucherAmount(e.target.value);
                      // Mirror total schedule & cheque by default if they are empty or 0 to save typing!
                      if (!totalScheduleValue || totalScheduleValue === "0") setTotalScheduleValue(e.target.value);
                      if (!chequeValue || chequeValue === "0") setChequeValue(e.target.value);
                      if (!totalPaid || totalPaid === "0") setTotalPaid(e.target.value);
                    }}
                    className="w-full px-3 py-2 bg-white rounded-[4px] border border-[#D6D9DE] focus:outline-none focus:border-[#1F3A5F] font-mono font-bold text-[#1E293B]"
                  />
                </div>
                <div>
                  <label className="block text-[#1E293B] font-bold mb-1">Total Schedule Value</label>
                  <input
                    type="number"
                    step="0.01"
                    value={totalScheduleValue}
                    onChange={(e) => setTotalScheduleValue(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-[4px] border border-[#D6D9DE] focus:outline-none focus:border-[#1F3A5F] font-mono text-[#1E293B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#1E293B] font-bold mb-1">Cheque Value (LKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={chequeValue}
                    onChange={(e) => {
                      setChequeValue(e.target.value);
                      // Auto-calculate cross-entry if voucher amount differs from cheque value
                      const vAmt = parseFloat(voucherAmount) || 0;
                      const cVal = parseFloat(e.target.value) || 0;
                      if (vAmt !== cVal && vAmt > cVal) {
                        setCrossEntry((vAmt - cVal).toFixed(2));
                      } else {
                        setCrossEntry("0");
                      }
                    }}
                    className="w-full px-3 py-2 bg-white rounded-[4px] border border-[#D6D9DE] focus:outline-none focus:border-[#1F3A5F] font-mono text-[#1E293B]"
                  />
                </div>
                <div>
                  <label className="block text-[#1E293B] font-bold mb-1">Cross Entry Adjustment</label>
                  <input
                    type="number"
                    step="0.01"
                    value={crossEntry}
                    onChange={(e) => setCrossEntry(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-[4px] border border-[#D6D9DE] focus:outline-none focus:border-[#1F3A5F] font-mono text-[#1E293B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#1E293B] font-bold mb-1">Total Paid (LKR)</label>
                <input
                  type="number"
                  step="0.01"
                  value={totalPaid}
                  onChange={(e) => setTotalPaid(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-[4px] border border-[#D6D9DE] focus:outline-none focus:border-[#1F3A5F] font-mono font-bold text-[#1E293B]"
                />
              </div>
            </motion.div>
          )}

          {/* TAB 3: ITMIS & SETTLEMENTS */}
          {activeTab === "settlement" && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }} 
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#1E293B] font-bold mb-1">Status of the VR</label>
                  <select
                    value={statusOfVr}
                    onChange={(e) => setStatusOfVr(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-[4px] border border-[#D6D9DE] focus:outline-none focus:border-[#1F3A5F] text-[#1E293B] font-bold"
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#1E293B] font-bold mb-1">ITMIS EV Number</label>
                  <input
                    type="text"
                    value={itmisEvNo}
                    onChange={(e) => setItmisEvNo(e.target.value)}
                    placeholder="e.g., 45,994.00"
                    className="w-full px-3 py-2 bg-white rounded-[4px] border border-[#D6D9DE] focus:outline-none focus:border-[#1F3A5F] text-[#1E293B] font-mono placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#1E293B] font-bold mb-1">Handover to Subject Date</label>
                  <input
                    type="text"
                    value={handOverDateToSubject}
                    onChange={(e) => setHandOverDateToSubject(e.target.value)}
                    placeholder="e.g., 25-12-02"
                    className="w-full px-3 py-2 bg-white rounded-[4px] border border-[#D6D9DE] focus:outline-none focus:border-[#1F3A5F] text-[#1E293B] placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-[#1E293B] font-bold mb-1">Handover to ITMIS Date</label>
                  <input
                    type="text"
                    value={handOverDateToItmis}
                    onChange={(e) => setHandOverDateToItmis(e.target.value)}
                    placeholder="e.g., 25-12-04"
                    className="w-full px-3 py-2 bg-white rounded-[4px] border border-[#D6D9DE] focus:outline-none focus:border-[#1F3A5F] text-[#1E293B] placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#1E293B] font-bold mb-1">Status of Payment (PMT)</label>
                  <input
                    type="text"
                    value={statusOfPmt}
                    onChange={(e) => setStatusOfPmt(e.target.value)}
                    placeholder="e.g., Paid, Completed"
                    className="w-full px-3 py-2 bg-white rounded-[4px] border border-[#D6D9DE] focus:outline-none focus:border-[#1F3A5F] text-[#1E293B] placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-[#1E293B] font-bold mb-1">Paid Date</label>
                  <input
                    type="text"
                    value={paidDate}
                    onChange={(e) => setPaidDate(e.target.value)}
                    placeholder="e.g., 25-12-10"
                    className="w-full px-3 py-2 bg-white rounded-[4px] border border-[#D6D9DE] focus:outline-none focus:border-[#1F3A5F] text-[#1E293B] placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#1E293B] font-bold mb-1">Schedule Number</label>
                  <input
                    type="text"
                    value={scheduleNo}
                    onChange={(e) => setScheduleNo(e.target.value)}
                    placeholder="e.g., SCH-1049"
                    className="w-full px-3 py-2 bg-white rounded-[4px] border border-[#D6D9DE] focus:outline-none focus:border-[#1F3A5F] text-[#1E293B] font-mono placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-[#1E293B] font-bold mb-1">Cheque Number</label>
                  <input
                    type="text"
                    value={chequeNo}
                    onChange={(e) => setChequeNo(e.target.value)}
                    placeholder="e.g., CHQ-92810"
                    className="w-full px-3 py-2 bg-white rounded-[4px] border border-[#D6D9DE] focus:outline-none focus:border-[#1F3A5F] text-[#1E293B] font-mono placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#1E293B] font-bold mb-1">Handover To Designation</label>
                  <input
                    type="text"
                    value={handoverTo}
                    onChange={(e) => setHandoverTo(e.target.value)}
                    placeholder="e.g., OIC Administration"
                    className="w-full px-3 py-2 bg-white rounded-[4px] border border-[#D6D9DE] focus:outline-none focus:border-[#1F3A5F] text-[#1E293B] placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-[#1E293B] font-bold mb-1">Handover Date</label>
                  <input
                    type="text"
                    value={handOverDate}
                    onChange={(e) => setHandOverDate(e.target.value)}
                    placeholder="e.g., 25-12-08"
                    className="w-full px-3 py-2 bg-white rounded-[4px] border border-[#D6D9DE] focus:outline-none focus:border-[#1F3A5F] text-[#1E293B] placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#1E293B] font-bold mb-1">Paid VR Status</label>
                  <input
                    type="text"
                    value={paidVrStatus}
                    onChange={(e) => setPaidVrStatus(e.target.value)}
                    placeholder="e.g., Settled"
                    className="w-full px-3 py-2 bg-white rounded-[4px] border border-[#D6D9DE] focus:outline-none focus:border-[#1F3A5F] text-[#1E293B] placeholder-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#1E293B] font-bold mb-1">Registrar Remarks & Comments</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Waiting for fuel logs approval..."
                  className="w-full px-3 py-2 bg-white rounded-[4px] border border-[#D6D9DE] focus:outline-none focus:border-[#1F3A5F] text-[#1E293B] font-medium placeholder-slate-400"
                />
              </div>
            </motion.div>
          )}

        </form>

        {/* Form Footer */}
        <div className="bg-[#F5F6F8] border-t border-[#D6D9DE] px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("general")}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${activeTab === "general" ? "bg-[#1F3A5F]" : "bg-slate-300"}`}
              title="Page 1"
            />
            <button
              type="button"
              onClick={() => setActiveTab("finance")}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${activeTab === "finance" ? "bg-[#1F3A5F]" : "bg-slate-300"}`}
              title="Page 2"
            />
            <button
              type="button"
              onClick={() => setActiveTab("settlement")}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${activeTab === "settlement" ? "bg-[#1F3A5F]" : "bg-slate-300"}`}
              title="Page 3"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-[#1E293B] rounded-[4px] text-xs font-semibold border border-[#D6D9DE] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 bg-[#1F3A5F] hover:bg-[#152842] text-white rounded-[4px] text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Save size={14} />
              {voucher ? "Save Modifications" : "Register Voucher"}
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
