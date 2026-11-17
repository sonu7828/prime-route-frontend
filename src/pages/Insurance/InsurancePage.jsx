import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShieldCheck,
  Plus,
  Download,
  Filter,
  Calendar,
  AlertTriangle,
  Clock,
  ShieldAlert,
  FileCheck,
  Layers,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import ComplianceTable from './components/ComplianceTable';
import PoliciesView from './components/PoliciesView';
import ClaimsView from './components/ClaimsView';
import PolicyModal from './components/PolicyModal';
import ClaimModal from './components/ClaimModal';
import RenewComplianceModal from './components/RenewComplianceModal';
import AddComplianceModal from './components/AddComplianceModal';
import { useFleet } from '../../context/FleetContext';
import { insuranceApi } from '../../api/insuranceApi';
import { exportToCsv } from '../../utils/exportCsv';
import { formatCurrency } from '../../utils/formatters';
import Can from '../../auth/Can';

const COMPLIANCE_CATEGORIES = [
  'All Categories',
  'Vehicle Registration',
  'Driver License',
  'Rental Contract',
  'Required Document'
];

const URGENCY_FILTERS = [
  'All Urgencies',
  'Critical (≤7 days)',
  'Due Soon (≤14 days)',
  'Upcoming (≤30 days)',
  'Compliant (>30 days)'
];

