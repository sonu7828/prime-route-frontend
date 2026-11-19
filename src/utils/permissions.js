/**
 * Checks if the logged-in user has permission for a specific module action.
 * @param {string} moduleName - Module name (e.g. 'Vehicles', 'Rentals', 'Accounting')
 * @param {'view' | 'add' | 'edit' | 'delete'} action - Action to check
 * @returns {boolean}
 */
export const hasPermission = (moduleName, action = 'view') => {
  try {
    const userStr = localStorage.getItem('primeroute_user') || localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      // Owner has full unrestricted bypass
      if (user.role === 'owner') return true;
    }

    const permsStr = localStorage.getItem('primeroute_permissions') || localStorage.getItem('permissions');
    if (!permsStr) return true; // Fallback to permissive if not loaded

    const permissions = JSON.parse(permsStr);
    const perm = permissions.find(
      (p) => (p.moduleName || p.module)?.toLowerCase() === moduleName?.toLowerCase()
    );

    if (!perm) return false;

    const act = action.toLowerCase();
    if (act === 'view') return Boolean(perm.canView ?? perm.can_view);
    if (act === 'add') return Boolean(perm.canAdd ?? perm.can_add);
    if (act === 'edit') return Boolean(perm.canEdit ?? perm.can_edit);
    if (act === 'delete') return Boolean(perm.canDelete ?? perm.can_delete);

    return false;
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
};
