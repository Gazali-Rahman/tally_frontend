import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import { ArrowUpRight, ArrowDownRight, Wallet2 } from 'lucide-react';

export const SummaryCards = ({ summary, groupName, loading }) => {
  const balance = summary?.balance || 0;
  const income = summary?.total_income || 0;
  const expense = summary?.total_expense || 0;

  return (
    <div className="space-y-3">
      {/* Main Balance Card */}
      <div 
        className="rounded-2xl p-5 text-white shadow-md relative overflow-hidden transition-all"
        style={{ backgroundColor: 'var(--primary-color, #003049)' }}
      >
        {/* Background ambient pattern */}
        <div className="absolute -right-4 -bottom-6 opacity-10 pointer-events-none">
          <Wallet2 className="w-32 h-32" />
        </div>

        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium tracking-wide uppercase opacity-80">
              Saldo Bersama — {groupName || 'Grup'}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-xs font-semibold">
              Live Tracker
            </span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {loading ? (
                <span className="opacity-50 text-xl font-normal">Memuat saldo...</span>
              ) : (
                formatCurrency(balance)
              )}
            </h2>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/15 text-xs">
            <div className="flex items-center gap-2 bg-white/10 rounded-xl p-2.5 backdrop-blur-xs">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-white/70">Total Pemasukan</p>
                <p className="font-semibold text-emerald-300 truncate">
                  {loading ? '...' : formatCurrency(income)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white/10 rounded-xl p-2.5 backdrop-blur-xs">
              <div className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0">
                <ArrowDownRight className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-white/70">Total Pengeluaran</p>
                <p className="font-semibold text-rose-300 truncate">
                  {loading ? '...' : formatCurrency(expense)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
