import React from 'react';
import Modal from '../../../components/common/Modal';

export default function AdminReviewModal({
  isOpen,
  action,
  adminNotes,
  onAdminNotesChange,
  onClose,
  onConfirmApprove,
  onConfirmReject,
}) {
  const isApprove = action === 'Approve';

  const quickTemplates = isApprove
    ? [
        'All documentation verified. Driver cleared for fleet operations.',
        'Credentials approved. Onboarding completed successfully.',
        'Paperwork verified and accepted.'
      ]
    : [
        'Please provide a clearer copy of your Driving License with full expiration date visible.',
        'Please verify and update your emergency contact details.',
        'Please review and sign Section D again.'
      ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isApprove ? 'Approve Employee Paperwork' : 'Request Paperwork Revisions'}
      subtitle="Official Compliance & Managerial Review Decision"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-600">
          {isApprove
            ? 'Approving this paperwork will set the employee status to Approved in the database and certify their credentials for active fleet operations.'
            : 'Rejecting this paperwork will set status to Rejected in the database and notify the employee with the feedback provided below.'}
        </p>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-slate-700">
              Reviewer Notes / Feedback:
            </label>
            <span className="text-[10px] text-slate-400 font-medium">Saved to Database</span>
          </div>
          <textarea
            rows={3}
            value={adminNotes}
            onChange={(e) => onAdminNotesChange(e.target.value)}
            className="w-full p-3 rounded-xl text-xs border border-slate-200 focus:border-[#075EE8] outline-none focus:outline-none focus:ring-2 focus:ring-[#075EE8]/20"
            placeholder={
              isApprove
                ? 'Enter approval notes for database record (e.g. All documents verified)...'
                : 'Enter feedback notes explaining required changes...'
            }
          />

          {/* Quick template chips */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-slate-400 mr-1">Quick note:</span>
            {quickTemplates.map((tmpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onAdminNotesChange(tmpl)}
                className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                {tmpl.slice(0, 32)}...
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={isApprove ? onConfirmApprove : onConfirmReject}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer ${
              isApprove ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            Confirm {action}
          </button>
        </div>
      </div>
    </Modal>
  );
}

