'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ManifestOrder } from '@/types/manifest';
import { ShopifyProductSummary, ShopifyProductVariantSummary } from '@/lib/shopify';
import { Plus, Trash2, Search, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react';

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
  const [activeCatalogItemIdx, setActiveCatalogItemIdx] = useState<number | null>(null);
  const [catalogQuery, setCatalogQuery] = useState('');
  const [catalogResults, setCatalogResults] = useState<ShopifyProductSummary[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setCustomer('');
      setCustomerPhone('');
      setCustomerEmail('');
      setOrderNumber('');
      setOrderDate(new Date().toISOString().split('T')[0]);
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
    }
  }, [isOpen]);

  // Handle searching products in catalog
  useEffect(() => {
    if (activeCatalogItemIdx === null) {
      setCatalogResults([]);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      setCatalogLoading(true);
      try {
        const res = await fetch(`/api/shopify/products?query=${encodeURIComponent(catalogQuery.trim())}&limit=20`);
        const data = await res.json();
        if (res.ok && data.products) {
          setCatalogResults(data.products);
        }
      } catch (e) {
        console.error('Failed to search catalog:', e);
      } finally {
        setCatalogLoading(false);
      }
    }, 250);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [catalogQuery, activeCatalogItemIdx]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
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

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
    if (activeCatalogItemIdx === index) {
      setActiveCatalogItemIdx(null);
    }
  };

  const handleItemChange = (index: number, field: keyof ManualOrderItemForm, value: any) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSelectVariant = (
    itemIndex: number,
    product: ShopifyProductSummary,
    variant: ShopifyProductVariantSummary
  ) => {
    setItems((prev) => {
      const next = [...prev];
      next[itemIndex] = {
        ...next[itemIndex],
        name: product.title,
        brand: product.vendor || 'Essentials EG',
        size: variant.size || variant.title || '—',
        color: variant.color || next[itemIndex].color || '',
        sku: variant.sku || '',
        inventoryQuantity: variant.inventoryQuantity,
        productId: product.id,
        variantId: variant.id,
      };
      return next;
    });
    setActiveCatalogItemIdx(null);
    setCatalogQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
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
      const res = await fetch('/api/manual-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: customer.trim(),
          customerPhone: customerPhone.trim() || undefined,
          customerEmail: customerEmail.trim() || undefined,
          orderNumber: orderNumber.trim() || undefined,
          orderDate,
          notes: notes.trim() || undefined,
          items: items.map((it) => ({
            name: it.name.trim(),
            brand: it.brand.trim() || 'Essentials EG',
            size: it.size.trim() || '—',
            color: it.color.trim() || undefined,
            sku: it.sku.trim() || '',
            quantity: Number(it.quantity) || 1,
            inventoryQuantity: it.inventoryQuantity,
            productId: it.productId,
            variantId: it.variantId,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create manual order.');
      }

      // Order created successfully
      onOrderCreated(data.order);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div
        className="bg-ink-night-2 border border-ink-rule rounded-lg shadow-2xl w-full max-w-3xl my-6 flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => {
          // Close catalog dropdown if clicking outside
          if (activeCatalogItemIdx !== null && !(e.target as HTMLElement).closest('.catalog-dropdown-container')) {
            setActiveCatalogItemIdx(null);
          }
        }}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-ink-rule flex items-center justify-between bg-ink-night">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-cream tracking-tight">Create Manual Order</h2>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-ink-night-3 text-stone-300 border border-ink-rule">
                Internal Ops
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Add offline, phone, or custom orders directly into the active manifest batch and database.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-cream p-1.5 rounded-lg hover:bg-ink-night-3 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 bg-rose-950/40 border border-rose-800/60 rounded-lg p-3 text-rose-200 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer Details Section */}
          <div className="bg-ink-night border border-ink-rule rounded-xl p-4 sm:p-5 shadow-sm">
            <h3 className="font-mono text-xs uppercase tracking-wider text-stone-300 font-bold mb-3 flex items-center gap-2">
              <span>1. Customer & Order Details</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Customer Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tarek Mansour"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  className="w-full bg-ink-night-2 border border-ink-rule rounded-lg px-3 py-1.5 text-xs sm:text-sm text-cream placeholder-stone-500 focus:outline-none focus:border-stone-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Customer Phone <span className="text-stone-500 font-normal">(optional)</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +20 100 123 4567"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-ink-night-2 border border-ink-rule rounded-lg px-3 py-1.5 text-xs sm:text-sm text-cream placeholder-stone-500 focus:outline-none focus:border-stone-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Order # / Reference <span className="text-stone-500 font-normal">(auto MAN-XXXX if blank)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. MAN-1005 or #OFFLINE-22"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full bg-ink-night-2 border border-ink-rule rounded-lg px-3 py-1.5 text-xs sm:text-sm font-semibold text-cream placeholder-stone-500 focus:outline-none focus:border-stone-400 transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Order Date
                </label>
                <input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="w-full bg-ink-night-2 border border-ink-rule rounded-lg px-3 py-1.5 text-xs sm:text-sm text-cream focus:outline-none focus:border-stone-400 transition font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Order Notes <span className="text-stone-500 font-normal">(optional instructions or tracking info)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Delivery requested for weekend, customer contacted via WhatsApp"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-ink-night-2 border border-ink-rule rounded-lg px-3 py-1.5 text-xs sm:text-sm text-cream placeholder-stone-500 focus:outline-none focus:border-stone-400 transition"
                />
              </div>
            </div>
          </div>

          {/* Line Items Section */}
          <div className="bg-ink-night border border-ink-rule rounded-xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-mono text-xs uppercase tracking-wider text-stone-300 font-bold flex items-center gap-2">
                <span>2. Line Items ({items.length})</span>
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="font-mono text-xs font-semibold flex items-center gap-1.5 text-stone-200 hover:text-white px-2.5 py-1 rounded-md bg-ink-night-3 border border-ink-rule transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-ink-night-2 border border-ink-rule rounded-lg p-3.5 relative space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-ink-rule/60">
                    <span className="font-mono text-[11px] text-stone-400 font-medium">
                      Item #{idx + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-stone-500 hover:text-red-400 transition cursor-pointer p-1"
                        title="Remove this item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Product Catalog Lookup / Custom Entry */}
                  <div className="catalog-dropdown-container relative">
                    <label className="block text-[11px] font-medium text-stone-300 mb-1">
                      Product Name <span className="text-red-400">*</span>
                      <span className="text-stone-500 font-normal ml-1.5">
                        (Search store catalog or type directly)
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="Search catalog e.g. 'Shark Hoodie' or enter custom..."
                        value={item.name}
                        onChange={(e) => {
                          handleItemChange(idx, 'name', e.target.value);
                          setCatalogQuery(e.target.value);
                          setActiveCatalogItemIdx(idx);
                        }}
                        onFocus={() => {
                          setCatalogQuery(item.name);
                          setActiveCatalogItemIdx(idx);
                        }}
                        className="w-full bg-ink-night border border-ink-rule rounded px-3 py-1.5 pl-8 text-xs text-cream placeholder-stone-600 focus:outline-none focus:border-purple-500 transition"
                      />
                      <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-2.5" />
                      {catalogLoading && activeCatalogItemIdx === idx && (
                        <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin absolute right-2.5 top-2.5" />
                      )}
                    </div>

                    {/* Catalog Autocomplete Dropdown */}
                    {activeCatalogItemIdx === idx && catalogResults.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-ink-night border border-ink-rule rounded-md shadow-2xl max-h-56 overflow-y-auto divide-y divide-ink-rule/60">
                        {catalogResults.map((prod) => (
                          <div key={prod.id} className="p-2 hover:bg-stone-900/80 transition">
                            <div className="flex items-center justify-between text-xs font-semibold text-cream mb-1">
                              <span>{prod.title}</span>
                              <span className="text-[10px] text-stone-400 font-normal font-mono">
                                {prod.vendor}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {prod.variants.map((v) => (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() => handleSelectVariant(idx, prod, v)}
                                  className="font-mono text-[10px] px-2 py-0.5 rounded bg-ink-night-2 hover:bg-purple-900/60 border border-ink-rule hover:border-purple-500 text-stone-300 hover:text-white transition cursor-pointer flex items-center gap-1.5"
                                >
                                  <span>{v.size || v.title}</span>
                                  {v.color && <span className="text-stone-400">({v.color})</span>}
                                  {v.inventoryQuantity !== null && (
                                    <span
                                      className={`text-[9.5px] px-1 rounded ${
                                        v.inventoryQuantity > 0
                                          ? 'text-emerald-400 bg-emerald-950/40'
                                          : 'text-stone-500 bg-stone-900'
                                      }`}
                                    >
                                      {v.inventoryQuantity} in stock
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Variant Details: Brand, Size, Color, Qty, SKU */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    <div>
                      <label className="block text-[10.5px] font-medium text-stone-400 mb-1">
                        Brand
                      </label>
                      <input
                        type="text"
                        value={item.brand}
                        onChange={(e) => handleItemChange(idx, 'brand', e.target.value)}
                        placeholder="e.g. Essentials"
                        className="w-full bg-ink-night border border-ink-rule rounded px-2.5 py-1 text-xs text-cream placeholder-stone-600 focus:outline-none focus:border-purple-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-medium text-stone-400 mb-1">
                        Size / Variant
                      </label>
                      <input
                        type="text"
                        value={item.size}
                        onChange={(e) => handleItemChange(idx, 'size', e.target.value)}
                        placeholder="S, M, L..."
                        className="w-full bg-ink-night border border-ink-rule rounded px-2.5 py-1 text-xs text-cream placeholder-stone-600 focus:outline-none focus:border-purple-500 transition font-mono"
                        list={`sizes-list-${idx}`}
                      />
                      <datalist id={`sizes-list-${idx}`}>
                        {COMMON_SIZES.map((sz) => (
                          <option key={sz} value={sz} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-medium text-stone-400 mb-1">
                        Color <span className="text-stone-600 font-normal">(opt)</span>
                      </label>
                      <input
                        type="text"
                        value={item.color}
                        onChange={(e) => handleItemChange(idx, 'color', e.target.value)}
                        placeholder="Black, Grey..."
                        className="w-full bg-ink-night border border-ink-rule rounded px-2.5 py-1 text-xs text-cream placeholder-stone-600 focus:outline-none focus:border-purple-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-medium text-stone-400 mb-1">
                        Qty <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-full bg-ink-night border border-ink-rule rounded px-2.5 py-1 text-xs text-cream focus:outline-none focus:border-purple-500 transition font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-medium text-stone-400 mb-1">
                        SKU <span className="text-stone-600 font-normal">(opt)</span>
                      </label>
                      <input
                        type="text"
                        value={item.sku}
                        onChange={(e) => handleItemChange(idx, 'sku', e.target.value)}
                        placeholder="BAP-3187"
                        className="w-full bg-ink-night border border-ink-rule rounded px-2.5 py-1 text-xs text-cream placeholder-stone-600 focus:outline-none focus:border-purple-500 transition font-mono"
                      />
                    </div>
                  </div>

                  {item.inventoryQuantity !== null && (
                    <div className="text-[10.5px] font-mono text-stone-400 flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>Catalog Stock Level:</span>
                      <strong className="text-cream">{item.inventoryQuantity} units available</strong>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-ink-rule flex items-center justify-between bg-ink-night">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="font-mono text-xs px-3.5 py-2 rounded text-stone-400 hover:text-cream border border-ink-rule hover:border-stone-500 transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="font-mono text-xs font-bold tracking-wide px-4 py-2 rounded-lg bg-stone-200 hover:bg-white text-stone-900 shadow-sm transition flex items-center gap-2 disabled:opacity-40 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving & Importing…</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Create & Import Order</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
