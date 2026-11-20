import React, { useRef, useEffect } from 'react';
import { Shield, Edit3 } from 'lucide-react';
import DigitalSignaturePad from '../../../components/agreements/DigitalSignaturePad';

const DEFAULT_AGREEMENT_TEXT = `1. FLEET VEHICLE CARE AND RESPONSIBILITY
The employee agrees to operate all PrimeRoute fleet vehicles in strict compliance with federal, state, and local laws. Vehicles must undergo pre-trip and post-trip inspections through the PrimeRoute system. Unauthorized personal usage, unregistered passengers, or reckless driving are strictly prohibited.

2. TELEMETRY AND SAFETY MONITORING
Fleet vehicles are equipped with GPS, speed monitoring, and diagnostic telemetry to protect assets and ensure safety. Tampering with telematics hardware is grounds for immediate termination.

3. ACCIDENT REPORTING & TRAFFIC VIOLATIONS
Any collision, property damage, ticket, or mechanical failure must be logged in PrimeRoute within 2 hours. Traffic fines and toll violations incurred due to employee negligence remain the sole responsibility of the operator.

4. CONFIDENTIALITY & ACCURACY
The employee certifies that all documentation, driver credentials, and personal information submitted in this form are accurate and free from misrepresentation.`;

export default function SectionAgreements({
  formData,
  errors = {},
  onAgreementChange,
}) {
  const agreements = formData?.agreements || {};
  const personal = formData?.personal || {};
  const currentAgreementText = agreements.customPolicyText !== undefined ? agreements.customPolicyText : DEFAULT_AGREEMENT_TEXT;
  const textareaRef = useRef(null);

  // Auto-expand textarea height so top text is never scrolled out of view or hidden
  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight + 16, 340)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [currentAgreementText]);

  const handleTextareaChange = (e) => {
    onAgreementChange('customPolicyText', e.target.value);
    adjustHeight();
  };

  const handleFocusTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  };

  return (
    <section className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-[0_2px_10px_rgba(7,29,73,0.03)] space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#0A1E42]">
              Section D: Agreements, Policies & Digital Signature
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review company vehicle safety covenants, conduct rules, and execute your binding digital signature.
            </p>
          </div>
        </div>
      </div>

      {/* Editable Terms & Agreement Box with Auto-Expansion */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="employee-agreement-textarea" className="block text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer">
            <span>PrimeRoute Fleet Employee Operating Agreement &amp; Code of Conduct</span>
            <button
              type="button"
              onClick={handleFocusTextarea}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#075EE8] bg-blue-50 hover:bg-blue-100 hover:text-blue-700 active:scale-95 border border-blue-200/80 px-2.5 py-0.5 rounded-full cursor-pointer transition-all shadow-xs"
              title="Click here to type/edit agreement"
            >
              <Edit3 className="w-3 h-3" /> Editable Field
            </button>
          </label>
          <span className="text-[11px] text-slate-400">
            Auto-expanding: all points stay fully visible
          </span>
        </div>

        <textarea
          id="employee-agreement-textarea"
          ref={textareaRef}
          rows={16}
          value={currentAgreementText}
          onChange={handleTextareaChange}
          placeholder="Type or paste your company's custom employee agreement, operating policies, and code of conduct here..."
          className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-sans leading-relaxed transition-all outline-none focus:outline-none focus:ring-2 focus:ring-[#075EE8]/20 focus:border-[#075EE8] focus:bg-white resize-y min-h-[340px] overflow-hidden"
        />
      </div>

      {/* Acceptance Checkbox */}
      <div className={`p-4 rounded-2xl border transition-colors ${
        errors.acceptedTerms ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 bg-slate-50/50'
      }`}>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={!!agreements.acceptedTerms}
            onChange={(e) => onAgreementChange('acceptedTerms', e.target.checked)}
            className="mt-1 w-4 h-4 text-[#075EE8] rounded-sm border-slate-300 focus:ring-[#075EE8]"
          />
          <span className="text-xs text-slate-700 leading-relaxed">
            <strong className="text-[#0A1E42]">I have read, acknowledge, and agree</strong> to the PrimeRoute Employee Operating Agreement, Vehicle Safety Guidelines, and Drug & Alcohol Testing policies. I confirm that all submitted details and uploaded records are true, genuine, and legally valid. <span className="text-rose-500">*</span>
          </span>
        </label>
        {errors.acceptedTerms && <p className="text-[11px] text-rose-500 mt-2 font-medium">{errors.acceptedTerms}</p>}
      </div>

      {/* Digital Signature Pad */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700">
            Digital Signature Field <span className="text-rose-500">*</span>
          </label>
          <span className="text-[11px] text-slate-400">Sign using mouse, touchscreen or type name</span>
        </div>

        <DigitalSignaturePad
          title="Employee Digital Signature"
          signerName={`${personal.firstName || ''} ${personal.lastName || ''}`.trim() || 'Employee'}
          role="Fleet Employee"
          initialSignature={agreements.digitalSignature}
          onSignatureChange={(sigData) => onAgreementChange('digitalSignature', sigData)}
        />
        {errors.digitalSignature && (
          <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.digitalSignature}</p>
        )}
      </div>
    </section>
  );
}
