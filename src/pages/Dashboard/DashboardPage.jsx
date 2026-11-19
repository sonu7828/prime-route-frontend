import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import RevenueOverviewChart from '../../components/charts/RevenueOverviewChart';
import FleetStatusChart from '../../components/charts/FleetStatusChart';
import FinancialBarChart from '../../components/charts/FinancialBarChart';
import DashboardFilters from './components/DashboardFilters';
import DashboardKpis from './components/DashboardKpis';
import DashboardQuickActions from './components/DashboardQuickActions';
import FleetUtilizationGauge from './components/FleetUtilizationGauge';
import UpcomingRemindersCard from './components/UpcomingRemindersCard';
import ImportantAlertsCard from './components/ImportantAlertsCard';
import TopVehiclesCard from './components/TopVehiclesCard';
import { dashboardApi } from '../../api';
import { accountingApi } from '../../api/accountingApi';
import { maintenanceApi } from '../../api/maintenanceApi';

// Quick action modals
import RentalModal from '../Rentals/RentalModal';
import ExpenseIncomeModals from '../Accounting/components/ExpenseIncomeModals';
import MaintenanceModal from '../Maintenance/MaintenanceModal';

import { useFleet } from '../../context/FleetContext';
import { usePermission } from '../../auth/usePermission';

