'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ManifestOrder } from '@/types/manifest';
import { ShopifyProductSummary, ShopifyProductVariantSummary } from '@/lib/shopify';
import { Plus, Trash2, Search, Loader2, CheckCircle2, X } from 'lucide-react';

interface ManualOrderItemForm {
  id: string;
  name: string;
  brand: string;
  size: string;
  color: string;
  sku: string;
  quantity: number;
  inventoryQuantity: number | null;
  productId?: string;
  variantId?: string;
}

interface ManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (order: ManifestOrder) => void;
}

const COMMON_SIZES = ['S', 'M', 'L', 'XL', 'XXL', '3XL', 'One Size', '—'];

export default function ManualOrderModal({
  isOpen,
  onClose,
  onOrderCreated,
}: ManualOrderModalProps) {
  const [customer, setCustomer] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [orderDate, setOrderDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<ManualOrderItemForm[]>([
    {
      id: 'item-1',
      name: '',
      brand: 'Essentials EG',
      size: 'M',
      color: '',
      sku: '',
      quantity: 1,
      inventoryQuantity: null,
    },
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search catalog state per item
  const [catalogQuery, setCatalogQuery] = useState('');
  const [catalogResults, setCatalogResults] = useState<ShopifyProductSummary[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [activeCatalogItemIdx, setActiveCatalogItemIdx] = useState<number | null>(null);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setCustomer('');
      setCustomerPhone('');
      setCustomerEmail('');
      setOrderNumber('');
      setNotes('');
      setItems([
        {
          id: 'item-1',
          name: '',
          brand: 'Essentials EG',
          size: 'M',
          color: '',
          sku: '',
          quantity: 1,
          inventoryQuantity: null,
        },
      ]);
      setError(null);
      setActiveCatalogItemIdx(null);
    }
  }, [isOpen]);

  const handleCatalogSearch = (query: string) => {
    setCatalogQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!query.trim()) {
      setCatalogResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setCatalogLoading(true);
      try {
        const res = await fetch(`/api/shopify/products?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (res.ok && Array.isArray(data.products)) {
          setCatalogResults(data.products);
        } else {
          setCatalogResults([]);
        }
      } catch {
        setCatalogResults([]);
      } finally {
        setCatalogLoading(false);
      }
    }, 300);
  };

  const handleSelectProduct = (idx: number, prod: ShopifyProductSummary) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const firstVariant = prod.variants[0];
        return {
          ...item,
          name: prod.title,
          brand: prod.vendor || 'Essentials EG',
          sku: firstVariant?.sku || item.sku,
          size: firstVariant?.size || item.size,
          color: firstVariant?.color || item.color,
          inventoryQuantity: firstVariant ? firstVariant.inventoryQuantity : null,
          productId: prod.id,
          variantId: firstVariant?.id,
        };
      })
    );
    setActiveCatalogItemIdx(null);
    setCatalogQuery('');
    setCatalogResults([]);
  };

  const handleSelectVariant = (
    idx: number,
    prod: ShopifyProductSummary,
    variant: ShopifyProductVariantSummary
  ) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        return {
          ...item,
          name: prod.title,
          brand: prod.vendor || 'Essentials EG',
          sku: variant.sku || item.sku,
          size: variant.size || item.size,
          color: variant.color || item.color,
          inventoryQuantity: variant.inventoryQuantity,
          productId: prod.id,
          variantId: variant.id,
        };
      })
    );
    setActiveCatalogItemIdx(null);
    setCatalogQuery('');
    setCatalogResults([]);
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${prev.length + 1}`,
        name: '',
        brand: 'Essentials EG',
        size: 'M',
        color: '',
        sku: '',
        quantity: 1,
        inventoryQuantity: null,
      },
    ]);
  };

  const handleRemoveItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: keyof ManualOrderItemForm, val: any) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customer.trim()) {
      setError('Customer name is required.');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].name.trim()) {
        setError(`Product name is required for Item #${i + 1}.`);
        return;
      }
      if (items[i].quantity < 1) {
        setError(`Quantity for Item #${i + 1} must be at least 1.`);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        customer: customer.trim(),
        customerPhone: customerPhone.trim() || undefined,
        customerEmail: customerEmail.trim() || undefined,
        orderNumber: orderNumber.trim() || undefined,
        orderDate: orderDate || undefined,
        notes: notes.trim() || undefined,
        items: items.map((it) => ({
          name: it.name.trim(),
          brand: it.brand.trim() || 'Essentials EG',
          size: it.size.trim() || 'One Size',
          color: it.color.trim() || undefined,
          sku: it.sku.trim() || undefined,
          quantity: Number(it.quantity) || 1,
          productId: it.productId,
          variantId: it.variantId,
        })),
      };

      const res = await fetch('/api/manual-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create manual order.');
      }

      onOrderCreated(data.order);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4"
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          if (activeCatalogItemIdx !== null && !(e.target as HTMLElement).closest('.catalog-dropdown-portal')) {
            setActiveCatalogItemIdx(null);
          }
        }}
        className="bg-surface border border-border rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col shadow-lg overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-surface">
          <div>
            <h2 className="text-base font-semibold text-text">Create Manual Order</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Add offline, phone, or custom orders directly into the active manifest batch
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text p-1.5 rounded-lg hover:bg-bg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <div className="bg-[#FEE2E2] border border-[#FECACA] rounded-lg p-3 text-[#991B1B] dark:bg-[#7F1D1D] dark:border-[#991B1B] dark:text-[#FECACA] text-xs font-medium">
              {error}
            </div>
          )}

          {/* Customer Details Section */}
          <div className="bg-bg border border-border rounded-lg p-4 space-y-3.5">
            <h3 className="text-xs font-semibold text-text-muted">
              1. Customer & Order Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text mb-1">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tarek Mansour"
                  value={customer}
                  dir="auto"
                  onChange={(e) => setCustomer(e.target.value)}
                  className="w-full h-10 bg-surface border border-border rounded-lg px-3 text-sm text-text placeholder-[#9CA3AF] focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text mb-1">
                  Customer Phone <span className="text-text-muted font-normal">(optional)</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +20 100 123 4567"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full h-10 bg-surface border border-border rounded-lg px-3 text-sm text-text placeholder-[#9CA3AF] focus:border-accent tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text mb-1">
                  Order # / Reference <span className="text-text-muted font-normal">(auto MAN-XXXX if blank)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. MAN-1005"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full h-10 bg-surface border border-border rounded-lg px-3 text-sm text-text placeholder-[#9CA3AF] focus:border-accent tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text mb-1">
                  Order Date
                </label>
                <input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="w-full h-10 bg-surface border border-border rounded-lg px-3 text-sm text-text focus:border-accent tabular-nums"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-text mb-1">
                  Order Notes <span className="text-text-muted font-normal">(optional instructions)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Customer contacted via WhatsApp, morning delivery requested"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-10 bg-surface border border-border rounded-lg px-3 text-sm text-text placeholder-[#9CA3AF] focus:border-accent"
                />
              </div>
            </div>
          </div>

          {/* Line Items Section */}
          <div className="bg-bg border border-border rounded-lg p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-text-muted">
                2. Line Items ({items.length})
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="h-8 px-2.5 bg-surface hover:bg-slate-50 dark:hover:bg-slate-800 text-text border border-border rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-surface border border-border rounded-lg p-3.5 space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <span className="text-xs font-semibold text-text">
                      Item #{idx + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-text-muted hover:text-red-500 p-1 rounded transition cursor-pointer flex items-center gap-1 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  {/* Search Product Catalog */}
                  <div className="relative">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="Search product from Shopify catalog (optional)…"
                          value={activeCatalogItemIdx === idx ? catalogQuery : ''}
                          onFocus={() => {
                            setActiveCatalogItemIdx(idx);
                            setCatalogQuery('');
                            setCatalogResults([]);
                          }}
                          onChange={(e) => handleCatalogSearch(e.target.value)}
                          className="w-full h-9 bg-bg border border-border rounded-md pl-8 pr-3 text-xs text-text placeholder-[#9CA3AF] focus:border-accent"
                        />
                        <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-2.5 pointer-events-none" />
                      </div>
                    </div>

                    {/* Catalog Results Dropdown */}
                    {activeCatalogItemIdx === idx && (catalogResults.length > 0 || catalogLoading) && (
                      <div className="catalog-dropdown-portal absolute left-0 right-0 top-10 bg-surface border border-border rounded-lg shadow-lg z-30 max-h-56 overflow-y-auto p-1.5 space-y-1">
                        {catalogLoading && (
                          <div className="p-3 text-center text-xs text-text-muted flex items-center justify-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                            <span>Searching catalog…</span>
                          </div>
                        )}
                        {catalogResults.map((prod) => (
                          <div
                            key={prod.id}
                            className="p-2 hover:bg-bg rounded-md transition text-xs border border-transparent hover:border-border cursor-pointer"
                          >
                            <div
                              onClick={() => handleSelectProduct(idx, prod)}
                              className="font-medium text-text hover:text-accent"
                            >
                              {prod.title}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {prod.variants.map((v) => (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() => handleSelectVariant(idx, prod, v)}
                                  className="text-[11px] px-1.5 py-0.5 rounded bg-bg hover:bg-slate-100 dark:hover:bg-slate-800 border border-border text-text transition cursor-pointer"
                                >
                                  {v.size || v.title}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Manual Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-text-muted mb-1">
                        Product Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Vintage Heavyweight Hoodie"
                        value={item.name}
                        onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                        className="w-full h-9 bg-bg border border-border rounded-md px-2.5 text-xs text-text placeholder-[#9CA3AF] focus:border-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">Brand</label>
                      <input
                        type="text"
                        placeholder="e.g. Essentials EG"
                        value={item.brand}
                        onChange={(e) => handleItemChange(idx, 'brand', e.target.value)}
                        className="w-full h-9 bg-bg border border-border rounded-md px-2.5 text-xs text-text placeholder-[#9CA3AF] focus:border-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">Size / Variant</label>
                      <select
                        value={COMMON_SIZES.includes(item.size) ? item.size : 'CUSTOM'}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val !== 'CUSTOM') handleItemChange(idx, 'size', val);
                        }}
                        className="w-full h-9 bg-bg border border-border rounded-md px-2 text-xs text-text focus:border-accent"
                      >
                        {COMMON_SIZES.map((sz) => (
                          <option key={sz} value={sz}>
                            {sz}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full h-9 bg-bg border border-border rounded-md px-2.5 text-xs text-text focus:border-accent tabular-nums"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">Color (optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Washed Black"
                        value={item.color}
                        onChange={(e) => handleItemChange(idx, 'color', e.target.value)}
                        className="w-full h-9 bg-bg border border-border rounded-md px-2.5 text-xs text-text placeholder-[#9CA3AF] focus:border-accent"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-border flex items-center justify-between bg-surface">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-10 px-4 bg-surface hover:bg-slate-50 dark:hover:bg-slate-800 text-text border border-border rounded-lg text-sm font-medium transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="h-10 px-5 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving & Importing…</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Create & Import Order</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
