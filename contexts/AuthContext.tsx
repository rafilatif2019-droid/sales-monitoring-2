

import React, { createContext, useContext, ReactNode, useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { User } from '../types';
import AuthorizationModal from '../components/AuthorizationModal';

const USERS: User[] = [
    { id: 'user-1', name: 'User 1', accessCode: '111111' },
    { id: 'user-2', name: 'User 2', accessCode: '222222' },
    { id: 'user-3', name: 'User 3', accessCode: '333333' },
    { id: 'user-4', name: 'User 4', accessCode: '444444' },
    { id: 'user-5', name: 'User 5', accessCode: '555555' },
    { id: 'user-6', name: 'User 6', accessCode: '666666' },
    { id: 'user-7', name: 'User 7', accessCode: '777777' },
    { id: 'user-8', name: 'User 8', accessCode: '888888' },
    { id: 'user-9', name: 'User 9', accessCode: '999999' },
];

interface AuthContextType {
    currentUser: User | null;
    login: (accessCode: string) => boolean;
    logout: () => void;
    requestAuthorization: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    
    const login = (accessCode: string) => {
        const user = USERS.find(u => u.accessCode === accessCode);
        if (user) {
            setCurrentUser(user);
            setIsAuthModalOpen(false);
            // window.location.reload(); // Removed to prevent blank screen bug and provide a smoother UX.
            return true;
        }
        return false;
    };

    const logout = () => {
        setCurrentUser(null);
        // window.location.reload(); // Removed for smoother logout without full refresh.
    };

    const requestAuthorization = () => {
        setIsAuthModalOpen(true);
    };

    const value = { currentUser, login, logout, requestAuthorization };

    return (
        <AuthContext.Provider value={value}>
            {children}
            <AuthorizationModal 
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                onLogin={login}
            />
        {/* FIX: Corrected closing tag for AuthContext.Provider */}
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