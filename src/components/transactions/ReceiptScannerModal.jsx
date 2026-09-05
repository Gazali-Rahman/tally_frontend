import React, { useState, useRef } from 'react';
import { createWorker } from 'tesseract.js';
import { parseReceiptText } from '../../utils/receiptParser';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { 
  X, 
  Camera, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Tag, 
  Calendar, 
  FileText, 
  Receipt 
} from 'lucide-react';

export const ReceiptScannerModal = ({ isOpen, onClose, onScanComplete }) => {
  const [imagePreview, setImagePreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [parsedResult, setParsedResult] = useState(null);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setParsedResult(null);

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
      processImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (imageSrc) => {
    setScanning(true);
    setProgress(10);
    setStatusText('Memulai mesin pengenal teks (OCR)...');

    try {
      const worker = await createWorker('ind+eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
            setStatusText(`Membaca struk... ${Math.round(m.progress * 100)}%`);
          } else if (m.status === 'loading tesseract core') {
            setStatusText('Memuat modul pemrosesan...');
          } else if (m.status === 'loading language traineddata') {
            setStatusText('Menyiapkan bahasa Indonesia & Inggris...');
          }
        },
      });

      const { data: { text } } = await worker.recognize(imageSrc);
      await worker.terminate();

      setStatusText('Menganalisis total & rincian belanja...');
      const parsed = parseReceiptText(text);

      setParsedResult(parsed);
    } catch (err) {
      console.error('Error scanning receipt:', err);
      setError('Gagal membaca gambar struk. Pastikan foto cukup terang dan fokus pada teks.');
    } finally {
      setScanning(false);
    }
  };

  const handleApplyResult = () => {
    if (!parsedResult) return;
    if (onScanComplete) {
      onScanComplete({
        type: 'expense',
        amount: parsedResult.amount,
        category: parsedResult.category,
        transaction_date: parsedResult.date,
        description: parsedResult.description,
      });
    }
    handleClose();
  };

  const handleClose = () => {
    setImagePreview(null);
    setScanning(false);
    setProgress(0);
    setStatusText('');
    setParsedResult(null);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-sm rounded-2xl border border-slate-200/80 shadow-md p-5 space-y-4 animate-scaleUp overflow-hidden max-h-[90vh] flex flex-col"
        style={{ backgroundColor: 'var(--bg-color, #ffffff)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div 
              className="p-1.5 rounded-lg text-white"
              style={{ backgroundColor: 'var(--primary-color, #003049)' }}
            >
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Pindai Struk Belanja</h2>
              <p className="text-[11px] text-slate-500">Ekstraksi otomatis nominal &amp; kategori</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hidden File Inputs */}
        {/* Native Camera input for mobile */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={cameraInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        {/* Regular file picker for gallery / desktop */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Scrollable Content */}
        <div className="space-y-4 overflow-y-auto flex-1 pr-0.5">
          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload Area / Preview Area */}
          {!imagePreview ? (
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center space-y-4 bg-slate-50/50">
              <div 
                className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center text-white shadow-sm"
                style={{ backgroundColor: 'var(--primary-color, #003049)' }}
              >
                <Camera className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-800">
                  Ambil Foto atau Pilih Gambar Struk
                </p>
                <p className="text-[11px] text-slate-500 max-w-[220px] mx-auto">
                  Arahkan kamera ke struk belanja kasir yang terang dan jelas.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  style={{ backgroundColor: 'var(--primary-color, #003049)' }}
                  className="w-full py-2.5 px-3 rounded-xl text-white text-xs font-semibold shadow-sm hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Ambil Foto via Kamera HP</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Pilih Gambar dari Galeri</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Image Preview with Scanning Animation */}
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 max-h-48 flex items-center justify-center">
                <img
                  src={imagePreview}
                  alt="Struk Belanja"
                  className="w-full h-48 object-contain"
                />

                {/* Scanning Laser Line */}
                {scanning && (
                  <div className="absolute inset-x-0 h-1 bg-sky-400 shadow-md animate-pulse top-1/2 -translate-y-1/2" />
                )}

                {/* Rescan Button Overlay */}
                {!scanning && (
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setParsedResult(null);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 backdrop-blur-xs text-[10px] flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Ganti Foto</span>
                  </button>
                )}
              </div>

              {/* Progress indicator while scanning */}
              {scanning && (
                <div className="p-3 bg-sky-50 border border-sky-100 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between text-sky-900 font-semibold text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-sky-600 animate-spin" />
                      <span>{statusText || 'Memproses struk...'}</span>
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-sky-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-sky-600 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Parsed Result Preview Card */}
              {parsedResult && (
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2.5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Hasil Ekstraksi Berhasil</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200/60 text-emerald-800 font-semibold">
                      Pengeluaran
                    </span>
                  </div>

                  {/* Nominal detected */}
                  <div className="p-2.5 bg-white rounded-lg border border-emerald-100 shadow-xs flex items-baseline justify-between">
                    <span className="text-[10px] font-medium text-slate-500">Nominal Total:</span>
                    <span className="text-base font-extrabold text-slate-900">
                      {parsedResult.amount ? formatCurrency(parsedResult.amount) : 'Tidak terdeteksi'}
                    </span>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 bg-white rounded-lg border border-emerald-100 shadow-xs space-y-0.5">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5" /> Kategori
                      </span>
                      <p className="font-semibold text-slate-800 truncate">
                        {parsedResult.category}
                      </p>
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-emerald-100 shadow-xs space-y-0.5">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" /> Tanggal
                      </span>
                      <p className="font-semibold text-slate-800 truncate">
                        {formatDate(parsedResult.date)}
                      </p>
                    </div>
                  </div>

                  {parsedResult.description && (
                    <div className="p-2 bg-white rounded-lg border border-emerald-100 shadow-xs text-[11px] space-y-0.5">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <FileText className="w-2.5 h-2.5" /> Merchant / Toko
                      </span>
                      <p className="font-semibold text-slate-800 truncate">
                        {parsedResult.description}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-slate-100 flex gap-2 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition-colors"
          >
            Batal
          </button>

          {parsedResult && (
            <button
              type="button"
              onClick={handleApplyResult}
              style={{ backgroundColor: 'var(--primary-color, #003049)' }}
              className="flex-1 py-2 rounded-xl text-white text-xs font-semibold shadow-sm hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Gunakan Data Ini</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
