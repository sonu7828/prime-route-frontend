import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Shield,
  UserCheck,
  UserX,
  Plus,
  Mail,
  Search,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  Check,
  Loader2,
  RotateCcw,
  Sparkles,
  Lock,
  Send
} from 'lucide-react';
import { useRole } from '../../context/RoleContext';
import { ROLES_CONFIG, hasPermission } from '../../auth/permissions';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import NoAccessPage from '../../components/common/NoAccessPage';
import { usersApi, loadStoredUsers, persistUsers } from '../../api/users';
import { permissionsApi, PRIME_MODULES } from '../../api/permissionsApi';

export default function UsersAndRolesPage({ onNavigateHome, onOpenRoleSwitcher }) {
  const { currentRoleId } = useRole();
  const isOwner = currentRoleId === 'owner';

  const [users, setUsers] = useState(() => {
    return loadStoredUsers();
  });

  const [selectedUserId, setSelectedUserId] = useState(() => {
    const list = loadStoredUsers();
    return list[0]?.id || 'USR-001';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Member form state (for New Member / Edit Member)
  const [formData, setFormData] = useState({
    id: null,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'rental_operations',
    title: '',
    department: 'Fleet Operations',
    permissions: [],
  });

  const getDefaultPermissions = () => {
    return PRIME_MODULES.map((m, idx) => ({
      id: idx + 1,
      moduleName: m,
      canView: true,
      canAdd: false,
      canEdit: false,
      canDelete: false,
    }));
  };

  const handleModalTogglePerm = (moduleName, action) => {
    setFormData((prev) => ({
      ...prev,
      permissions: (prev.permissions || []).map((p) => {
        if (p.moduleName === moduleName) {
          return { ...p, [action]: !p[action] };
        }
        return p;
      }),
    }));
  };

  const handleModalToggleRowAll = (moduleName) => {
    setFormData((prev) => ({
      ...prev,
      permissions: (prev.permissions || []).map((p) => {
        if (p.moduleName === moduleName) {
          const allChecked = p.canView && p.canAdd && p.canEdit && p.canDelete;
          const target = !allChecked;
          return {
            ...p,
            canView: target,
            canAdd: target,
            canEdit: target,
            canDelete: target,
          };
        }
        return p;
      }),
    }));
  };

  const handleModalToggleAll = (targetState) => {
    setFormData((prev) => ({
      ...prev,
      permissions: (prev.permissions || []).map((p) => ({
        ...p,
        canView: targetState,
        canAdd: targetState,
        canEdit: targetState,
        canDelete: targetState,
      })),
    }));
  };

  // Granular Permissions state
  const [userPermissions, setUserPermissions] = useState([]);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [savingPerms, setSavingPerms] = useState(false);

  const selectedUser = useMemo(() => {
    return users.find((u) => u.id === selectedUserId) || users[0] || null;
  }, [users, selectedUserId]);

  const saveUsers = (updated) => {
    setUsers(updated);
    persistUsers(updated);
  };

  // Fetch live users from backend and sync with stored users
  useEffect(() => {
    let isCancelled = false;
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('primeroute_access_token');
        const res = await fetch(`${import.meta.env.VITE_API_URL}/users?limit=100`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        const json = await res.json().catch(() => ({}));
        if (json?.data?.items && Array.isArray(json.data.items) && json.data.items.length > 0) {
          if (!isCancelled) {
            const mapped = json.data.items.map((u) => ({
              id: String(u.id),
              name: u.name,
              firstName: u.name?.split(' ')[0] || '',
              lastName: u.name?.split(' ').slice(1).join(' ') || '',
              email: u.email,
              phone: u.phone,
              role: u.role,
              department: u.department || 'Fleet Operations',
              title: u.title || (u.role === 'owner' ? 'Owner & Managing Director' : 'Operations Director'),
              status: u.status === 'active' || u.status === 'Active' ? 'Active' : 'Inactive',
              lastLogin: u.lastLogin || 'Today, 10:42 AM',
              avatar: u.avatar || `https://images.unsplash.com/photo-${1534528741775 + Number(u.id)}?w=120&auto=format&fit=crop&q=80`
            }));

            // Deduplicate by email
            const uniqueUsers = [];
            const seenEmails = new Set();
            for (const u of mapped) {
              const emailKey = (u.email || '').toLowerCase();
              if (!seenEmails.has(emailKey)) {
                seenEmails.add(emailKey);
                uniqueUsers.push(u);
              }
            }

            setUsers(uniqueUsers);
            persistUsers(uniqueUsers);
          }
        }
      } catch (err) {
        console.warn('Live users load notice:', err.message);
      }
    };

    fetchUsers();
    return () => {
      isCancelled = true;
    };
  }, []);

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load permissions whenever selected user changes
  useEffect(() => {
    if (!selectedUser?.id) return;
    let isCancelled = false;
    setLoadingPerms(true);

    permissionsApi
      .getUserPermissions(selectedUser.id)
      .then((perms) => {
        if (!isCancelled) {
          setUserPermissions(perms);
          setLoadingPerms(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Failed to load permissions:', err);
          setLoadingPerms(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedUser?.id]);

  // Guard: Owner Only
  if (!isOwner) {
    return (
      <NoAccessPage
        moduleName="Users and Roles Administration"
        onNavigateHome={onNavigateHome}
        onOpenRoleSwitcher={onOpenRoleSwitcher}
      />
    );
  }

  // Filtered users list for left pane
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.department || '').toLowerCase().includes(q);

      const userRole = (u.role || '').toLowerCase();
      const filterRole = roleFilter.toLowerCase();
      const matchesRole =
        roleFilter === 'All' ||
        u.role === roleFilter ||
        userRole === filterRole ||
        (filterRole === 'secondary_admin' && (userRole === 'admin' || userRole === 'administrator'));

      const matchesStatus = statusFilter === 'All' || u.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const activeCount = users.filter((u) => u.status === 'Active').length;

  const handleToggleStatus = (userId, e) => {
    if (e) e.stopPropagation();
    const updated = users.map((u) => {
      if (u.id === userId) {
        if (u.role === 'owner' && u.id === 'USR-001') {
          showToast('Cannot deactivate primary system owner account.', 'error');
          return u;
        }
        const newStatus = u.status === 'Active' ? 'Inactive' : 'Active';
        showToast(`User ${u.name} set to ${newStatus}.`, 'success');
        return { ...u, status: newStatus };
      }
      return u;
    });
    saveUsers(updated);
  };

  const handleOpenAddModal = () => {
    setFormData({
      id: null,
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'rental_operations',
      title: '',
      department: 'Fleet Operations',
      permissions: getDefaultPermissions(),
    });
    setShowMemberModal(true);
  };

  const handleOpenEditModal = async (user, e) => {
    if (e) e.stopPropagation();
    const [first = '', ...rest] = (user.name || '').split(' ');
    const last = rest.join(' ');

    let perms = [];
    try {
      perms = await permissionsApi.getUserPermissions(user.id);
    } catch {
      perms = getDefaultPermissions();
    }
    if (!perms || perms.length === 0) {
      perms = getDefaultPermissions();
    }

    setFormData({
      id: user.id,
      firstName: user.firstName || first,
      lastName: user.lastName || last,
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'rental_operations',
      title: user.title || user.department || '',
      department: user.department || 'Fleet Operations',
      permissions: perms,
    });
    setShowMemberModal(true);
  };

  const handleDeleteMember = (userId, e) => {
    if (e) e.stopPropagation();
    if (userId === 'USR-001') {
      showToast('Cannot delete primary system owner account.', 'error');
      return;
    }
    const member = users.find((u) => u.id === userId);
    if (!window.confirm(`Are you sure you want to delete ${member?.name || 'this team member'}?`)) return;

    const updated = users.filter((u) => u.id !== userId);
    saveUsers(updated);
    if (selectedUserId === userId) {
      setSelectedUserId(updated[0]?.id || null);
    }
    showToast(`Team member ${member?.name || ''} deleted.`);
  };

  const handleSaveMember = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.email) {
      showToast('Please provide both first name and email.', 'error');
      return;
    }

    const fullName = `${formData.firstName} ${formData.lastName}`.trim();

    if (formData.id) {
      // Editing existing member
      const updated = users.map((u) => {
        if (u.id === formData.id) {
          return {
            ...u,
            name: fullName,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            role: formData.role,
            department: formData.department || formData.title,
            title: formData.title || formData.department,
          };
        }
        return u;
      });
      saveUsers(updated);

      // Save permissions
      if (formData.permissions && formData.permissions.length > 0) {
        await permissionsApi.updateUserPermissions(formData.id, formData.permissions).catch(console.error);
        if (selectedUserId === formData.id) {
          setUserPermissions(formData.permissions);
        }
      }

      window.dispatchEvent(new Event('permissions_updated'));
      showToast(`Member ${fullName} updated successfully!`);
    } else {
      // Creating new member in Backend with default password 123456
      let createdDbId = null;
      try {
        const token = localStorage.getItem('primeroute_access_token');
        const res = await fetch(`${import.meta.env.VITE_API_URL}/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            role: formData.role,
            department: formData.department,
            permissions: formData.permissions
          })
        });
        const json = await res.json().catch(() => ({}));
        if (json?.data?.user?.id) {
          createdDbId = json.data.user.id;
        }
      } catch (err) {
        console.warn('Backend user creation notice:', err.message);
      }

      const assignedId = createdDbId ? String(createdDbId) : `USR-${String(users.length + 1).padStart(3, '0')}`;
      const newUser = {
        id: assignedId,
        name: fullName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email.toLowerCase(),
        phone: formData.phone,
        role: formData.role,
        department: formData.department || formData.title || 'Fleet Operations',
        title: formData.title || formData.department,
        status: 'Active',
        lastLogin: 'Never (Invited)',
        avatar: `https://images.unsplash.com/photo-${1534528741775 + users.length}?w=120&auto=format&fit=crop&q=80`,
      };
      const updated = [newUser, ...users];
      saveUsers(updated);
      setSelectedUserId(newUser.id);

      // Save initial permissions
      if (formData.permissions && formData.permissions.length > 0) {
        await permissionsApi.updateUserPermissions(assignedId, formData.permissions).catch(console.error);
        setUserPermissions(formData.permissions);
      }

      window.dispatchEvent(new Event('permissions_updated'));
      showToast(`New member ${fullName} added! Default password: 123456`, 'success');
    }

    setShowMemberModal(false);
  };

  const handleRoleChange = (userId, newRole) => {
    let chosenRole = newRole;
    const lowerRole = String(newRole).toLowerCase().trim();
    if (lowerRole === 'admin' || lowerRole === 'administrator') {
      chosenRole = 'secondary_admin';
    }
    const updated = users.map((u) => {
      if (u.id === userId) {
        if (u.id === 'USR-001' && chosenRole !== 'owner') {
          showToast('Primary owner role cannot be changed.', 'error');
          return u;
        }
        showToast(`Updated ${u.name}'s role to ${ROLES_CONFIG[chosenRole]?.name || chosenRole}.`, 'success');
        return { ...u, role: chosenRole };
      }
      return u;
    });
    saveUsers(updated);
    try {
      usersApi.updateUser(userId, { role: chosenRole }).catch(console.error);
    } catch {
      // ignore
    }
  };

  const handleTogglePerm = (moduleName, action) => {
    setUserPermissions((prev) =>
      prev.map((p) => {
        if (p.moduleName === moduleName) {
          return { ...p, [action]: !p[action] };
        }
        return p;
      })
    );
  };

  const handleToggleRowAll = (moduleName) => {
    setUserPermissions((prev) =>
      prev.map((p) => {
        if (p.moduleName === moduleName) {
          const allChecked = p.canView && p.canAdd && p.canEdit && p.canDelete;
          const target = !allChecked;
          return {
            ...p,
            canView: target,
            canAdd: target,
            canEdit: target,
            canDelete: target,
          };
        }
        return p;
      })
    );
  };

  const handleToggleAllModules = (targetState) => {
    setUserPermissions((prev) =>
      prev.map((p) => ({
        ...p,
        canView: targetState,
        canAdd: targetState,
        canEdit: targetState,
        canDelete: targetState,
      }))
    );
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    setSavingPerms(true);
    try {
      await permissionsApi.updateUserPermissions(selectedUser.id, userPermissions);
      // Real-time broadcast so entire app re-evaluates permissions immediately without refresh!
      window.dispatchEvent(new Event('permissions_updated'));
      showToast(`Permissions saved successfully for ${selectedUser.name}!`);
    } catch (err) {
      console.error('Failed to save permissions:', err);
      showToast(err.message || 'Failed to save permissions', 'error');
    } finally {
      setSavingPerms(false);
    }
  };

  const handleSendInvite = (user) => {
    showToast(`Invitation sent to ${user.email}!`, 'success');
  };

  const selectedRoleKey = (selectedUser?.role === 'admin' || selectedUser?.role === 'Administrator')
    ? 'secondary_admin'
    : selectedUser?.role || 'readonly_manager';
  const selectedRoleConfig = ROLES_CONFIG[selectedRoleKey] || ROLES_CONFIG.secondary_admin;

  return (
    <div className="space-y-6 animate-fade-in p-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold text-white transition-all transform animate-scale-up ${
            toastMessage.type === 'error' ? 'bg-rose-600' : 'bg-[#0A1E42]'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-200" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-black text-[#0A1E42] tracking-tight">
              Users &amp; Roles Management
            </h1>
            <span className="text-xs font-bold px-3 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 shadow-xs flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-purple-600" />
              Owner Restricted Console
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Assign business roles, manage user activation status, and configure granular permissions across modules.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#075EE8] hover:bg-[#0650C7] text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Member
        </button>
      </div>

      {/* Top Stat Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Accounts</span>
          <p className="text-2xl font-black text-[#0A1E42] mt-1">{users.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Registered personnel</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Active Users</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Cleared for access</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">System Roles</span>
          <p className="text-2xl font-black text-[#075EE8] mt-1">6</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Granular RBAC profiles</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Primary Owner</span>
          <p className="text-2xl font-black text-purple-700 mt-1">1</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Master administrator</p>
        </div>
      </div>

      {/* 2-Column Split Workbench: Team Members List (Left) + Granular Permissions Matrix (Right) */}
      <div className="flex flex-col lg:flex-row gap-6 min-h-[620px]">
        {/* Left Pane: Team Members */}
        <div className="w-full lg:w-[380px] shrink-0 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(7,29,73,0.04)] p-4 flex flex-col">
          {/* List Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-[#0A1E42]">Team Members</h2>
              <p className="text-[11px] text-slate-400">{filteredUsers.length} of {users.length} shown</p>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#075EE8] hover:bg-[#0650C7] text-white text-[11px] font-bold rounded-lg transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              New Member
            </button>
          </div>

          {/* Search & Filters */}
          <div className="py-3 space-y-2 border-b border-slate-100">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, email, department..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#075EE8]/20 focus:border-[#075EE8]"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-1/2 px-2.5 py-1.5 text-[11px] bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-hidden cursor-pointer"
              >
                <option value="All">All Roles</option>
                {Object.values(ROLES_CONFIG).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-1/2 px-2.5 py-1.5 text-[11px] bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-hidden cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Scrollable Members List */}
          <div className="flex-1 overflow-y-auto mt-2 space-y-1.5 pr-1 max-h-[580px]">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No team members match your filter criteria.
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isSelected = selectedUser?.id === user.id;
                const roleKey = (user.role === 'admin' || user.role === 'Administrator') ? 'secondary_admin' : user.role;
                const roleConfig = ROLES_CONFIG[roleKey] || ROLES_CONFIG.secondary_admin;
                const isActive = user.status === 'Active';

                return (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className={`p-3 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-blue-50/80 border-[#075EE8] ring-1 ring-[#075EE8]/30 shadow-xs'
                        : 'bg-white hover:bg-slate-50/80 border-slate-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={user.avatar || '/placeholders/avatar-default.svg'}
                          alt={user.name}
                          onError={(e) => { e.currentTarget.src = '/placeholders/avatar-default.svg'; }}
                          className="w-9 h-9 rounded-xl object-cover ring-2 ring-slate-100 shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[#0A1E42] truncate">{user.name}</h4>
                          <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {user.status}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-slate-100/80 text-[11px]">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${roleConfig.badgeColor}`}>
                        {roleConfig.name}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => handleOpenEditModal(user, e)}
                          className="p-1 text-slate-400 hover:text-[#075EE8] rounded-md hover:bg-slate-100 transition-colors"
                          title="Edit Member"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>

                        {user.id !== 'USR-001' && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteMember(user.id, e)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                            title="Delete Member"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => handleToggleStatus(user.id, e)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors cursor-pointer ${
                            isActive
                              ? 'text-rose-600 hover:bg-rose-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Granular Permissions Matrix for Selected Member */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(7,29,73,0.04)] p-6 flex flex-col min-w-0">
          {selectedUser ? (
            <>
              {/* Member Overview Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#075EE8]/10 text-[#075EE8] flex items-center justify-center font-black text-sm shrink-0 border border-[#075EE8]/20">
                    <Shield className="w-6 h-6 text-[#075EE8]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-[#0A1E42]">
                        Permissions Matrix: {selectedUser.name}
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${selectedRoleConfig.badgeColor}`}>
                        {selectedRoleConfig.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {selectedUser.email} • {selectedUser.department} • Last login: {selectedUser.lastLogin}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleSendInvite(selectedUser)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Resend Invite
                  </button>

                  <button
                    type="button"
                    disabled={savingPerms}
                    onClick={handleSavePermissions}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#075EE8] hover:bg-[#0650C7] text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {savingPerms ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Save Permissions
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Actions & Role Switcher Toolbar */}
              <div className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-600">Assigned Role:</span>
                  <select
                    value={selectedRoleKey}
                    disabled={selectedUser.id === 'USR-001'}
                    onChange={(e) => handleRoleChange(selectedUser.id, e.target.value)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border cursor-pointer focus:outline-hidden ${selectedRoleConfig.badgeColor}`}
                  >
                    {Object.values(ROLES_CONFIG).map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleAllModules(true)}
                    className="px-3 py-1.5 text-xs font-bold text-[#075EE8] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl cursor-pointer transition-all"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleAllModules(false)}
                    className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer transition-all"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Permissions Matrix Table */}
              <div className="flex-1 overflow-x-auto mt-4">
                {loadingPerms ? (
                  <div className="flex flex-col items-center justify-center p-16 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin text-[#075EE8] mb-2" />
                    <p className="text-xs font-semibold">Loading access matrix for {selectedUser.name}...</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#F8FAFC] border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                        <th className="py-3 px-4">Software Module</th>
                        <th className="py-3 px-3 text-center">View</th>
                        <th className="py-3 px-3 text-center">Add</th>
                        <th className="py-3 px-3 text-center">Edit</th>
                        <th className="py-3 px-3 text-center">Delete</th>
                        <th className="py-3 px-3 text-center">All</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {userPermissions.map((perm) => {
                        const allChecked = perm.canView && perm.canAdd && perm.canEdit && perm.canDelete;
                        const isSubMenu = perm.moduleName.startsWith('Settings - ');
                        return (
                          <tr key={perm.moduleName} className={`transition-colors ${isSubMenu ? 'bg-slate-50/50 hover:bg-blue-50/30' : 'hover:bg-blue-50/20'}`}>
                            <td className="py-2.5 px-4">
                              {isSubMenu ? (
                                <div className="flex items-center gap-1.5 pl-5">
                                  <span className="text-slate-400 font-mono text-xs">↳</span>
                                  <span className="font-semibold text-slate-700">
                                    {perm.moduleName.replace('Settings - ', '')}
                                  </span>
                                  <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                    Submenu
                                  </span>
                                </div>
                              ) : (
                                <span className="font-bold text-[#0A1E42]">
                                  {perm.moduleName}
                                </span>
                              )}
                            </td>
                            {['canView', 'canAdd', 'canEdit', 'canDelete'].map((act) => (
                              <td key={act} className="py-2.5 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={Boolean(perm[act])}
                                  onChange={() => handleTogglePerm(perm.moduleName, act)}
                                  className="w-4 h-4 rounded text-[#075EE8] focus:ring-[#075EE8] border-slate-300 cursor-pointer accent-[#075EE8]"
                                />
                              </td>
                            ))}
                            <td className="py-2.5 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={Boolean(allChecked)}
                                onChange={() => handleToggleRowAll(perm.moduleName)}
                                className="w-4 h-4 rounded text-slate-600 focus:ring-slate-400 border-slate-300 cursor-pointer"
                                title="Toggle all permissions for this module"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Bottom Save Bar */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">
                  Granular permissions grant or restrict specific actions for {selectedUser.name}.
                </span>
                <button
                  type="button"
                  disabled={savingPerms}
                  onClick={handleSavePermissions}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-[#075EE8] hover:bg-[#0650C7] text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {savingPerms ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Save Permissions
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 text-center">
              <Users className="w-12 h-12 stroke-1 text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-600">No Team Member Selected</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Select a team member from the left list to view and configure their module access matrix.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Team Member Modal (New Member / Edit Member) with Sidebar Menus Permissions */}
      <Modal
        isOpen={showMemberModal}
        onClose={() => setShowMemberModal(false)}
        title={formData.id ? 'Edit Team Member' : 'New Team Member'}
        subtitle={
          formData.id
            ? 'Update member profile, role, and granular sidebar menu permissions'
            : 'Add a new team member and configure their sidebar menu permissions'
        }
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSaveMember} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">First Name *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="e.g. Jessica"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#075EE8]/20 focus:border-[#075EE8]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="e.g. Taylor"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#075EE8]/20 focus:border-[#075EE8]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="jessica.taylor@primeroute.io"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#075EE8]/20 focus:border-[#075EE8]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 234-5678"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#075EE8]/20 focus:border-[#075EE8]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Assigned Role</label>
              <select
                value={formData.role}
                disabled={formData.id === 'USR-001'}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden cursor-pointer"
              >
                {Object.values(ROLES_CONFIG).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Role / Job Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Property Manager, Bookkeeper"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#075EE8]/20 focus:border-[#075EE8]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Department</label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden cursor-pointer"
            >
              <option value="Fleet Operations">Fleet Operations</option>
              <option value="Finance & Accounting">Finance & Accounting</option>
              <option value="Logistics & Dispatch">Logistics & Dispatch</option>
              <option value="Maintenance & Service">Maintenance & Service</option>
              <option value="Compliance Oversight">Compliance Oversight</option>
              <option value="Executive Administration">Executive Administration</option>
            </select>
          </div>

          {/* Granular Sidebar Menus Permissions Table */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div>
                <h4 className="text-xs font-bold text-[#0A1E42] flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#075EE8]" />
                  Sidebar Menus Access &amp; Permissions
                </h4>
                <p className="text-[11px] text-slate-400">
                  Configure View, Add, Edit/Update, and Delete permissions for each sidebar module.
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleModalToggleAll(true)}
                  className="px-2.5 py-1 text-[11px] font-bold text-[#075EE8] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer transition-all"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => handleModalToggleAll(false)}
                  className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer transition-all"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-[#F8FAFC] border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider z-10">
                  <tr>
                    <th className="py-2.5 px-3">Sidebar Menu</th>
                    <th className="py-2.5 px-2 text-center">View</th>
                    <th className="py-2.5 px-2 text-center">Add</th>
                    <th className="py-2.5 px-2 text-center">Edit / Update</th>
                    <th className="py-2.5 px-2 text-center">Delete</th>
                    <th className="py-2.5 px-2 text-center">All</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {formData.permissions?.map((p) => {
                    const allChecked = p.canView && p.canAdd && p.canEdit && p.canDelete;
                    const isSubMenu = p.moduleName.startsWith('Settings - ');
                    return (
                      <tr key={p.moduleName} className={`transition-colors ${isSubMenu ? 'bg-slate-50/50 hover:bg-blue-50/30' : 'hover:bg-blue-50/20'}`}>
                        <td className="py-2 px-3">
                          {isSubMenu ? (
                            <div className="flex items-center gap-1.5 pl-4">
                              <span className="text-slate-400 font-mono text-xs">↳</span>
                              <span className="font-semibold text-slate-700">
                                {p.moduleName.replace('Settings - ', '')}
                              </span>
                              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                Submenu
                              </span>
                            </div>
                          ) : (
                            <span className="font-bold text-[#0A1E42]">
                              {p.moduleName}
                            </span>
                          )}
                        </td>
                        {['canView', 'canAdd', 'canEdit', 'canDelete'].map((act) => (
                          <td key={act} className="py-2 px-2 text-center">
                            <input
                              type="checkbox"
                              checked={Boolean(p[act])}
                              onChange={() => handleModalTogglePerm(p.moduleName, act)}
                              className="w-4 h-4 rounded text-[#075EE8] focus:ring-[#075EE8] border-slate-300 cursor-pointer accent-[#075EE8]"
                            />
                          </td>
                        ))}
                        <td className="py-2 px-2 text-center">
                          <input
                            type="checkbox"
                            checked={Boolean(allChecked)}
                            onChange={() => handleModalToggleRowAll(p.moduleName)}
                            className="w-4 h-4 rounded text-slate-600 focus:ring-slate-400 border-slate-300 cursor-pointer"
                            title="Toggle all for this menu"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowMemberModal(false)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#075EE8] hover:bg-[#0650C7] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
            >
              {formData.id ? 'Save Changes' : 'Save Member'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
