import { motion } from "motion/react";
import { 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Coins, 
  CreditCard, 
  Scale 
} from "lucide-react";
import { RegisterStats } from "../types";

interface StatsOverviewProps {
  stats: RegisterStats;
}

export default function StatsOverview({ stats }: StatsOverviewProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 2,
    }).format(val);
  };

  const statCards = [
    {
      title: "Total Registered Vouchers",
      value: stats.totalCount,
      subValue: `${stats.approvedCount + stats.incompleteCount + stats.pendingCount} classified entries`,
      icon: FileText,
      color: "bg-[#101014]/65 backdrop-blur-md border border-white/5 hover:border-indigo-500/20 shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.05)]",
      valueColor: "text-white text-xl sm:text-2xl font-black font-display bg-clip-text bg-gradient-to-r from-white to-slate-300",
      iconColor: "text-indigo-400 bg-indigo-500/10 border border-indigo-500/20",
    },
    {
      title: "Total Voucher Value",
      value: formatCurrency(stats.totalVoucherAmount),
      subValue: `Avg: ${formatCurrency(stats.totalCount > 0 ? stats.totalVoucherAmount / stats.totalCount : 0)}`,
      icon: Coins,
      color: "bg-[#101014]/65 backdrop-blur-md border border-white/5 hover:border-indigo-500/20 shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.05)]",
      valueColor: "text-indigo-400 text-xl sm:text-2xl font-black font-display bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400",
      iconColor: "text-indigo-400 bg-indigo-500/10 border border-indigo-500/20",
    },
    {
      title: "Approved Vouchers",
      value: stats.approvedCount,
      subValue: `${((stats.approvedCount / (stats.totalCount || 1)) * 100).toFixed(1)}% of register`,
      icon: CheckCircle2,
      color: "bg-[#101014]/65 backdrop-blur-md border border-white/5 hover:border-emerald-500/20 shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.05)]",
      valueColor: "text-emerald-400 text-xl sm:text-2xl font-black font-display bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300",
      iconColor: "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20",
    },
    {
      title: "Pending / Processing",
      value: stats.pendingCount,
      subValue: `${stats.incompleteCount} flags needing attention`,
      icon: AlertCircle,
      color: "bg-[#101014]/65 backdrop-blur-md border border-white/5 hover:border-amber-500/20 shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:shadow-[0_8px_30px_rgba(245,158,11,0.05)]",
      valueColor: "text-amber-400 text-xl sm:text-2xl font-black font-display bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400",
      iconColor: "text-amber-400 bg-amber-500/10 border border-amber-500/20",
    },
    {
      title: "Total Settled / Paid",
      value: formatCurrency(stats.totalPaidAmount),
      subValue: `${((stats.totalPaidAmount / (stats.totalVoucherAmount || 1)) * 100).toFixed(1)}% settlement rate`,
      icon: CreditCard,
      color: "bg-[#101014]/65 backdrop-blur-md border border-white/5 hover:border-sky-500/20 shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:shadow-[0_8px_30px_rgba(14,165,233,0.05)]",
      valueColor: "text-sky-400 text-xl sm:text-2xl font-black font-display bg-clip-text bg-gradient-to-r from-sky-400 to-blue-400",
      iconColor: "text-sky-400 bg-sky-500/10 border border-sky-500/20",
    },
    {
      title: "Cross Entries / Adjustments",
      value: formatCurrency(stats.totalCrossEntry),
      subValue: `Pending Balance: ${formatCurrency(stats.totalPendingAmount)}`,
      icon: Scale,
      color: "bg-[#101014]/65 backdrop-blur-md border border-white/5 hover:border-purple-500/20 shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:shadow-[0_8px_30px_rgba(168,85,247,0.05)]",
      valueColor: "text-purple-400 text-xl sm:text-2xl font-black font-display bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400",
      iconColor: "text-purple-400 bg-purple-500/10 border border-purple-500/20",
    },
  ];

  return (
    <div id="stats-overview-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {statCards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            id={`stat-card-${idx}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.05 }}
            className={`p-5 rounded-2xl ${card.color} flex flex-col justify-between transition-all duration-300 group cursor-pointer hover:-translate-y-1`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 group-hover:text-slate-300 transition-colors">{card.title}</span>
              <div className={`p-2 rounded-xl transition-transform duration-300 group-hover:scale-110 ${card.iconColor}`}>
                <Icon size={15} />
              </div>
            </div>
            <div className="mt-4">
              <span className={`tracking-tight font-sans block truncate ${card.valueColor}`}>{card.value}</span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mt-1.5">{card.subValue}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
