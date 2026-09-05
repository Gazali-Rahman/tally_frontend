import React, { useState, useEffect } from 'react';
import { transactionService } from '../../services/api';
import { CATEGORIES } from '../../utils/formatters';
import { X, ArrowDownCircle, ArrowUpCircle, Calendar, Tag, FileText, DollarSign } from 'lucide-react';

export const TransactionModal = ({
  isOpen,
  onClose,
  groupId,
  transactionToEdit,
  onSuccess,
}) => {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type || 'expense');
      setAmount(transactionToEdit.amount || '');
      setCategory(transactionToEdit.category || '');
      setTransactionDate(
        transactionToEdit.transaction_date || new Date().toISOString().split('T')[0]
      );
      setDescription(transactionToEdit.description || '');
    } else {
      setType('expense');
      setAmount('');
      setCategory(CATEGORIES.expense[0]);
      setTransactionDate(new Date().toISOString().split('T')[0]);
      setDescription('');
    }
    setError('');
  }, [transactionToEdit, isOpen]);

  // Update default category when type changes
  const handleTypeChange = (newType) => {
    setType(newType);
    if (!transactionToEdit) {
      setCategory(CATEGORIES[newType][0]);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError('Nominal harus lebih besar dari 0.');
      return;
    }
    if (!category) {
      setError('Kategori wajib dipilih.');
      return;
    }

    setLoading(true);
    setError('');

    const payload = {
      type,
      amount: Number(amount),
      category,
      transaction_date: transactionDate,
      description: description || null,
    };

    try {
      if (transactionToEdit) {
        await transactionService.updateTransaction(transactionToEdit.id, payload);
      } else {
        await transactionService.createTransaction(groupId, payload);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan transaksi.');
    } finally {
      setLoading(false);
    }
  };

  const categories = CATEGORIES[type] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-sm rounded-2xl border border-slate-200/80 shadow-md p-5 space-y-4 animate-scaleUp"
        style={{ backgroundColor: 'var(--bg-color, #ffffff)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {transactionToEdit ? 'Edit Transaksi' : 'Catat Transaksi Baru'}
            </h2>
            <p className="text-[11px] text-slate-500">
              {transactionToEdit ? 'Perbarui rincian transaksi' : 'Tambahkan ke dompet bersama'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Type Toggle (Income / Expense) */}
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200/60 font-semibold">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownCircle className="w-3.5 h-3.5" />
              <span>Pengeluaran</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
            }`}
          >
              <ArrowUpCircle className="w-3.5 h-3.5" />
              <span>Pemasukan</span>
            </button>
          </div>

          {/* Amount Field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Nominal (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Rp</span>
              <input
                type="number"
                min="1"
                step="any"
                required
                placeholder="50.000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white"
              />
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Tag className="w-3 h-3 text-slate-400" />
              <span>Kategori</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>Tanggal Transaksi</span>
            </label>
            <input
              type="date"
              required
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white"
            />
          </div>

          {/* Description (Optional) */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <FileText className="w-3 h-3 text-slate-400" />
              <span>Catatan / Deskripsi (Opsional)</span>
            </label>
            <textarea
              rows="2"
              placeholder="Misal: Makan siang bersama tim"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: 'var(--primary-color, #003049)' }}
              className="flex-1 py-2 rounded-xl text-white font-medium shadow-sm hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>{transactionToEdit ? 'Simpan Perubahan' : 'Catat Transaksi'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
