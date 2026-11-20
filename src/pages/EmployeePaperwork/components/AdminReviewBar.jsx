import React from 'react';
import { ShieldCheck, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

export default function AdminReviewBar({ roleName, activeRoleName, onApprove, onReject, onReset }) {
  const displayRole = roleName || activeRoleName || 'Administrator';
  return (
    <div className="p-4 rounded-3xl bg-gradient-to-r from-slate-900 to-[#071D49] text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-white/10 text-emerald-300">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            {displayRole} Compliance &amp; Review Panel
          </p>
          <p className="text-xs text-slate-300 mt-0.5">
            Review and officially approve or request revisions for this employee's onboarding paperwork.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={onApprove}
          className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Approve Paperwork
        </button>

        <button
          type="button"
          onClick={onReject}
          className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
        >
          <XCircle className="w-3.5 h-3.5" />
          Request Revisions
        </button>

        <button
          type="button"
          onClick={onReset}
          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>
    </div>
  );
}

