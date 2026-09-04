import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Customer, Beneficiary, TransactionRecord, BankMetrics, DemoScenario } from '../types';
import { api } from '../services/api';

type AppView = 'CUSTOMER' | 'BANK' | 'DEMO';
type CustomerTab = 'dashboard' | 'send' | 'transactions' | 'beneficiaries' | 'scam-analyzer' | 'safety-center';

interface AppContextType {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  customerTab: CustomerTab;
  setCustomerTab: (tab: CustomerTab) => void;
  customers: Customer[];
  currentCustomer: Customer | null;
  setCurrentCustomerId: (id: string) => void;
  beneficiaries: Beneficiary[];
  transactions: TransactionRecord[];
  bankMetrics: BankMetrics | null;
  demoScenarios: DemoScenario[];
  selectedAlertForModal: TransactionRecord | null;
  setSelectedAlertForModal: (record: TransactionRecord | null) => void;
  prefillPayment: any | null;
  setPrefillPayment: (data: any | null) => void;
  refreshData: () => Promise<void>;
  isLoading: boolean;
  addToast: (msg: string, type?: 'info' | 'success' | 'warn' | 'error') => void;
  toasts: { id: string; msg: string; type: 'info' | 'success' | 'warn' | 'error' }[];
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<AppView>('CUSTOMER');
  const [customerTab, setCustomerTab] = useState<CustomerTab>('dashboard');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currentCustomerId, setCurrentCustomerId] = useState<string>('usr_ravi_kumar');
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [bankMetrics, setBankMetrics] = useState<BankMetrics | null>(null);
  const [demoScenarios, setDemoScenarios] = useState<DemoScenario[]>([]);
  const [selectedAlertForModal, setSelectedAlertForModal] = useState<TransactionRecord | null>(null);
  const [prefillPayment, setPrefillPayment] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<{ id: string; msg: string; type: 'info' | 'success' | 'warn' | 'error' }[]>([]);

  const addToast = (msg: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const refreshData = useCallback(async () => {
    try {
      const [fetchedCustomers, fetchedTransactions, fetchedMetrics, fetchedScenarios] = await Promise.all([
        api.getCustomers(),
        api.getTransactions(),
        api.getBankStats(),
        api.getDemoScenarios(),
      ]);

      setCustomers(fetchedCustomers);
      setTransactions(fetchedTransactions);
      setBankMetrics(fetchedMetrics);
      setDemoScenarios(fetchedScenarios);

      if (currentCustomerId) {
        const bens = await api.getBeneficiaries(currentCustomerId);
        setBeneficiaries(bens);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentCustomerId]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // When customer changes, load customer's beneficiaries
  useEffect(() => {
    if (currentCustomerId) {
      api.getBeneficiaries(currentCustomerId)
        .then(setBeneficiaries)
        .catch((err) => console.error('Failed to load beneficiaries:', err));
    }
  }, [currentCustomerId]);

  const currentCustomer = customers.find((c) => c.id === currentCustomerId) || customers[0] || null;

  return (
    <AppContext.Provider
      value={{
        activeView,
        setActiveView,
        customerTab,
        setCustomerTab,
        customers,
        currentCustomer,
        setCurrentCustomerId,
        beneficiaries,
        transactions,
        bankMetrics,
        demoScenarios,
        selectedAlertForModal,
        setSelectedAlertForModal,
        prefillPayment,
        setPrefillPayment,
        refreshData,
        isLoading,
        addToast,
        toasts,
        dismissToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
