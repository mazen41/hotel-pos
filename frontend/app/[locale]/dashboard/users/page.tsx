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

interface User {
  id: number;
  name: string;
  email: string;
  roles: Array<{ name: string }>;
  is_active: boolean;
  created_at: string;
}

interface Role {
  name: string;
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const locale = useLocale();
  const t = useTranslations('users');
  const tCommon = useTranslations('common');
  const isRtl = locale === 'ar';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: '',
    is_active: true,
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api('GET', `/users?search=${searchTerm}&role=${roleFilter}`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await api('GET', '/roles');
      setRoles(response.data);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api('POST', '/users', formData);
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      alert(locale === 'ar' ? 'خطأ أثناء إنشاء المستخدم. يرجى التحقق من المدخلات.' : 'Error creating user. Please check your inputs.');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        is_active: formData.is_active,
      };

      if (formData.password) {
        updateData.password = formData.password;
        updateData.password_confirmation = formData.password_confirmation;
      }

      await api('PUT', `/users/${editingUser.id}`, updateData);
      setShowModal(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      alert(locale === 'ar' ? 'خطأ أثناء تحديث المستخدم. يرجى التحقق من المدخلات.' : 'Error updating user. Please check your inputs.');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm(t('deleteConfirm'))) return;

    try {
      await api('DELETE', `/users/${userId}`);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(locale === 'ar' ? 'خطأ أثناء حذف المستخدم.' : 'Error deleting user.');
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      password_confirmation: '',
      role: user.roles[0]?.name || '',
      is_active: user.is_active,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      role: '',
      is_active: true,
    });
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    resetForm();
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
            {t('addUser')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
      }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '10px 14px',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg)',
              color: 'var(--color-text-primary)',
              fontSize: '13px',
              textAlign: isRtl ? 'right' : 'left',
            }}
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: '10px 14px',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg)',
              color: 'var(--color-text-primary)',
              fontSize: '13px',
              minWidth: '150px',
              direction: isRtl ? 'rtl' : 'ltr',
            }}
          >
            <option value="">{t('allRoles')}</option>
            {roles.map(role => (
              <option key={role.name} value={role.name}>{getRoleLabel(role.name)}</option>
            ))}
          </select>
          <button
            type="submit"
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
            {locale === 'ar' ? 'بحث' : 'Search'}
          </button>
        </form>
      </div>

      {/* Users table */}
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
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isRtl ? 'right' : 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)', textAlign: isRtl ? 'right' : 'left' }}>{tCommon('name')}</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)', textAlign: isRtl ? 'right' : 'left' }}>{t('role')}</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)', textAlign: isRtl ? 'right' : 'left' }}>{tCommon('status')}</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)', textAlign: isRtl ? 'right' : 'left' }}>{tCommon('date')}</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)', textAlign: isRtl ? 'left' : 'right' }}>{tCommon('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '40px', textAlign: 'center', fontSize: '14px', color: 'var(--color-text-muted)' }}>
                    {t('noUsers')}
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary)' }}>
                        {user.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{user.email}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: 'var(--color-surface-2)',
                        color: 'var(--color-text-primary)',
                      }}>
                        {getRoleLabel(user.roles[0]?.name || 'No role')}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: user.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        color: user.is_active ? '#10b981' : '#ef4444',
                      }}>
                        {user.is_active ? tCommon('active') : tCommon('inactive')}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                      {new Date(user.created_at).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: isRtl ? 'flex-start' : 'flex-end' }}>
                        <button
                          onClick={() => openEditModal(user)}
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
                        {user.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
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
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
            maxWidth: '500px',
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
              {editingUser ? t('editUser') : t('addNewUser')}
            </h2>

            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                  {tCommon('name')}
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

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                  {tCommon('email')}
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                    fontSize: '13px',
                    textAlign: 'left',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                  {t('role')}
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                    fontSize: '13px',
                    direction: isRtl ? 'rtl' : 'ltr',
                  }}
                >
                  <option value="">{t('selectRole')}</option>
                  {roles.map(role => (
                    <option key={role.name} value={role.name}>{getRoleLabel(role.name)}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                  {editingUser ? t('newPasswordHelp') : (isRtl ? 'كلمة المرور' : 'Password')}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                    fontSize: '13px',
                    textAlign: 'left',
                  }}
                />
              </div>

              {formData.password && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                    {t('confirmPassword')}
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password_confirmation}
                    onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text-primary)',
                      fontSize: '13px',
                      textAlign: 'left',
                    }}
                  />
                </div>
              )}

              {editingUser && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text-primary)', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      style={{ width: '16px', height: '16px' }}
                    />
                    {tCommon('active')}
                  </label>
                </div>
              )}

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
                  {editingUser ? (locale === 'ar' ? 'تعديل المستخدم' : 'Update User') : (locale === 'ar' ? 'إنشاء المستخدم' : 'Create User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
