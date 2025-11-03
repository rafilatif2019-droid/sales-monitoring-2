

import React, { createContext, useContext, ReactNode, useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { useAuth } from './AuthContext';
import { Store, Product, Sale, Settings, AppContextType, DailyVisitPlan, User, ChatEntry } from '../types';
import { DEFAULT_SETTINGS } from '../constants';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode, user: User | null }> = ({ children, user }) => {
  const { requestAuthorization } = useAuth();

  // Persisted state hooks (only active if user exists)
  const [pStores, setPStores] = useLocalStorage<Store[]>('stores', [], user?.id);
  const [pProducts, setPProducts] = useLocalStorage<Product[]>('products', [], user?.id);
  const [pSales, setPSales] = useLocalStorage<Sale[]>('sales', [], user?.id);
  const [pSettings, setPSettings] = useLocalStorage<Settings>('settings', DEFAULT_SETTINGS, user?.id);
  const [pDailyVisitPlan, setPDailyVisitPlan] = useLocalStorage<DailyVisitPlan>('dailyVisitPlan', {}, user?.id);
  const [pChatHistory, setPChatHistory] = useLocalStorage<ChatEntry[]>('chatHistory', [], user?.id);
  
  // Temporary state hooks for guest mode
  const [tStores, setTStores] = useState<Store[]>([]);
  const [tProducts, setTProducts] = useState<Product[]>([]);
  const [tSales, setTSales] = useState<Sale[]>([]);
  const [tSettings, setTSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [tDailyVisitPlan, setTDailyVisitPlan] = useState<DailyVisitPlan>({});
  const [tChatHistory, setTChatHistory] = useState<ChatEntry[]>([]);
  
  // Select active state and setters based on user authentication
  const stores = user ? pStores : tStores;
  const setStores = user ? setPStores : setTStores;
  const products = user ? pProducts : tProducts;
  const setProducts = user ? setPProducts : setTProducts;
  const sales = user ? pSales : tSales;
  const setSales = user ? setPSales : setTSales;
  const settings = user ? pSettings : tSettings;
  const setSettings = user ? setPSettings : setTSettings;
  const dailyVisitPlan = user ? pDailyVisitPlan : tDailyVisitPlan;
  const setDailyVisitPlan = user ? setPDailyVisitPlan : setTDailyVisitPlan;
  const chatHistory = user ? pChatHistory : tChatHistory;
  const setChatHistory = user ? setPChatHistory : setTChatHistory;

  // Guarded actions
  const withAuth = <T extends (...args: any[]) => any>(fn: T): T => {
    return ((...args: Parameters<T>): ReturnType<T> | void => {
      if (!user) {
        requestAuthorization();
        return;
      }
      return fn(...args);
    }) as T;
  };
  
  const addStore = withAuth((store: Omit<Store, 'id'>) => {
    const newStore = { ...store, id: new Date().toISOString() };
    setStores(prev => [...prev, newStore]);
  });

  const updateStore = withAuth((updatedStore: Store) => {
    setStores(prev => prev.map(store => store.id === updatedStore.id ? updatedStore : store));
  });
  
  const deleteStore = withAuth((id: string) => {
    setStores(prev => prev.filter(store => store.id !== id));
    setDailyVisitPlan(prevPlan => {
      const newPlan = { ...prevPlan };
      Object.keys(newPlan).forEach(dayStr => {
        const dayKey = parseInt(dayStr, 10);
        newPlan[dayKey] = newPlan[dayKey].filter(storeId => storeId !== id);
      });
      return newPlan;
    });
  });

  const bulkAddStores = withAuth((newStores: Omit<Store, 'id'>[]) => {
    const storesWithIds = newStores.map((store, i) => ({
      ...store,
      id: `${new Date().toISOString()}-${i}`
    }));
    setStores(prev => [...prev, ...storesWithIds]);
  });

  const addProduct = withAuth((product: Omit<Product, 'id' | 'isActive'>) => {
    const newProduct = { ...product, id: new Date().toISOString(), isActive: true, targetCoverage: product.targetCoverage || {} };
    setProducts(prev => [...prev, newProduct]);
  });

  const updateProduct = withAuth((updatedProduct: Product) => {
    setProducts(prev => prev.map(product => product.id === updatedProduct.id ? updatedProduct : product));
  });
  
  const bulkUpsertProducts = withAuth((productsToUpsert: Omit<Product, 'id' | 'isActive'>[]) => {
    setProducts(prevProducts => {
      const updatedProducts = [...prevProducts];
      const productMap = new Map(updatedProducts.map(p => [`${p.name.toLowerCase().trim()}::${p.type}`, p]));
  
      let addedCount = 0;
      let updatedCount = 0;
  
      productsToUpsert.forEach(p_in => {
        const key = `${p_in.name.toLowerCase().trim()}::${p_in.type}`;
        const existingProduct = productMap.get(key);
  
        if (existingProduct) {
          existingProduct.basePrice = p_in.basePrice;
          existingProduct.targetCoverage = p_in.targetCoverage;
          updatedCount++;
        } else {
          const newProduct: Product = { ...p_in, id: `${new Date().toISOString()}-${addedCount}`, isActive: true };
          updatedProducts.push(newProduct);
          productMap.set(key, newProduct);
          addedCount++;
        }
      });
      
      alert(`Impor selesai!\n- Produk baru ditambahkan: ${addedCount}\n- Produk yang sudah ada diperbarui: ${updatedCount}`);
      return updatedProducts;
    });
  });

  const toggleProductStatus = withAuth((id: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
  });

  const logSale = withAuth((sale: Omit<Sale, 'date'>) => {
    const newSale = { ...sale, date: new Date().toISOString() };
    setSales(prev => [...prev, newSale]);
  });

  const deleteSale = withAuth((storeId: string, productId: string) => {
    setSales(prev => prev.filter(sale => !(sale.storeId === storeId && sale.productId === productId)));
  });
  
  const updateSettings = withAuth((newSettings: Settings) => {
    setSettings(newSettings);
  });
  
  const guardedSetDailyVisitPlan = withAuth((plan: DailyVisitPlan) => {
    setDailyVisitPlan(plan);
  });

  const guardedSetChatHistory = withAuth((value: React.SetStateAction<ChatEntry[]>) => {
    setChatHistory(value);
  });

  const backupData = withAuth(() => {
    const data = { stores, products, sales, settings, dailyVisitPlan, chatHistory };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-monitor-backup-${user.name}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('Backup data berhasil diunduh!');
  });

  const restoreData = withAuth((backupFile: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.stores && data.products && data.sales && data.settings && data.dailyVisitPlan) {
          setPStores(data.stores);
          setPProducts(data.products);
          setPSales(data.sales);
          setPSettings(data.settings);
          setPDailyVisitPlan(data.dailyVisitPlan);
          setPChatHistory(data.chatHistory || []);
          alert("Data berhasil dipulihkan! Perubahan akan terlihat setelah ini.");
        } else {
          alert("File backup tidak valid.");
        }
      } catch (error) {
        console.error("Failed to restore data:", error);
        alert("Gagal memulihkan data. Pastikan file backup benar.");
      }
    };
    reader.readAsText(backupFile);
  });
  
  const resetApp = withAuth(() => {
    if (window.confirm(`YAKIN ingin mereset seluruh data untuk ${user.name}? SEMUA progres akan hilang dan tidak bisa dibatalkan.`)) {
      setPStores([]);
      setPProducts([]);
      setPSales([]);
      setPSettings(DEFAULT_SETTINGS);
      setPDailyVisitPlan({});
      setPChatHistory([]);
      alert("Aplikasi berhasil direset.");
    }
  });
  
  const value = {
    user,
    stores,
    addStore,
    updateStore,
    deleteStore,
    bulkAddStores,
    products,
    addProduct,
    updateProduct,
    toggleProductStatus,
    bulkUpsertProducts,
    sales,
    logSale,
    deleteSale,
    settings,
    updateSettings,
    dailyVisitPlan,
    setDailyVisitPlan: guardedSetDailyVisitPlan,
    chatHistory,
    setChatHistory: guardedSetChatHistory,
    backupData,
    restoreData,
    resetApp,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};