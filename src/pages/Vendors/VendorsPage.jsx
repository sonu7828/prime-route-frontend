import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Plus,
  Download,
  Search,
  Filter,
  Eye,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Briefcase,
  DollarSign,
  FileText,
  SlidersHorizontal,
  ExternalLink,
  ShieldCheck,
  Tag,
  Trash2,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
  PowerOff,
  ShieldAlert,
  FolderOpen,
  Info
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { FormInput, FormSelect, FormTextarea } from '../../components/forms/FormInputs';
import { formatCurrency } from '../../utils/formatters';
import { exportToCsv } from '../../utils/exportCsv';
import Can from '../../auth/Can';
import VendorDetailsModal from './components/VendorDetailsModal';
import { vendorsApi } from '../../api/vendorsApi';
import { accountingApi } from '../../api/accountingApi';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';

const SERVICE_CATEGORIES = [
  { id: 'All', label: 'All Services' },
  { id: 'repairs', label: 'Repairs & Mechanical' },
  { id: 'other', label: 'Fuel & EV Charging' },
  { id: 'insurance', label: 'Insurance & Underwriting' },
  { id: 'tires', label: 'Tires & Alignment' },
  { id: 'tolls', label: 'Tolls & Transponders' },
  { id: 'software', label: 'Software & Telematics' },
  { id: 'towing', label: 'Towing & Roadside' },
  { id: 'cleaning', label: 'Detailing & Wash' }
];

// Module-level in-memory cache to prevent redundant re-fetching on page switch
let _vendorsCache = null;
let _vendorsInFlight = null;

