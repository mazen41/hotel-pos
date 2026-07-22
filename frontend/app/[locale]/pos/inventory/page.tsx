'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePermissions } from '@/contexts/AuthContext';
import { inventoryApi } from '@/lib/api';
import type { Inventory } from '@/types';
import { Package, AlertTriangle, Plus, Edit, Trash2, TrendingUp } from 'lucide-react';

export default function InventoryPage() {
  const t = useTranslations();
  const { can } = usePermissions();
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    current_stock: 0,
    minimum_stock: 0,
    unit: '',
    unit_cost: 0
  });
  const [adjustmentData, setAdjustmentData] = useState({
    quantity: 0,
    reason: '',
    type: 'add' as 'add' | 'remove'
  });

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const { data } = await inventoryApi.list();
      setInventory(data);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    try {
      const { data } = await inventoryApi.create(formData);
      setInventory([...inventory, data]);
      setShowAddDialog(false);
      setFormData({
        name: '',
        sku: '',
        current_stock: 0,
        minimum_stock: 0,
        unit: '',
        unit_cost: 0
      });
    } catch (error) {
      console.error('Failed to add item:', error);
    }
  };

  const handleDeleteItem = async (id: number) => {
    try {
      await inventoryApi.delete(id);
      setInventory(inventory.filter(item => item.id !== id));
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedItem) return;

    try {
      await inventoryApi.adjust(selectedItem.id, {
        adjustment_type: adjustmentData.type,
        quantity: adjustmentData.quantity,
        reason: adjustmentData.reason
      });
      await loadInventory();
      setShowAdjustDialog(false);
      setSelectedItem(null);
      setAdjustmentData({ quantity: 0, reason: '', type: 'add' });
    } catch (error) {
      console.error('Failed to adjust stock:', error);
    }
  };

  const lowStockItems = inventory.filter(item => item.current_stock <= item.minimum_stock);

  if (!can('pos.manage_inventory')) {
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
            {t('inventory.title')}
          </h1>
          <p className="text-text-muted">
            Manage your inventory and stock levels
          </p>
        </div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <div className="glass rounded-2xl p-6 mb-6 border-l-4 border-warning">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-warning" />
              <h3 className="font-display text-lg font-bold text-text-primary">
                {t('inventory.lowStock')}
              </h3>
            </div>
            <div className="space-y-2">
              {lowStockItems.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-surface-elevated rounded-lg p-3">
                  <div>
                    <p className="font-medium text-text-primary">{item.name}</p>
                    <p className="text-sm text-text-muted">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-warning">
                      {item.current_stock} {item.unit}
                    </p>
                    <p className="text-sm text-text-muted">
                      Min: {item.minimum_stock} {item.unit}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inventory Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary bg-opacity-10 flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">{t('inventory.currentStock')}</p>
                <p className="font-display text-2xl font-bold text-text-primary">
                  {inventory.length}
                </p>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-warning bg-opacity-10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">{t('inventory.lowStock')}</p>
                <p className="font-display text-2xl font-bold text-warning">
                  {lowStockItems.length}
                </p>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-success bg-opacity-10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Total Value</p>
                <p className="font-display text-2xl font-bold text-success">
                  ${inventory.reduce((sum, item) => sum + (item.current_stock * (item.unit_cost || 0)), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-bold text-text-primary">
              All Items
            </h2>
            <button
              onClick={() => setShowAddDialog(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('inventory.addItem')}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                    {t('inventory.itemName')}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                    {t('inventory.sku')}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                    {t('inventory.currentStock')}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                    {t('inventory.minimumStock')}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                    {t('inventory.unitCost')}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => (
                  <tr key={item.id} className="border-b border-border hover:bg-surface-hover">
                    <td className="py-3 px-4">
                      <p className="font-medium text-text-primary">{item.name}</p>
                    </td>
                    <td className="py-3 px-4 text-text-secondary">{item.sku}</td>
                    <td className="py-3 px-4">
                      <span className={`font-display font-bold ${
                        item.current_stock <= item.minimum_stock ? 'text-warning' : 'text-success'
                      }`}>
                        {item.current_stock} {item.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {item.minimum_stock} {item.unit}
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      ${(item.unit_cost || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setShowAdjustDialog(true);
                          }}
                          className="p-2 rounded-lg hover:bg-surface-elevated text-text-muted hover:text-text-primary transition-colors"
                          title={t('inventory.adjustStock')}
                        >
                          <TrendingUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-2 rounded-lg hover:bg-surface-elevated text-text-muted hover:text-error transition-colors"
                          title={t('inventory.deleteItem')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Item Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-display text-xl font-bold text-text-primary mb-4">
              {t('inventory.addItem')}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  {t('inventory.itemName')}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-text-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  {t('inventory.sku')}
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-text-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    {t('inventory.currentStock')}
                  </label>
                  <input
                    type="number"
                    value={formData.current_stock}
                    onChange={(e) => setFormData({ ...formData, current_stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-lg bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-text-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    {t('inventory.minimumStock')}
                  </label>
                  <input
                    type="number"
                    value={formData.minimum_stock}
                    onChange={(e) => setFormData({ ...formData, minimum_stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-lg bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-text-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    {t('inventory.unit')}
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-text-accent"
                    placeholder="kg, pcs, l"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    {t('inventory.unitCost')}
                  </label>
                  <input
                    type="number"
                    value={formData.unit_cost}
                    onChange={(e) => setFormData({ ...formData, unit_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-lg bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-text-accent"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddDialog(false)}
                className="flex-1 py-3 rounded-lg bg-surface text-text-secondary hover:bg-surface-hover transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleAddItem}
                className="flex-1 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-600 transition-colors"
              >
                {t('inventory.addItem')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Stock Dialog */}
      {showAdjustDialog && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-display text-xl font-bold text-text-primary mb-4">
              {t('inventory.adjustStock')}
            </h3>

            <div className="mb-4">
              <p className="text-text-secondary">
                {selectedItem.name} - Current: {selectedItem.current_stock} {selectedItem.unit}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  {t('inventory.adjustmentType')}
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAdjustmentData({ ...adjustmentData, type: 'add' })}
                    className={`flex-1 py-2 rounded-lg border ${
                      adjustmentData.type === 'add'
                        ? 'border-primary bg-primary bg-opacity-10 text-primary'
                        : 'border-border text-text-secondary hover:border-text-accent'
                    }`}
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setAdjustmentData({ ...adjustmentData, type: 'remove' })}
                    className={`flex-1 py-2 rounded-lg border ${
                      adjustmentData.type === 'remove'
                        ? 'border-error bg-error bg-opacity-10 text-error'
                        : 'border-border text-text-secondary hover:border-text-accent'
                    }`}
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  {t('inventory.quantity')}
                </label>
                <input
                  type="number"
                  value={adjustmentData.quantity}
                  onChange={(e) => setAdjustmentData({ ...adjustmentData, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-lg bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-text-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  {t('inventory.reason')}
                </label>
                <textarea
                  value={adjustmentData.reason}
                  onChange={(e) => setAdjustmentData({ ...adjustmentData, reason: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-text-accent resize-none"
                  rows={3}
                  placeholder={t('common.notes')}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAdjustDialog(false);
                  setSelectedItem(null);
                  setAdjustmentData({ quantity: 0, reason: '', type: 'add' });
                }}
                className="flex-1 py-3 rounded-lg bg-surface text-text-secondary hover:bg-surface-hover transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleAdjustStock}
                className="flex-1 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-600 transition-colors"
              >
                {t('inventory.adjustStock')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}