import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  Wallet, 
  Palette, 
  LogOut, 
  ChevronDown, 
  Plus, 
  Users, 
  PlusCircle, 
  Layers,
  BarChart3
} from 'lucide-react';

export const AppShell = ({
  children,
  groups,
  currentGroup,
  onSelectGroup,
  onOpenGroupModal,
  onOpenThemeModal,
  onOpenAddTransaction,
  activeTab = 'transactions',
  onTabChange,
}) => {
  const { user, logout } = useAuth();
  const { currentTheme } = useTheme();
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);

  return (
    <div 
      className="min-h-screen transition-colors duration-300 flex flex-col items-center"
      style={{ backgroundColor: 'var(--bg-color, #ffffff)' }}
    >
      {/* Mobile-first centered container: max-w-md provides ideal app-like experience on both mobile & desktop */}
      <div className="w-full max-w-md min-h-screen flex flex-col bg-slate-50/50 border-x border-slate-200/60 relative pb-24 shadow-sm">
        
        {/* Top App Header */}
        <header className="sticky top-0 z-40 px-4 py-3 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
          {/* Brand & Group Switcher */}
          <div className="relative flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setGroupDropdownOpen(!groupDropdownOpen)}
              className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-100 transition-colors text-left max-w-full"
            >
              <div 
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: 'var(--primary-color, #003049)' }}
              >
                <Wallet className="w-3.5 h-3.5" />
              </div>

              <div className="min-w-0 pr-1">
                <span className="text-[10px] text-slate-400 font-medium block leading-none">Dompet Bersama</span>
                <span className="text-xs font-bold text-slate-900 truncate block flex items-center gap-1">
                  {currentGroup?.name || 'Pilih Grup'}
                  <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                </span>
              </div>
            </button>

            {/* Group Dropdown Menu */}
            {groupDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setGroupDropdownOpen(false)} 
                />
                <div className="absolute left-0 top-full mt-1.5 w-60 bg-white rounded-xl border border-slate-200 shadow-md p-2 z-40 animate-fadeIn text-xs space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Daftar Dompet
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-0.5">
                    {groups && groups.length > 0 ? (
                      groups.map((grp) => {
                        const isSelected = grp.id === currentGroup?.id;
                        return (
                          <button
                            key={grp.id}
                            type="button"
                            onClick={() => {
                              onSelectGroup(grp);
                              setGroupDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                              isSelected
                                ? 'bg-slate-100 text-slate-900 font-semibold'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <span className="truncate">{grp.name}</span>
                            {isSelected && (
                              <span 
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: 'var(--primary-color, #003049)' }}
                              />
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-2 py-2 text-slate-400 text-center text-[11px]">
                        Belum ada grup
                      </div>
                    )}
                  </div>

                  <div className="pt-1.5 border-t border-slate-100 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setGroupDropdownOpen(false);
                        onOpenGroupModal();
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                    >
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>Kelola Anggota &amp; Grup</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1">
            {/* Theme Picker Button */}
            <button
              type="button"
              onClick={onOpenThemeModal}
              title="Ganti Tema"
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <Palette className="w-4 h-4" />
            </button>

            {/* Logout Button */}
            <button
              type="button"
              onClick={logout}
              title="Keluar"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Navigation Tabs: Transaksi vs Analitik */}
        <div className="px-4 pt-3 pb-1">
          <div className="flex p-1 bg-slate-200/70 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => onTabChange && onTabChange('transactions')}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'transactions'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Transaksi</span>
            </button>
            <button
              type="button"
              onClick={() => onTabChange && onTabChange('analytics')}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'analytics'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analitik</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-4 space-y-4">
          {children}
        </main>

        {/* Floating Add Transaction FAB */}
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 w-full max-w-md px-4 pointer-events-none">
          <div className="flex items-center justify-between gap-2 p-2 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-md pointer-events-auto">
            <div className="flex items-center gap-2 pl-2">
              <button
                type="button"
                onClick={onOpenGroupModal}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                <Users className="w-4 h-4 text-slate-500" />
                <span>Grup</span>
              </button>
              <span className="text-slate-200">|</span>
              <button
                type="button"
                onClick={onOpenThemeModal}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                <Palette className="w-4 h-4 text-slate-500" />
                <span>Tema</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenAddTransaction}
              style={{ backgroundColor: 'var(--primary-color, #003049)' }}
              className="py-2 px-4 rounded-xl text-white text-xs font-semibold shadow-sm hover:opacity-95 active:scale-[0.98] transition-all flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Transaksi</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