export default function VendorsPage() {
  const [vendors, setVendors] = useState(() => _vendorsCache?.vendors || []);
  const [stats, setStats] = useState(() => _vendorsCache?.stats || null);
  const [allPayables, setAllPayables] = useState(() => _vendorsCache?.allPayables || []);
  const [isLoading, setIsLoading] = useState(!_vendorsCache);
  const [fetchError, setFetchError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [deletingVendor, setDeletingVendor] = useState(null);
  const [notification, setNotification] = useState('');

  const [newVendor, setNewVendor] = useState({
    name: '',
    category: 'repairs',
    services: '',
    contact: '',
    phone: '',
    email: '',
    address: '',
    terms: 'Net 30',
    notes: ''
  });

  const loadVendorsData = async (forceRefresh = false) => {
    if (_vendorsCache && !forceRefresh) {
      setVendors(_vendorsCache.vendors);
      setStats(_vendorsCache.stats);
      setAllPayables(_vendorsCache.allPayables);
      setIsLoading(false);
      return;
    }

    if (!_vendorsCache) {
      setIsLoading(true);
    }
    setFetchError(null);

    if (_vendorsInFlight) {
      try {
        const result = await _vendorsInFlight;
        setVendors(result.vendors);
        setStats(result.stats);
        setAllPayables(result.allPayables);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    _vendorsInFlight = (async () => {
      const [vendorsRes, payablesRes] = await Promise.all([
        vendorsApi.getVendors(),
        accountingApi.getPayables().catch(() => [])
      ]);
      const result = {
        vendors: vendorsRes.vendors || [],
        stats: vendorsRes.stats || null,
        allPayables: payablesRes || []
      };
      _vendorsCache = result;
      return result;
    })();

    try {
      const result = await _vendorsInFlight;
      setVendors(result.vendors);
      setStats(result.stats);
      setAllPayables(result.allPayables);
    } catch (err) {
      console.error('Failed to load vendors:', err);
      setFetchError(err.message || 'Failed to connect to vendors API');
    } finally {
      _vendorsInFlight = null;
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVendorsData();
  }, []);

  // Filter vendors based on search and filters
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        (v.name && v.name.toLowerCase().includes(q)) ||
        (v.services && v.services.toLowerCase().includes(q)) ||
        (v.contact && v.contact.toLowerCase().includes(q)) ||
        (v.phone && v.phone.toLowerCase().includes(q)) ||
        (v.email && v.email.toLowerCase().includes(q)) ||
        (v.address && v.address.toLowerCase().includes(q)) ||
        (v.notes && v.notes.toLowerCase().includes(q));

      const matchesCategory =
        categoryFilter === 'All' || v.category === categoryFilter;

      const matchesStatus =
        statusFilter === 'All' || v.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [vendors, searchQuery, categoryFilter, statusFilter]);

  // Overall metrics
  const totalVendors = stats?.totalVendors ?? vendors.length;
  const activeVendors = stats?.activeVendors ?? vendors.filter((v) => (v.status || '').includes('Active')).length;
  const totalSpendYTD = stats?.totalSpendYTD ?? vendors.reduce((sum, v) => sum + Number(v.spendYTD || 0), 0);
  const standardTerms = stats?.standardTerms ?? 'Net 30';

  const handleExport = () => {
    exportToCsv('PrimeRoute_Vendors_Directory', filteredVendors);
  };

  const handleCreateVendor = async (e) => {
    e.preventDefault();
    if (!newVendor.name || !newVendor.contact) return;

    setIsSubmitting(true);
    try {
      const vendorRecord = await vendorsApi.createVendor({
        name: newVendor.name,
        category: newVendor.category,
        services: newVendor.services || 'General Fleet Support',
        contact: newVendor.contact,
        phone: newVendor.phone,
        email: newVendor.email,
        address: newVendor.address,
        terms: newVendor.terms || 'Net 30',
        notes: newVendor.notes
      });

      setIsAddVendorOpen(false);
      setNewVendor({
        name: '',
        category: 'repairs',
        services: '',
        contact: '',
        phone: '',
        email: '',
        address: '',
        terms: 'Net 30',
        notes: ''
      });
      setNotification(`Vendor ${vendorRecord.name} (${vendorRecord.id}) onboarded successfully into database.`);
      await loadVendorsData(true);
      setTimeout(() => setNotification(''), 4000);
    } catch (err) {
      console.error('Failed to create vendor:', err);
      setNotification(`Error: ${err.message || 'Failed to onboard vendor'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVendor = async (vendor) => {
    setIsSubmitting(true);
    try {
      const res = await vendorsApi.deleteVendor(vendor.id);
      const isDeactivated = res?.deactivated || res?.message?.includes('deactivated');
      setNotification({
        type: isDeactivated ? 'warning' : 'success',
        text: res?.message || `Vendor ${vendor.name} updated.`,
        financialRecords: res?.financialRecords
      });
      setDeletingVendor(null);
      await loadVendorsData(true);
      setTimeout(() => setNotification(null), 6000);
    } catch (err) {
      console.error('Failed to delete vendor:', err);
      setNotification({
        type: 'error',
        text: `Error: ${err.message || 'Failed to update vendor'}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReactivateVendor = async (vendor) => {
    setIsSubmitting(true);
    try {
      await vendorsApi.reactivateVendor(vendor.id);
      setNotification({
        type: 'success',
        text: `Vendor ${vendor.name} (${vendor.id}) reactivated successfully to Active Partner.`
      });
      await loadVendorsData(true);
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      console.error('Failed to reactivate vendor:', err);
      setNotification({
        type: 'error',
        text: `Error: ${err.message || 'Failed to reactivate vendor'}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-black text-[#0A1E42] tracking-tight">Vendors &amp; Suppliers Directory</h1>
            <span className="text-xs font-bold px-3 py-1 rounded-xl bg-blue-50 text-[#075EE8] border border-blue-100 shadow-2xs">
              {filteredVendors.length} Registered Partners
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Approved body repair shops, parts distributors, fuel programs, commercial underwriters, and municipal tollway gateways
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => loadVendorsData(true)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
            title="Reload from MySQL database"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Directory CSV</span>
          </button>

          <Can module="vendors" do="add">
            <button
              onClick={() => setIsAddVendorOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#075EE8] hover:bg-[#0650C7] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95 duration-150 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Onboard New Vendor</span>
            </button>
          </Can>
        </div>
      </div>

      {/* Ephemeral Feedback Toast */}
      {notification && (
        <div className={`p-4 border rounded-2xl flex items-start justify-between gap-3 shadow-md animate-fade-in ${
          (typeof notification === 'object' && notification.type === 'warning')
            ? 'bg-amber-50 border-amber-200 text-amber-950'
            : (typeof notification === 'object' && notification.type === 'error')
            ? 'bg-rose-50 border-rose-200 text-rose-950'
            : 'bg-emerald-50 border-emerald-200 text-emerald-950'
        }`}>
          <div className="flex items-start gap-2.5">
            {typeof notification === 'object' && notification.type === 'warning' ? (
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            ) : typeof notification === 'object' && notification.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="text-xs font-bold leading-relaxed">
                {typeof notification === 'object' ? notification.text : notification}
              </p>
              {typeof notification === 'object' && notification.type === 'warning' && (
                <p className="text-[11px] text-amber-800 font-medium">
                  Financial Audit Footprint: Recorded in <strong>Payments &amp; Accounting (/accounting) &gt; Payables (AP)</strong>. Ledger integrity &amp; tax compliance preserved.
                </p>
              )}
            </div>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600 p-1 text-xs font-bold cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Loading & Error States */}
      {isLoading ? (
        <LoadingState message="Loading approved vendor partners and live spend from database..." />
      ) : fetchError ? (
        <ErrorState
          title="Vendor Directory Connection Error"
          message={fetchError}
          onRetry={() => loadVendorsData(true)}
        />
      ) : (
        <>
          {/* KPI Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(7,29,73,0.04)] space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Total Approved Vendors
                </span>
                <Building2 className="w-4 h-4 text-[#075EE8]" />
              </div>
              <div className="text-2xl font-black text-[#0A1E42] font-mono">{totalVendors}</div>
              <p className="text-[10px] text-slate-400">Commercial enterprise partners</p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(7,29,73,0.04)] space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Active Service Hubs
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-700 font-mono">{activeVendors}</div>
              <p className="text-[10px] text-emerald-600">In good standing with contracts</p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(7,29,73,0.04)] space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Cumulative Spend (YTD)
                </span>
                <DollarSign className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-black text-rose-600 font-mono">{formatCurrency(totalSpendYTD)}</div>
              <p className="text-[10px] text-slate-400">Total vendor disbursements</p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(7,29,73,0.04)] space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Standard Terms
                </span>
                <ShieldCheck className="w-4 h-4 text-[#075EE8]" />
              </div>
              <div className="text-2xl font-black text-[#0A1E42] font-mono">{standardTerms}</div>
              <p className="text-[10px] text-slate-400">Automated ACH &amp; Escrow clearing</p>
            </div>
          </div>

          {/* Directory Table Container */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(7,29,73,0.04)] overflow-hidden space-y-4">
            {/* Table Filter & Search Controls */}
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#F8FAFC]">
              {/* Service Categories Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                {SERVICE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                      categoryFilter === cat.id
                        ? 'bg-[#075EE8] text-white shadow-2xs font-bold'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="w-full md:w-72">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search vendor name, contact, address..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#075EE8]/20 focus:border-[#075EE8]"
                  />
                </div>
              </div>
            </div>

            {/* Directory Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Vendor &amp; ID</th>
                    <th className="py-3.5 px-4">Services Provided</th>
                    <th className="py-3.5 px-4">Contact Person</th>
                    <th className="py-3.5 px-4">Phone &amp; Email</th>
                    <th className="py-3.5 px-4">Physical Address</th>
                    <th className="py-3.5 px-4">Payment Terms</th>
                    <th className="py-3.5 px-4 text-right">Spend (YTD)</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredVendors.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-12 text-center text-slate-400">
                        <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold">No vendors match your search.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredVendors.map((v) => (
                      <tr
                        key={v.id}
                        className="hover:bg-blue-50/20 transition-colors group cursor-pointer"
                        onClick={() => setSelectedVendor(v)}
                      >
                        {/* Name & ID */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-[#0A1E42] block text-sm group-hover:text-[#075EE8] transition-colors">
                            {v.name}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">{v.id}</span>
                        </td>

                        {/* Services */}
                        <td className="py-3.5 px-4 text-slate-700 max-w-[200px]">
                          <span className="font-medium block">{v.services}</span>
                          <span className="text-[10px] text-slate-400 capitalize">{v.category}</span>
                        </td>

                        {/* Contact Person */}
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {v.contact || 'N/A'}
                        </td>

                        {/* Phone & Email */}
                        <td className="py-3.5 px-4 text-slate-600">
                          <div className="flex items-center gap-1 font-mono text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{v.phone || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{v.email || 'N/A'}</span>
                          </div>
                        </td>

                        {/* Address */}
                        <td className="py-3.5 px-4 text-slate-600 max-w-[180px] truncate" title={v.address}>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{v.address || 'N/A'}</span>
                          </div>
                        </td>

                        {/* Terms */}
                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                            {v.terms || 'Net 30'}
                          </span>
                        </td>

                        {/* Spend YTD */}
                        <td className="py-3.5 px-4 text-right font-extrabold text-[#0A1E42] font-mono">
                          {formatCurrency(v.spendYTD || 0)}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex flex-col items-center">
                            {v.status === 'Inactive' ? (
                              <button
                                type="button"
                                onClick={() => handleReactivateVendor(v)}
                                title="Click to Reactivate Vendor to Active Partner"
                                className="group/badge cursor-pointer"
                              >
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 group-hover/badge:bg-emerald-50 group-hover/badge:text-emerald-700 group-hover/badge:border-emerald-300 transition-all shadow-2xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 group-hover/badge:bg-emerald-500" />
                                  <span className="group-hover/badge:hidden">Inactive</span>
                                  <span className="hidden group-hover/badge:inline flex items-center gap-1">
                                    <RotateCcw className="w-3 h-3" /> Reactivate?
                                  </span>
                                </span>
                              </button>
                            ) : (
                              <StatusBadge status={v.status || 'Active Partner'} />
                            )}
                            {v.spendYTD > 0 && (
                              <button
                                type="button"
                                onClick={() => setSelectedVendor(v)}
                                className="text-[10px] text-slate-400 hover:text-[#075EE8] font-mono mt-1 hover:underline cursor-pointer flex items-center gap-1"
                                title="Financial records located in Accounting -> Payables (AP). Click to view in Dossier."
                              >
                                <FolderOpen className="w-3 h-3 text-[#075EE8]" />
                                <span>In Accounting: {formatCurrency(v.spendYTD)}</span>
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {v.status === 'Inactive' && (
                              <button
                                type="button"
                                onClick={() => handleReactivateVendor(v)}
                                disabled={isSubmitting}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
                                title="Reactivate this vendor back to Active Partner"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Reactivate</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedVendor(v)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#075EE8]/10 hover:bg-[#075EE8] text-[#075EE8] hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                              title="View Vendor Dossier with Invoices, Payments & Spending History"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Dossier</span>
                            </button>
                            {/* If Active, show Deactivate/Delete button; If Inactive with zero spend, allow permanent delete; If Inactive with spend, already deactivated */}
                            {v.status !== 'Inactive' ? (
                              <button
                                type="button"
                                onClick={() => setDeletingVendor(v)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Deactivate / Delete Vendor"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : v.spendYTD === 0 ? (
                              <button
                                type="button"
                                onClick={() => setDeletingVendor(v)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Permanently Delete (Zero financial records)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Vendor Details Modal with Tabs: Invoices, Payments, Spending History */}
      {selectedVendor && (
        <VendorDetailsModal
          isOpen={!!selectedVendor}
          onClose={() => setSelectedVendor(null)}
          vendor={selectedVendor}
          allExpenses={allPayables}
          allPayables={allPayables}
          onVendorUpdated={async () => {
            await loadVendorsData(true);
          }}
        />
      )}

      {/* Onboard Vendor Modal */}
      <Modal
        isOpen={isAddVendorOpen}
        onClose={() => setIsAddVendorOpen(false)}
        title="Onboard New Fleet Vendor / Service Partner"
        subtitle="Register commercial repair facility, parts jobber, or municipal agency into approved vendor master"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateVendor} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput
              label="Company / Vendor Name"
              value={newVendor.name}
              onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
              placeholder="e.g. Apex Collision Center"
              required
            />
            <FormSelect
              label="Primary Service Category"
              value={newVendor.category}
              onChange={(e) => setNewVendor({ ...newVendor, category: e.target.value })}
              options={[
                'repairs',
                'tires',
                'other',
                'insurance',
                'tolls',
                'software',
                'towing',
                'cleaning'
              ]}
            />
          </div>

          <FormInput
            label="Specific Services Provided"
            value={newVendor.services}
            onChange={(e) => setNewVendor({ ...newVendor, services: e.target.value })}
            placeholder="e.g. Frame straightening, paint booths, aluminum body repair"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormInput
              label="Contact Representative"
              value={newVendor.contact}
              onChange={(e) => setNewVendor({ ...newVendor, contact: e.target.value })}
              placeholder="e.g. Frank Castle"
              required
            />
            <FormInput
              label="Phone Number"
              value={newVendor.phone}
              onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
              required
            />
            <FormInput
              label="Billing Email"
              type="email"
              value={newVendor.email}
              onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
              placeholder="billing@vendor.com"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput
              label="Physical Service Facility Address"
              value={newVendor.address}
              onChange={(e) => setNewVendor({ ...newVendor, address: e.target.value })}
              placeholder="123 Industrial Pkwy, City, State ZIP"
              required
            />
            <FormSelect
              label="Agreed Credit Terms"
              value={newVendor.terms}
              onChange={(e) => setNewVendor({ ...newVendor, terms: e.target.value })}
              options={['Net 30', 'Net 15', 'Net 20 Auto-Debit', 'Quarterly ACH', 'Weekly Account', 'Due Upon Receipt']}
            />
          </div>

          <FormTextarea
            label="Vendor Profile Notes / Contract Agreements"
            value={newVendor.notes}
            onChange={(e) => setNewVendor({ ...newVendor, notes: e.target.value })}
            placeholder="Special commercial rates, insurance policy details, warranty agreements..."
            rows={2}
          />

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddVendorOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#075EE8] hover:bg-[#0650C7] text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering...' : 'Register Vendor Partner'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete / Deactivate Confirmation Modal */}
      {deletingVendor && (() => {
        const vName = (deletingVendor.name || '').toLowerCase();
        const matchedPayables = (allPayables || []).filter(
          (p) =>
            (p.vendor || '').toLowerCase() === vName ||
            (p.vendorId && String(p.vendorId) === String(deletingVendor.rawId || deletingVendor.id)) ||
            (p.vendor_id && String(p.vendor_id) === String(deletingVendor.rawId || deletingVendor.id))
        );
        const hasFinancials = Number(deletingVendor.spendYTD || 0) > 0 || matchedPayables.length > 0;

        return (
          <Modal
            isOpen={!!deletingVendor}
            onClose={() => setDeletingVendor(null)}
            title={hasFinancials ? 'Deactivate Vendor (Accounting Safeguard)' : 'Permanently Delete Vendor'}
            subtitle={`Vendor Master Record: ${deletingVendor.name} (${deletingVendor.id})`}
            maxWidth="max-w-lg"
          >
            <div className="space-y-4">
              {hasFinancials ? (
                <>
                  {/* Accounting Safeguard Warning */}
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-950 space-y-1.5 leading-relaxed">
                      <p className="font-bold text-sm text-amber-950">
                        Permanent Deletion Blocked by Accounting Safeguard
                      </p>
                      <p>
                        <strong>{deletingVendor.name}</strong> cannot be permanently deleted from the database because it has existing financial records recorded in the general ledger.
                      </p>
                      <div className="p-2.5 rounded-xl bg-amber-100/70 border border-amber-200/60 text-amber-900 font-medium">
                        ✓ <strong>Action to be performed:</strong> This partner will be marked as <strong className="text-rose-700">Inactive</strong>. It will be disabled for future fleet operations, but all historic vouchers, invoices, and accounting records will remain safely preserved.
                      </div>
                    </div>
                  </div>

                  {/* Financial Audit Trail Footprint Box */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <FolderOpen className="w-4 h-4 text-[#075EE8]" />
                        Financial Records Location
                      </span>
                      <span className="font-mono text-xs font-black text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200">
                        Spend YTD: {formatCurrency(deletingVendor.spendYTD || 0)}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="flex items-center justify-between text-[11px] py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Module Location:</span>
                        <strong className="text-slate-800">Payments &amp; Accounting (/accounting) &gt; Payables (AP)</strong>
                      </div>
                      <div className="flex items-center justify-between text-[11px] py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Ledger Invoices / Bills:</span>
                        <strong className="text-slate-800">{matchedPayables.length > 0 ? `${matchedPayables.length} bills on file` : 'Recorded in Expenses Table'}</strong>
                      </div>
                      <div className="flex items-center justify-between text-[11px] py-1">
                        <span className="text-slate-500">Primary Service:</span>
                        <span className="font-semibold text-slate-700">{deletingVendor.services || deletingVendor.category}</span>
                      </div>
                    </div>

                    {/* Quick Link to Dossier */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const v = deletingVendor;
                          setDeletingVendor(null);
                          setSelectedVendor(v);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-white hover:bg-blue-50 text-[#075EE8] border border-blue-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Inspect Invoices &amp; Ledger Bills in Dossier</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-900 space-y-1">
                    <p className="font-bold">Confirm Permanent Deletion</p>
                    <p className="leading-relaxed">
                      Are you sure you want to permanently remove <strong>{deletingVendor.name}</strong> ({deletingVendor.id})?
                      This vendor has no recorded expenses or invoices in the accounting ledger and will be completely deleted from the database.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeletingVendor(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleDeleteVendor(deletingVendor)}
                  className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                    hasFinancials
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25'
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25'
                  }`}
                >
                  {hasFinancials ? (
                    <>
                      <PowerOff className="w-4 h-4" />
                      <span>{isSubmitting ? 'Deactivating...' : 'Deactivate Vendor (Set Inactive)'}</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>{isSubmitting ? 'Deleting...' : 'Permanently Delete Vendor'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}
