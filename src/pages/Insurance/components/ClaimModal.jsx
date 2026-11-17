import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import { ShieldAlert, DollarSign, FileText, Wrench, Building } from 'lucide-react';

export default function ClaimModal({
  isOpen,
  onClose,
  onSave,
  claim = null,
  accidents = [],
  policies = [],
  vehicles = [],
  drivers = []
}) {
  const availablePolicies = policies.length > 0 ? policies : [];

  const getInitialForm = () => {
    const firstPol = availablePolicies[0] || {};
    const firstAccident = accidents[0] || null;

    return {
      claimNumber: '',
      policyId: firstPol.id || '',
      policyNumber: firstPol.policyNumber || firstPol.policy_number || '',
      insurer: firstPol.insurer || firstPol.insurer_name || '',
      accidentId: firstAccident ? firstAccident.id : '',
      incidentDate: firstAccident?.incidentDate || firstAccident?.date || new Date().toISOString().split('T')[0],
      vehicle: firstAccident?.vehicle || (vehicles[0]?.name || `${vehicles[0]?.make || ''} ${vehicles[0]?.model || ''}`.trim()) || '',
      plate: firstAccident?.plate || vehicles[0]?.plate || '',
      driver: firstAccident?.driver || drivers[0]?.name || '',
      claimedAmount: firstAccident?.repairEstimate || '',
      repairEstimate: firstAccident?.repairEstimate || '',
      repairInvoice: '',
      repairInvoiceFile: '',
      deductibleAmount: firstPol.deductible ? parseFloat(String(firstPol.deductible).replace(/[^0-9.-]+/g, '')) || 0 : '',
      deductibleTerms: firstPol.deductibleTerms || '$1,000 Deductible',
      insurancePaid: '',
      driverCharge: '',
      amountRecovered: 0,
      driverRecovered: '',
      status: 'Under Review',
      adjusterName: '',
      adjusterPhone: '',
      notes: ''
    };
  };

  const [formData, setFormData] = useState(getInitialForm);

  useEffect(() => {
    if (claim) {
      setFormData(claim);
    } else {
      setFormData(getInitialForm());
    }
  }, [claim, isOpen, policies, accidents, vehicles, drivers]);

  const handleAccidentSelect = (accidentId) => {
    if (!accidentId || accidentId === 'DIRECT_CLAIM') {
      setFormData((prev) => ({
        ...prev,
        accidentId: accidentId || ''
      }));
      return;
    }

    const selected = accidents.find((a) => String(a.id) === String(accidentId) || a.rawId === accidentId);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        accidentId: selected.id,
        vehicle: selected.vehicle || prev.vehicle,
        plate: selected.plate || prev.plate,
        driver: selected.driver || prev.driver,
        incidentDate: selected.incidentDate || selected.date || prev.incidentDate,
        claimedAmount: selected.repairEstimate || prev.claimedAmount,
        repairEstimate: selected.repairEstimate || prev.repairEstimate,
        deductibleAmount: selected.deductibleAmount !== undefined ? selected.deductibleAmount : prev.deductibleAmount
      }));
    } else {
      setFormData((prev) => ({ ...prev, accidentId }));
    }
  };

  const handlePolicySelect = (policyId) => {
    const pol = availablePolicies.find((p) => String(p.id) === String(policyId) || p.policyId === policyId);
    if (pol) {
      setFormData((prev) => ({
        ...prev,
        policyId: pol.id,
        policyNumber: pol.policyNumber || pol.policy_number,
        insurer: pol.insurer || pol.insurer_name,
        deductibleTerms: pol.deductibleTerms || pol.deductible
      }));
    } else {
      setFormData((prev) => ({ ...prev, policyId }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      amountRecovered: (Number(formData.insurancePaid) || 0) + (Number(formData.driverRecovered) || 0)
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={claim ? 'Edit Insurance Claim' : 'File Insurance Claim Linked to Accident'}
      subtitle="Connect accident incident damage with fleet insurance policies, carrier claim numbers, and adjuster notes"
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
        <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(85vh-140px)]">
          {/* Claim # & Policy Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Insurance Claim # *
              </label>
              <input
                type="text"
                value={formData.claimNumber}
                onChange={(e) => setFormData((p) => ({ ...p, claimNumber: e.target.value }))}
                placeholder="CLM-TRV-882190"
                className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Linked Insurance Policy *
              </label>
              <select
                value={formData.policyId}
                onChange={(e) => handlePolicySelect(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                required
              >
                {availablePolicies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.insurer || p.insurer_name} ({p.policyNumber || p.policy_number})
                  </option>
                ))}
                <option value="Internal Escrow">Internal Escrow (Sub-threshold)</option>
              </select>
            </div>
          </div>

          {/* Linked Accident Incident */}
          <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              Linked Accident Incident Record *
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Select Incident / Accident Log
                </label>
                <select
                  value={formData.accidentId}
                  onChange={(e) => handleAccidentSelect(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white font-bold"
                >
                  <option value="">-- Direct Claim (Comprehensive / Storm / Glass / Vandalism) --</option>
                  {accidents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.id} – {a.vehicle} {a.plate ? `(${a.plate})` : ''} ({a.incidentDate || a.date})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Incident Date
                </label>
                <input
                  type="date"
                  value={formData.incidentDate}
                  onChange={(e) => setFormData((p) => ({ ...p, incidentDate: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Involved Fleet Vehicle *
                </label>
                {vehicles && vehicles.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={formData.vehicle}
                      onChange={(e) => {
                        const selected = vehicles.find((v) => (v.name || `${v.make} ${v.model}`) === e.target.value);
                        setFormData((p) => ({
                          ...p,
                          vehicle: e.target.value,
                          plate: selected ? selected.plate : p.plate
                        }));
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                      required
                    >
                      <option value="">-- Select Vehicle --</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.name || `${v.make} ${v.model}`}>
                          {v.name || `${v.make} ${v.model}`}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={formData.plate}
                      onChange={(e) => setFormData((p) => ({ ...p, plate: e.target.value }))}
                      placeholder="Plate (e.g. PR-2024-TC)"
                      className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-200 rounded-xl bg-white"
                      required
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={formData.vehicle}
                      onChange={(e) => setFormData((p) => ({ ...p, vehicle: e.target.value }))}
                      placeholder="Vehicle (e.g. Toyota Camry)"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                      required
                    />
                    <input
                      type="text"
                      value={formData.plate}
                      onChange={(e) => setFormData((p) => ({ ...p, plate: e.target.value }))}
                      placeholder="Plate (e.g. PR-2024-TC)"
                      className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-200 rounded-xl bg-white"
                      required
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Involved Driver
                </label>
                {drivers && drivers.length > 0 ? (
                  <select
                    value={formData.driver}
                    onChange={(e) => setFormData((p) => ({ ...p, driver: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="">-- Select Driver (Optional) --</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.name || `${d.firstName || d.first_name || ''} ${d.lastName || d.last_name || ''}`.trim()}>
                        {d.name || `${d.firstName || d.first_name || ''} ${d.lastName || d.last_name || ''}`.trim()}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.driver}
                    onChange={(e) => setFormData((p) => ({ ...p, driver: e.target.value }))}
                    placeholder="e.g. Marcus Vance"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Financials & Deductibles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Claimed Amount ($)
              </label>
              <input
                type="number"
                value={formData.claimedAmount}
                onChange={(e) => setFormData((p) => ({ ...p, claimedAmount: Number(e.target.value) }))}
                className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-200 rounded-xl bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Deductible Amount ($)
              </label>
              <input
                type="number"
                value={formData.deductibleAmount}
                onChange={(e) => setFormData((p) => ({ ...p, deductibleAmount: Number(e.target.value) }))}
                className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-200 rounded-xl bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Carrier Paid ($)
              </label>
              <input
                type="number"
                value={formData.insurancePaid}
                onChange={(e) => setFormData((p) => ({ ...p, insurancePaid: Number(e.target.value) }))}
                className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-200 rounded-xl bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Driver Recovered ($)
              </label>
              <input
                type="number"
                value={formData.driverRecovered}
                onChange={(e) => setFormData((p) => ({ ...p, driverRecovered: Number(e.target.value) }))}
                className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-200 rounded-xl bg-white text-emerald-600"
              />
            </div>
          </div>

          {/* Adjuster Details & Resolution Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Claim Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
                className="w-full px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-white"
              >
                <option value="Filed">📝 Claim Filed</option>
                <option value="Under Review">🟡 Under Adjuster Review</option>
                <option value="Approved">🔵 Approved (Repairs Active)</option>
                <option value="Settled">🟢 Settled & Funds Collected</option>
                <option value="Denied">🔴 Claim Denied / Disputed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Insurance Adjuster
              </label>
              <input
                type="text"
                value={formData.adjusterName}
                onChange={(e) => setFormData((p) => ({ ...p, adjusterName: e.target.value }))}
                placeholder="Jessica Taylor (Field Adjuster)"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Adjuster Telephone / Ext.
              </label>
              <input
                type="text"
                value={formData.adjusterPhone}
                onChange={(e) => setFormData((p) => ({ ...p, adjusterPhone: e.target.value }))}
                placeholder="+1 (800) 555-8728"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl bg-white"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Adjuster Findings & Settlement Notes
            </label>
            <textarea
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Record adjuster remarks, subrogation updates, repair authorization..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#F8FAFC] border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            Save Claim
          </button>
        </div>
      </form>
    </Modal>
  );
}

