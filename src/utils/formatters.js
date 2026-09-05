export const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const getMonthNames = () => [
  { value: '', label: 'Semua Bulan' },
  { value: '1', label: 'Januari' },
  { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' },
  { value: '4', label: 'April' },
  { value: '5', label: 'Mei' },
  { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' },
  { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
];

export const CATEGORIES = {
  income: [
    'Gaji & Upah',
    'Bonus & Tunjangan',
    'Hasil Usaha',
    'Investasi',
    'Hadiah & Hibah',
    'Lainnya',
  ],
  expense: [
    'Makanan & Minuman',
    'Belanja Bulanan',
    'Tagihan & Utilitas',
    'Transportasi',
    'Keluarga & Anak',
    'Kesehatan & Medis',
    'Hiburan & Rekreasi',
    'Pendidikan',
    'Lainnya',
  ],
};
