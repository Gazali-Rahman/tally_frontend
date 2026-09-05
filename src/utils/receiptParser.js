/**
 * Smart Receipt Parser for Indonesian and standard international receipts.
 * Extracts: Total Amount, Transaction Date, Merchant/Store Name, and Category.
 */

const MERCHANT_CATEGORY_MAP = [
  // Makanan & Minuman
  {
    category: 'Makanan & Minuman',
    keywords: [
      'starbucks', 'kopi', 'kenangan', 'janji jiwa', 'fore', 'chatime', 'point coffee',
      'mcdonald', 'mcd', 'kfc', 'burger king', 'pizza hut', 'domino', 'hokben',
      'solaria', 'gacoan', 'bakso', 'soto', 'sate', 'warung', 'resto', 'restoran',
      'cafe', 'kafe', 'coffee', 'kitchen', 'dapur', 'bakery', 'roti'
    ]
  },
  // Belanja Bulanan
  {
    category: 'Belanja Bulanan',
    keywords: [
      'indomaret', 'alfamart', 'alfamidi', 'superindo', 'hypermart', 'transmart',
      'carrefour', 'lotte', 'hero', 'grand lucky', 'market', 'minimarket', 'swalayan',
      'toserba', 'mart', 'supermarket', 'groceries'
    ]
  },
  // Transportasi
  {
    category: 'Transportasi',
    keywords: [
      'pertamina', 'shell', 'bp', 'spbu', 'bensin', 'solar', 'pertamax', 'pertalite',
      'grab', 'gojek', 'goride', 'gocar', 'maxim', 'blue bird', 'taxi', 'taksi',
      'parkir', 'parking', 'tol', 'kereta', 'kai', 'mrt', 'transjakarta'
    ]
  },
  // Kesehatan & Medis
  {
    category: 'Kesehatan & Medis',
    keywords: [
      'apotek', 'kimia farma', 'century', 'guardian', 'watsons', 'k24', 'apotik',
      'klinik', 'clinic', 'rumah sakit', 'rsud', 'puskesmas', 'dokter', 'laboratorium', 'prodia'
    ]
  },
  // Tagihan & Utilitas
  {
    category: 'Tagihan & Utilitas',
    keywords: [
      'pln', 'listrik', 'token', 'pdam', 'air', 'telkom', 'indihome', 'biznet',
      'first media', 'myrepublic', 'bpjs', 'pbb', 'pulsa', 'kuota', 'paket data'
    ]
  },
  // Hiburan & Rekreasi
  {
    category: 'Hiburan & Rekreasi',
    keywords: [
      'cinema', 'xxi', 'cgv', 'cinepolis', 'bioskop', 'timezone', 'funworld',
      'karaoke', 'tiket', 'wisata', 'taman', 'game', 'playstation'
    ]
  },
  // Pendidikan
  {
    category: 'Pendidikan',
    keywords: [
      'gramedia', 'toko buku', 'buku', 'stationery', 'fotocopy', 'sekolah',
      'universitas', 'kampus', 'kursus', 'les', 'bimbel'
    ]
  }
];

