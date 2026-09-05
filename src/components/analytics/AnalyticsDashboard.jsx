import React, { useState, useEffect } from 'react';
import { transactionService } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { 
  TrendingUp, 
  PieChart, 
  BarChart3, 
  Users, 
  AlertCircle, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldCheck,
  Calendar,
  Layers,
  Award
} from 'lucide-react';

// Module-level in-memory cache keyed by `${groupId}_${period}`
const analyticsCache = new Map();

export const AnalyticsDashboard = ({ groupId, groupName, refreshTrigger }) => {
  const [period, setPeriod] = useState('this_month'); // 'this_month' | '3_months' | 'this_year' | 'all'
  const cacheKey = `${groupId}_${period}`;

  const [data, setData] = useState(() => analyticsCache.get(cacheKey) || null);
  const [loading, setLoading] = useState(() => !analyticsCache.has(cacheKey));
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [error, setError] = useState('');

  const fetchAnalytics = async (force = false) => {
    if (!groupId) return;
    const currentKey = `${groupId}_${period}`;
    const cached = analyticsCache.get(currentKey);

    if (cached && !force) {
      setData(cached);
      setLoading(false);
      return;
    }

    if (cached && force) {
      setIsRevalidating(true);
    } else {
      setLoading(true);
    }

    setError('');
    try {
      const res = await transactionService.getAnalytics(groupId, { period });
      analyticsCache.set(currentKey, res);
      setData(res);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      if (!cached) {
        setError('Gagal memuat data analitik.');
      }
    } finally {
      setLoading(false);
      setIsRevalidating(false);
    }
  };

  // When groupId or period changes
  useEffect(() => {
    const currentKey = `${groupId}_${period}`;
    if (analyticsCache.has(currentKey)) {
      setData(analyticsCache.get(currentKey));
      setLoading(false);
    } else {
      fetchAnalytics();
    }
  }, [groupId, period]);

  // Invalidate cache and refetch when refreshTrigger increments (e.g. transaction added/edited/deleted)
  useEffect(() => {
    if (refreshTrigger > 0 && groupId) {
      for (const key of Array.from(analyticsCache.keys())) {
        if (key.startsWith(`${groupId}_`)) {
          analyticsCache.delete(key);
        }
      }
      fetchAnalytics(true);
    }
  }, [refreshTrigger]);

  const periods = [
    { value: 'this_month', label: 'Bulan Ini' },
    { value: '3_months', label: '3 Bulan' },
    { value: 'this_year', label: 'Tahun Ini' },
    { value: 'all', label: 'Semua' },
  ];

  // Initial skeleton loader when no data exists in cache yet
  if (loading && !data) {
    return (
      <div className="space-y-4 animate-fadeIn">
        {/* Period Filter Pills Skeleton */}
        <div className="flex items-center justify-between gap-1 p-1 bg-white rounded-xl border border-slate-200/80 shadow-sm animate-pulse">
          {periods.map((p) => (
            <div key={p.value} className="flex-1 py-3 bg-slate-100 rounded-lg" />
          ))}
        </div>

        {/* Health Card Skeleton */}
        <div 
          className="rounded-2xl p-4 text-white shadow-md relative overflow-hidden animate-pulse space-y-3"
          style={{ backgroundColor: 'var(--primary-color, #003049)' }}
        >
          <div className="h-4 w-36 bg-white/20 rounded-md" />
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-white/10 rounded-xl p-3 h-20" />
            <div className="bg-white/10 rounded-xl p-3 h-20" />
          </div>
        </div>

        {/* 6-Month Chart Skeleton */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-3 animate-pulse">
          <div className="h-4 w-44 bg-slate-100 rounded-md" />
          <div className="h-32 bg-slate-50 rounded-xl" />
        </div>

        {/* Category Skeleton */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-3 animate-pulse">
          <div className="h-4 w-40 bg-slate-100 rounded-md" />
          <div className="space-y-2">
            <div className="h-6 bg-slate-50 rounded-lg" />
            <div className="h-6 bg-slate-50 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 text-center space-y-2">
        <AlertCircle className="w-5 h-5 mx-auto text-rose-500" />
        <p>{error}</p>
        <button
          onClick={() => fetchAnalytics(true)}
          className="px-3 py-1 bg-white border border-rose-200 rounded-lg text-rose-700 font-medium"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const categories = data?.category_breakdown || [];
  const memberContributions = data?.member_contributions || [];
  const topExpenses = data?.top_expenses || [];
  const monthlyTrend = data?.monthly_trend || [];

  // Calculate maximum for 6-month chart scaling
  const maxTrendVal = Math.max(
    ...monthlyTrend.map((m) => Math.max(m.income, m.expense)),
    1000000
  );

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Period Filter Pills */}
      <div className="flex items-center justify-between gap-1 p-1 bg-white rounded-xl border border-slate-200/80 shadow-sm">
        {periods.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPeriod(p.value)}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
              period === p.value
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {isRevalidating && (
        <div className="flex items-center justify-center gap-1.5 text-[10px] font-medium text-slate-400 animate-fadeIn">
          <Sparkles className="w-3 h-3 text-sky-500 animate-spin" />
          <span>Memperbarui analitik terkini...</span>
        </div>
      )}

      {/* 1. Financial Health & Savings Card */}
      <div 
        className="rounded-2xl p-4 text-white shadow-md relative overflow-hidden transition-all"
        style={{ backgroundColor: 'var(--primary-color, #003049)' }}
      >
        <div className="space-y-3 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium tracking-wide uppercase opacity-80 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Kesehatan Kas &amp; Tabungan</span>
            </span>

            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 ${
              metrics.health_status === 'surplus'
                ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/30'
                : metrics.health_status === 'balanced'
                ? 'bg-amber-500/25 text-amber-300 border border-amber-400/30'
                : 'bg-rose-500/25 text-rose-300 border border-rose-400/30'
            }`}>
              <ShieldCheck className="w-3 h-3" />
              <span>
                {metrics.health_status === 'surplus'
                  ? 'Surplus Sehat'
                  : metrics.health_status === 'balanced'
                  ? 'Seimbang'
                  : 'Defisit'}
              </span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
              <p className="text-[10px] text-white/70 font-medium">Rasio Tabungan (Savings Rate)</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-emerald-300">
                  {metrics.savings_rate}%
                </span>
              </div>
              <p className="text-[9px] text-white/60 mt-0.5">
                {metrics.net_savings >= 0 ? 'Tersimpan ' + formatCurrency(metrics.net_savings) : 'Defisit ' + formatCurrency(Math.abs(metrics.net_savings))}
              </p>
            </div>

            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
              <p className="text-[10px] text-white/70 font-medium">Rata-rata Pengeluaran</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  {formatCurrency(metrics.daily_avg_expense)}
                </span>
                <span className="text-[10px] text-white/70">/hari</span>
              </div>
              <p className="text-[9px] text-white/60 mt-0.5">
                Total beban: {formatCurrency(metrics.expense)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 6-Month Cashflow Bar Chart */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-slate-500" />
            <span>Tren Arus Kas 6 Bulan Terakhir</span>
          </h3>
          <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Masuk
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Keluar
            </span>
          </div>
        </div>

        {/* CSS/SVG Responsive Bar Chart */}
        <div className="pt-3 pb-1">
          <div className="h-36 flex items-end justify-between gap-2 border-b border-slate-100 px-1">
            {monthlyTrend.map((item, idx) => {
              const incHeight = maxTrendVal > 0 ? Math.min(100, Math.max(6, (item.income / maxTrendVal) * 100)) : 6;
              const expHeight = maxTrendVal > 0 ? Math.min(100, Math.max(6, (item.expense / maxTrendVal) * 100)) : 6;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-900 text-white text-[9px] rounded-md px-1.5 py-1 z-20 whitespace-nowrap shadow-sm">
                    <p className="text-emerald-300">+{formatCurrency(item.income)}</p>
                    <p className="text-rose-300">-{formatCurrency(item.expense)}</p>
                  </div>

                  {/* Bars */}
                  <div className="w-full flex items-end justify-center gap-1 h-28">
                    {/* Income Bar */}
                    <div
                      className="w-2.5 sm:w-3 rounded-t-md bg-emerald-500 hover:bg-emerald-600 transition-all"
                      style={{ height: `${item.income > 0 ? incHeight : 4}%` }}
                      title={`Pemasukan: ${formatCurrency(item.income)}`}
                    />
                    {/* Expense Bar */}
                    <div
                      className="w-2.5 sm:w-3 rounded-t-md bg-rose-400 hover:bg-rose-500 transition-all"
                      style={{ height: `${item.expense > 0 ? expHeight : 4}%` }}
                      title={`Pengeluaran: ${formatCurrency(item.expense)}`}
                    />
                  </div>

                  {/* Month Label */}
                  <span className="text-[10px] font-medium text-slate-500 truncate w-full text-center">
                    {item.label.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Category Breakdown (Pengeluaran per Kategori) */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-slate-500" />
            <span>Alokasi Pengeluaran per Kategori</span>
          </h3>
          <span className="text-[11px] font-semibold text-slate-500">
            {categories.length} Kategori
          </span>
        </div>

        {categories.length > 0 ? (
          <div className="space-y-2.5 pt-1">
            {categories.map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <span>{cat.category}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({cat.count}x)</span>
                  </span>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">{formatCurrency(cat.total)}</span>
                    <span className="text-[11px] text-slate-500 font-medium ml-1.5">({cat.percentage}%)</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(100, cat.percentage)}%`,
                      backgroundColor: idx === 0 
                        ? 'var(--primary-color, #003049)' 
                        : idx === 1 
                        ? 'var(--secondary-color, #669bbc)' 
                        : '#94a3b8'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-6 text-xs text-slate-400">
            Belum ada data pengeluaran pada periode ini.
          </p>
        )}
      </div>

      {/* 4. Member Contributions (Dompet Bersama Special) */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
            <Users className="w-4 h-4 text-slate-500" />
            <span>Kontribusi Anggota Dompet Bersama</span>
          </h3>
          <span className="text-[11px] text-slate-500 font-semibold">
            {memberContributions.length} Anggota Aktif
          </span>
        </div>

        {memberContributions.length > 0 ? (
          <div className="space-y-2.5">
            {memberContributions.map((member, idx) => (
              <div 
                key={idx}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                      style={{ backgroundColor: 'var(--primary-color, #003049)' }}
                    >
                      {(member.user?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{member.user?.name || 'Anggota'}</p>
                      <p className="text-[10px] text-slate-400">{member.tx_count} transaksi dicatat</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-extrabold text-slate-900">
                      {formatCurrency(member.expense_total)}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Porsi Belanja: <strong className="text-slate-700">{member.expense_percentage}%</strong>
                    </p>
                  </div>
                </div>

                {/* Progress bar for member's share */}
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(100, member.expense_percentage)}%`,
                      backgroundColor: 'var(--secondary-color, #669bbc)'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-6 text-xs text-slate-400">
            Belum ada data kontribusi anggota.
          </p>
        )}
      </div>

      {/* 5. Top 5 Largest Expenses */}
      {topExpenses.length > 0 && (
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Pengeluaran Terbesar</span>
            </h3>
            <span className="text-[10px] text-slate-400">Top 5 Outliers</span>
          </div>

          <div className="space-y-2">
            {topExpenses.map((item, idx) => (
              <div 
                key={item.id}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-white transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 text-center text-xs font-bold text-slate-400">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.category}</p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {item.description || formatDate(item.transaction_date)} • oleh {item.user?.name || 'Anggota'}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs font-extrabold text-rose-600">
                    -{formatCurrency(item.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
