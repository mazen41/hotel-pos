'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePermissions } from '@/contexts/AuthContext';
import { rolesApi } from '@/lib/api';
import type { Role } from '@/types';
import { Shield, Plus, Edit, Trash2, Check, X } from 'lucide-react';

export default function RolesPage() {
  const t = useTranslations();
  const { can } = usePermissions();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    max_discount_percent: 0,
    max_discount_amount: 0,
    permissions: [] as string[]
  });

  // Define all available permissions by module
  const permissionModules = {
    'pos': [
      'pos.view',
      'pos.create_order',
      'pos.manage_shifts',
      'pos.manage_inventory',
      'pos.manage_returns',
      'pos.manage_menu',
      'pos.view_reports'
    ],
    'roles': [
      'roles.view',
      'roles.create',
      'roles.edit',
      'roles.delete'
    ],
    'settings': [
      'settings.view',
      'settings.edit'
    ]
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const { data } = await rolesApi.list();
      setRoles(data);
    } catch (error) {
      console.error('Failed to load roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    try {
      const { data } = await rolesApi.create(formData);
      setRoles([...roles, data]);
      setShowCreateDialog(false);
      setFormData({
        name: '',
        max_discount_percent: 0,
        max_discount_amount: 0,
        permissions: []
      });
    } catch (error) {
      console.error('Failed to create role:', error);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedRole) return;

    try {
      const { data } = await rolesApi.update(selectedRole.id, formData);
      setRoles(roles.map(r => r.id === selectedRole.id ? data : r));
      setShowEditDialog(false);
      setSelectedRole(null);
      setFormData({
        name: '',
        max_discount_percent: 0,
        max_discount_amount: 0,
        permissions: []
      });
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const handleDeleteRole = async (id: number) => {
    if (!confirm(t('roles.confirmDelete'))) return;

    try {
      await rolesApi.delete(id);
      setRoles(roles.filter(r => r.id !== id));
    } catch (error) {
      console.error('Failed to delete role:', error);
    }
  };

  const togglePermission = (permission: string) => {
    setFormData({
      ...formData,
      permissions: formData.permissions.includes(permission)
        ? formData.permissions.filter(p => p !== permission)
        : [...formData.permissions, permission]
    });
  };

  const openEditDialog = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      max_discount_percent: role.max_discount_percent || 0,
      max_discount_amount: role.max_discount_amount || 0,
      permissions: role.permissions || []
    });
    setShowEditDialog(true);
  };

  if (!can('roles.view')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-text-muted">{t('errors.noPermission')}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-text-muted">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-text-primary mb-2">
            {t('roles.title')}
          </h1>
          <p className="text-text-muted">
            Manage user roles and their permissions
          </p>
        </div>

        {/* Roles Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-bold text-text-primary">
              Roles
            </h2>
            {can('roles.create') && (
              <button
                onClick={() => setShowCreateDialog(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('roles.createRole')}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => (
              <div key={role.id} className="glass rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary bg-opacity-10 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold text-text-primary">
                        {role.name}
                      </h3>
                      <p className="text-sm text-text-muted">
                        {role.permissions?.length || 0} permissions
                      </p>
                    </div>
                  </div>
                  
                  {can('roles.edit') && (
                    <button
                      onClick={() => openEditDialog(role)}
                      className="p-2 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">{t('roles.maxDiscountPercent')}</span>
                    <span className="text-text-primary font-medium">
                      {role.max_discount_percent}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">{t('roles.maxDiscountAmount')}</span>
                    <span className="text-text-primary font-medium">
                      ${role.max_discount_amount?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {role.permissions?.slice(0, 3).map((permission) => (
                    <span
                      key={permission}
                      className="px-2 py-1 rounded-full text-xs font-medium bg-surface-elevated text-text-secondary"
                    >
                      {permission}
                    </span>
                  ))}
                  {(role.permissions?.length || 0) > 3 && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-surface-elevated text-text-secondary">
                      +{(role.permissions?.length || 0) - 3} more
                    </span>
                  )}
                </div>

                {can('roles.delete') && role.name !== 'Admin' && (
                  <button
                    onClick={() => handleDeleteRole(role.id)}
                    className="mt-4 w-full py-2 rounded-lg bg-error bg-opacity-10 text-error hover:bg-error hover:text-white transition-colors"
                  >
                    {t('roles.deleteRole')}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Create Role Dialog */}
        {showCreateDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-surface rounded-2xl p-6 w-full max-w-2xl my-8">
              <h3 className="font-display text-xl font-bold text-text-primary mb-6">
                {t('roles.createRole')}
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    {t('roles.roleName')}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-text-accent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      {t('roles.maxDiscountPercent')}
                    </label>
                    <input
                      type="number"
                      value={formData.max_discount_percent}
                      onChange={(e) => setFormData({ ...formData, max_discount_percent: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 rounded-lg bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-text-accent"
                      max={100}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      {t('roles.maxDiscountAmount')}
                    </label>
                    <input
                      type="number"
                      value={formData.max_discount_amount}
                      onChange={(e) => setFormData({ ...formData, max_discount_amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 rounded-lg bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-text-accent"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <h4 className="font-display text-lg font-bold text-text-primary mb-4">
                    {t('roles.permissionsByModule')}
                  </h4>
                  
                  {Object.entries(permissionModules).map(([module, permissions]) => (
                    <div key={module} className="mb-4">
                      <h5 className="font-medium text-text-primary mb-2 capitalize">{module}</h5>
                      <div className="grid grid-cols-2 gap-2">
                        {permissions.map((permission) => (
                          <button
                            key={permission}
                            onClick={() => togglePermission(permission)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                              formData.permissions.includes(permission)
                                ? 'border-primary bg-primary bg-opacity-10 text-primary'
                                : 'border-border text-text-secondary hover:border-text-accent'
                            }`}
                          >
                            {formData.permissions.includes(permission) ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                            <span className="text-sm">{permission}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateDialog(false)}
                  className="flex-1 py-3 rounded-lg bg-surface text-text-secondary hover:bg-surface-hover transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleCreateRole}
                  className="flex-1 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-600 transition-colors"
                >
                  {t('roles.createRole')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Role Dialog */}
        {showEditDialog && selectedRole && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-surface rounded-2xl p-6 w-full max-w-2xl my-8">
              <h3 className="font-display text-xl font-bold text-text-primary mb-6">
                {t('roles.editRole')}: {selectedRole.name}
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    {t('roles.roleName')}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-text-accent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      {t('roles.maxDiscountPercent')}
                    </label>
                    <input
                      type="number"
                      value={formData.max_discount_percent}
                      onChange={(e) => setFormData({ ...formData, max_discount_percent: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 rounded-lg bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-text-accent"
                      max={100}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      {t('roles.maxDiscountAmount')}
                    </label>
                    <input
                      type="number"
                      value={formData.max_discount_amount}
                      onChange={(e) => setFormData({ ...formData, max_discount_amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 rounded-lg bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-text-accent"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <h4 className="font-display text-lg font-bold text-text-primary mb-4">
                    {t('roles.permissionsByModule')}
                  </h4>
                  
                  {Object.entries(permissionModules).map(([module, permissions]) => (
                    <div key={module} className="mb-4">
                      <h5 className="font-medium text-text-primary mb-2 capitalize">{module}</h5>
                      <div className="grid grid-cols-2 gap-2">
                        {permissions.map((permission) => (
                          <button
                            key={permission}
                            onClick={() => togglePermission(permission)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                              formData.permissions.includes(permission)
                                ? 'border-primary bg-primary bg-opacity-10 text-primary'
                                : 'border-border text-text-secondary hover:border-text-accent'
                            }`}
                          >
                            {formData.permissions.includes(permission) ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                            <span className="text-sm">{permission}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditDialog(false);
                    setSelectedRole(null);
                    setFormData({
                      name: '',
                      max_discount_percent: 0,
                      max_discount_amount: 0,
                      permissions: []
                    });
                  }}
                  className="flex-1 py-3 rounded-lg bg-surface text-text-secondary hover:bg-surface-hover transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleUpdateRole}
                  className="flex-1 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-600 transition-colors"
                >
                  {t('roles.editRole')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}