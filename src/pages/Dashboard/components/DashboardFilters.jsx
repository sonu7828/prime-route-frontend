import React from 'react';
import {
  Calendar,
  CarFront,
  Users,
  Layers,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';

export default function DashboardFilters({
  dateRange,
  setDateRange,
  selectedVehicleFilter,
  setSelectedVehicleFilter,
  selectedDriverFilter,
  setSelectedDriverFilter,
  selectedCategoryFilter,
  setSelectedCategoryFilter,
  isFiltered,
  onResetFilters,
  vehicles = [],
  drivers = []
}) {
  const isVehicleFiltered = selectedVehicleFilter && !selectedVehicleFilter.startsWith('All');
  const isDriverFiltered = selectedDriverFilter && !selectedDriverFilter.startsWith('All');
  const isCategoryFiltered = selectedCategoryFilter && !selectedCategoryFilter.startsWith('All');
  const isDateFiltered = dateRange && !dateRange.startsWith('This Month');

  const showActiveFiltersBar = isFiltered !== undefined ? isFiltered : (isVehicleFiltered || isDriverFiltered || isCategoryFiltered || isDateFiltered);

  return (
    <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-100 shadow-[0_2px_12px_rgba(7,29,73,0.04)]">
      {/* 4 Equal-Width Filter Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs w-full">
        {/* 1. Date Filter */}
        <div className="relative flex items-center bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 rounded-xl transition-all">
          <Calendar className="w-4 h-4 text-[#075EE8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full bg-transparent font-semibold text-slate-700 text-xs cursor-pointer pl-9 pr-7 py-2.5 appearance-none border-0 border-none outline-none focus:outline-none focus:ring-0"
          >
            <option value="This Month">This Month (July 2025)</option>
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="Second Quarter (Q2)">Second Quarter (Q2)</option>
            <option value="Year to Date">Year to Date (2025)</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* 2. Vehicle Filter */}
        <div className="relative flex items-center bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 rounded-xl transition-all">
          <CarFront className="w-4 h-4 text-[#075EE8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={selectedVehicleFilter}
            onChange={(e) => setSelectedVehicleFilter(e.target.value)}
            className="w-full bg-transparent font-semibold text-slate-700 text-xs cursor-pointer pl-9 pr-7 py-2.5 appearance-none border-0 border-none outline-none focus:outline-none focus:ring-0"
          >
            <option value="All Vehicles">All {vehicles.length > 0 ? `${vehicles.length} Vehicle${vehicles.length > 1 ? 's' : ''}` : 'Vehicles'}</option>
            {vehicles.map((v) => (
              <option key={v.id || v.plate} value={v.name}>{v.name}</option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* 3. Driver Filter */}
        <div className="relative flex items-center bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 rounded-xl transition-all">
          <Users className="w-4 h-4 text-[#075EE8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={selectedDriverFilter}
            onChange={(e) => setSelectedDriverFilter(e.target.value)}
            className="w-full bg-transparent font-semibold text-slate-700 text-xs cursor-pointer pl-9 pr-7 py-2.5 appearance-none border-0 border-none outline-none focus:outline-none focus:ring-0"
          >
            <option value="All Drivers">All {drivers.length > 0 ? `${drivers.length} Driver${drivers.length > 1 ? 's' : ''}` : 'Drivers'}</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* 4. Category Filter */}
        <div className="relative flex items-center bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 rounded-xl transition-all">
          <Layers className="w-4 h-4 text-[#075EE8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="w-full bg-transparent font-semibold text-slate-700 text-xs cursor-pointer pl-9 pr-7 py-2.5 appearance-none border-0 border-none outline-none focus:outline-none focus:ring-0"
          >
            <option value="All Categories">All Categories</option>
            {[...new Set(vehicles.map((v) => v.type).filter(Boolean))].map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Active Filter Indicators & 1-Click Reset */}
      {showActiveFiltersBar && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 mt-2.5 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-1.5 text-slate-500">
            <span className="font-semibold text-slate-700">Active Filters:</span>
            {isDateFiltered && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#075EE8] font-medium border border-blue-100">
                {dateRange}
              </span>
            )}
            {isVehicleFiltered && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#075EE8] font-medium border border-blue-100">
                {selectedVehicleFilter}
              </span>
            )}
            {isDriverFiltered && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#075EE8] font-medium border border-blue-100">
                {selectedDriverFilter}
              </span>
            )}
            {isCategoryFiltered && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#075EE8] font-medium border border-blue-100">
                {selectedCategoryFilter}
              </span>
            )}
          </div>
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
