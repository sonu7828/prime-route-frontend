import React, { useState, useMemo } from 'react';
import {
  Clock,
  Download,
  AlertTriangle,
  Mail,
  Send,
  DollarSign,
  CheckCircle2
} from 'lucide-react';
import StatusBadge from '../../../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { exportToCsv } from '../../../utils/exportCsv';

export default function ReceivablesTable({
  invoices = [],
  charges = [],
  onRecordPayment,
  onTraceAR
}) {
  const [agingFilter, setAgingFilter] = useState('All');

  // Derive open AR items dynamically from live invoices & charges
  const openItems = useMemo(() => {
    const list = [];

    // 1. Outstanding Invoices
    invoices.forEach((inv) => {
      const balance = Number(inv.balance !== undefined ? inv.balance : (inv.total - (inv.paidAmount || 0)));
      if (balance > 0 && inv.status !== 'Paid' && inv.status !== 'void' && inv.status !== 'Reversed') {
        const today = new Date();
        const due = inv.dueDate ? new Date(inv.dueDate) : today;
        const diffDays = Math.ceil((today - due) / (1000 * 3600 * 24));
        const daysOverdue = Math.max(0, diffDays);
        const agingBucket = daysOverdue > 30 ? '31-60 Days' : 'Current (0-30)';

        list.push({
          id: `AR-${inv.id}`,
          refType: 'Invoice',
          docId: inv.invoiceNumber || inv.id,
          debtor: inv.customer || inv.driver || 'Corporate Debtor',
          vehicle: inv.vehicle || 'Fleet Vehicle',
          issueDate: inv.date || inv.issueDate,
          dueDate: inv.dueDate,
          daysOverdue,
          originalAmount: Number(inv.total),
          openBalance: balance,
          agingBucket,
          status: inv.status,
          collectionStage: daysOverdue > 30 ? 'Escalated - Final Demand Notice' : 'On Schedule - Net Terms'
        });
      }
    });

    // 2. Open Unsettled Charges
    charges.forEach((chg) => {
      if (chg.status === 'Posted') {
        list.push({
          id: `AR-${chg.id}`,
          refType: chg.category || 'Charge',
          docId: chg.id,
          debtor: chg.driver || 'Driver',
          vehicle: chg.description || 'Fleet Vehicle',
          issueDate: chg.date,
          dueDate: chg.date,
          daysOverdue: 0,
          originalAmount: Number(chg.amount),
          openBalance: Number(chg.amount),
          agingBucket: 'Current (0-30)',
          status: 'Posted',
          collectionStage: 'Pending Settlement'
        });
      }
    });

    return list;
  }, [invoices, charges]);

  const totalAR = openItems.reduce((sum, item) => sum + item.openBalance, 0);
  const currentAR = openItems.filter((i) => i.agingBucket.includes('Current')).reduce((sum, i) => sum + i.openBalance, 0);
  const pastDue30 = openItems.filter((i) => i.agingBucket.includes('31-60')).reduce((sum, i) => sum + i.openBalance, 0);

  const filteredItems = openItems.filter((i) => {
    if (agingFilter === 'All') return true;
    return i.agingBucket === agingFilter;
  });

  const handleExport = () => {
    exportToCsv('PrimeRoute_Accounts_Receivable_AR', filteredItems);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(7,29,73,0.04)] overflow-hidden space-y-4">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#F8FAFC]">
        <div>
          <h3 className="font-bold text-[#0A1E42] text-sm flex items-center gap-2">
            <span>Accounts Receivable (AR) Subledger &amp; Aging</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
              {filteredItems.length} Open Balances
            </span>
          </h3>
          <p className="text-xs text-slate-500">
            Aging analysis of outstanding driver invoices, unbilled toll re-charges, and commercial corporate accounts
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs self-start md:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" /> Export AR Aging
        </button>
      </div>

      {/* AR Aging Buckets Strip */}
      <div className="px-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total AR (Traceable) */}
        <div
          onClick={() => onTraceAR && onTraceAR('Accounts Receivable (AR)', totalAR, openItems)}
          className="p-3.5 bg-rose-50/80 rounded-xl border border-rose-200 text-xs cursor-pointer hover:ring-2 hover:ring-rose-400 transition-all group"
          title="Click to trace all source AR transactions"
        >
          <div className="flex items-center justify-between">
            <span className="text-rose-700 font-bold uppercase tracking-wider text-[10px]">
              Total Open Receivables (AR)
            </span>
            <span className="text-[10px] text-rose-600 font-semibold group-hover:underline">
              🔍 Trace Source
            </span>
          </div>
          <span className="text-lg font-black text-rose-950 font-mono block mt-1">
            {formatCurrency(totalAR)}
          </span>
        </div>

        <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-200 text-xs">
          <span className="text-blue-700 font-bold uppercase tracking-wider text-[10px] block">
            Current (0 - 30 Days)
          </span>
          <span className="text-lg font-black text-[#071D49] font-mono block mt-1">
            {formatCurrency(currentAR)}
          </span>
          <span className="text-[10px] text-blue-600">On schedule within payment terms</span>
        </div>

        <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200 text-xs">
          <span className="text-amber-800 font-bold uppercase tracking-wider text-[10px] block">
            Past Due (31 - 60 Days)
          </span>
          <span className="text-lg font-black text-amber-950 font-mono block mt-1">
            {formatCurrency(pastDue30)}
          </span>
          <span className="text-[10px] text-amber-700">Requires collection escalation</span>
        </div>
      </div>

      {/* AR Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[920px]">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Document Ref</th>
              <th className="py-3 px-4">Debtor / Customer</th>
              <th className="py-3 px-4">Vehicle Unit</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4 text-center">Aging / Days</th>
              <th className="py-3 px-4 text-right">Original Amount</th>
              <th className="py-3 px-4 text-right">Open Balance</th>
              <th className="py-3 px-4">Collection Stage</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredItems.map((item) => (
              <tr key={item.id} className="hover:bg-blue-50/20 group">
                <td className="py-3.5 px-4 font-mono font-bold text-[#075EE8]">
                  {item.docId}
                  <span className="block text-[10px] font-sans font-normal text-slate-400">{item.refType}</span>
                </td>
                <td className="py-3.5 px-4 font-bold text-[#0A1E42]">
                  {item.debtor}
                </td>
                <td className="py-3.5 px-4 text-slate-600">
                  {item.vehicle}
                </td>
                <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                  {formatDate(item.dueDate)}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                      item.daysOverdue > 15
                        ? 'bg-rose-100 text-rose-800'
                        : item.daysOverdue > 0
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {item.daysOverdue > 0 ? `+${item.daysOverdue} d late` : 'On Time'}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right font-medium text-slate-600">
                  {formatCurrency(item.originalAmount)}
                </td>
                <td className="py-3.5 px-4 text-right font-extrabold text-rose-600 font-mono">
                  {formatCurrency(item.openBalance)}
                </td>
                <td className="py-3.5 px-4">
                  <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                    {item.collectionStage}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={() => onRecordPayment(item.debtor)}
                    className="px-2.5 py-1 bg-[#075EE8] hover:bg-[#0650C7] text-white rounded-lg text-[10px] font-bold transition-all shadow-2xs cursor-pointer"
                  >
                    Settle / Pay
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

