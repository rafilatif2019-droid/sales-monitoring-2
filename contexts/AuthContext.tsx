

import React, { createContext, useContext, ReactNode, useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { User } from '../types';
import AuthorizationModal from '../components/AuthorizationModal';
import { useUsers } from './UserContext';

interface AuthContextType {
    currentUser: User | null;
    login: (accessCode: string) => boolean;
    logout: () => void;
    requestAuthorization: () => void;
    updateCurrentUserData: (updatedData: Partial<Omit<User, 'id' | 'role' | 'accessCode'>>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const { users, updateUser } = useUsers();
    
    const login = (accessCode: string) => {
        const user = users.find(u => u.accessCode === accessCode);
        if (user) {
            setCurrentUser(user);
            setIsAuthModalOpen(false);
            return true;
        }
        return false;
    };

    const logout = () => {
        setCurrentUser(null);
    };

    const requestAuthorization = () => {
        setIsAuthModalOpen(true);
    };

    const updateCurrentUserData = (updatedData: Partial<Omit<User, 'id' | 'role' | 'accessCode'>>) => {
        if (!currentUser) return;
        const updatedUser = { ...currentUser, ...updatedData };
        setCurrentUser(updatedUser); // Update current session state
        updateUser(updatedUser); // Persist changes to the master user list
    };


    const value = { currentUser, login, logout, requestAuthorization, updateCurrentUserData };

    return (
        <AuthContext.Provider value={value}>
            {children}
            <AuthorizationModal 
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                onLogin={login}
            />
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};