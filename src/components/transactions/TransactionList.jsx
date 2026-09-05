import React from 'react';
import { formatCurrency, formatDate, getMonthNames } from '../../utils/formatters';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Edit3, 
  Trash2, 
  Calendar, 
  User, 
  Inbox, 
  Filter 
} from 'lucide-react';

export const TransactionList = ({
  transactions,
  loading,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  onEditTransaction,
  onDeleteTransaction,
  currentUserId,
}) => {
  const months = getMonthNames();
  const now = new Date();
  const currentMonthValue = String(now.getMonth() + 1);
  const currentYear = now.getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];
  const isCurrentMonthActive = selectedMonth === currentMonthValue && Number(selectedYear) === currentYear;

  const handleResetToCurrentMonth = () => {
    setSelectedMonth(currentMonthValue);
    setSelectedYear(currentYear);
  };

  return (
    <div className="space-y-3">
      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-2 p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-sm text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-semibold shrink-0">
          <Filter className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filter:</span>
        </div>

        <div className="flex items-center gap-1.5 flex-1 justify-end flex-wrap">
          {/* Quick shortcut to jump back to current month if not active */}
          {!isCurrentMonthActive && (
            <button
              type="button"
              onClick={handleResetToCurrentMonth}
              className="px-2 py-1 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 text-[11px] font-medium transition-colors"
            >
              Bulan Ini
            </button>
          )}

          {/* Month Selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            {months.map((m) => {
              const isNow = m.value === currentMonthValue;
              return (
                <option key={m.value} value={m.value}>
                  {m.label}{isNow ? ' (Bulan Ini)' : ''}
                </option>
              );
            })}
          </select>

          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transaction List Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold text-slate-900 tracking-wide uppercase">
          Riwayat Transaksi
        </h3>
        <span className="text-[11px] text-slate-500 font-medium">
          {transactions?.length || 0} catatan
        </span>
      </div>

      {/* Transactions Container */}
      <div className="space-y-2">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Memuat riwayat transaksi...</p>
          </div>
        ) : transactions && transactions.length > 0 ? (
          transactions.map((tx) => {
            const isIncome = tx.type === 'income';
            return (
              <div
                key={tx.id}
                className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all flex items-start justify-between gap-3 group"
              >
                {/* Left Side: Icon & Details */}
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isIncome 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                        : 'bg-rose-50 text-rose-600 border border-rose-100'
                    }`}
                  >
                    {isIncome ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {tx.category}
                      </span>
                    </div>

                    {tx.description && (
                      <p className="text-[11px] text-slate-600 truncate">
                        {tx.description}
                      </p>
                    )}

                    {/* Metadata: Date & Creator */}
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        {formatDate(tx.transaction_date)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <User className="w-2.5 h-2.5" />
                        {tx.user?.name || 'Anggota'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Amount & Action Buttons */}
                <div className="text-right shrink-0 space-y-1">
                  <p
                    className={`text-xs sm:text-sm font-bold tracking-tight ${
                      isIncome ? 'text-emerald-600' : 'text-slate-900'
                    }`}
                  >
                    {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => onEditTransaction(tx)}
                      title="Edit transaksi"
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteTransaction(tx.id)}
                      title="Hapus transaksi"
                      className="p-1 rounded-md text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 px-4 text-center bg-white/60 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Inbox className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-700">Belum ada transaksi</p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Tidak ada catatan pemasukan atau pengeluaran pada periode ini. Klik tombol di bawah untuk mencatat transaksi pertama.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
