import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { X, Check, Palette } from 'lucide-react';

export const ThemeModal = ({ isOpen, onClose }) => {
  const { themes, currentTheme, selectTheme, loadingThemes } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-sm rounded-2xl border border-slate-200/80 shadow-md p-5 space-y-4 animate-scaleUp"
        style={{ backgroundColor: 'var(--bg-color, #ffffff)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div 
              className="p-1.5 rounded-lg text-white"
              style={{ backgroundColor: 'var(--primary-color, #003049)' }}
            >
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Pilihan Tema</h2>
              <p className="text-[11px] text-slate-500">Sesuaikan palet warna visual aplikasi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Theme List */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {loadingThemes && (
            <p className="text-center py-4 text-xs text-slate-400">Memuat tema...</p>
          )}

          {themes.map((theme) => {
            const isSelected = currentTheme?.id === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => selectTheme(theme)}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  isSelected
                    ? 'border-slate-800 bg-slate-50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                    {theme.name}
                    {isSelected && (
                      <span 
                        className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium"
                        style={{ backgroundColor: 'var(--primary-color, #003049)' }}
                      >
                        Aktif
                      </span>
                    )}
                  </span>
                  
                  {/* Swatches */}
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <div 
                      className="w-4 h-4 rounded-full border border-slate-300 shadow-sm"
                      style={{ backgroundColor: theme.color_background }}
                      title={`Background: ${theme.color_background}`}
                    />
                    <div 
                      className="w-4 h-4 rounded-full border border-slate-200 shadow-sm"
                      style={{ backgroundColor: theme.color_primary }}
                      title={`Primary: ${theme.color_primary}`}
                    />
                    <div 
                      className="w-4 h-4 rounded-full border border-slate-200 shadow-sm"
                      style={{ backgroundColor: theme.color_secondary }}
                      title={`Secondary: ${theme.color_secondary}`}
                    />
                  </div>
                </div>

                {isSelected ? (
                  <div 
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: 'var(--primary-color, #003049)' }}
                  >
                    <Check className="w-3 h-3" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-slate-200" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-2 text-center">
          <button
            onClick={onClose}
            style={{ backgroundColor: 'var(--primary-color, #003049)' }}
            className="w-full py-2 rounded-xl text-white text-xs font-medium shadow-sm hover:opacity-95 transition-opacity"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
