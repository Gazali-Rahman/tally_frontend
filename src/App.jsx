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
import { ToastNotification } from './components/common/ToastNotification';
import { getEcho } from './services/echo';
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

  // Real-Time Notification State
  const [notification, setNotification] = useState(null);

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

  // Real-Time Event Broadcasting via WebSockets (Pusher / Echo)
  useEffect(() => {
    if (!currentGroup?.id) return;

    const echo = getEcho();
    if (!echo) return;

    const channelName = `group.${currentGroup.id}`;

    echo.private(channelName)
      .listen('.transaction.created', (event) => {
        const createdTx = event.transaction;
        if (createdTx) {
          // Check if it matches active month/year filter
          const txDate = new Date(createdTx.transaction_date);
          const matchesMonth = !selectedMonth || String(txDate.getMonth() + 1) === String(selectedMonth);
          const matchesYear = !selectedYear || String(txDate.getFullYear()) === String(selectedYear);

          if (matchesMonth && matchesYear) {
            setTransactions((prev) => {
              if (prev.some((t) => t.id === createdTx.id)) return prev;
              return [createdTx, ...prev];
            });
          }

          // Update summary balance
          setSummary((prev) => {
            if (!prev) return prev;
            const inc = createdTx.type === 'income' ? Number(createdTx.amount) : 0;
            const exp = createdTx.type === 'expense' ? Number(createdTx.amount) : 0;
            return {
              ...prev,
              total_income: prev.total_income + inc,
              total_expense: prev.total_expense + exp,
              balance: prev.balance + inc - exp,
            };
          });

          // Invalidate and refresh analytics tab
          setAnalyticsRefreshTrigger((prev) => prev + 1);

          // Show Toast notification if created by another member
          if (createdTx.user_id !== user?.id) {
            setNotification({
              type: createdTx.type,
              title: createdTx.type === 'income' ? 'Pemasukan Baru' : 'Pengeluaran Baru',
              message: event.message || `${createdTx.user?.name || 'Pasangan'} mencatat transaksi baru`,
            });
          }
        }
      })
      .listen('.transaction.updated', (event) => {
        const updatedTx = event.transaction;
        if (updatedTx) {
          setTransactions((prev) =>
            prev.map((t) => (t.id === updatedTx.id ? updatedTx : t))
          );
          // Refetch summary cleanly
          transactionService.getSummary(currentGroup.id).then((res) => {
            if (res && res.summary) setSummary(res.summary);
          });
          setAnalyticsRefreshTrigger((prev) => prev + 1);

          if (updatedTx.user_id !== user?.id) {
            setNotification({
              type: updatedTx.type,
              title: 'Transaksi Diperbarui',
              message: event.message || `${updatedTx.user?.name || 'Pasangan'} memperbarui transaksi`,
            });
          }
        }
      })
      .listen('.transaction.deleted', (event) => {
        const { id, amount, type: delType, userName } = event;
        if (id) {
          setTransactions((prev) => prev.filter((t) => t.id !== id));
          setSummary((prev) => {
            if (!prev) return prev;
            const inc = delType === 'income' ? Number(amount) : 0;
            const exp = delType === 'expense' ? Number(amount) : 0;
            return {
              ...prev,
              total_income: Math.max(0, prev.total_income - inc),
              total_expense: Math.max(0, prev.total_expense - exp),
              balance: prev.balance - inc + exp,
            };
          });
          setAnalyticsRefreshTrigger((prev) => prev + 1);

          setNotification({
            type: 'deleted',
            title: 'Transaksi Dihapus',
            message: event.message || `${userName || 'Pasangan'} menghapus transaksi`,
          });
        }
      });

    return () => {
      echo.leave(channelName);
    };
  }, [currentGroup?.id, selectedMonth, selectedYear, user?.id]);

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

      {/* Real-Time WebSocket Toast Notification */}
      <ToastNotification
        notification={notification}
        onClose={() => setNotification(null)}
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
