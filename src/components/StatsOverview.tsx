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
      color: "bg-white border border-[#D6D9DE] hover:border-[#1F3A5F] shadow-sm",
      valueColor: "text-[#1E293B] text-2xl font-bold font-sans",
      iconColor: "text-[#1F3A5F] bg-[#1F3A5F]/5 border border-[#1F3A5F]/15",
    },
    {
      title: "Total Voucher Value",
      value: formatCurrency(stats.totalVoucherAmount),
      subValue: `Avg: ${formatCurrency(stats.totalCount > 0 ? stats.totalVoucherAmount / stats.totalCount : 0)}`,
      icon: Coins,
      color: "bg-white border border-[#D6D9DE] hover:border-[#1F3A5F] shadow-sm",
      valueColor: "text-[#1F3A5F] text-2xl font-bold font-sans",
      iconColor: "text-[#1F3A5F] bg-[#1F3A5F]/5 border border-[#1F3A5F]/15",
    },
    {
      title: "Approved Vouchers",
      value: stats.approvedCount,
      subValue: `${((stats.approvedCount / (stats.totalCount || 1)) * 100).toFixed(1)}% of register`,
      icon: CheckCircle2,
      color: "bg-white border border-[#D6D9DE] hover:border-[#2E7D32] shadow-sm",
      valueColor: "text-[#2E7D32] text-2xl font-bold font-sans",
      iconColor: "text-[#2E7D32] bg-[#2E7D32]/5 border border-[#2E7D32]/15",
    },
    {
      title: "Pending / Processing",
      value: stats.pendingCount,
      subValue: `${stats.incompleteCount} flags needing attention`,
      icon: AlertCircle,
      color: "bg-white border border-[#D6D9DE] hover:border-[#F9A825] shadow-sm",
      valueColor: "text-[#D97706] text-2xl font-bold font-sans",
      iconColor: "text-[#D97706] bg-[#F9A825]/5 border border-[#F9A825]/15",
    },
    {
      title: "Total Settled / Paid",
      value: formatCurrency(stats.totalPaidAmount),
      subValue: `${((stats.totalPaidAmount / (stats.totalVoucherAmount || 1)) * 100).toFixed(1)}% settlement rate`,
      icon: CreditCard,
      color: "bg-white border border-[#D6D9DE] hover:border-[#1F3A5F] shadow-sm",
      valueColor: "text-[#1E293B] text-2xl font-bold font-sans",
      iconColor: "text-[#1F3A5F] bg-[#1F3A5F]/5 border border-[#1F3A5F]/15",
    },
    {
      title: "Cross Entries / Adjustments",
      value: formatCurrency(stats.totalCrossEntry),
      subValue: `Pending Balance: ${formatCurrency(stats.totalPendingAmount)}`,
      icon: Scale,
      color: "bg-white border border-[#D6D9DE] hover:border-[#2F4F4F] shadow-sm",
      valueColor: "text-[#2F4F4F] text-2xl font-bold font-sans",
      iconColor: "text-[#2F4F4F] bg-[#2F4F4F]/5 border border-[#2F4F4F]/15",
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
            className={`p-4 rounded-[6px] ${card.color} flex flex-col justify-between transition-all duration-300 group`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-semibold text-[#64748B] group-hover:text-[#1E293B] transition-colors">{card.title}</span>
              <div className={`p-1.5 rounded-[4px] ${card.iconColor}`}>
                <Icon size={14} />
              </div>
            </div>
            <div className="mt-4">
              <span className={`tracking-tight font-sans block truncate ${card.valueColor}`}>{card.value}</span>
              <span className="text-[11px] font-medium text-[#64748B] block mt-1">{card.subValue}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
