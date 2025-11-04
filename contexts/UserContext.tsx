import React, { createContext, useContext, ReactNode } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { User } from '../types';

const INITIAL_USERS: User[] = [
    { id: 'user-1', name: 'Super User', accessCode: '111111', role: 'superuser', nik: '000000', waNumber: '081234567890' },
    { id: 'user-2', name: 'User 2', accessCode: '222222', role: 'user' },
    { id: 'user-3', name: 'User 3', accessCode: '333333', role: 'user' },
    { id: 'user-4', name: 'User 4', accessCode: '444444', role: 'user' },
    { id: 'user-5', name: 'User 5', accessCode: '555555', role: 'user' },
    { id: 'user-6', name: 'User 6', accessCode: '666666', role: 'user' },
    { id: 'user-7', name: 'User 7', accessCode: '777777', role: 'user' },
    { id: 'user-8', name: 'User 8', accessCode: '888888', role: 'user' },
    { id: 'user-9', name: 'User 9', accessCode: '999999', role: 'user' },
];

interface UserContextType {
    users: User[];
    addUser: (user: Omit<User, 'id'>) => void;
    updateUser: (updatedUser: User) => void;
    deleteUser: (userId: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [users, setUsers] = useLocalStorage<User[]>('app_users', INITIAL_USERS);

    const addUser = (user: Omit<User, 'id'>) => {
        const newUser = { ...user, id: `user-${new Date().getTime()}` };
        setUsers(prev => [...prev, newUser]);
    };

    const updateUser = (updatedUser: User) => {
        setUsers(prev => prev.map(user => user.id === updatedUser.id ? updatedUser : user));
    };

    const deleteUser = (userId: string) => {
        setUsers(prev => prev.filter(user => user.id !== userId));
    };

    const value = { users, addUser, updateUser, deleteUser };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};

export const useUsers = (): UserContextType => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUsers must be used within a UserProvider');
    }
    return context;
};
