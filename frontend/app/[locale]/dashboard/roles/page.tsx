'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api';
import { useLocale, useTranslations } from 'next-intl';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://hotel-sys.loop-pr.com/api';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; }
async function api(method: string, path: string, body?: any) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.message ?? 'Request failed', res.status, data.errors);
  return data;
}

interface Permission {
  id: number;
  name: string;
}

interface Role {
  id: number;
  name: string;
  permissions: Permission[];
}

export default function RolesPage() {
  const { user: currentUser } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const locale = useLocale();
  const t = useTranslations('roles');
  const tCommon = useTranslations('common');
  const isRtl = locale === 'ar';

  const [formData, setFormData] = useState({
    name: '',
    permissions: [] as string[],
  });

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await api('GET', '/roles');
      setRoles(response.data);
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await api('GET', '/permissions');
      setPermissions(response.data);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api('POST', '/roles', formData);
      setShowModal(false);
      resetForm();
      fetchRoles();
    } catch (error) {
      console.error('Error creating role:', error);
      alert(locale === 'ar' ? 'خطأ أثناء إنشاء الدور. يرجى التحقق من المدخلات.' : 'Error creating role. Please check your inputs.');
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;

    try {
      await api('PUT', `/roles/${editingRole.id}`, formData);
      setShowModal(false);
      setEditingRole(null);
      resetForm();
      fetchRoles();
    } catch (error) {
      console.error('Error updating role:', error);
      alert(locale === 'ar' ? 'خطأ أثناء تحديث الدور. يرجى التحقق من المدخلات.' : 'Error updating role. Please check your inputs.');
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (!confirm(t('deleteConfirm'))) return;

    try {
      await api('DELETE', `/roles/${roleId}`);
      fetchRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
      alert(locale === 'ar' ? 'خطأ أثناء حذف الدور. قد يكون مخصصاً لمستخدمين.' : 'Error deleting role. It may be assigned to users.');
    }
  };

  const openEditModal = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      permissions: role.permissions.map(p => p.name),
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      permissions: [],
    });
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRole(null);
    resetForm();
  };

  const togglePermission = (permissionName: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionName)
        ? prev.permissions.filter(p => p !== permissionName)
        : [...prev.permissions, permissionName],
    }));
  };

  const permissionGroups = {
    'Dashboard': ['view dashboard'],
    'Guests': ['manage guests'],
    'Reservations': ['manage reservations', 'express check-in', 'express check-out', 'mark no-show'],
    'Rooms': ['manage rooms', 'manage room types'],
    'Rate Plans': ['manage rate plans'],
    'Billing': ['manage billing'],
    'Housekeeping': ['manage housekeeping'],
    'Settings': ['manage settings'],
    'Users': ['manage users', 'manage roles'],
    'Reports': ['view reports'],
  };

  const getPermissionLabel = (name: string) => {
    switch (name) {
      case 'view dashboard': return locale === 'ar' ? 'عرض لوحة التحكم' : 'view dashboard';
      case 'manage guests': return locale === 'ar' ? 'إدارة النزلاء' : 'manage guests';
      case 'manage reservations': return locale === 'ar' ? 'إدارة الحجوزات' : 'manage reservations';
      case 'express check-in': return locale === 'ar' ? 'تسجيل وصول سريع' : 'express check-in';
      case 'express check-out': return locale === 'ar' ? 'تسجيل مغادرة سريع' : 'express check-out';
      case 'mark no-show': return locale === 'ar' ? 'تحديد كعدم حضور' : 'mark no-show';
      case 'manage rooms': return locale === 'ar' ? 'إدارة الغرف' : 'manage rooms';
      case 'manage room types': return locale === 'ar' ? 'إدارة أنواع الغرف' : 'manage room types';
      case 'manage rate plans': return locale === 'ar' ? 'إدارة خطط الأسعار' : 'manage rate plans';
      case 'manage billing': return locale === 'ar' ? 'إدارة الفواتير' : 'manage billing';
      case 'manage housekeeping': return locale === 'ar' ? 'إدارة الخدمة الفندقية' : 'manage housekeeping';
      case 'manage settings': return locale === 'ar' ? 'إدارة الإعدادات' : 'manage settings';
      case 'manage users': return locale === 'ar' ? 'إدارة المستخدمين' : 'manage users';
      case 'manage roles': return locale === 'ar' ? 'إدارة الأدوار' : 'manage roles';
      case 'view reports': return locale === 'ar' ? 'عرض التقارير' : 'view reports';
      default: return name;
    }
  };

  const getGroupLabel = (group: string) => {
    switch (group) {
      case 'Dashboard': return locale === 'ar' ? 'لوحة التحكم' : 'Dashboard';
      case 'Guests': return locale === 'ar' ? 'النزلاء' : 'Guests';
      case 'Reservations': return locale === 'ar' ? 'الحجوزات' : 'Reservations';
      case 'Rooms': return locale === 'ar' ? 'الغرف' : 'Rooms';
      case 'Rate Plans': return locale === 'ar' ? 'خطط الأسعار' : 'Rate Plans';
      case 'Billing': return locale === 'ar' ? 'الفواتير' : 'Billing';
      case 'Housekeeping': return locale === 'ar' ? 'الخدمة الفندقية' : 'Housekeeping';
      case 'Settings': return locale === 'ar' ? 'الإعدادات' : 'Settings';
      case 'Users': return locale === 'ar' ? 'المستخدمين' : 'Users';
      case 'Reports': return locale === 'ar' ? 'التقارير' : 'Reports';
      default: return group;
    }
  };

  const getRoleLabel = (name: string) => {
    if (locale !== 'ar') return name;
    switch (name) {
      case 'Admin': return 'مسؤول النظام';
      case 'Manager': return 'مدير';
      case 'Receptionist': return 'موظف استقبال';
      case 'Housekeeper': return 'مشرف تنظيف';
      default: return name;
    }
  };

  return (
    <div style={{ direction: isRtl ? 'rtl' : 'ltr', textAlign: isRtl ? 'right' : 'left' }}>
      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <div>
            <h1 style={{
              fontSize: '22px',
              fontWeight: '600',
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.5px',
              marginBottom: '4px',
            }}>
              {t('title')}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13.5px' }}>
              {t('subtitle')}
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--color-primary)',
              color: 'white',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {t('addRole')}
          </button>
        </div>
      </div>

      {/* Roles grid */}
      {loading ? (
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>{tCommon('loading')}</div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '16px',
        }}>
          {roles.map(role => (
            <div
              key={role.id}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'var(--color-text-primary)',
                    marginBottom: '4px',
                  }}>
                    {getRoleLabel(role.name)}
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {role.permissions.length} {locale === 'ar' ? 'صلاحيات' : 'permissions'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                  <button
                    onClick={() => openEditModal(role)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text-primary)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                  >
                    {tCommon('edit')}
                  </button>
                  <button
                    onClick={() => handleDeleteRole(role.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-bg)',
                      color: '#ef4444',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                  >
                    {tCommon('delete')}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                {role.permissions.slice(0, 6).map(permission => (
                  <span
                    key={permission.id}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '500',
                      background: 'var(--color-surface-2)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {getPermissionLabel(permission.name)}
                  </span>
                ))}
                {role.permissions.length > 6 && (
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '500',
                    background: 'var(--color-surface-2)',
                    color: 'var(--color-text-muted)',
                  }}>
                    +{role.permissions.length - 6} {locale === 'ar' ? 'إضافية' : 'more'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--color-bg)',
            borderRadius: '12px',
            padding: '24px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            textAlign: isRtl ? 'right' : 'left',
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: 'var(--color-text-primary)',
              marginBottom: '20px',
            }}>
              {editingRole ? t('editRole') : t('addNewRole')}
            </h2>

            <form onSubmit={editingRole ? handleUpdateRole : handleCreateRole}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                  {t('roleName')}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                    fontSize: '13px',
                    textAlign: isRtl ? 'right' : 'left',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                  {t('permissions')}
                </label>
                <div style={{
                  maxHeight: '300px',
                  overflow: 'auto',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  padding: '12px',
                  background: 'var(--color-surface)',
                }}>
                  {Object.entries(permissionGroups).map(([groupName, groupPermissions]) => (
                    <div key={groupName} style={{ marginBottom: '16px' }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: 'var(--color-text-primary)',
                        marginBottom: '8px',
                      }}>
                        {getGroupLabel(groupName)}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                        {groupPermissions.map(permissionName => {
                          const permission = permissions.find(p => p.name === permissionName);
                          if (!permission) return null;

                          return (
                            <label
                              key={permission.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                background: formData.permissions.includes(permissionName)
                                  ? 'rgba(99,102,241,0.1)'
                                  : 'var(--color-bg)',
                                border: formData.permissions.includes(permissionName)
                                  ? '1px solid #6366f1'
                                  : '1px solid var(--color-border)',
                                cursor: 'pointer',
                                fontSize: '12px',
                                color: 'var(--color-text-primary)',
                                transition: 'all 0.2s',
                                flexDirection: isRtl ? 'row-reverse' : 'row',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={formData.permissions.includes(permissionName)}
                                onChange={() => togglePermission(permissionName)}
                                style={{ width: '14px', height: '14px' }}
                              />
                              {getPermissionLabel(permissionName)}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: isRtl ? 'flex-start' : 'flex-end', marginTop: '24px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg)',
                    color: 'var(--color-text-primary)',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  {tCommon('cancel')}
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'var(--color-primary)',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  {editingRole ? (locale === 'ar' ? 'تعديل الدور' : 'Update Role') : (locale === 'ar' ? 'إنشاء الدور' : 'Create Role')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
