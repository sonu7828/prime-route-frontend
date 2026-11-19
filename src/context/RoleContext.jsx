import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ROLES_CONFIG, hasPermission } from '../auth/permissions';
import { paperworkApi } from '../api/paperworkApi';
import { permissionsApi } from '../api/permissionsApi';

export const ROLES = {
  OWNER: {
    id: 'owner',
    name: 'Owner / Primary Admin',
    fullName: 'Marcus Brody',
    email: 'marcus.brody@primeroute.io',
    title: 'Owner & Managing Director',
    badge: 'Full Root Privileges',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    description: 'Unrestricted system access: users, settings, finance, accounting, reports, audit logs, and master security overrides.',
    allowedMenus: [
      'dashboard',
      'vehicles',
      'drivers',
      'rentals',
      'inspections',
      'insurance',
      'accounting',
      'maintenance',
      'tolls-tickets',
      'documents',
      'reports',
      'settings',
      'users',
      'employee-paperwork'
    ]
  },
  SECONDARY_ADMIN: {
    id: 'secondary_admin',
    name: 'Secondary Admin',
    fullName: 'Elena Vance',
    email: 'elena.vance@primeroute.io',
    title: 'Operations Director',
    badge: 'Operational Admin',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    description: 'Broad operational administration. Sensitive actions (e.g. system config, bank releases, permanent archive) require Owner approval.',
    allowedMenus: [
      'dashboard',
      'vehicles',
      'drivers',
      'rentals',
      'inspections',
      'insurance',
      'accounting',
      'maintenance',
      'tolls-tickets',
      'documents',
      'reports',
      'settings',
      'employee-paperwork'
    ]
  },
  FINANCE: {
    id: 'finance',
    name: 'Finance',
    fullName: 'Michael Chang',
    email: 'michael.chang@primeroute.io',
    title: 'Financial Controller',
    badge: 'Financial Controller',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    description: 'Full financial authority: payments, expenses, accounting ledger, security deposit escrow, and P&L statements.',
    allowedMenus: [
      'dashboard',
      'accounting',
      'tolls-tickets',
      'documents',
      'reports'
    ]
  },
  FLEET_MAINTENANCE: {
    id: 'fleet_maintenance',
    name: 'Fleet / Maintenance',
    fullName: 'Tom Gallagher',
    email: 'tom.gallagher@primeroute.io',
    title: 'Fleet & Service Lead',
    badge: 'Fleet Ops & Shop',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80',
    description: 'Vehicle fleet management, odometer tracking, routine maintenance schedules, workshop repair orders, and handover inspections.',
    allowedMenus: [
      'dashboard',
      'vehicles',
      'maintenance',
      'inspections',
      'insurance',
      'documents'
    ]
  },
  RENTAL_OPERATIONS: {
    id: 'rental_operations',
    name: 'Rental / Operations',
    fullName: 'Sarah Connor',
    email: 'sarah.connor@primeroute.io',
    title: 'Front Desk & Dispatcher',
    badge: 'Front-desk & Dispatch',
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    description: 'Booking intake, rental leasing contracts, digital driver assignment, vehicle pickup handover, and check-in return verification.',
    allowedMenus: [
      'dashboard',
      'rentals',
      'drivers',
      'inspections',
      'insurance',
      'documents'
    ]
  },
  READONLY_MANAGER: {
    id: 'readonly_manager',
    name: 'Read-only Manager',
    fullName: 'Rachel Green',
    email: 'rachel.green@primeroute.io',
    title: 'Compliance & Audit Officer',
    badge: 'Audit & Compliance',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
    description: 'Executive and auditor oversight. View-only access to operational dashboards and reports with zero edit/write privileges.',
    allowedMenus: [
      'dashboard',
      'reports',
      'vehicles',
      'rentals',
      'inspections',
      'insurance',
      'maintenance',
      'documents'
    ]
  }
};

const RoleContext = createContext(null);

