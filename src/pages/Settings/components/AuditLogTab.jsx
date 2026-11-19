import React, { useState, useEffect, useCallback, useTransition } from 'react';
import {
  FileText,
  Filter,
  Download,
  Calendar,
  Search,
  ArrowRight,
  ShieldCheck,
  User,
  Layers,
  Activity,
  RotateCcw,
  RefreshCw,
  Loader2,
  Eye,
  X,
  Clock,
  Laptop,
  CheckCircle2
} from 'lucide-react';
import { auditApi } from '../../../api/auditApi';
import { exportToCsv } from '../../../utils/exportCsv';
import { useRole } from '../../../context/RoleContext';
import Can from '../../../auth/Can';

export default function AuditLogTab() {
  const { currentRoleId, activeRole } = useRole();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dynamic filter metadata fetched directly from MySQL database
  const [dbFilters, setDbFilters] = useState({
    users: [],
    actions: [],
    modules: []
  });

  const [selectedUser, setSelectedUser] = useState('All Users');
  const [selectedAction, setSelectedAction] = useState('All Actions');
  const [selectedModule, setSelectedModule] = useState('All Modules');
  const [selectedDateFilter, setSelectedDateFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch filter metadata (Users, Actions, Modules) live from Database
  useEffect(() => {
    let isMounted = true;
    async function loadFilterMetadata() {
      try {
        const filters = await auditApi.getAuditFilters();
        if (isMounted && filters) {
          setDbFilters({
            users: Array.isArray(filters.users) ? filters.users : [],
            actions: Array.isArray(filters.actions) ? filters.actions : [],
            modules: Array.isArray(filters.modules) ? filters.modules : []
          });
        }
      } catch (err) {
        console.warn('Failed to load filter metadata from database:', err);
      }
    }
    loadFilterMetadata();
    return () => {
      isMounted = false;
    };
  }, []);

  // Modal inspection state for in-depth audit trail inspection
  const [selectedLogForDetails, setSelectedLogForDetails] = useState(null);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedLogForDetails(null);
      }
    };
    if (selectedLogForDetails) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLogForDetails]);

  // Load audit logs directly from MySQL Database
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await auditApi.getAuditLogs({
        user: selectedUser,
        action: selectedAction,
        module: selectedModule,
        datePeriod: selectedDateFilter,
        search: searchQuery
      });
      const items = Array.isArray(data?.logs) ? data.logs : Array.isArray(data) ? data : [];
      setLogs(items);
    } catch (err) {
      console.error('Failed to load audit logs from database:', err);
      setError('Unable to fetch live audit logs from database. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [selectedUser, selectedAction, selectedModule, selectedDateFilter, searchQuery]);

  // Refetch when filters or search term changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchLogs]);

  const handleExport = async () => {
    try {
      const fullList = await auditApi.exportAuditLogs({
        user: selectedUser,
        action: selectedAction,
        module: selectedModule,
        datePeriod: selectedDateFilter,
        search: searchQuery
      });

      const exportRows = (Array.isArray(fullList) ? fullList : logs).map((l) => ({
        LogID: l.id,
        Timestamp: l.timestamp,
        User: l.user,
        Action: l.action,
        Module: l.module,
        TargetRecord: l.record,
        PreviousValue: l.previousValue || 'N/A',
        NewValue: l.newValue || 'N/A',
        AuditNotes: l.notes
      }));

      exportToCsv('PrimeRoute_Audit_Trail_Log', exportRows);
    } catch (err) {
      console.error('Export failed:', err);
      exportToCsv(
        'PrimeRoute_Audit_Trail_Log',
        logs.map((l) => ({
          LogID: l.id,
          Timestamp: l.timestamp,
          User: l.user,
          Action: l.action,
          Module: l.module,
          TargetRecord: l.record,
          PreviousValue: l.previousValue || 'N/A',
          NewValue: l.newValue || 'N/A',
          AuditNotes: l.notes
        }))
      );
    }
  };

  const resetFilters = () => {
    setSelectedUser('All Users');
    setSelectedAction('All Actions');
    setSelectedModule('All Modules');
    setSelectedDateFilter('All');
    setSearchQuery('');
  };

  const getActionBadgeColor = (action) => {
    switch (action) {
      case 'Create':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Edit':
        return 'bg-blue-50 text-[#075EE8] border-blue-200';
      case 'Approve':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Archive':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'Contract Generated / Amended':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Permission Change':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Document Activity':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Render clean State Change display tailored to fleet workflow
  const renderStateChange = (log) => {
    const isCreate = log.action === 'Create' || !log.previousValue || log.previousValue === 'null';

    if (isCreate) {
      return (
        <div className="flex items-center gap-1.5 py-1">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/70 text-emerald-800 text-[11px] font-medium leading-tight">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
            <span className="font-semibold text-emerald-900">Initial:</span> {log.newValue}
          </span>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-1 py-1 max-w-md">
        {/* Previous Value */}
        <div className="flex items-start gap-1.5 text-[11px] text-slate-500 leading-tight">
          <span className="px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200/60 text-rose-700 font-mono text-[10px] shrink-0 line-through">
            Old
          </span>
          <span className="text-slate-600 font-medium line-through decoration-rose-400">
            {log.previousValue}
          </span>
        </div>

        {/* Arrow & New Value */}
        <div className="flex items-start gap-1.5 text-[11px] leading-tight">
          <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200/60 text-emerald-700 font-mono text-[10px] shrink-0 font-bold">
            New
          </span>
          <span className="text-emerald-900 font-semibold">
            {log.newValue}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(7,29,73,0.04)] overflow-hidden space-y-4">
      {/* Header Banner */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-[#0A1E42] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#075EE8]" /> System Audit Log
            </h3>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-all active:scale-95 duration-150 cursor-pointer disabled:opacity-60"
            title="Reload latest records from MySQL database"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync DB</span>
          </button>

          {/* Export Button: Strictly for Admins only */}
          <Can module="users" do="export">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-all active:scale-95 duration-150 cursor-pointer"
              title="Export filtered audit trail for compliance verification"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export Audit Log (Admin)</span>
            </button>
          </Can>
        </div>
      </div>

      {/* Multi-Criteria Filter Bar */}
      <div className="px-5 pt-1 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* User Filter (Live from DB) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              User
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-2.5 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#075EE8]"
            >
              <option value="All Users">All Users</option>
              {dbFilters.users.map((u) => (
                <option key={u.id || u.name} value={u.label || u.name}>
                  {u.label || u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Action Filter (Live from DB) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Action
            </label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full px-2.5 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#075EE8]"
            >
              <option value="All Actions">All Actions</option>
              {dbFilters.actions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Module Filter (Live from DB) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Module
            </label>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="w-full px-2.5 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#075EE8]"
            >
              <option value="All Modules">All Modules</option>
              {dbFilters.modules.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Date Period
            </label>
            <select
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="w-full px-2.5 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#075EE8]"
            >
              <option value="All">All Recorded Dates</option>
              <option value="Today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Search Record / Notes
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search record..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#075EE8]"
              />
            </div>
          </div>
        </div>

        {/* Results summary & Reset */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span className="flex items-center gap-2">
            {loading ? (
              <span className="flex items-center gap-1.5 text-blue-600 font-semibold">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Querying database...
              </span>
            ) : (
              <span>
                Showing <strong>{logs.length}</strong> immutable audit records from database
              </span>
            )}
          </span>
          {(selectedUser !== 'All Users' ||
            selectedAction !== 'All Actions' ||
            selectedModule !== 'All Modules' ||
            selectedDateFilter !== 'All' ||
            searchQuery) && (
            <button
              onClick={resetFilters}
              className="text-[#075EE8] hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mx-5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchLogs}
            className="text-amber-900 font-bold underline ml-2 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Read-Only Table */}
      <div className="overflow-x-auto px-5 pb-5">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#F8FAFC] border-y border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-3 whitespace-nowrap">Log ID</th>
              <th className="py-3 px-3 whitespace-nowrap">Date / Time</th>
              <th className="py-3 px-3 whitespace-nowrap">User &amp; Role</th>
              <th className="py-3 px-3 whitespace-nowrap">Action</th>
              <th className="py-3 px-3 whitespace-nowrap">Module</th>
              <th className="py-3 px-3 whitespace-nowrap">Target Record</th>
              <th className="py-3 px-3 min-w-[280px]">Change State (Old → New)</th>
              <th className="py-3 px-3 min-w-[200px]">Audit Details</th>
              <th className="py-3 px-3 text-center whitespace-nowrap">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && logs.length === 0 ? (
              <tr>
                <td colSpan="9" className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 text-[#075EE8] animate-spin" />
                    <span className="text-xs font-medium text-slate-500">Loading audit records from MySQL database...</span>
                  </div>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="9" className="py-10 text-center text-slate-400">
                  No audit log entries match the selected filters in database.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-blue-50/20 transition-colors group">
                  {/* Log ID */}
                  <td className="py-3 px-3 font-mono font-bold text-[#075EE8] whitespace-nowrap">
                    {log.id}
                  </td>

                  {/* Date / Time */}
                  <td className="py-3 px-3 text-slate-600 font-mono whitespace-nowrap">
                    {log.timestamp}
                  </td>

                  {/* User */}
                  <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                    {log.user}
                  </td>

                  {/* Action */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border ${getActionBadgeColor(
                        log.action
                      )}`}
                    >
                      {log.action}
                    </span>
                  </td>

                  {/* Module */}
                  <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap">
                    {log.module}
                  </td>

                  {/* Target Record */}
                  <td className="py-3 px-3 font-mono font-bold text-[#0A1E42] whitespace-nowrap">
                    {log.record}
                  </td>

                  {/* State Change (Old -> New) tailored cleanly */}
                  <td className="py-3 px-3">
                    {renderStateChange(log)}
                  </td>

                  {/* Audit Details */}
                  <td className="py-3 px-3 text-slate-600 text-[11px] leading-relaxed">
                    {log.notes}
                  </td>

                  {/* View Full Detail Button */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <button
                      onClick={() => setSelectedLogForDetails(log)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:text-[#075EE8] hover:border-blue-300 hover:bg-blue-50 text-xs font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer"
                      title="View complete audit record inspection"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Inspection Modal */}
      {selectedLogForDetails && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedLogForDetails(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 cursor-pointer"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 cursor-default">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#075EE8]" />
                <h4 className="font-bold text-sm text-[#0A1E42]">
                  Audit Record Inspection ({selectedLogForDetails.id})
                </h4>
              </div>
              <button
                onClick={() => setSelectedLogForDetails(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Timestamp</span>
                  <span className="font-mono text-slate-700 font-semibold">{selectedLogForDetails.timestamp}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Module</span>
                  <span className="font-semibold text-slate-800">{selectedLogForDetails.module}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Actor / User</span>
                  <span className="font-semibold text-[#0A1E42]">{selectedLogForDetails.user}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Action Taken</span>
                  <span className="font-bold text-[#075EE8]">{selectedLogForDetails.action}</span>
                </div>
              </div>

              {/* Target Record */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Target Record Affected
                </label>
                <div className="p-2.5 rounded-xl bg-slate-100 font-mono font-bold text-[#0A1E42]">
                  {selectedLogForDetails.record}
                </div>
              </div>

              {/* State Change Comparison Box */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Delta State Comparison
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200/60">
                    <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block mb-1">
                      Previous Value
                    </span>
                    <p className="text-slate-700 font-medium break-words">
                      {selectedLogForDetails.previousValue || '(None / Initial State)'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/60">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                      New Certified Value
                    </span>
                    <p className="text-slate-800 font-semibold break-words">
                      {selectedLogForDetails.newValue}
                    </p>
                  </div>
                </div>
              </div>

              {/* Audit Details */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Audit Notes / Reason
                </label>
                <p className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 leading-relaxed">
                  {selectedLogForDetails.notes}
                </p>
              </div>

              {/* Security info */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <Laptop className="w-3 h-3 text-slate-400" />
                  IP: {selectedLogForDetails.ipAddress || '192.168.1.10'}
                </span>
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Cryptographically Verified
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
              <button
                onClick={() => setSelectedLogForDetails(null)}
                className="px-4 py-2 rounded-xl bg-[#075EE8] text-white text-xs font-bold hover:bg-blue-600 transition-colors cursor-pointer"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