export default function DashboardPage({ onNavigate, onViewVehicle }) {
  const { vehicles = [], drivers = [], rentals = [], saveRental } = useFleet();

  // Role permissions
  const canVehicles = usePermission('vehicles', 'view').can;
  const canAccounting = usePermission('accounting', 'view').can;
  const canRentals = usePermission('rentals', 'view').can;
  const canMaintenance = usePermission('maintenance', 'view').can;
  const canDocuments = usePermission('documents', 'view').can;

  // Filter States
  const [dateRange, setDateRange] = useState('This Month');
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState('All Vehicles');
  const [selectedDriverFilter, setSelectedDriverFilter] = useState('All Drivers');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All Categories');

  // Live Database State
  const [dbDashboardData, setDbDashboardData] = useState(null);
  const [isDbLoading, setIsDbLoading] = useState(false);
  const [, setCurrencyKey] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const loadLiveDashboardFromDB = useCallback(async () => {
    try {
      setIsDbLoading(true);
      const liveData = await dashboardApi.getDashboardData({
        dateRange,
        vehicleFilter: selectedVehicleFilter,
        driverFilter: selectedDriverFilter,
        categoryFilter: selectedCategoryFilter
      });
      if (liveData) {
        setDbDashboardData(liveData);
      }
    } catch (err) {
      console.error('Error fetching live database metrics:', err);
    } finally {
      setIsDbLoading(false);
    }
  }, [dateRange, selectedVehicleFilter, selectedDriverFilter, selectedCategoryFilter]);

  useEffect(() => {
    const handleCurrencyChange = () => setCurrencyKey((k) => k + 1);
    window.addEventListener('primeroute_currency_changed', handleCurrencyChange);
    return () => window.removeEventListener('primeroute_currency_changed', handleCurrencyChange);
  }, []);

  useEffect(() => {
    loadLiveDashboardFromDB();
  }, [loadLiveDashboardFromDB]);

  // Quick Action Modal States
  const [isRentalModalOpen, setIsRentalModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);

  // Quick Action Form States
  const [newExpense, setNewExpense] = useState({
    category: 'Fleet Fuel',
    description: '',
    vehicle: 'Toyota Camry SE',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    vendor: '',
    status: 'Paid',
  });

  const [newIncome, setNewIncome] = useState({
    source: 'Vehicle Rental Lease',
    customer: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Corporate ACH',
    status: 'Completed',
  });

  const isVehicleFiltered = selectedVehicleFilter && !selectedVehicleFilter.startsWith('All');
  const isDriverFiltered = selectedDriverFilter && !selectedDriverFilter.startsWith('All');
  const isCategoryFiltered = selectedCategoryFilter && !selectedCategoryFilter.startsWith('All');
  const isDateFiltered = dateRange && !dateRange.startsWith('This Month');

  const isFiltered = isDateFiltered || isVehicleFiltered || isDriverFiltered || isCategoryFiltered;

  const handleResetFilters = () => {
    setDateRange('This Month');
    setSelectedVehicleFilter('All Vehicles');
    setSelectedDriverFilter('All Drivers');
    setSelectedCategoryFilter('All Categories');
  };

  // Form Handlers with Real API Wiring
  const handleAddExpense = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const amountVal = parseFloat(newExpense.amount) || 0;
      await accountingApi.createPayable({
        vendor_name: newExpense.vendor || 'Fleet Supplier',
        category: newExpense.category || 'Fleet Fuel',
        amount: amountVal,
        invoice_date: newExpense.date || new Date().toISOString().split('T')[0],
        description: newExpense.description || `${newExpense.category} for ${newExpense.vehicle || 'Fleet'}`,
        status: 'pending'
      });
      setIsExpenseModalOpen(false);
      setNewExpense({
        category: 'Fleet Fuel',
        description: '',
        vehicle: 'Toyota Camry SE',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        vendor: '',
        status: 'Paid',
      });
      showToast(`Expense of $${amountVal.toLocaleString()} logged successfully!`, 'success');
      loadLiveDashboardFromDB();
    } catch (err) {
      console.error('Failed to log expense:', err);
      showToast(`Failed to log expense: ${err.message}`, 'error');
    }
  };

  const handleAddIncome = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const amountVal = parseFloat(newIncome.amount) || 0;
      await accountingApi.createPayment({
        category: newIncome.source || 'Vehicle Rental Lease',
        amount: amountVal,
        payment_date: newIncome.date || new Date().toISOString().split('T')[0],
        payment_method: newIncome.paymentMethod || 'Corporate ACH',
        status: newIncome.status || 'Completed',
        notes: `Recorded from Dashboard: ${newIncome.customer || 'General Fleet Income'}`
      });
      setIsPaymentModalOpen(false);
      setNewIncome({
        source: 'Vehicle Rental Lease',
        customer: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Corporate ACH',
        status: 'Completed',
      });
      showToast(`Payment of $${amountVal.toLocaleString()} recorded successfully!`, 'success');
      loadLiveDashboardFromDB();
    } catch (err) {
      console.error('Failed to record payment:', err);
      showToast(`Failed to record payment: ${err.message}`, 'error');
    }
  };

  const handleSaveRentalAgreement = async (rental) => {
    try {
      await saveRental(rental);
      setIsRentalModalOpen(false);
      showToast('Rental agreement saved successfully!', 'success');
      loadLiveDashboardFromDB();
    } catch (err) {
      console.error('Failed to save rental:', err);
      showToast(`Failed to save rental: ${err.message}`, 'error');
    }
  };

  const handleSaveMaintenanceRecord = async (record) => {
    try {
      await maintenanceApi.createMaintenanceRecord(record);
      setIsMaintenanceModalOpen(false);
      showToast('Maintenance service scheduled successfully!', 'success');
      loadLiveDashboardFromDB();
    } catch (err) {
      console.error('Failed to schedule maintenance:', err);
      showToast(`Failed to schedule maintenance: ${err.message}`, 'error');
    }
  };

  // Multi-dimensional Filtering Engine for Dashboard
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const vName = v.name || `${v.make} ${v.model}`;
      if (isVehicleFiltered) {
        const matchesName = vName.toLowerCase().includes(selectedVehicleFilter.toLowerCase()) ||
          selectedVehicleFilter.toLowerCase().includes(vName.toLowerCase());
        const matchesPlate = v.plate && (v.plate.toLowerCase() === selectedVehicleFilter.toLowerCase());
        if (!matchesName && !matchesPlate) return false;
      }
      if (isCategoryFiltered) {
        if (v.type !== selectedCategoryFilter) return false;
      }
      if (isDriverFiltered) {
        const hasRentalWithDriver = rentals.some(r =>
          (r.status === 'Active' || r.status === 'active') &&
          (r.vehicleId === v.id || r.vehicle === vName || (r.vehicles && r.vehicles.plate === v.plate)) &&
          (r.driver?.toLowerCase().includes(selectedDriverFilter.toLowerCase()) || r.customer?.toLowerCase().includes(selectedDriverFilter.toLowerCase()))
        );
        if (!hasRentalWithDriver && !v.driver?.toLowerCase().includes(selectedDriverFilter.toLowerCase())) return false;
      }
      return true;
    });
  }, [vehicles, rentals, isVehicleFiltered, selectedVehicleFilter, isCategoryFiltered, selectedCategoryFilter, isDriverFiltered, selectedDriverFilter]);

  const filteredRentals = useMemo(() => {
    return rentals.filter((r) => {
      if (r.status !== 'Active' && r.status !== 'active') return false;

      if (isDriverFiltered) {
        const dName = r.driver || r.customer || '';
        if (!dName.toLowerCase().includes(selectedDriverFilter.toLowerCase())) return false;
      }

      if (isVehicleFiltered) {
        const vName = r.vehicle || '';
        const matchesV = vName.toLowerCase().includes(selectedVehicleFilter.toLowerCase()) || selectedVehicleFilter.toLowerCase().includes(vName.toLowerCase());
        if (!matchesV) return false;
      }

      if (isCategoryFiltered) {
        const veh = vehicles.find(v => v.id === r.vehicleId || v.name === r.vehicle || (r.vehicles && v.plate === r.vehicles.plate));
        if (veh && veh.type !== selectedCategoryFilter) return false;
      }

      return true;
    });
  }, [rentals, vehicles, isDriverFiltered, selectedDriverFilter, isVehicleFiltered, selectedVehicleFilter, isCategoryFiltered, selectedCategoryFilter]);

  const filteredDrivers = useMemo(() => {
    return drivers.filter((d) => {
      const dName = d.name || `${d.firstName || ''} ${d.lastName || ''}`.trim();
      if (isDriverFiltered) {
        if (!dName.toLowerCase().includes(selectedDriverFilter.toLowerCase())) return false;
      }
      if (isVehicleFiltered) {
        const hasRentalWithVehicle = rentals.some(r =>
          (r.status === 'Active' || r.status === 'active') &&
          (r.driverId === d.id || r.driver === dName || r.customer === dName) &&
          (r.vehicle?.toLowerCase().includes(selectedVehicleFilter.toLowerCase()) || selectedVehicleFilter.toLowerCase().includes(r.vehicle?.toLowerCase()))
        );
        if (!hasRentalWithVehicle && !d.vehicle?.toLowerCase().includes(selectedVehicleFilter.toLowerCase())) return false;
      }
      if (isCategoryFiltered) {
        const assignedVeh = vehicles.find(v => v.driver === dName || rentals.some(r => (r.driverId === d.id || r.driver === dName) && (r.vehicleId === v.id || r.vehicle === v.name)));
        if (!assignedVeh || assignedVeh.type !== selectedCategoryFilter) return false;
      }
      return true;
    });
  }, [drivers, vehicles, rentals, isDriverFiltered, selectedDriverFilter, isVehicleFiltered, selectedVehicleFilter, isCategoryFiltered, selectedCategoryFilter]);

  const dateMultiplier = useMemo(() => {
    if (dateRange === 'Last 30 Days') return 0.95;
    if (dateRange === 'Second Quarter (Q2)') return 2.85;
    if (dateRange.startsWith('Year to Date')) return 6.8;
    return 1.0;
  }, [dateRange]);

  const revLabel = useMemo(() => {
    if (dateRange === 'Last 30 Days') return 'Last 30D Revenue';
    if (dateRange === 'Second Quarter (Q2)') return 'Q2 Revenue';
    if (dateRange.startsWith('Year to Date')) return 'YTD Revenue';
    return 'Monthly Revenue';
  }, [dateRange]);

  const expLabel = useMemo(() => {
    if (dateRange === 'Last 30 Days') return 'Last 30D Expenses';
    if (dateRange === 'Second Quarter (Q2)') return 'Q2 Expenses';
    if (dateRange.startsWith('Year to Date')) return 'YTD Expenses';
    return 'Monthly Expenses';
  }, [dateRange]);

  // Dynamic Metrics Computation from Live DB Data & Filters
  const computedStats = useMemo(() => {
    const totalV = filteredVehicles.length;
    const activeR = filteredRentals.length;
    const activeD = filteredDrivers.length;
    const utilRate = totalV > 0 ? Math.min(100, Math.round((activeR / totalV) * 100)) : 0;

    const baseMonthlyRev = filteredRentals.reduce((sum, r) => {
      const wRent = Number(r.weeklyRent || 0);
      return sum + (wRent > 0 ? Math.round(wRent * 4.286) : (Number(r.amount) || 0));
    }, 0);

    const monthlyRev = Math.round(baseMonthlyRev * dateMultiplier);

    const baseExp = (dbDashboardData?.kpis?.monthlyExpenses && vehicles.length > 0)
      ? Math.round((dbDashboardData.kpis.monthlyExpenses / vehicles.length) * totalV)
      : Math.round(activeR * 120);
    const monthlyExp = Math.round(baseExp * dateMultiplier);
    const netProf = monthlyRev - monthlyExp;

    const outstanding = filteredDrivers.reduce((sum, d) => sum + Math.max(0, Number(d.balance || 0)), 0);

    return {
      totalVehicles: totalV,
      vehiclesChange: isFiltered ? `${totalV} filtered vehicle${totalV === 1 ? '' : 's'}` : `${totalV} active in fleet`,
      activeRentals: activeR,
      rentalsChange: `${utilRate}% leased`,
      activeDrivers: activeD,
      driversChange: `${activeD} active driver${activeD === 1 ? '' : 's'}`,
      monthlyRevenue: monthlyRev,
      revLabel,
      revenueChange: isFiltered ? 'Selected Scope' : '+100% active',
      monthlyExpenses: monthlyExp,
      expLabel,
      expensesChange: '-10%',
      netProfit: netProf,
      profitChange: netProf >= 0 ? '+100%' : '-10%',
      isProfitPositive: netProf >= 0,
      outstandingBalances: outstanding,
      balancesChange: outstanding > 0 ? `${outstanding > 0 ? '1' : '0'} account due` : 'All clear',
      utilizationRate: utilRate,
      inServiceCount: activeR,
      benchmarkTarget: 85
    };
  }, [filteredVehicles, filteredRentals, filteredDrivers, dateMultiplier, revLabel, expLabel, isFiltered, dbDashboardData, vehicles.length]);

  const liveStats = useMemo(() => {
    if (isFiltered) return computedStats;
    return dbDashboardData?.kpis || computedStats;
  }, [isFiltered, computedStats, dbDashboardData]);

  const liveFleetStatus = useMemo(() => {
    if (!isFiltered && dbDashboardData?.fleetStatus && dbDashboardData.fleetStatus.length > 0) {
      return dbDashboardData.fleetStatus;
    }
    const counts = { Available: 0, Reserved: 0, Rented: 0, Maintenance: 0, Unavailable: 0, 'Sold/Retired': 0 };
    filteredVehicles.forEach((v) => {
      const st = (v.status || '').toLowerCase();
      if (st === 'available') counts.Available++;
      else if (st === 'rented') counts.Rented++;
      else if (st === 'maintenance' || st === 'in workshop') counts.Maintenance++;
      else if (st === 'reserved') counts.Reserved++;
      else counts.Available++;
    });

    return [
      { name: 'Available', value: counts.Available, color: '#10B981' },
      { name: 'Reserved', value: counts.Reserved, color: '#6366F1' },
      { name: 'Rented', value: counts.Rented, color: '#075EE8' },
      { name: 'Maintenance', value: counts.Maintenance, color: '#F97316' },
      { name: 'Unavailable', value: counts.Unavailable, color: '#EF4444' },
      { name: 'Sold/Retired', value: counts['Sold/Retired'], color: '#94A3B8' }
    ];
  }, [isFiltered, dbDashboardData, filteredVehicles]);

  const liveTopVehicles = useMemo(() => {
    if (!isFiltered && dbDashboardData?.topVehicles && dbDashboardData.topVehicles.length > 0) {
      return dbDashboardData.topVehicles;
    }
    const list = filteredVehicles.map((v, idx) => {
      const rental = rentals.find(r => (r.status === 'Active' || r.status === 'active') && (r.vehicleId === v.id || r.vehicle === v.name));
      const wRent = rental ? Number(rental.weeklyRent || 0) : 0;
      const rev = Math.round((wRent > 0 ? wRent * 4.286 : (v.revenue || 0)) * dateMultiplier);
      const exp = Math.round(rev * 0.25);
      return {
        id: v.id || idx + 1,
        rank: idx + 1,
        name: v.name || `${v.make} ${v.model}`,
        make: v.make,
        model: v.model,
        revenue: rev,
        profit: rev - exp
      };
    });
    list.sort((a, b) => b.revenue - a.revenue);
    return list.slice(0, 5).map((v, i) => ({ ...v, rank: i + 1 }));
  }, [isFiltered, dbDashboardData, filteredVehicles, rentals, dateMultiplier]);

  const liveReminders = useMemo(() => {
    const raw = dbDashboardData?.reminders || [];
    if (!isFiltered) return raw;
    const vNames = new Set(filteredVehicles.map(v => (v.name || '').toLowerCase()));
    const filtered = raw.filter(r => vNames.has((r.vehicle || '').toLowerCase()));
    return filtered.length > 0 ? filtered : raw;
  }, [dbDashboardData, isFiltered, filteredVehicles]);

  const liveFinancialSummary = useMemo(() => {
    if (!isFiltered && dbDashboardData?.financialSummary) {
      return dbDashboardData.financialSummary;
    }
    return {
      totalRevenue: liveStats.monthlyRevenue,
      totalExpenses: liveStats.monthlyExpenses,
      netProfit: liveStats.netProfit,
      profitMarginChange: liveStats.isProfitPositive ? '+100%' : '-10%'
    };
  }, [isFiltered, dbDashboardData, liveStats]);

  const liveRevenueOverview = useMemo(() => {
    if (!isFiltered && dbDashboardData?.revenueOverview) {
      return dbDashboardData.revenueOverview;
    }
    const weeklyRev = Math.round(liveStats.monthlyRevenue / 4);
    const weeklyExp = Math.round(liveStats.monthlyExpenses / 4);
    return {
      'This Month': [
        { name: 'Week 1', revenue: Math.round(weeklyRev * 0.9), expenses: Math.round(weeklyExp * 0.85) },
        { name: 'Week 2', revenue: Math.round(weeklyRev * 0.95), expenses: Math.round(weeklyExp * 0.9) },
        { name: 'Week 3', revenue: Math.round(weeklyRev * 1.05), expenses: Math.round(weeklyExp * 1.1) },
        { name: 'Week 4', revenue: weeklyRev, expenses: weeklyExp },
      ],
      'Last 6 Months': [
        { name: 'M-5', revenue: Math.round(liveStats.monthlyRevenue * 0.75), expenses: Math.round(liveStats.monthlyExpenses * 0.8) },
        { name: 'M-4', revenue: Math.round(liveStats.monthlyRevenue * 0.8), expenses: Math.round(liveStats.monthlyExpenses * 0.85) },
        { name: 'M-3', revenue: Math.round(liveStats.monthlyRevenue * 0.85), expenses: Math.round(liveStats.monthlyExpenses * 0.9) },
        { name: 'M-2', revenue: Math.round(liveStats.monthlyRevenue * 0.9), expenses: Math.round(liveStats.monthlyExpenses * 0.95) },
        { name: 'M-1', revenue: Math.round(liveStats.monthlyRevenue * 0.95), expenses: Math.round(liveStats.monthlyExpenses * 0.98) },
        { name: 'Cur', revenue: liveStats.monthlyRevenue, expenses: liveStats.monthlyExpenses },
      ],
      'This Year': [
        { name: 'Q1', revenue: Math.round(liveStats.monthlyRevenue * 2.8), expenses: Math.round(liveStats.monthlyExpenses * 2.7) },
        { name: 'Q2', revenue: Math.round(liveStats.monthlyRevenue * 3.0), expenses: Math.round(liveStats.monthlyExpenses * 2.9) },
        { name: 'Q3', revenue: Math.round(liveStats.monthlyRevenue * 3.2), expenses: Math.round(liveStats.monthlyExpenses * 3.0) },
        { name: 'Q4', revenue: Math.round(liveStats.monthlyRevenue * 3.1), expenses: Math.round(liveStats.monthlyExpenses * 2.95) },
      ]
    };
  }, [isFiltered, dbDashboardData, liveStats]);

  return (
    <div className="space-y-4 sm:space-y-5 animate-slide-up duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-bold transition-all animate-slide-up ${
          toastMessage.type === 'error'
            ? 'bg-rose-600 text-white border-rose-700'
            : 'bg-[#0A1E42] text-white border-slate-800'
        }`}>
          {toastMessage.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Global Dashboard Multi-Parameter Filters */}
      <DashboardFilters
        dateRange={dateRange}
        setDateRange={setDateRange}
        selectedVehicleFilter={selectedVehicleFilter}
        setSelectedVehicleFilter={setSelectedVehicleFilter}
        selectedDriverFilter={selectedDriverFilter}
        setSelectedDriverFilter={setSelectedDriverFilter}
        selectedCategoryFilter={selectedCategoryFilter}
        setSelectedCategoryFilter={setSelectedCategoryFilter}
        isFiltered={isFiltered}
        onResetFilters={handleResetFilters}
        vehicles={vehicles}
        drivers={drivers}
      />

      {/* Quick Action Buttons (Opens Modals) */}
      <DashboardQuickActions
        onOpenRentalModal={() => setIsRentalModalOpen(true)}
        onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
        onOpenExpenseModal={() => setIsExpenseModalOpen(true)}
        onOpenMaintenanceModal={() => setIsMaintenanceModalOpen(true)}
      />

      {/* 6 KPI Cards with Trend Indicators */}
      <DashboardKpis
        filteredStats={liveStats}
        onNavigate={onNavigate}
      />

      {/* Row 1: Line Chart (Revenue vs Expenses), Donut Chart (Fleet Status 6 Statuses), Utilization Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 xl:gap-5">
        {/* Revenue vs Expenses Line Chart */}
        {canAccounting && (
          <div className="lg:col-span-6 h-[340px] transition-all duration-300 hover:shadow-card-hover rounded-2xl">
            <RevenueOverviewChart data={liveRevenueOverview} />
          </div>
        )}

        {/* Fleet Status Donut (Available, Reserved, Rented, Maintenance, Unavailable, Sold/Retired) */}
        {canVehicles && (
          <div
            className={`${
              canAccounting ? 'lg:col-span-3' : 'lg:col-span-6'
            } h-[340px] transition-all duration-300 hover:shadow-card-hover rounded-2xl`}
          >
            <FleetStatusChart data={liveFleetStatus} />
          </div>
        )}

        {/* Fleet Utilization Gauge */}
        {(canVehicles || canRentals) && (
          <div
            className={`${
              canAccounting ? 'lg:col-span-3' : 'lg:col-span-6'
            } h-[340px] transition-all duration-300 hover:shadow-card-hover rounded-2xl`}
          >
            <FleetUtilizationGauge
              utilizationRate={liveStats.utilizationRate ?? 71}
              activeCount={liveStats.activeRentals ?? 5}
              totalCount={liveStats.totalVehicles ?? 7}
              targetRate={85}
            />
          </div>
        )}
      </div>

      {/* Row 2: Important Alerts, Upcoming Reminders, Top Performing Vehicles */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 xl:gap-5">
        {/* Important Alerts Card */}
        <div className="lg:col-span-4">
          <ImportantAlertsCard onNavigate={onNavigate} alerts={dbDashboardData?.alerts} />
        </div>

        {/* Upcoming Reminders (Oil changes, Insurance renewal, Contract expiry) */}
        {(canMaintenance || canDocuments || canRentals) && (
          <div className="lg:col-span-4">
            <UpcomingRemindersCard onNavigate={onNavigate} reminders={liveReminders} />
          </div>
        )}

        {/* Top Performing Vehicles Table */}
        {(canVehicles || canAccounting) && (
          <div className="lg:col-span-4">
            <TopVehiclesCard
              displayedTopVehicles={liveTopVehicles}
              onNavigate={onNavigate}
              onViewVehicle={onViewVehicle}
            />
          </div>
        )}
      </div>

      {/* Row 3: Financial Summary Bar Chart & Statistics */}
      {canAccounting && (
        <div className="transition-all duration-300 hover:shadow-card-hover rounded-2xl">
          <FinancialBarChart data={liveFinancialSummary} />
        </div>
      )}

      {/* Quick Action Modals */}
      <RentalModal
        isOpen={isRentalModalOpen}
        onClose={() => setIsRentalModalOpen(false)}
        onSave={handleSaveRentalAgreement}
      />

      <ExpenseIncomeModals
        isExpenseModalOpen={isExpenseModalOpen}
        onCloseExpenseModal={() => setIsExpenseModalOpen(false)}
        newExpense={newExpense}
        setNewExpense={setNewExpense}
        onAddExpense={handleAddExpense}
        isIncomeModalOpen={isPaymentModalOpen}
        onCloseIncomeModal={() => setIsPaymentModalOpen(false)}
        newIncome={newIncome}
        setNewIncome={setNewIncome}
        onAddIncome={handleAddIncome}
      />

      <MaintenanceModal
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        onSave={handleSaveMaintenanceRecord}
      />
    </div>
  );
}
