import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Download,
  Plus,
  RefreshCw,
  Building2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Receipt,
  Layers,
  Search
} from 'lucide-react';
import AccountingKpis from './components/AccountingKpis';
import AccountingSyncPanel from './components/AccountingSyncPanel';
import ChargesTable from './components/ChargesTable';
import PaymentsTable from './components/PaymentsTable';
import PaymentModal from './components/PaymentModal';
import PaymentReceiptModal from './components/PaymentReceiptModal';
import DepositsLiabilityTable from './components/DepositsLiabilityTable';
import RefundsTable from './components/RefundsTable';
import CreditsAdjustmentsTable from './components/CreditsAdjustmentsTable';
import BalancesTable from './components/BalancesTable';
import InvoicesTable from './components/InvoicesTable';
import ReceivablesTable from './components/ReceivablesTable';
import PayablesTable from './components/PayablesTable';
import FinancialReportsTab from './components/FinancialReportsTab';
import ReverseTransactionModal from './components/ReverseTransactionModal';
import TraceTransactionsModal from './components/TraceTransactionsModal';
import InvoiceModal from './InvoiceModal';
import InvoicePrintModal from './components/InvoicePrintModal';
import ExpenseModal from './components/ExpenseModal';
import ExpenseApprovalModal from './components/ExpenseApprovalModal';
import ExpenseCorrectionModal from './components/ExpenseCorrectionModal';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import { initialVendors } from '../../data/mockData';
import { useFleet } from '../../context/FleetContext';
import { accountingApi } from '../../api/accountingApi';
import { exportToCsv } from '../../utils/exportCsv';
import { formatCurrency } from '../../utils/formatters';

const TABS = [
  { id: 'charges', label: 'Charges' },
  { id: 'payments', label: 'Payments' },
  { id: 'deposits', label: 'Deposits' },
  { id: 'refunds', label: 'Refunds' },
  { id: 'credits', label: 'Credits/Adjustments' },
  { id: 'balances', label: 'Balances' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'receivables', label: 'Receivables (AR)' },
  { id: 'payables', label: 'Payables (AP)' },
  { id: 'reports', label: 'Reports' },
];