export function RoleProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('primeroute_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [currentRoleId, setCurrentRoleId] = useState(() => {
    try {
      const savedUser = localStorage.getItem('primeroute_current_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u?.role) return u.role.toLowerCase();
      }
      const saved = localStorage.getItem('primeroute_active_role');
      if (!saved) return 'owner';
      // Normalize legacy role IDs
      if (saved === 'admin') return 'owner';
      if (saved === 'manager') return 'rental_operations';
      if (saved === 'employee') return 'fleet_maintenance';
      
      const validRoles = Object.keys(ROLES_CONFIG);
      if (validRoles.includes(saved.toLowerCase())) {
        return saved.toLowerCase();
      }
      localStorage.removeItem('primeroute_active_role');
    } catch {
      // ignore
    }
    return 'owner';
  });

  const [paperworkData, setPaperworkData] = useState(() => {
    try {
      const saved = localStorage.getItem('primeroute_employee_paperwork');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      status: 'Not Started',
      lastUpdated: null,
      submittedAt: null,
      submissionId: 'PR-SUB-2026-8841',
      reviewNotes: '',
      personal: {
        firstName: 'David',
        lastName: 'Miller',
        email: 'david.miller@primeroute.io',
        phone: '+1 (555) 349-1029',
        dob: '1992-06-14',
        address: '742 Evergreen Terrace',
        city: 'Queens',
        state: 'NY',
        zipCode: '11375',
        emergencyContactName: 'Sarah Miller',
        emergencyContactPhone: '+1 (555) 902-4821'
      },
      employment: {
        employeeId: 'PR-EMP-2026',
        position: 'Logistics Fleet Driver',
        department: 'Fleet Operations',
        employmentType: 'Full-Time',
        joiningDate: '2026-03-01',
        assignedManager: 'Elena Vance'
      },
      documents: {
        governmentId: { name: 'US_Passport_DMiller.pdf', size: '2.4 MB', uploadedAt: '2026-11-04' },
        drivingLicense: { name: 'NY_Driver_License_ClassD.pdf', size: '1.8 MB', uploadedAt: '2026-11-04' },
        taxDocuments: null,
        bankDetails: null,
        otherDocuments: null
      },
      agreements: {
        codeOfConduct: false,
        safetyPolicy: false,
        digitalSignature: null,
        acceptedTerms: false
      }
    };
  });

  // Load live paperwork data from MySQL on mount
  useEffect(() => {
    let isMounted = true;
    paperworkApi.getPaperwork()
      .then((data) => {
        if (isMounted && data) {
          setPaperworkData(data);
        }
      })
      .catch((err) => {
        console.warn('Paperwork live load warning:', err.message);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Save changes to localStorage as offline fallback
  useEffect(() => {
    try {
      localStorage.setItem('primeroute_active_role', currentRoleId);
    } catch {
      // ignore
    }
  }, [currentRoleId]);

  useEffect(() => {
    try {
      localStorage.setItem('primeroute_employee_paperwork', JSON.stringify(paperworkData));
    } catch {
      // ignore
    }
  }, [paperworkData]);

  // Resolve current active role object, dynamically enriched with logged-in user profile
  const activeRole = useMemo(() => {
    const key = Object.keys(ROLES).find(
      (k) => ROLES[k].id === currentRoleId
    );
    const baseRole = key ? ROLES[key] : ROLES.OWNER;
    if (currentUser) {
      return {
        ...baseRole,
        fullName: currentUser.name || currentUser.fullName || baseRole.fullName,
        email: currentUser.email || baseRole.email,
        title: currentUser.title || currentUser.department || baseRole.title,
        avatar: currentUser.avatar || baseRole.avatar
      };
    }
    return baseRole;
  }, [currentRoleId, currentUser]);

  const switchRole = (roleId) => {
    const match = Object.values(ROLES).find((r) => r.id === roleId?.toLowerCase());
    const validRoleId = match ? match.id : 'owner';
    setCurrentRoleId(validRoleId);
  };

  const returnToAdmin = () => {
    setCurrentRoleId('owner');
  };

  // Synchronize current user session and live permissions
  useEffect(() => {
    let isMounted = true;
    const syncUserSession = async () => {
      try {
        const stored = localStorage.getItem('primeroute_current_user');
        if (stored) {
          const userObj = JSON.parse(stored);
          if (isMounted) setCurrentUser(userObj);
          if (userObj.id) {
            localStorage.setItem('primeroute_active_user_id', String(userObj.id));
            const perms = await permissionsApi.getUserPermissions(userObj.id).catch(() => null);
            if (perms && Array.isArray(perms) && perms.length > 0) {
              localStorage.setItem(`primeroute_user_permissions_${userObj.id}`, JSON.stringify(perms));
              localStorage.setItem('primeroute_permissions', JSON.stringify(perms));
              if (isMounted) setPermissionsVersion((v) => v + 1);
            }
          }
        }
      } catch (err) {
        // ignore
      }
    };

    syncUserSession();
    return () => {
      isMounted = false;
    };
  }, [currentRoleId]);

  const [permissionsVersion, setPermissionsVersion] = useState(0);

  // Real-time permission sync listeners
  useEffect(() => {
    let isMounted = true;
    const handlePermissionsUpdated = async () => {
      try {
        const stored = localStorage.getItem('primeroute_current_user');
        if (stored) {
          const userObj = JSON.parse(stored);
          if (userObj.id) {
            const perms = await permissionsApi.getUserPermissions(userObj.id).catch(() => null);
            if (isMounted && perms && Array.isArray(perms) && perms.length > 0) {
              localStorage.setItem(`primeroute_user_permissions_${userObj.id}`, JSON.stringify(perms));
              localStorage.setItem('primeroute_permissions', JSON.stringify(perms));
              setPermissionsVersion((v) => v + 1);
              return;
            }
          }
        }
      } catch (err) {
        // ignore
      }
      if (isMounted) {
        setPermissionsVersion((v) => v + 1);
      }
    };

    window.addEventListener('permissions_updated', handlePermissionsUpdated);
    window.addEventListener('storage', handlePermissionsUpdated);
    window.addEventListener('focus', handlePermissionsUpdated);

    // Periodic check every 5 seconds so incognito/separate browser sessions sync automatically
    const interval = setInterval(handlePermissionsUpdated, 5000);

    return () => {
      isMounted = false;
      window.removeEventListener('permissions_updated', handlePermissionsUpdated);
      window.removeEventListener('storage', handlePermissionsUpdated);
      window.removeEventListener('focus', handlePermissionsUpdated);
      clearInterval(interval);
    };
  }, []);

  const isMenuAllowed = (menuId) => {
    // Reading permissionsVersion ensures React re-evaluates isMenuAllowed whenever permissionsVersion changes!
    void permissionsVersion;
    return hasPermission(currentRoleId, menuId, 'view');
  };

  const updatePaperwork = (updater) => {
    setPaperworkData((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      // Asynchronously persist to MySQL
      paperworkApi.savePaperwork(next).catch((err) => {
        console.error('Failed to sync paperwork to MySQL:', err);
      });
      return next;
    });
  };

  return (
    <RoleContext.Provider
      value={{
        currentUser,
        currentRoleId,
        activeRole,
        switchRole,
        returnToAdmin,
        isMenuAllowed,
        paperworkData,
        updatePaperwork,
        rolesList: Object.values(ROLES)
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    return {
      currentRoleId: 'owner',
      activeRole: ROLES.OWNER,
      switchRole: () => {},
      returnToAdmin: () => {},
      isMenuAllowed: () => true,
      paperworkData: { status: 'Not Started' },
      updatePaperwork: () => {},
      rolesList: Object.values(ROLES)
    };
  }
  return context;
}