export default function InsurancePage() {
  const { accidents: contextAccidents, vehicles, drivers } = useFleet();

  // Active Tab: 'compliance' | 'policies' | 'claims'
  const [activeTab, setActiveTab] = useState('compliance');

  // Live Database State for Policies, Claims, and Compliance items
  const [policies, setPolicies] = useState([]);
  const [claims, setClaims] = useState([]);
  const [complianceItems, setComplianceItems] = useState([]);
  const [accidents, setAccidents] = useState([]);
  const [backendStats, setBackendStats] = useState(null);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', message: string }

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [urgencyFilter, setUrgencyFilter] = useState('All Urgencies');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isAddComplianceModalOpen, setIsAddComplianceModalOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [selectedComplianceItem, setSelectedComplianceItem] = useState(null);

  // Delete Confirmation State
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    type: null, // 'policy' | 'claim'
    item: null,
    title: '',
    message: ''
  });

  // Auto-dismiss feedback toast
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Load live data from backend API
  const loadData = useCallback(async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    setFetchError(null);
    try {
      const [policiesData, claimsData, complianceData, statsData, accidentsData] = await Promise.all([
        insuranceApi.getPolicies().catch((err) => {
          console.error('Failed to load policies:', err);
          return [];
        }),
        insuranceApi.getClaims().catch((err) => {
          console.error('Failed to load claims:', err);
          return [];
        }),
        insuranceApi.getCompliance().catch((err) => {
          console.error('Failed to load compliance records:', err);
          return [];
        }),
        insuranceApi.getStats().catch(() => null),
        insuranceApi.getAccidents().catch(() => [])
      ]);

      setPolicies(Array.isArray(policiesData) ? policiesData : []);
      setClaims(Array.isArray(claimsData) ? claimsData : []);
      setComplianceItems(Array.isArray(complianceData) ? complianceData : []);
      setAccidents(Array.isArray(accidentsData) && accidentsData.length > 0 ? accidentsData : (contextAccidents || []));
      if (statsData) setBackendStats(statsData);
    } catch (err) {
      console.error('Error fetching insurance and compliance data:', err);
      setFetchError(err.message || 'Failed to connect with insurance database');
    } finally {
      setIsLoading(false);
    }
  }, [contextAccidents]);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Filtered Compliance Items
  const filteredCompliance = useMemo(() => {
    return complianceItems.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        (item.title || '').toLowerCase().includes(q) ||
        (item.entityName || '').toLowerCase().includes(q) ||
        (item.identifier || '').toLowerCase().includes(q) ||
        (item.authority || '').toLowerCase().includes(q) ||
        (item.documentFile || '').toLowerCase().includes(q);

      let matchesCategory = true;
      if (categoryFilter !== 'All Categories') {
        matchesCategory = item.category === categoryFilter;
      }

      let matchesUrgency = true;
      if (urgencyFilter !== 'All Urgencies') {
        if (urgencyFilter.includes('≤7 days')) {
          matchesUrgency = item.daysRemaining <= 7;
        } else if (urgencyFilter.includes('≤14 days')) {
          matchesUrgency = item.daysRemaining > 7 && item.daysRemaining <= 14;
        } else if (urgencyFilter.includes('≤30 days')) {
          matchesUrgency = item.daysRemaining > 14 && item.daysRemaining <= 30;
        } else if (urgencyFilter.includes('>30 days')) {
          matchesUrgency = item.daysRemaining > 30;
        }
      }

      return matchesSearch && matchesCategory && matchesUrgency;
    });
  }, [complianceItems, searchQuery, categoryFilter, urgencyFilter]);

  // Filtered Policies
  const filteredPolicies = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return policies.filter(
      (p) =>
        (p.insurer || '').toLowerCase().includes(q) ||
        (p.policyNumber || '').toLowerCase().includes(q) ||
        (p.coverage || '').toLowerCase().includes(q) ||
        (p.status || '').toLowerCase().includes(q)
    );
  }, [policies, searchQuery]);

  // Filtered Claims
  const filteredClaims = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return claims.filter(
      (c) =>
        (c.claimNumber || '').toLowerCase().includes(q) ||
        (c.insurer || '').toLowerCase().includes(q) ||
        (c.accidentId || '').toLowerCase().includes(q) ||
        (c.vehicle || '').toLowerCase().includes(q) ||
        (c.driver || '').toLowerCase().includes(q) ||
        (c.status || '').toLowerCase().includes(q)
    );
  }, [claims, searchQuery]);

  // Pagination for Compliance Table
  const paginatedCompliance = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCompliance.slice(start, start + pageSize);
  }, [filteredCompliance, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredCompliance.length / pageSize) || 1;

  // Real-time KPI Calculations
  const stats = useMemo(() => {
    if (backendStats) {
      return backendStats;
    }
    const criticalCount = complianceItems.filter((c) => c.daysRemaining <= 7).length;
    const dueSoonCount = complianceItems.filter((c) => c.daysRemaining > 7 && c.daysRemaining <= 14).length;
    const upcomingCount = complianceItems.filter((c) => c.daysRemaining > 14 && c.daysRemaining <= 30).length;
    const openClaimsCount = claims.filter((c) => c.status !== 'Settled').length;
    const totalPremium = policies
      .filter((p) => p.status === 'Active')
      .reduce((sum, p) => sum + (Number(p.premium) || 0), 0);

    return {
      totalCompliance: complianceItems.length,
      criticalCount,
      dueSoonCount,
      upcomingCount,
      totalPremium,
      openClaimsCount,
      totalPolicies: policies.length
    };
  }, [backendStats, complianceItems, claims, policies]);

  // -----------------------------------------------------------------
  // LIVE BACKEND ACTIONS
  // -----------------------------------------------------------------

  // Save Policy (Create or Update)
  const handleSavePolicy = async (policyData) => {
    setIsSubmitting(true);
    try {
      if (selectedPolicy && selectedPolicy.id) {
        await insuranceApi.updatePolicy(selectedPolicy.id, policyData);
        setFeedback({ type: 'success', message: `Policy "${policyData.policyNumber}" updated in database!` });
      } else {
        await insuranceApi.createPolicy(policyData);
        setFeedback({ type: 'success', message: `New policy "${policyData.policyNumber}" created in database!` });
      }
      await loadData();
      setIsPolicyModalOpen(false);
      setSelectedPolicy(null);
    } catch (err) {
      console.error('Failed to save policy:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to save policy' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Request Policy Delete
  const handleRequestDeletePolicy = (policy) => {
    setDeleteDialog({
      isOpen: true,
      type: 'policy',
      item: policy,
      title: 'Delete Fleet Insurance Policy',
      message: `Are you sure you want to permanently delete policy "${policy.policyNumber}" (${policy.insurer}) from the database?`
    });
  };

  // Save Claim (Create or Update)
  const handleSaveClaim = async (claimData) => {
    setIsSubmitting(true);
    try {
      if (selectedClaim && selectedClaim.id) {
        await insuranceApi.updateClaim(selectedClaim.id, claimData);
        setFeedback({ type: 'success', message: `Claim "${claimData.claimNumber}" updated in database!` });
      } else {
        await insuranceApi.createClaim(claimData);
        setFeedback({ type: 'success', message: `New insurance claim "${claimData.claimNumber}" filed and stored in database!` });
      }
      await loadData();
      setIsClaimModalOpen(false);
      setSelectedClaim(null);
    } catch (err) {
      console.error('Failed to save claim:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to save insurance claim' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Request Claim Delete
  const handleRequestDeleteClaim = (claim) => {
    setDeleteDialog({
      isOpen: true,
      type: 'claim',
      item: claim,
      title: 'Delete Insurance Claim Record',
      message: `Are you sure you want to delete claim #${claim.claimNumber} (${claim.vehicle || 'Fleet vehicle'}) from the database?`
    });
  };

  // Confirm Delete Handler
  const handleConfirmDelete = async () => {
    const { type, item } = deleteDialog;
    if (!item || !item.id) return;

    setIsSubmitting(true);
    try {
      if (type === 'policy') {
        const res = await insuranceApi.deletePolicy(item.id);
        setFeedback({ type: 'success', message: res?.message || 'Policy deleted successfully' });
      } else if (type === 'claim') {
        const res = await insuranceApi.deleteClaim(item.id);
        setFeedback({ type: 'success', message: res?.message || 'Claim deleted successfully' });
      } else if (type === 'compliance') {
        const res = await insuranceApi.deleteCompliance(item.id);
        setFeedback({ type: 'success', message: res?.message || 'Compliance record deleted successfully' });
      }
      await loadData();
    } catch (err) {
      console.error('Delete failed:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to delete record from database' });
    } finally {
      setIsSubmitting(false);
      setDeleteDialog({ isOpen: false, type: null, item: null, title: '', message: '' });
    }
  };

  // Save Compliance Renewal
  const handleSaveRenewal = async (renewedItem) => {
    setIsSubmitting(true);
    try {
      await insuranceApi.renewCompliance(renewedItem.id, {
        expiryDate: renewedItem.expiryDate,
        authority: renewedItem.authority,
        documentFile: renewedItem.documentFile,
        notes: renewedItem.notes
      });
      setFeedback({
        type: 'success',
        message: `Compliance for "${renewedItem.title}" extended to ${renewedItem.expiryDate} in database!`
      });
      await loadData();
      setIsRenewModalOpen(false);
      setSelectedComplianceItem(null);
    } catch (err) {
      console.error('Failed to renew compliance:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to extend compliance in database' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create New Compliance Item
  const handleSaveNewCompliance = async (compData) => {
    setIsSubmitting(true);
    try {
      await insuranceApi.createCompliance(compData);
      setFeedback({
        type: 'success',
        message: `New compliance record "${compData.title}" created in database!`
      });
      await loadData();
      setIsAddComplianceModalOpen(false);
    } catch (err) {
      console.error('Failed to create compliance record:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to create compliance record' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export CSV Handler
  const handleExport = () => {
    if (activeTab === 'policies') {
      exportToCsv('primeroute-fleet-insurance-policies', policies);
    } else if (activeTab === 'claims') {
      exportToCsv('primeroute-insurance-claims', claims);
    } else {
      exportToCsv('primeroute-compliance-tracking-report', filteredCompliance);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Feedback Notification */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold transition-all duration-300 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0A1E42] tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-[#075EE8]" />
            Insurance & Compliance Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Master fleet insurance policies, carrier claims tracking, and 30/14/7-day regulatory compliance countdown
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => loadData()}
            disabled={isLoading}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            title="Refresh from Database"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <Can module="insurance" do="export">
            <button
              onClick={handleExport}
              className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Export Report
            </button>
          </Can>

          {activeTab === 'compliance' && (
            <Can module="insurance" do="add">
              <button
                onClick={() => setIsAddComplianceModalOpen(true)}
                className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all active:scale-97 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Compliance Item
              </button>
            </Can>
          )}

          <Can module="insurance" do="add">
            <button
              onClick={() => {
                setSelectedClaim(null);
                setIsClaimModalOpen(true);
              }}
              className="px-3.5 py-2 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              + File Insurance Claim
            </button>
          </Can>

          <Can module="insurance" do="add">
            <button
              onClick={() => {
                setSelectedPolicy(null);
                setIsPolicyModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all active:scale-97 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Policy
            </button>
          </Can>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={AlertTriangle}
          label="Critical Expiry (≤7 Days)"
          value={stats.criticalCount}
          change="Immediate Renewal Required"
          isPositive={false}
          color="rose"
        />
        <StatCard
          icon={Clock}
          label="Due Soon (≤14 Days)"
          value={stats.dueSoonCount}
          change={`${stats.upcomingCount} Within 30 Days`}
          isPositive={false}
          color="amber"
        />
        <StatCard
          icon={ShieldCheck}
          label="Active Fleet Policies"
          value={stats.totalPolicies}
          change={formatCurrency(stats.totalPremium) + ' Annual Premium'}
          isPositive={true}
          color="blue"
        />
        <StatCard
          icon={ShieldAlert}
          label="Open Insurance Claims"
          value={stats.openClaimsCount}
          change="Under Carrier Review"
          isPositive={false}
          color="indigo"
        />
      </div>

      {/* Primary Tab Navigation */}
      <div className="bg-white rounded-2xl p-2 border border-slate-100 shadow-[0_2px_12px_rgba(7,29,73,0.04)] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('compliance');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'compliance'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>30/14/7-Day Compliance Tracker</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                activeTab === 'compliance'
                  ? 'bg-white/20 text-white'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {stats.criticalCount} Critical
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('policies');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'policies'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Master Fleet Policies</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'policies'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {policies.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('claims');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'claims'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Claims Linked to Accidents</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'claims'
                  ? 'bg-white/20 text-white'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {claims.length}
            </span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_2px_12px_rgba(7,29,73,0.04)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-80">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={
              activeTab === 'compliance'
                ? 'Search registration, license, contract, permit...'
                : activeTab === 'policies'
                ? 'Search insurer, policy #, coverage...'
                : 'Search claim #, accident, vehicle, driver...'
            }
          />
        </div>

        {activeTab === 'compliance' && (
          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {COMPLIANCE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Urgency Filter */}
            <select
              value={urgencyFilter}
              onChange={(e) => {
                setUrgencyFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {URGENCY_FILTERS.map((urg) => (
                <option key={urg} value={urg}>
                  {urg}
                </option>
              ))}
            </select>

            {(categoryFilter !== 'All Categories' || urgencyFilter !== 'All Urgencies' || searchQuery) && (
              <button
                onClick={() => {
                  setCategoryFilter('All Categories');
                  setUrgencyFilter('All Urgencies');
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="text-xs font-semibold text-rose-600 hover:underline px-2 cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content Rendering: Loading, Error, or Data Views */}
      {isLoading ? (
        <LoadingState message="Loading live insurance policies, claims, and regulatory records from database..." />
      ) : fetchError ? (
        <ErrorState
          title="Database Connection Error"
          message={fetchError}
          onRetry={() => loadData(true)}
        />
      ) : activeTab === 'compliance' ? (
        <>
          <ComplianceTable
            items={paginatedCompliance}
            onRenewItem={(item) => {
              setSelectedComplianceItem(item);
              setIsRenewModalOpen(true);
            }}
            onDeleteItem={(item) => {
              setDeleteDialog({
                isOpen: true,
                type: 'compliance',
                item,
                title: 'Delete Compliance Record',
                message: `Are you sure you want to permanently delete compliance record "${item.title}" (${item.entityName}) from the database?`
              });
            }}
            onResetFilters={() => {
              setCategoryFilter('All Categories');
              setUrgencyFilter('All Urgencies');
              setSearchQuery('');
            }}
          />

          {filteredCompliance.length > pageSize && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredCompliance.length}
              pageSize={pageSize}
            />
          )}
        </>
      ) : activeTab === 'policies' ? (
        <PoliciesView
          policies={filteredPolicies}
          onEditPolicy={(p) => {
            setSelectedPolicy(p);
            setIsPolicyModalOpen(true);
          }}
          onDeletePolicy={handleRequestDeletePolicy}
          onAddNewPolicy={() => {
            setSelectedPolicy(null);
            setIsPolicyModalOpen(true);
          }}
        />
      ) : (
        <ClaimsView
          claims={filteredClaims}
          onEditClaim={(c) => {
            setSelectedClaim(c);
            setIsClaimModalOpen(true);
          }}
          onDeleteClaim={handleRequestDeleteClaim}
          onFileClaim={() => {
            setSelectedClaim(null);
            setIsClaimModalOpen(true);
          }}
          onResetFilters={() => setSearchQuery('')}
        />
      )}

      {/* Policy Modal */}
      <PolicyModal
        isOpen={isPolicyModalOpen}
        onClose={() => {
          setIsPolicyModalOpen(false);
          setSelectedPolicy(null);
        }}
        onSave={handleSavePolicy}
        policy={selectedPolicy}
      />

      {/* Claim Modal */}
      <ClaimModal
        isOpen={isClaimModalOpen}
        onClose={() => {
          setIsClaimModalOpen(false);
          setSelectedClaim(null);
        }}
        onSave={handleSaveClaim}
        claim={selectedClaim}
        accidents={accidents}
        policies={policies}
        vehicles={vehicles}
        drivers={drivers}
      />

      {/* Renew Compliance Modal */}
      <RenewComplianceModal
        isOpen={isRenewModalOpen}
        onClose={() => {
          setIsRenewModalOpen(false);
          setSelectedComplianceItem(null);
        }}
        onSave={handleSaveRenewal}
        item={selectedComplianceItem}
      />

      {/* Add Compliance Modal */}
      <AddComplianceModal
        isOpen={isAddComplianceModalOpen}
        onClose={() => setIsAddComplianceModalOpen(false)}
        onSave={handleSaveNewCompliance}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, type: null, item: null, title: '', message: '' })}
        onConfirm={handleConfirmDelete}
        title={deleteDialog.title}
        message={deleteDialog.message}
        confirmText="Yes, Delete Record"
        cancelText="Keep Record"
        isDanger={true}
      />
    </div>
  );
}