export default function AccountingPage() {
  const { drivers = [], rentals = [], vehicles = [] } = useFleet();

  // Tab State: Default is 'charges'
  const [activeTab, setActiveTab] = useState('charges');
  const [isSyncPanelOpen, setIsSyncPanelOpen] = useState(false);

  // Live Database Subledger States
  const [charges, setCharges] = useState([]);
  const [payments, setPayments] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [credits, setCredits] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payables, setPayables] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [dbDriverBalances, setDbDriverBalances] = useState([]);
  const [backendStats, setBackendStats] = useState(null);

  // Loading & Feedback
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState('');

  // Modals state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [prefilledPaymentDriver, setPrefilledPaymentDriver] = useState('');
  const [selectedPaymentReceipt, setSelectedPaymentReceipt] = useState(null);
  const [reversingTx, setReversingTx] = useState(null);
  const [traceData, setTraceData] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState(null);

  // Expenses Modals State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [approvalModalData, setApprovalModalData] = useState(null);
  const [correctingExpense, setCorrectingExpense] = useState(null);

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(''), 4500);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Load live data from backend MySQL database
  const loadData = useCallback(async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    setFetchError(null);
    try {
      const [
        chargesData,
        paymentsData,
        depositsData,
        refundsData,
        creditsData,
        invoicesData,
        payablesData,
        balancesData,
        vendorsData,
        statsData
      ] = await Promise.all([
        accountingApi.getCharges().catch((err) => { console.error('Failed to load charges:', err); return []; }),
        accountingApi.getPayments().catch((err) => { console.error('Failed to load payments:', err); return []; }),
        accountingApi.getDeposits().catch((err) => { console.error('Failed to load deposits:', err); return []; }),
        accountingApi.getRefunds().catch((err) => { console.error('Failed to load refunds:', err); return []; }),
        accountingApi.getCredits().catch((err) => { console.error('Failed to load credits:', err); return []; }),
        accountingApi.getInvoices().catch((err) => { console.error('Failed to load invoices:', err); return []; }),
        accountingApi.getPayables().catch((err) => { console.error('Failed to load payables:', err); return []; }),
        accountingApi.getDriverBalances().catch((err) => { console.error('Failed to load balances:', err); return []; }),
        accountingApi.getVendors().catch((err) => { console.error('Failed to load vendors:', err); return []; }),
        accountingApi.getStats().catch(() => null)
      ]);

      setCharges(Array.isArray(chargesData) ? chargesData : []);
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      setDeposits(Array.isArray(depositsData) ? depositsData : []);
      setRefunds(Array.isArray(refundsData) ? refundsData : []);
      setCredits(Array.isArray(creditsData) ? creditsData : []);
      setInvoices(Array.isArray(invoicesData) ? invoicesData : []);
      setPayables(Array.isArray(payablesData) ? payablesData : []);
      setExpenses(Array.isArray(payablesData) ? payablesData : []);
      setDbDriverBalances(Array.isArray(balancesData) ? balancesData : []);
      setVendors(Array.isArray(vendorsData) && vendorsData.length > 0 ? vendorsData : initialVendors);
      if (statsData) setBackendStats(statsData);
    } catch (err) {
      console.error('Accounting API Error:', err);
      setFetchError(err.message || 'Failed to connect to accounting database');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Live KPI Calculations (Strictly excluding deposits from Operating Revenue)
  const totalOperatingRevenue = useMemo(() => {
    if (backendStats?.totalOperatingRevenue !== undefined) {
      return backendStats.totalOperatingRevenue;
    }
    return charges
      .filter((c) => c.status !== 'Reversed' && c.status !== 'Reversed & Offset')
      .reduce((sum, c) => sum + Number(c.amount || 0), 0);
  }, [charges, backendStats]);

  const totalExpenses = useMemo(() => {
    if (backendStats?.totalExpenses !== undefined) {
      return backendStats.totalExpenses;
    }
    return payables
      .filter((p) => p.status !== 'Rejected')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [payables, backendStats]);

  const netProfit = totalOperatingRevenue - totalExpenses;

  const totalPendingAR = useMemo(() => {
    if (backendStats?.totalPendingAR !== undefined) {
      return backendStats.totalPendingAR;
    }
    return invoices
      .filter((i) => i.status === 'Pending' || i.status === 'Overdue' || i.status === 'Partial')
      .reduce((sum, i) => sum + Number(i.balance || i.total || 0), 0);
  }, [invoices, backendStats]);

  const totalEscrowLiability = useMemo(() => {
    if (backendStats?.totalEscrowLiability !== undefined) {
      return backendStats.totalEscrowLiability;
    }
    return deposits
      .filter((d) => d.status !== 'Refunded / Released')
      .reduce((sum, d) => sum + Number(d.balance || d.depositAmount || 0), 0);
  }, [deposits, backendStats]);

  // Driver Balances computation
  const driverBalances = useMemo(() => {
    if (dbDriverBalances && dbDriverBalances.length > 0) {
      return dbDriverBalances;
    }
    const driverNames = Array.from(new Set([
      ...charges.map((c) => c.driver),
      ...payments.map((p) => p.driver),
      ...deposits.map((d) => d.driver),
      ...credits.map((cr) => cr.driver)
    ])).filter(Boolean);

    return driverNames.map((name) => {
      const dCharges = charges
        .filter((c) => c.driver === name && c.status !== 'Reversed' && c.status !== 'Reversed & Offset')
        .reduce((sum, c) => sum + Number(c.amount || 0), 0);

      const dPayments = payments
        .filter((p) => p.driver === name && p.status === 'Paid')
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

      const dCredits = credits
        .filter((c) => c.driver === name && c.status === 'Applied')
        .reduce((sum, c) => sum + Number(c.amount || 0), 0);

      const dDeposit = deposits
        .filter((d) => d.driver === name && d.status !== 'Refunded / Released')
        .reduce((sum, d) => sum + Number(d.balance || 0), 0);

      const netBalance = dCharges - (dPayments + dCredits);

      let status = 'Current / In Good Standing';
      if (netBalance > 500) status = 'Severely Overdue';
      else if (netBalance > 0) status = 'Overdue Balance';
      else if (netBalance < 0) status = 'Credit Balance';

      const dObj = drivers.find((d) => d.name === name);
      const activeRental = rentals.find((r) => r.driver === name || r.customer === name);

      return {
        driver: name,
        driverId: dObj?.id || 'DRV-101',
        vehicle: activeRental ? activeRental.vehicle : (dObj?.vehicle || 'Toyota Camry SE'),
        charges: dCharges,
        payments: dPayments,
        credits: dCredits,
        deposit: dDeposit,
        netBalance: netBalance,
        status: status
      };
    });
  }, [dbDriverBalances, charges, payments, credits, deposits, drivers, rentals]);

  // Trace Total handler (Every total is traceable)
  const handleTraceMetric = (metricKey) => {
    if (metricKey === 'revenue') {
      setTraceData({
        title: 'Operating Rental Revenue',
        totalAmount: totalOperatingRevenue,
        accountCode: '4100 • Operating Rental Revenue (QBO)',
        description: 'Underlying commercial vehicle lease charges, excess mileage, and toll administration line items.',
        sourceTransactions: charges.map((c) => ({
          id: c.id,
          date: c.date,
          driver: c.driver,
          description: c.description,
          category: c.category,
          amount: c.amount,
          status: c.status
        }))
      });
    } else if (metricKey === 'expenses') {
      setTraceData({
        title: 'Fleet & General Operating Expenses',
        totalAmount: totalExpenses,
        accountCode: '5000 / 6000 • Fleet Operating & Administrative OpEx',
        description: 'Vendor bills for fuel, regular maintenance, commercial insurance, and depot leases.',
        sourceTransactions: payables.map((p) => ({
          id: p.id,
          date: p.billDate,
          vendor: p.vendor,
          description: `${p.category} (${p.term})`,
          category: p.category,
          amount: p.amount,
          status: p.status
        }))
      });
    } else if (metricKey === 'profit') {
      setTraceData({
        title: 'Net Operational Profit',
        totalAmount: netProfit,
        accountCode: 'Income Statement Net Flow',
        description: 'Reconciliation of operating revenue inflows less fleet expenditures and general administrative overhead.',
        sourceTransactions: [
          ...charges.map((c) => ({ ...c, amount: c.amount, type: 'Revenue Inflow' })),
          ...payables.map((p) => ({ ...p, amount: -p.amount, type: 'Expense Outflow' }))
        ]
      });
    } else if (metricKey === 'ar') {
      setTraceData({
        title: 'Accounts Receivable (AR)',
        totalAmount: totalPendingAR,
        accountCode: '1100 • Accounts Receivable Clearing',
        description: 'Unsettled commercial corporate invoices and driver overdue account balances.',
        sourceTransactions: invoices.filter((i) => i.status !== 'Paid').map((i) => ({
          id: i.id,
          date: i.date,
          customer: i.customer,
          description: `Invoice for ${i.vehicle}`,
          amount: i.total,
          status: i.status
        }))
      });
    } else if (metricKey === 'deposits') {
      setTraceData({
        title: 'Customer Escrow Deposits (Liability)',
        totalAmount: totalEscrowLiability,
        accountCode: '2100 • Customer Deposits Held in Escrow (Balance Sheet Liability)',
        description: 'Fiduciary security deposits held on trust. Strictly excluded from rental revenue.',
        sourceTransactions: deposits.map((d) => ({
          id: d.id,
          date: d.heldDate,
          driver: d.driver,
          description: `Security deposit for ${d.vehicle} (${d.contractId})`,
          amount: d.balance,
          status: d.status
        }))
      });
    }
  };

  // Trace Driver Ledger handler
  const handleTraceDriver = (driverBal) => {
    const driverCharges = charges.filter((c) => c.driver === driverBal.driver);
    const driverPmts = payments.filter((p) => p.driver === driverBal.driver);
    const driverCr = credits.filter((c) => c.driver === driverBal.driver);

    setTraceData({
      title: `${driverBal.driver} • Account Ledger`,
      totalAmount: driverBal.netBalance,
      accountCode: `Subledger: ${driverBal.driverId}`,
      description: `Complete statement audit of debits, remittances, and credit adjustments for ${driverBal.driver}.`,
      sourceTransactions: [
        ...driverCharges.map((c) => ({ id: c.id, date: c.date, description: c.description, amount: c.amount, status: c.status })),
        ...driverPmts.map((p) => ({ id: p.id, date: p.date, description: `Payment: ${p.method} (${p.refNumber})`, amount: -p.amount, status: p.status })),
        ...driverCr.map((cr) => ({ id: cr.id, date: cr.date, description: `Credit: ${cr.type} (${cr.reason})`, amount: -cr.amount, status: cr.status }))
      ]
    });
  };

  // -----------------------------------------------------------------
  // LIVE DATABASE ACTIONS
  // -----------------------------------------------------------------

  // Post Charge
  const handleAddCharge = async (chargeData) => {
    setIsSubmitting(true);
    try {
      await accountingApi.createCharge(chargeData);
      setNotification(`Charge "${chargeData.category}" ($${Number(chargeData.amount).toFixed(2)}) posted to database!`);
      await loadData();
    } catch (err) {
      console.error('Failed to post charge:', err);
      setNotification(`Error: ${err.message || 'Failed to post charge'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Record Payment
  const handleSavePayment = async (newPayment) => {
    setIsSubmitting(true);
    try {
      const created = await accountingApi.createPayment(newPayment);
      setSelectedPaymentReceipt(created || newPayment);
      setNotification(`Payment of $${Number(newPayment.amount).toFixed(2)} recorded in database!`);
      setIsPaymentModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Failed to record payment:', err);
      setNotification(`Error: ${err.message || 'Failed to record payment'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Deposit (Escrow Liability)
  const handleAddDeposit = async (newDep) => {
    setIsSubmitting(true);
    try {
      await accountingApi.createDeposit(newDep);
      setNotification(`Security deposit of $${Number(newDep.depositAmount || newDep.amount).toFixed(2)} held in escrow database.`);
      await loadData();
    } catch (err) {
      console.error('Failed to record deposit:', err);
      setNotification(`Error: ${err.message || 'Failed to record deposit'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Release Security Deposit (Refund disbursement)
  const handleReleaseDeposit = async (depId) => {
    setIsSubmitting(true);
    try {
      await accountingApi.releaseDeposit(depId, {
        reason: 'Lease concluded; deposit released from escrow.'
      });
      setNotification('Security deposit released from escrow and refund recorded in database.');
      await loadData();
    } catch (err) {
      console.error('Failed to release deposit:', err);
      setNotification(`Error: ${err.message || 'Failed to release deposit'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Refund
  const handleAddRefund = async (newRef) => {
    setIsSubmitting(true);
    try {
      await accountingApi.createRefund(newRef);
      setNotification(`Refund of $${Number(newRef.amount).toFixed(2)} recorded in database.`);
      await loadData();
    } catch (err) {
      console.error('Failed to record refund:', err);
      setNotification(`Error: ${err.message || 'Failed to record refund'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Credit / Adjustment
  const handleAddCredit = async (newCr) => {
    setIsSubmitting(true);
    try {
      await accountingApi.createCredit(newCr);
      setNotification(`Credit adjustment of $${Number(newCr.amount).toFixed(2)} applied in database.`);
      await loadData();
    } catch (err) {
      console.error('Failed to add credit:', err);
      setNotification(`Error: ${err.message || 'Failed to add credit'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Invoice
  const handleSaveInvoice = async (newInv) => {
    setIsSubmitting(true);
    try {
      await accountingApi.createInvoice(newInv);
      setNotification(`Invoice created and saved in database.`);
      setIsInvoiceModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Failed to save invoice:', err);
      setNotification(`Error: ${err.message || 'Failed to save invoice'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Payable Bill / Expense
  const handleAddPayable = async (newP) => {
    setIsSubmitting(true);
    try {
      await accountingApi.createPayable(newP);
      setNotification(`Vendor payable bill "${newP.category}" ($${Number(newP.amount).toFixed(2)}) recorded in database.`);
      await loadData();
    } catch (err) {
      console.error('Failed to record payable:', err);
      setNotification(`Error: ${err.message || 'Failed to record payable'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprovePayable = async (id) => {
    setIsSubmitting(true);
    try {
      await accountingApi.updatePayableStatus(id, 'approved');
      setNotification(`Payable bill approved for payment.`);
      await loadData();
    } catch (err) {
      console.error('Failed to approve payable:', err);
      setNotification(`Error: ${err.message || 'Failed to approve payable'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkPayablePaid = async (id) => {
    setIsSubmitting(true);
    try {
      await accountingApi.updatePayableStatus(id, 'paid');
      setNotification(`Payable bill settled and marked as Paid in database.`);
      await loadData();
    } catch (err) {
      console.error('Failed to mark payable as paid:', err);
      setNotification(`Error: ${err.message || 'Failed to mark payable paid'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Expense from ExpenseModal
  const handleSaveExpense = async (newExp) => {
    setIsSubmitting(true);
    try {
      await accountingApi.createPayable(newExp);
      setNotification(`Expense ${newExp.vendor || 'Vendor'} ($${Number(newExp.amount || 0).toLocaleString()}) logged in database.`);
      setIsExpenseModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Failed to log expense:', err);
      setNotification(`Error: ${err.message || 'Failed to log expense'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmApproval = async ({ id, status, approvedBy }) => {
    setIsSubmitting(true);
    try {
      await accountingApi.updatePayableStatus(id, status);
      setNotification(`Expense ${id} status updated to ${status}.`);
      setApprovalModalData(null);
      await loadData();
    } catch (err) {
      console.error('Failed to update expense approval:', err);
      setNotification(`Error: ${err.message || 'Failed to update approval'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCorrection = async (updatedExpense) => {
    setIsSubmitting(true);
    try {
      await accountingApi.updatePayableStatus(updatedExpense.id, updatedExpense.status || 'approved');
      setNotification(`Expense ${updatedExpense.id} updated with audit note.`);
      setCorrectingExpense(null);
      await loadData();
    } catch (err) {
      console.error('Failed to correct expense:', err);
      setNotification(`Error: ${err.message || 'Failed to correct expense'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reverse / Correct handler (Audit Compliance & Immutability)
  const handleConfirmReversal = async (originalTx, linkedCorrection) => {
    setIsSubmitting(true);
    try {
      await accountingApi.reverseTransaction({
        originalTxId: originalTx.id,
        reason: linkedCorrection.reason,
        authorizedBy: linkedCorrection.authorizedBy,
        reversalDate: linkedCorrection.date
      });
      setNotification(`Transaction ${originalTx.id} reversed. Linked correction entry created in database.`);
      setReversingTx(null);
      await loadData();
    } catch (err) {
      console.error('Failed to reverse transaction:', err);
      setNotification(`Error: ${err.message || 'Failed to reverse transaction'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0A1E42] tracking-tight">Payments &amp; Accounting</h1>
          <p className="text-xs text-slate-500 mt-1">
            Subledger operations, driver balances, deposit escrow liabilities, and QuickBooks Online integration
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Refresh Button */}
          <button
            onClick={() => loadData(false)}
            disabled={isLoading || isSubmitting}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs transition-all cursor-pointer"
            title="Refresh Accounting Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Accounting Sync Toggle Button */}
          <button
            onClick={() => setIsSyncPanelOpen((prev) => !prev)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all active:scale-95 duration-150 cursor-pointer shadow-2xs ${
              isSyncPanelOpen
                ? 'bg-[#071D49] text-white border-[#071D49]'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Building2 className={`w-4 h-4 ${isSyncPanelOpen ? 'text-emerald-400' : 'text-[#075EE8]'}`} />
            <span>Accounting Sync (QBO)</span>
          </button>

          <button
            onClick={() => {
              setPrefilledPaymentDriver('');
              setIsPaymentModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#075EE8] hover:bg-[#0650C7] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95 duration-150 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Record Payment
          </button>
        </div>
      </div>

      {/* Ephemeral Feedback Toast */}
      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 rounded-xl flex items-center justify-between shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification('')} className="text-slate-400 hover:text-slate-600">
            Dismiss
          </button>
        </div>
      )}

      {/* Accounting Sync Panel (Toggleable / Expandable) */}
      {isSyncPanelOpen && (
        <div className="animate-slide-up">
          <AccountingSyncPanel
            charges={charges}
            payments={payments}
            deposits={deposits}
            payables={payables}
          />
        </div>
      )}

      {/* Financial Top KPI Stats (All Traceable per Requirement 7 & Deposits Excluded per Requirement 3) */}
      <AccountingKpis
        totalIncome={totalOperatingRevenue}
        totalExpenses={totalExpenses}
        netProfit={netProfit}
        totalPending={totalPendingAR}
        totalEscrowLiability={totalEscrowLiability}
        onTraceMetric={handleTraceMetric}
      />

      {/* Subpage Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#075EE8] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading & Error States */}
      {isLoading ? (
        <LoadingState message="Loading live financial subledger records from database..." />
      ) : fetchError ? (
        <ErrorState
          title="Accounting Database Connection Error"
          message={fetchError}
          onRetry={() => loadData(true)}
        />
      ) : (
        <>
          {/* TAB 1: Charges */}
          {activeTab === 'charges' && (
            <ChargesTable
              charges={charges}
              onAddCharge={handleAddCharge}
              onOpenReverseModal={(tx) => setReversingTx(tx)}
              drivers={drivers}
              rentals={rentals}
            />
          )}

          {/* TAB 2: Payments */}
          {activeTab === 'payments' && (
            <PaymentsTable
              payments={payments}
              onOpenPaymentModal={() => {
                setPrefilledPaymentDriver('');
                setIsPaymentModalOpen(true);
              }}
              onOpenReceiptModal={(pmt) => setSelectedPaymentReceipt(pmt)}
              onOpenReverseModal={(tx) => setReversingTx(tx)}
            />
          )}

          {/* TAB 3: Deposits (Liability - NOT Revenue) */}
          {activeTab === 'deposits' && (
            <DepositsLiabilityTable
              deposits={deposits}
              onReleaseDeposit={handleReleaseDeposit}
              onOpenReverseModal={(tx) => setReversingTx(tx)}
              onAddDeposit={handleAddDeposit}
              drivers={drivers}
              rentals={rentals}
            />
          )}

          {/* TAB 4: Refunds */}
          {activeTab === 'refunds' && (
            <RefundsTable
              refunds={refunds}
              onAddRefund={handleAddRefund}
              onOpenReverseModal={(tx) => setReversingTx(tx)}
              drivers={drivers}
            />
          )}

          {/* TAB 5: Credits/Adjustments */}
          {activeTab === 'credits' && (
            <CreditsAdjustmentsTable
              credits={credits}
              onAddCredit={handleAddCredit}
              onOpenReverseModal={(tx) => setReversingTx(tx)}
              drivers={drivers}
            />
          )}

          {/* TAB 6: Balances */}
          {activeTab === 'balances' && (
            <BalancesTable
              driverBalances={driverBalances}
              onRecordPaymentForDriver={(driverName) => {
                setPrefilledPaymentDriver(driverName);
                setIsPaymentModalOpen(true);
              }}
              onTraceDriver={handleTraceDriver}
            />
          )}

          {/* TAB 7: Invoices */}
          {activeTab === 'invoices' && (
            <InvoicesTable
              invoices={invoices}
              onOpenCreateModal={() => setIsInvoiceModalOpen(true)}
              onSelectInvoiceForPrint={(inv) => setSelectedInvoiceForPrint(inv)}
              onOpenReverseModal={(tx) => setReversingTx(tx)}
            />
          )}

          {/* TAB 8: Receivables (AR) */}
          {activeTab === 'receivables' && (
            <ReceivablesTable
              invoices={invoices}
              charges={charges}
              onRecordPayment={(debtor) => {
                setPrefilledPaymentDriver(debtor);
                setIsPaymentModalOpen(true);
              }}
              onTraceAR={(title, total, items) => {
                setTraceData({
                  title,
                  totalAmount: total,
                  accountCode: '1100 • Accounts Receivable Clearing',
                  description: 'Open customer balances and overdue accounts receivable.',
                  sourceTransactions: items.map((i) => ({
                    id: i.docId,
                    date: i.dueDate,
                    customer: i.debtor,
                    description: `${i.refType} for ${i.vehicle}`,
                    amount: i.openBalance,
                    status: i.status
                  }))
                });
              }}
            />
          )}

          {/* TAB 9: Payables (AP) & Fleet Operating Expenses */}
          {activeTab === 'payables' && (
            <PayablesTable
              payables={payables}
              expenses={expenses}
              onAddPayable={handleAddPayable}
              onApprovePayable={handleApprovePayable}
              onMarkPayablePaid={handleMarkPayablePaid}
              onOpenReverseModal={(tx) => setReversingTx(tx)}
              onOpenExpenseModal={() => setIsExpenseModalOpen(true)}
              onOpenApprovalModal={(exp, actionType) => setApprovalModalData({ expense: exp, actionType })}
              onOpenCorrectionModal={(exp) => setCorrectingExpense(exp)}
              vendors={vendors}
              onTraceAP={(title, total, items) => {
                setTraceData({
                  title,
                  totalAmount: total,
                  accountCode: '2000 • Accounts Payable (AP)',
                  description: 'Outstanding vendor bills for fuel, fleet maintenance, and insurance.',
                  sourceTransactions: items.map((p) => ({
                    id: p.id,
                    date: p.dueDate,
                    vendor: p.vendor,
                    description: `${p.category} (${p.term})`,
                    amount: p.amount,
                    status: p.status
                  }))
                });
              }}
            />
          )}

          {/* TAB 10: Reports (P&L and Balance Sheet with Official Label) */}
          {activeTab === 'reports' && (
            <FinancialReportsTab
              charges={charges}
              payables={payables}
              invoices={invoices}
              deposits={deposits}
              operatingRevenue={totalOperatingRevenue}
              totalExpenses={totalExpenses}
              netProfit={netProfit}
              pendingAR={totalPendingAR}
              escrowLiability={totalEscrowLiability}
            />
          )}
        </>
      )}

      {/* Payment Entry Form Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSavePayment={handleSavePayment}
        drivers={drivers}
        rentals={rentals}
        initialDriver={prefilledPaymentDriver}
      />

      {/* Printable Payment Receipt Modal */}
      <PaymentReceiptModal
        selectedPayment={selectedPaymentReceipt}
        onClose={() => setSelectedPaymentReceipt(null)}
      />

      {/* Reverse / Correct Transaction Modal */}
      <ReverseTransactionModal
        isOpen={!!reversingTx}
        onClose={() => setReversingTx(null)}
        transaction={reversingTx}
        onConfirmReversal={handleConfirmReversal}
      />

      {/* Traceable Transactions Audit Modal */}
      <TraceTransactionsModal
        isOpen={!!traceData}
        onClose={() => setTraceData(null)}
        traceData={traceData}
      />

      {/* Invoice Creation Modal */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onSave={handleSaveInvoice}
      />

      {/* Printable Invoice Modal */}
      <InvoicePrintModal
        selectedInvoice={selectedInvoiceForPrint}
        onClose={() => setSelectedInvoiceForPrint(null)}
      />

      {/* Log Operating Fleet Expense Modal */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSaveExpense={handleSaveExpense}
        existingExpenses={expenses}
        vehicles={vehicles}
        drivers={drivers}
        vendors={vendors}
      />

      {/* Expense Approval / Rejection Workflow Modal */}
      <ExpenseApprovalModal
        isOpen={!!approvalModalData}
        onClose={() => setApprovalModalData(null)}
        expense={approvalModalData?.expense}
        actionType={approvalModalData?.actionType}
        onConfirm={handleConfirmApproval}
      />

      {/* Expense Correction Modal */}
      <ExpenseCorrectionModal
        isOpen={!!correctingExpense}
        onClose={() => setCorrectingExpense(null)}
        expense={correctingExpense}
        onConfirmCorrection={handleConfirmCorrection}
      />
    </div>
  );
}
