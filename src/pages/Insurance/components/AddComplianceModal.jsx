import React, { useState } from 'react';
import Modal from '../../../components/common/Modal';
import { ShieldCheck, Calendar, FileText, Building } from 'lucide-react';

const CATEGORIES = [
  'Vehicle Registration',
  'Driver License',
  'Rental Contract',
  'Required Document'
];

const ENTITY_TYPES = ['Vehicle', 'Driver', 'Rental Agreement', 'Fleet'];

export default function AddComplianceModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    category: 'Vehicle Registration',
    title: '',
    entityType: 'Vehicle',
    entityName: '',
    identifier: '',
    authority: '',
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    documentFile: '',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    setFormData({
      category: 'Vehicle Registration',
      title: '',
      entityType: 'Vehicle',
      entityName: '',
      identifier: '',
      authority: '',
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      documentFile: '',
      notes: ''
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Regulatory Compliance Record"
      subtitle="Track regulatory expiration dates for vehicle registrations, driver licenses, and state inspection permits"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
        <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(85vh-140px)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                required
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Subject Entity Type *
              </label>
              <select
                value={formData.entityType}
                onChange={(e) => setFormData((p) => ({ ...p, entityType: e.target.value }))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                required
              >
                {ENTITY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Document / Regulatory Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Commercial Vehicle Registration or CDL License"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Subject Entity Name *
              </label>
              <input
                type="text"
                value={formData.entityName}
                onChange={(e) => setFormData((p) => ({ ...p, entityName: e.target.value }))}
                placeholder="e.g. Toyota Camry (PR-2024-TC) or Driver Name"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Document / Identifier #
              </label>
              <input
                type="text"
                value={formData.identifier}
                onChange={(e) => setFormData((p) => ({ ...p, identifier: e.target.value }))}
                placeholder="e.g. REG-NY-991204"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Regulatory Authority *
              </label>
              <input
                type="text"
                value={formData.authority}
                onChange={(e) => setFormData((p) => ({ ...p, authority: e.target.value }))}
                placeholder="e.g. New York State DMV / USDOT"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Expiration Date *
              </label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData((p) => ({ ...p, expiryDate: e.target.value }))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-bold"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Document File Name / Reference
            </label>
            <input
              type="text"
              value={formData.documentFile}
              onChange={(e) => setFormData((p) => ({ ...p, documentFile: e.target.value }))}
              placeholder="e.g. ny_registration_cert.pdf"
              className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notes & Compliance Requirements
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Inspection sticker status, renewal notes, or appointment details..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            Save Compliance Record
          </button>
        </div>
      </form>
    </Modal>
  );
}
