import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { groupService, transactionService } from './services/api';
import { AuthModal } from './components/auth/AuthModal';
import { AppShell } from './components/layout/AppShell';
import { SummaryCards } from './components/dashboard/SummaryCards';
import { TransactionList } from './components/transactions/TransactionList';
import { TransactionModal } from './components/transactions/TransactionModal';
import { ReceiptScannerModal } from './components/transactions/ReceiptScannerModal';
import { GroupModal } from './components/groups/GroupModal';
import { ThemeModal } from './components/theme/ThemeModal';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';
import tallyLogo from './assets/tally.jpg';

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' | 'analytics'
  const [groups, setGroups] = useState([]);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Filters (default ke bulan dan tahun saat ini)
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Modal States
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const [scannedTxData, setScannedTxData] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [analyticsRefreshTrigger, setAnalyticsRefreshTrigger] = useState(0);

  // Load Groups
  const fetchGroups = async () => {
    try {
      setLoadingGroups(true);
      const data = await groupService.getGroups();
      if (data && data.groups) {
        setGroups(data.groups);
        if (data.groups.length > 0) {
          // If currentGroup is not set or not in list, select first group
          setCurrentGroup((prev) => {
            if (!prev) return data.groups[0];
            const found = data.groups.find((g) => g.id === prev.id);
            return found || data.groups[0];
          });
        } else {
          setCurrentGroup(null);
        }
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoadingGroups(false);
    }
  };

  // Load Summary & Transactions for active group
  const fetchGroupData = async (groupId) => {
    if (!groupId) return;
    try {
      setLoadingSummary(true);
      setLoadingTransactions(true);

      const [summaryData, txData] = await Promise.all([
        transactionService.getSummary(groupId),
        transactionService.getTransactions(groupId, {
          ...(selectedMonth ? { month: selectedMonth } : {}),
          ...(selectedYear ? { year: selectedYear } : {}),
        }),
      ]);

      if (summaryData && summaryData.summary) {
        setSummary(summaryData.summary);
      }
      if (txData && txData.transactions) {
        setTransactions(txData.transactions);
      }
    } catch (err) {
      console.error('Error fetching group data:', err);
    } finally {
      setLoadingSummary(false);
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (currentGroup?.id) {
      fetchGroupData(currentGroup.id);
    }
  }, [currentGroup?.id, selectedMonth, selectedYear]);

  // Handlers
  const handleSelectGroup = (group) => {
    setCurrentGroup(group);
  };

  const handleOpenAddTransaction = () => {
    setTransactionToEdit(null);
    setScannedTxData(null);
    setIsTxModalOpen(true);
  };

  const handleEditTransaction = (tx) => {
    setTransactionToEdit(tx);
    setScannedTxData(null);
    setIsTxModalOpen(true);
  };

  const handleQuickScanComplete = (scannedData) => {
    setIsScannerOpen(false);
    setTransactionToEdit(null);
    setScannedTxData(scannedData);
    setIsTxModalOpen(true);
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) return;
    try {
      await transactionService.deleteTransaction(id);
      fetchGroupData(currentGroup.id);
      setAnalyticsRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error('Error deleting transaction:', err);
      alert('Gagal menghapus transaksi.');
    }
  };

  const handleTransactionSuccess = () => {
    if (currentGroup?.id) {
      fetchGroupData(currentGroup.id);
      setAnalyticsRefreshTrigger((prev) => prev + 1);
    }
  };

  const handleGroupCreated = (newGroup) => {
    fetchGroups();
    setCurrentGroup(newGroup);
  };

  const handleMemberUpdated = () => {
    fetchGroups();
  };

  return (
    <AppShell
      groups={groups}
      currentGroup={currentGroup}
      onSelectGroup={handleSelectGroup}
      onOpenGroupModal={() => setIsGroupModalOpen(true)}
      onOpenThemeModal={() => setIsThemeModalOpen(true)}
      onOpenAddTransaction={handleOpenAddTransaction}
      onOpenReceiptScanner={() => setIsScannerOpen(true)}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {/* Persistent Tab: Transaksi */}
      <div className={activeTab === 'transactions' ? 'space-y-4' : 'hidden'}>
        {/* Financial Summary */}
        <SummaryCards
          summary={summary}
          groupName={currentGroup?.name}
          loading={loadingSummary}
        />

        {/* Transaction History & Filter */}
        <TransactionList
          transactions={transactions}
          loading={loadingTransactions}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          onEditTransaction={handleEditTransaction}
          onDeleteTransaction={handleDeleteTransaction}
          currentUserId={user?.id}
        />
      </div>

      {/* Persistent Tab: Analitik */}
      <div className={activeTab === 'analytics' ? 'space-y-4' : 'hidden'}>
        <AnalyticsDashboard
          groupId={currentGroup?.id}
          groupName={currentGroup?.name}
          refreshTrigger={analyticsRefreshTrigger}
        />
      </div>

      {/* Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setScannedTxData(null);
        }}
        groupId={currentGroup?.id}
        transactionToEdit={transactionToEdit}
        initialData={scannedTxData}
        onSuccess={handleTransactionSuccess}
      />

      <ReceiptScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanComplete={handleQuickScanComplete}
      />

      <GroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        currentGroup={currentGroup}
        groups={groups}
        currentUser={user}
        onGroupCreated={handleGroupCreated}
        onMemberUpdated={handleMemberUpdated}
      />

      <ThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />
    </AppShell>
  );
};

const Main = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center space-y-3"
        style={{ backgroundColor: 'var(--bg-color, #ffffff)' }}
      >
        <img 
          src={tallyLogo} 
          alt="Tally Logo" 
          className="w-14 h-14 rounded-2xl object-cover shadow-sm animate-pulse border border-slate-200/80" 
        />
        <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
          Memuat Tally...
        </p>
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  return <Dashboard />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Main />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
