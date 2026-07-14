import { useState } from "react";
import { motion } from "motion/react";
import { VoucherRecord } from "../types";
import { 
  BarChart3, 
  PieChart, 
  Layers, 
  TrendingUp,
  Tag
} from "lucide-react";

interface AnalyticsChartsProps {
  records: VoucherRecord[];
}

export default function AnalyticsCharts({ records }: AnalyticsChartsProps) {
  const [activeUnitHover, setActiveUnitHover] = useState<string | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // 1. Process top 8 Units by expenditure
  const unitMap: Record<string, number> = {};
  records.forEach((r) => {
    const uName = r.unit?.trim() || "UNKNOWN";
    if (uName && uName !== "-") {
      unitMap[uName] = (unitMap[uName] || 0) + r.voucherAmount;
    }
  });
  const topUnits = Object.entries(unitMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const maxUnitVal = topUnits.length > 0 ? Math.max(...topUnits.map(([_, val]) => val)) : 1;

  // 2. Process status quantities
  let approvedCount = 0;
  let incompleteCount = 0;
  let pendingCount = 0;
  let totalValue = 0;

  records.forEach((r) => {
    totalValue += r.voucherAmount;
    const status = r.statusOfVr?.toLowerCase() || "";
    if (status.includes("approved") && !status.includes("not approved")) {
      approvedCount++;
    } else if (status.includes("incomplete") || status.includes("not approved")) {
      incompleteCount++;
    } else {
      pendingCount++;
    }
  });

  const totalStatusCount = approvedCount + incompleteCount + pendingCount || 1;

  // 3. Process expenditure categories
  const catMap: Record<string, { total: number; count: number }> = {};
  records.forEach((r) => {
    const desc = r.description?.toUpperCase() || "";
    let group = "OTHER EXPENDITURES";
    if (desc.includes("FUEL") || desc.includes("FULE")) {
      group = "FUEL & VEHICLE LUBRICANTS";
    } else if (desc.includes("OVERTIME") || desc.includes("O T") || desc.includes("OT ") || desc.includes("DAYSPAY")) {
      group = "OVERTIME & HOLIDAY ALLOWANCE";
    } else if (desc.includes("NEWS") || desc.includes("NEWSPEPAR") || desc.includes("NEWSPEPAR BILL")) {
      group = "NEWSPAPERS & PERIODICALS";
    } else if (desc.includes("RENT")) {
      group = "OFFICE & PREMISES RENT";
    } else if (desc.includes("SERVICE") || desc.includes("MAINTENANCE") || desc.includes("MOTORS") || desc.includes("REPAIR")) {
      group = "VEHICLE REPAIRS & RUNNING";
    } else if (desc.includes("PETTY") || desc.includes("CASH")) {
      group = "PETTY CASH ADVANCES";
    } else if (desc.includes("BILL") || desc.includes("ELECTRICITY") || desc.includes("WATER") || desc.includes("VPN") || desc.includes("DIALOG")) {
      group = "UTILITIES, TELECOM & DATA";
    } else if (desc.includes("FOOD") || desc.includes("LORDGING") || desc.includes("LODGING")) {
      group = "OFFICER FOOD & LODGING";
    }

    if (!catMap[group]) {
      catMap[group] = { total: 0, count: 0 };
    }
    catMap[group].total += r.voucherAmount;
    catMap[group].count += 1;
  });

  const sortedCategories = Object.entries(catMap)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 6);

  const maxCatVal = sortedCategories.length > 0 ? Math.max(...sortedCategories.map(([_, item]) => item.total)) : 1;

  return (
    <div id="analytics-dashboard" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Col 1: Unit Chart */}
      <div id="unit-chart-card" className="bg-white p-5 rounded-[4px] border border-[#D6D9DE] shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={18} className="text-[#1F3A5F]" />
            <h3 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Top Units Expenditure</h3>
          </div>
          <p className="text-xs text-[#64748B] mb-6">Distribution of voucher totals across top Police administrative units.</p>
        </div>

        <div className="h-56 flex items-end justify-between gap-2.5 px-2 relative">
          {topUnits.map(([unitName, value]) => {
            const pct = (value / maxUnitVal) * 100;
            const isHovered = activeUnitHover === unitName;
            return (
              <div 
                key={unitName} 
                className="flex-1 flex flex-col items-center group relative h-full justify-end cursor-pointer"
                onMouseEnter={() => setActiveUnitHover(unitName)}
                onMouseLeave={() => setActiveUnitHover(null)}
              >
                {/* Tooltip */}
                <div className={`absolute bottom-[calc(${pct}%+12px)] z-20 bg-[#1F3A5F] text-white text-[10px] p-2.5 rounded-[4px] shadow-lg border border-[#D6D9DE]/20 transition-all duration-150 whitespace-nowrap pointer-events-none ${isHovered ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
                  <span className="font-bold block">{unitName}</span>
                  <span className="text-white/90 font-mono font-bold block mt-0.5">{formatCurrency(value)}</span>
                </div>

                {/* Column Bar */}
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${pct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`w-full rounded-t-[2px] transition-all duration-200 ${
                    isHovered 
                      ? "bg-[#2F4F4F] shadow-md" 
                      : "bg-[#1F3A5F]"
                  }`}
                />

                {/* Label */}
                <div className="w-full text-center mt-2 overflow-hidden text-[9px] font-bold text-[#64748B] group-hover:text-[#1F3A5F] whitespace-nowrap overflow-ellipsis">
                  {unitName.split(" ")[0]}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-[#D6D9DE] flex items-center justify-between text-xs text-[#64748B] font-semibold">
          <span>Max Unit Demand</span>
          <span className="font-mono text-[#1E293B] font-bold">{formatCurrency(maxUnitVal)}</span>
        </div>
      </div>

      {/* Col 2: Category Bar Gauge */}
      <div id="category-chart-card" className="bg-white p-5 rounded-[4px] border border-[#D6D9DE] shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers size={18} className="text-[#1F3A5F]" />
            <h3 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Expenditure by Category</h3>
          </div>
          <p className="text-xs text-[#64748B] mb-4">Voucher values grouped by the core nature of transaction.</p>
        </div>

        <div className="space-y-3.5 my-auto">
          {sortedCategories.map(([catName, item]) => {
            const pct = (item.total / maxCatVal) * 100;
            const totalPct = (item.total / (totalValue || 1)) * 100;
            return (
              <div key={catName} className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-[#1E293B] truncate max-w-[190px]">{catName}</span>
                  <span className="font-mono text-[#1F3A5F]">{formatCurrency(item.total)} ({totalPct.toFixed(0)}%)</span>
                </div>
                <div className="h-2 w-full bg-[#F5F6F8] rounded-full overflow-hidden border border-[#D6D9DE]/30">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-[#1F3A5F] rounded-full"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-[#D6D9DE] flex items-center gap-1.5 text-[10px] text-[#64748B] font-semibold">
          <Tag size={12} className="text-[#1F3A5F]" />
          <span>Voucher descriptions are dynamically classified into 8 financial votes.</span>
        </div>
      </div>

      {/* Col 3: Status Distribution Ring */}
      <div id="status-chart-card" className="bg-white p-5 rounded-[4px] border border-[#D6D9DE] shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <PieChart size={18} className="text-[#1F3A5F]" />
            <h3 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Approval Status Ring</h3>
          </div>
          <p className="text-xs text-[#64748B] mb-6">Percentage proportion of vouchers passed, pending or flagged.</p>
        </div>

        <div className="flex items-center justify-around gap-2 my-auto">
          {/* Ring */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-slate-100"
                strokeWidth="10"
                fill="transparent"
              />
              {/* Approved segment */}
              <motion.circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-[#2E7D32]"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 40}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - approvedCount / totalStatusCount) }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
              {/* Pending segment starting after approved */}
              <motion.circle
                cx="50"
                cy="50"
                r="40"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 40}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                animate={{ 
                  strokeDashoffset: 2 * Math.PI * 40 * (1 - pendingCount / totalStatusCount) 
                }}
                className="stroke-[#F9A825] transform origin-center rotate-[120deg]"
                transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-extrabold tracking-tight text-[#1E293B] font-sans">
                {((approvedCount / totalStatusCount) * 100).toFixed(0)}%
              </span>
              <span className="text-[9px] uppercase tracking-wider text-[#64748B] font-bold">Approved</span>
            </div>
          </div>

          {/* Key */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D32] shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-[#64748B] block">Approved</span>
                <span className="text-xs font-bold text-[#1E293B] block font-mono">{approvedCount} ({((approvedCount/totalStatusCount)*100).toFixed(0)}%)</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F9A825] shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-[#64748B] block">Pending</span>
                <span className="text-xs font-bold text-[#1E293B] block font-mono">{pendingCount} ({((pendingCount/totalStatusCount)*100).toFixed(0)}%)</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C62828] shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-[#64748B] block">Incomplete</span>
                <span className="text-xs font-bold text-[#1E293B] block font-mono">{incompleteCount} ({((incompleteCount/totalStatusCount)*100).toFixed(0)}%)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#D6D9DE] flex items-center justify-between text-xs text-[#64748B] font-semibold">
          <div className="flex items-center gap-1.5">
            <TrendingUp size={12} className="text-[#2E7D32]" />
            <span>Success Rate Goal: 90%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
