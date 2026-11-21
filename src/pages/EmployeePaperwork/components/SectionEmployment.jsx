import React, { useState, useEffect } from 'react';
import { Briefcase } from 'lucide-react';
import { usersApi } from '../../../api/users';

export default function SectionEmployment({ formData, errors = {}, onEmploymentChange }) {
  const employment = formData?.employment || {};
  const currentManager = employment.assignedManager || '';
  const [managerOptions, setManagerOptions] = useState([]);

  useEffect(() => {
    let isMounted = true;
    usersApi.getUsers()
      .then((usersList) => {
        if (!isMounted || !Array.isArray(usersList)) return;
        // Filter active team members who can be assigned as supervisors
        const eligible = usersList
          .filter((u) => {
            const status = (u.status || '').toLowerCase();
            return status === 'active' || !status;
          })
          .map((u) => {
            const roleTitle = u.title || u.department || (u.role ? u.role.replace(/_/g, ' ') : '');
            return {
              id: u.id,
              name: u.name,
              label: roleTitle ? `${u.name} (${roleTitle})` : u.name
            };
          });

        setManagerOptions(eligible);
      })
      .catch((err) => {
        console.warn('Could not fetch dynamic managers list:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);
  return (
    <section className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-[0_2px_10px_rgba(7,29,73,0.03)] space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-50 text-cyan-600">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#0A1E42]">
              Section B: Employment Information
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Position assignment, department, work authorization type, and reporting manager.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Employee ID */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Employee Identification ID
          </label>
          <input
            type="text"
            readOnly
            value={employment.employeeId || 'PR-EMP-2026-01'}
            className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 bg-slate-50 font-mono font-bold text-slate-700 cursor-not-allowed"
          />
          <p className="text-[10px] text-slate-400 mt-1">Permanent PrimeRoute personnel ID</p>
        </div>

        {/* Job Position */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Job Position <span className="text-rose-500">*</span>
          </label>
          <select
            value={employment.position || ''}
            onChange={(e) => onEmploymentChange('position', e.target.value)}
            className={`w-full px-3.5 py-2.5 rounded-xl text-xs border transition-colors outline-none focus:outline-none focus:ring-2 focus:ring-[#075EE8]/20 ${
              errors.position ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-[#075EE8]'
            }`}
          >
            <option value="">Select Job Position...</option>
            <option value="Logistics Fleet Driver">Logistics Fleet Driver</option>
            <option value="Commercial CDL Driver">Commercial CDL Driver</option>
            <option value="Fleet Maintenance Specialist">Fleet Maintenance Specialist</option>
            <option value="Depot Dispatcher">Depot Dispatcher</option>
            <option value="Operations Assistant">Operations Assistant</option>
          </select>
          {errors.position && <p className="text-[11px] text-rose-500 mt-1">{errors.position}</p>}
        </div>

        {/* Department */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Department <span className="text-rose-500">*</span>
          </label>
          <select
            value={employment.department || ''}
            onChange={(e) => onEmploymentChange('department', e.target.value)}
            className={`w-full px-3.5 py-2.5 rounded-xl text-xs border transition-colors outline-none focus:outline-none focus:ring-2 focus:ring-[#075EE8]/20 ${
              errors.department ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-[#075EE8]'
            }`}
          >
            <option value="">Select Department...</option>
            <option value="Fleet Operations">Fleet Operations</option>
            <option value="Maintenance & Service">Maintenance & Service</option>
            <option value="Logistics & Dispatch">Logistics & Dispatch</option>
            <option value="Safety & Compliance">Safety & Compliance</option>
            <option value="Administration">Administration</option>
          </select>
          {errors.department && <p className="text-[11px] text-rose-500 mt-1">{errors.department}</p>}
        </div>

        {/* Employment Type */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Employment Type <span className="text-rose-500">*</span>
          </label>
          <select
            value={employment.employmentType || ''}
            onChange={(e) => onEmploymentChange('employmentType', e.target.value)}
            className={`w-full px-3.5 py-2.5 rounded-xl text-xs border transition-colors outline-none focus:outline-none focus:ring-2 focus:ring-[#075EE8]/20 ${
              errors.employmentType ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-[#075EE8]'
            }`}
          >
            <option value="">Select Type...</option>
            <option value="Full-Time (W-2)">Full-Time (W-2)</option>
            <option value="Part-Time (W-2)">Part-Time (W-2)</option>
            <option value="Independent Contractor (1099)">Independent Contractor (1099)</option>
            <option value="Seasonal / Temporary">Seasonal / Temporary</option>
          </select>
          {errors.employmentType && <p className="text-[11px] text-rose-500 mt-1">{errors.employmentType}</p>}
        </div>

        {/* Joining Date */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Joining Date <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            value={employment.joiningDate || ''}
            onChange={(e) => onEmploymentChange('joiningDate', e.target.value)}
            className={`w-full px-3.5 py-2.5 rounded-xl text-xs border transition-colors outline-none focus:outline-none focus:ring-2 focus:ring-[#075EE8]/20 ${
              errors.joiningDate ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-[#075EE8]'
            }`}
          />
          {errors.joiningDate && <p className="text-[11px] text-rose-500 mt-1">{errors.joiningDate}</p>}
        </div>

        {/* Assigned Manager */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Assigned Manager / Supervisor <span className="text-rose-500">*</span>
          </label>
          <select
            value={currentManager}
            onChange={(e) => onEmploymentChange('assignedManager', e.target.value)}
            className={`w-full px-3.5 py-2.5 rounded-xl text-xs border transition-colors outline-none focus:outline-none focus:ring-2 focus:ring-[#075EE8]/20 ${
              errors.assignedManager ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-[#075EE8]'
            }`}
          >
            <option value="">Select Manager / Supervisor...</option>
            {managerOptions.map((m) => (
              <option key={m.id || m.label} value={m.label}>
                {m.label}
              </option>
            ))}
            {/* Preserve previously selected manager if not in current active list */}
            {currentManager && !managerOptions.some((m) => m.label === currentManager || m.name === currentManager) && (
              <option value={currentManager}>{currentManager}</option>
            )}
          </select>
          {errors.assignedManager && <p className="text-[11px] text-rose-500 mt-1">{errors.assignedManager}</p>}
        </div>
      </div>
    </section>
  );
}

