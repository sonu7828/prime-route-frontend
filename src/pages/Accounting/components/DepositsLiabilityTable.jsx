import React, { useState } from 'react';
import {
  ShieldAlert,
  Info,
  Download,
  Search,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  RotateCcw,
  ArrowUpRight,
  Plus
} from 'lucide-react';
import StatusBadge from '../../../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { exportToCsv } from '../../../utils/exportCsv';
import Modal from '../../../components/common/Modal';
import { FormInput, FormSelect, FormTextarea } from '../../../components/forms/FormInputs';

export default function DepositsLiabilityTable({
  deposits = [],
  onReleaseDeposit,
  onOpenReverseModal,
  onAddDeposit,
  drivers = [],
  rentals = []
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [isAddDepositOpen, setIsAddDepositOpen] = useState(false);
  const [releasingDeposit, setReleasingDeposit] = useState(null);

  const [newDeposit, setNewDeposit] = useState({
    driver: '',
    contractId: '',
    vehicle: '',
    depositAmount: '',
    heldDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const filteredDeposits = deposits.filter((d) => {
    const q = searchQuery.toLowerCase();
    return (
      (d.id && d.id.toLowerCase().includes(q)) ||
      (d.driver && d.driver.toLowerCase().includes(q)) ||
      (d.vehicle && d.vehicle.toLowerCase().includes(q)) ||
      (d.contractId && d.contractId.toLowerCase().includes(q))
    );
  });

  const totalHeldLiability = deposits
    .filter(
      (d) =>
        d.status !== 'Refunded / Released' &&
        d.status !== 'Reversed' &&
        d.status !== 'Reversed & Offset'
    )
    .reduce((sum, d) => {
      const bal = Number(
        d.balance !== undefined && d.balance !== null ? d.balance : d.depositAmount || 0
      );
      return sum + (bal > 0 ? bal : 0);
    }, 0);

  const handleExport = () => {
    exportToCsv('PrimeRoute_Deposits_Escrow_Liability', filteredDeposits);
  };

  const handleCreateDeposit = (e) => {
    e.preventDefault();
    if (!newDeposit.driver || !newDeposit.depositAmount) return;

    if (onAddDeposit) {
      onAddDeposit({
        driver: newDeposit.driver,
        contractId: newDeposit.contractId || 'RNT-2024-089',
        vehicle: newDeposit.vehicle || 'Commercial Fleet Vehicle',
        depositAmount: Number(newDeposit.depositAmount),
        heldDate: newDeposit.heldDate,
        notes: newDeposit.notes
      });
    }

    setIsAddDepositOpen(false);
    setNewDeposit({
      driver: '',
      contractId: '',
      vehicle: '',
      depositAmount: '',
      heldDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  return (
    <div className="space-y-4">
      {/* 1. Mandatory Escrow Liability Banner with Info Tooltip */}
      <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-200/60 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-extrabold text-amber-950">
                Balance Sheet Liability: Escrow Customer Security Deposits
              </h4>
              {/* Info Tooltip Icon */}
              <div className="relative inline-block">
                <button
                  type="button"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  onClick={() => setShowTooltip((prev) => !prev)}
                  className="p-1 rounded-full text-amber-700 hover:bg-amber-200/60 transition-colors cursor-pointer"
                  title="Accounting Rule Info"
                >
                  <Info className="w-4 h-4" />
                </button>

                {showTooltip && (
                  <div className="absolute left-0 sm:left-auto sm:right-0 top-7 w-80 p-3 bg-slate-900 text-white rounded-xl shadow-xl text-xs z-50 leading-relaxed border border-slate-700 animate-fade-in">
                    <p className="font-bold text-amber-300 mb-1">GAAP &amp; IFRS Escrow Rule:</p>
                    <p>
                      Refundable security deposits represent segregated customer funds held on trust (Account <strong>2100 - Customer Escrow Liability</strong>). They must <strong>NEVER</strong> be counted toward rental income or operating revenue totals.
                    </p>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-amber-800 mt-0.5">
              Fiduciary deposits held against vehicle return condition. Legally excluded from commercial rental revenue and retained as a current liability.
            </p>
          </div>
        </div>

        <div className="bg-white/80 px-4 py-2 rounded-xl border border-amber-300/80 shrink-0 text-right self-stretch sm:self-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
            Total Escrow Liability Held
          </span>
          <span className="text-lg font-black text-amber-950 font-mono">
            {formatCurrency(totalHeldLiability)}
          </span>
        </div>
      </div>

      {/* 2. Table Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(7,29,73,0.04)] overflow-hidden space-y-4">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#F8FAFC]">
          <div>
            <h3 className="font-bold text-[#0A1E42] text-sm flex items-center gap-2">
              <span>Customer Security Deposit Escrow Ledger</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {filteredDeposits.length} Accounts
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Track deposit inflow, toll/damage deductions, and formal release upon completed lease return
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
            </button>
            <button
              onClick={() => setIsAddDepositOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" /> Collect Security Deposit
            </button>
            <div className="w-56">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search driver, contract, vehicle..."
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#075EE8]/20 focus:border-[#075EE8]"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[880px]">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Deposit ID</th>
                <th className="py-3 px-4">Driver / Lessee</th>
                <th className="py-3 px-4">Contract Ref</th>
                <th className="py-3 px-4">Held Date</th>
                <th className="py-3 px-4 text-right">Initial Deposit</th>
                <th className="py-3 px-4 text-right">Deductions</th>
                <th className="py-3 px-4 text-right">Escrow Balance</th>
                <th className="py-3 px-4 text-center">Liability Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredDeposits.map((d) => (
                <tr key={d.id} className="hover:bg-amber-50/20 group">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#075EE8]">
                    {d.id}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-[#0A1E42]">{d.driver}</p>
                    <p className="text-[11px] text-slate-400">{d.vehicle}</p>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">
                    {d.contractId}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                    {formatDate(d.heldDate || d.date)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                    {formatCurrency(d.depositAmount || d.amount)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium text-rose-600">
                    {d.deductions > 0 ? `-${formatCurrency(d.deductions)}` : '$0.00'}
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-amber-900 font-mono">
                    {formatCurrency(d.balance)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        d.status === 'Refunded / Released'
                          ? 'bg-slate-100 text-slate-600'
                          : d.status === 'Partial Deduction'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {d.balance > 0 &&
                      d.status !== 'Refunded / Released' &&
                      d.status !== 'Reversed' &&
                      d.status !== 'Reversed & Offset' ? (
                        <>
                          <button
                            onClick={() => setReleasingDeposit(d)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                          >
                            Release / Refund
                          </button>
                          <button
                            onClick={() => onOpenReverseModal(d)}
                            title="Reverse / Correct Escrow Entry"
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                          Settled / Closed
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Security Deposit Modal */}
      <Modal
        isOpen={isAddDepositOpen}
        onClose={() => setIsAddDepositOpen(false)}
        title="Collect Customer Security Deposit (Escrow)"
        subtitle="Record refundable security deposit in balance sheet escrow account 2100"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateDeposit} className="space-y-4">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Security deposits are segregated trust liabilities. This amount will be credited to <strong>Account 2100</strong> and strictly excluded from operational rental revenue.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Driver / Lessee *</label>
              {drivers.length > 0 ? (
                <select
                  value={newDeposit.driver}
                  onChange={(e) => {
                    const selDriver = e.target.value;
                    const r = rentals.find((rent) => rent.driver === selDriver || rent.driverName === selDriver);
                    setNewDeposit((prev) => ({
                      ...prev,
                      driver: selDriver,
                      contractId: r?.contract_no || r?.contractId || prev.contractId,
                      vehicle: r?.vehicle || prev.vehicle
                    }));
                  }}
                  required
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  <option value="">Select Driver</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={`${d.first_name || ''} ${d.last_name || ''}`.trim() || d.name}>
                      {`${d.first_name || ''} ${d.last_name || ''}`.trim() || d.name}
                    </option>
                  ))}
                </select>
              ) : (
                <FormInput
                  label="Driver Name"
                  value={newDeposit.driver}
                  onChange={(e) => setNewDeposit((p) => ({ ...p, driver: e.target.value }))}
                  required
                />
              )}
            </div>

            <FormInput
              label="Contract Reference *"
              value={newDeposit.contractId}
              onChange={(e) => setNewDeposit((p) => ({ ...p, contractId: e.target.value }))}
              placeholder="e.g. RNT-2024-090"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput
              label="Assigned Vehicle Unit"
              value={newDeposit.vehicle}
              onChange={(e) => setNewDeposit((p) => ({ ...p, vehicle: e.target.value }))}
              placeholder="e.g. Toyota Camry (PR-2024-TC)"
            />

            <FormInput
              label="Deposit Amount ($) *"
              type="number"
              step="0.01"
              value={newDeposit.depositAmount}
              onChange={(e) => setNewDeposit((p) => ({ ...p, depositAmount: e.target.value }))}
              placeholder="500.00"
              required
            />
          </div>

          <FormInput
            label="Held Date *"
            type="date"
            value={newDeposit.heldDate}
            onChange={(e) => setNewDeposit((p) => ({ ...p, heldDate: e.target.value }))}
            required
          />

          <FormTextarea
            label="Escrow Custody Notes & Terms"
            value={newDeposit.notes}
            onChange={(e) => setNewDeposit((p) => ({ ...p, notes: e.target.value }))}
            placeholder="Escrow custody terms, vehicle return condition..."
            rows={2}
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddDepositOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md shadow-amber-600/20 transition-all cursor-pointer"
            >
              Save Escrow Deposit
            </button>
          </div>
        </form>
      </Modal>

      {/* Release / Refund Escrow Confirmation Modal */}
      {releasingDeposit && (
        <Modal
          isOpen={!!releasingDeposit}
          onClose={() => setReleasingDeposit(null)}
          title="Confirm Security Deposit Release & Refund"
          subtitle={`Disburse escrow funds held for ${releasingDeposit.driver}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 space-y-1">
                <p className="font-bold">Are you sure you want to release this escrow deposit?</p>
                <p className="leading-relaxed">
                  This action will release{' '}
                  <strong>
                    {formatCurrency(
                      releasingDeposit.balance !== undefined && releasingDeposit.balance !== null
                        ? Number(releasingDeposit.balance)
                        : Number(releasingDeposit.depositAmount || 0)
                    )}
                  </strong>{' '}
                  from escrow liabilities (Account 2100) and record an outward disbursement refund to
                  the driver.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Deposit ID:</span>
                <span className="font-mono font-bold text-[#075EE8]">{releasingDeposit.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Driver / Lessee:</span>
                <span className="font-bold text-slate-800">{releasingDeposit.driver}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Contract Reference:</span>
                <span className="font-mono text-slate-700">
                  {releasingDeposit.contractId || releasingDeposit.rental_code || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Vehicle:</span>
                <span className="text-slate-700">
                  {releasingDeposit.vehicle || 'Commercial Fleet Unit'}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
                <span className="text-slate-700">Refund Amount:</span>
                <span className="text-emerald-600 text-sm font-extrabold">
                  {formatCurrency(
                    releasingDeposit.balance !== undefined && releasingDeposit.balance !== null
                      ? Number(releasingDeposit.balance)
                      : Number(releasingDeposit.depositAmount || 0)
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReleasingDeposit(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onReleaseDeposit(releasingDeposit.id);
                  setReleasingDeposit(null);
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/25 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Confirm &amp; Release Refund
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