export const parseReceiptText = (rawText) => {
  if (!rawText || typeof rawText !== 'string') {
    return {
      amount: '',
      category: 'Belanja Bulanan',
      date: new Date().toISOString().split('T')[0],
      merchant: '',
      description: 'Belanja Struk',
    };
  }

  const lines = rawText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // 1. Detect Merchant Name (Usually top 1-4 lines)
  let detectedMerchant = '';
  let matchedCategory = '';

  for (let i = 0; i < Math.min(6, lines.length); i++) {
    const lineLower = lines[i].toLowerCase();
    
    // Ignore generic address/date words
    if (lineLower.includes('jl.') || lineLower.includes('jalan') || lineLower.includes('telp') || lineLower.includes('tanggal')) {
      continue;
    }

    for (const group of MERCHANT_CATEGORY_MAP) {
      for (const kw of group.keywords) {
        if (lineLower.includes(kw)) {
          matchedCategory = group.category;
          detectedMerchant = lines[i];
          break;
        }
      }
      if (detectedMerchant) break;
    }
    if (detectedMerchant) break;
  }

  // If no famous merchant detected, take the first non-numeric header line
  if (!detectedMerchant && lines.length > 0) {
    const candidate = lines.find((l) => l.length > 3 && !/^\d+$/.test(l) && !l.includes(':'));
    if (candidate) {
      detectedMerchant = candidate.replace(/[^a-zA-Z0-9\s&]/g, '').trim();
    }
  }

  // 2. Detect Total Amount
  // Strategy: Find keywords like 'GRAND TOTAL', 'TOTAL HARGA', 'TOTAL BAYAR', etc.
  let detectedAmount = 0;
  const specificTotalKeywords = [
    'grand total',
    'total bayar',
    'total belanja',
    'total harga',
    'harga total',
    'jumlah total',
    'total tagihan',
    'total akhir',
    'net total',
  ];
  const generalTotalKeywords = ['total', 'jumlah', 'subtotal'];

  const checkLineForAmount = (line, nextLine = '') => {
    const lineLower = line.toLowerCase();

    // Ignore quantity or count lines like "TOTAL ITEM: 3" or "TOTAL QTY: 5" or change lines
    if (
      lineLower.includes('item') ||
      lineLower.includes('qty') ||
      lineLower.includes('pcs') ||
      lineLower.includes('barang') ||
      lineLower.includes('kuantiti') ||
      lineLower.includes('kembali') ||
      lineLower.includes('change') ||
      lineLower.includes('kembalian')
    ) {
      return 0;
    }

    // First check numbers on this line itself
    const lineNumbers = extractNumbers(line);
    if (lineNumbers.length > 0) {
      return lineNumbers[lineNumbers.length - 1];
    }

    // If no numbers on this line, check the next line unless it's a payment method / cash line
    if (nextLine) {
      const nextLower = nextLine.toLowerCase();
      if (
        !nextLower.includes('kembali') &&
        !nextLower.includes('tunai') &&
        !nextLower.includes('cash') &&
        !nextLower.includes('change') &&
        !nextLower.includes('kembalian')
      ) {
        const nextNumbers = extractNumbers(nextLine);
        if (nextNumbers.length > 0) {
          return nextNumbers[0];
        }
      }
    }

    return 0;
  };

  // Pass 1: Check high-priority specific keywords
  for (let i = 0; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase();
    if (specificTotalKeywords.some((kw) => lineLower.includes(kw))) {
      const amt = checkLineForAmount(lines[i], lines[i + 1]);
      if (amt) {
        detectedAmount = amt;
        break;
      }
    }
  }

  // Pass 2: Check general total keywords
  if (!detectedAmount) {
    for (let i = 0; i < lines.length; i++) {
      const lineLower = lines[i].toLowerCase();
      if (generalTotalKeywords.some((kw) => lineLower.includes(kw))) {
        const amt = checkLineForAmount(lines[i], lines[i + 1]);
        if (amt) {
          detectedAmount = amt;
          break;
        }
      }
    }
  }

  // Fallback: If no keyword matched, scan all lines for numbers and find the maximum plausible value
  if (!detectedAmount) {
    const allNumbers = extractNumbers(rawText);
    const validAmounts = allNumbers.filter((n) => n >= 500 && n <= 50000000);
    if (validAmounts.length > 0) {
      detectedAmount = Math.max(...validAmounts);
    }
  }

  // 3. Detect Transaction Date
  let detectedDate = '';
  // Match DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, DD/MM/YY
  const dateRegex = /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b|\b(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})\b/;
  const dateMatch = rawText.match(dateRegex);

  if (dateMatch) {
    try {
      let day, month, year;
      if (dateMatch[4]) {
        // YYYY-MM-DD
        year = dateMatch[4];
        month = dateMatch[5].padStart(2, '0');
        day = dateMatch[6].padStart(2, '0');
      } else {
        // DD-MM-YYYY or DD-MM-YY
        day = dateMatch[1].padStart(2, '0');
        month = dateMatch[2].padStart(2, '0');
        year = dateMatch[3];
        if (year.length === 2) {
          year = '20' + year;
        }
      }
      // Validate bounds
      if (Number(month) >= 1 && Number(month) <= 12 && Number(day) >= 1 && Number(day) <= 31) {
        detectedDate = `${year}-${month}-${day}`;
      }
    } catch (e) {
      // ignore
    }
  }

  if (!detectedDate) {
    detectedDate = new Date().toISOString().split('T')[0];
  }

  return {
    amount: detectedAmount ? String(detectedAmount) : '',
    category: matchedCategory || 'Belanja Bulanan',
    date: detectedDate,
    merchant: detectedMerchant,
    description: detectedMerchant ? `${detectedMerchant}` : 'Belanja Struk',
  };
};

/**
 * Helper to extract integer numbers from messy OCR text like "Rp 125.000,00" or "Rp125,000"
 */
const extractNumbers = (text) => {
  const clean = text
    .replace(/rp\.?/gi, ' ')
    .replace(/[^\d\s\.,]/g, ' ');

  const tokens = clean.split(/\s+/);
  const results = [];

  for (const token of tokens) {
    if (!token) continue;
    // Remove formatting commas/dots
    // If format like 125.000 or 125,000 (Indonesian / standard thousands separator)
    let sanitized = token;
    
    // Check if ends with ,00 or .00 (cents)
    sanitized = sanitized.replace(/[,\.]00$/, '');
    
    // Remove all remaining thousand separators
    sanitized = sanitized.replace(/[,\.]/g, '');

    const num = parseInt(sanitized, 10);
    // Ignore barcode strings or phone numbers (> 100 million) or tiny noise (< 100)
    if (!isNaN(num) && num >= 100 && num <= 100000000 && sanitized.length <= 9) {
      results.push(num);
    }
  }

  return results;
};
