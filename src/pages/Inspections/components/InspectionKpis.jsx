import React from 'react';
import { ClipboardCheck, CheckCircle2, AlertTriangle, ShieldAlert, Clock } from 'lucide-react';
import StatCard from '../../../components/common/StatCard';
import { formatCurrency } from '../../../utils/formatters';

export default function InspectionKpis({ stats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={ClipboardCheck}
        title="Total Inspections"
        value={stats.totalInspections}
        change={`${stats.passedCount} Clean Handover`}
        isPositive={true}
        color="blue"
      />
      <StatCard
        icon={Clock}
        title="Awaiting Inspection"
        value={stats.awaitingCount ?? 0}
        change={stats.awaitingCount > 0 ? `${stats.awaitingCount} Pending Sign-off` : "All Clear"}
        isPositive={stats.awaitingCount === 0}
        color="amber"
      />
      <StatCard
        icon={AlertTriangle}
        title="Damages Flagged"
        value={stats.damageCount}
        change={stats.damageCount > 0 ? `${stats.damageCount} Action Required` : "0 Flagged • Clean"}
        isPositive={stats.damageCount === 0}
        color="indigo"
      />
      <StatCard
        icon={ShieldAlert}
        title="Accident Claims Total"
        value={formatCurrency(stats.totalRepairCost)}
        change={stats.openClaims > 0 ? `${stats.openClaims} Unresolved Claims` : "All Claims Settled"}
        isPositive={stats.openClaims === 0}
        color="rose"
      />
    </div>
  );
}
