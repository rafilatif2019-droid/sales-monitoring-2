
import React from 'react';

export enum StoreLevel {
  WS1 = "Ws 1",
  WS2 = "Ws 2",
  RitelL = "Ritel L",
  Ritel = "Ritel",
  Others = "Others",
}

export interface Store {
  id: string;
  name: string;
  level: StoreLevel;
}

export enum ProductType {
    DD = "Distribusi Drive",
    Fokus = "Item Fokus"
}

export interface Product {
    id:string;
    name: string;
    type: ProductType;
    basePrice: number;
    image?: string; // base64 string
    isActive: boolean;
    targetCoverage: { [key in StoreLevel]?: number }; // Percentage
}

export interface Settings {
    discounts: {
        [key in StoreLevel]: number;
    };
    deadline: string; // YYYY-MM-DD
}

export interface Sale {
    storeId: string;
    productId: string;
    quantity: number; // e.g., number of boxes
    date: string;
}

export type DailyVisitPlan = {
    [day: number]: string[]; // day: 1 for Monday, ..., 6 for Saturday
};

export interface Notification {
    id: string;
    type: 'warning' | 'info' | 'success' | 'error';
    title: string;
    message: string;
    icon?: React.ReactNode;
}

export type UserRole = 'user' | 'superuser';

export interface User {
    id: string;
    name: string;
    accessCode: string;
    role: UserRole;
    profilePicture?: string; // base64 string
    nik?: string;
    waNumber?: string;
}


export interface ChatEntry {
    role: 'user' | 'model';
    parts: { text: string }[]; // Simplified for context storage
}

// FIX: Add InboxMessage and InboxContextType for the new Inbox feature
export interface InboxMessage {
    id: string;
    senderId: string;
    senderName: string;
    senderProfilePicture?: string;
    text: string;
    timestamp: number;
    type: 'standard' | 'broadcast';
}

export interface InboxContextType {
    messages: InboxMessage[];
    sendMessage: (text: string, type: 'standard' | 'broadcast') => void;
    unreadCount: number;
    markAsRead: () => void;
}

export interface AppContextType {
    user: User | null;
    stores: Store[];
    addStore: (store: Omit<Store, 'id'>) => void;
    updateStore: (store: Store) => void;
    deleteStore: (id: string) => void;
    bulkAddStores: (stores: Omit<Store, 'id'>[]) => void;
    
    products: Product[];
    addProduct: (product: Omit<Product, 'id' | 'isActive'>) => void;
    updateProduct: (product: Product) => void;
    toggleProductStatus: (id: string) => void;
    bulkUpsertProducts: (products: Omit<Product, 'id' | 'isActive'>[]) => void;

    sales: Sale[];
    logSale: (sale: Omit<Sale, 'date'>) => void;
    deleteSale: (storeId: string, productId: string) => void;
    
    settings: Settings;
    updateSettings: (settings: Settings) => void;

    dailyVisitPlan: DailyVisitPlan;
    setDailyVisitPlan: (plan: DailyVisitPlan) => void;

    chatHistory: ChatEntry[];
    setChatHistory: React.Dispatch<React.SetStateAction<ChatEntry[]>>;

    backupData: () => void;
    restoreData: (backupFile: File) => void;
    resetApp: () => void;
}