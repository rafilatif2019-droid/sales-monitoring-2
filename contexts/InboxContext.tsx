import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { useAuth } from './AuthContext';
import { useNotifier } from './NotificationContext';
import { InboxMessage, InboxContextType } from '../types';
import { InboxIcon } from '../components/icons';

const InboxContext = createContext<InboxContextType | undefined>(undefined);

export const InboxProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const { addNotification } = useNotifier();
    const [messages, setMessages] = useLocalStorage<InboxMessage[]>('inbox_messages', []);
    const [lastReadTimestamp, setLastReadTimestamp] = useLocalStorage<number>(
        'inbox_last_read', 
        0, 
        currentUser?.id // Keyed by user ID
    );
    const [unreadCount, setUnreadCount] = useState(0);

    const calculateUnread = useCallback(() => {
        if (!currentUser) return 0;
        return messages.filter(
            msg => msg.timestamp > lastReadTimestamp && msg.senderId !== currentUser.id
        ).length;
    }, [messages, lastReadTimestamp, currentUser]);

    useEffect(() => {
        const newUnreadCount = calculateUnread();
        setUnreadCount(newUnreadCount);
    }, [calculateUnread]);

    useEffect(() => {
        // This effect handles cross-tab notifications
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'inbox_messages') {
                const newMessages: InboxMessage[] = JSON.parse(event.newValue || '[]');
                const lastMessage = newMessages[newMessages.length - 1];
                if (currentUser && lastMessage && lastMessage.senderId !== currentUser.id) {
                     // Check if inbox is not the active page. This is a proxy. A better solution would involve context.
                     if(!window.location.href.includes('#inbox')) { // Simple check
                         addNotification({
                            type: 'info',
                            title: `Pesan Baru dari ${lastMessage.senderName}`,
                            message: lastMessage.text.length > 50 ? `${lastMessage.text.substring(0, 50)}...` : lastMessage.text,
                            icon: <InboxIcon />,
                         });
                     }
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [addNotification, currentUser]);

    const sendMessage = (text: string, type: 'standard' | 'broadcast') => {
        if (!currentUser) {
            alert("Anda harus login untuk mengirim pesan.");
            return;
        }

        const newMessage: InboxMessage = {
            id: new Date().toISOString(),
            senderId: currentUser.id,
            senderName: currentUser.name,
            senderProfilePicture: currentUser.profilePicture,
            text,
            timestamp: Date.now(),
            type,
        };

        setMessages(prev => [...prev, newMessage]);
    };

    const markAsRead = () => {
        setLastReadTimestamp(Date.now());
        setUnreadCount(0);
    };

    const value = { messages, sendMessage, unreadCount, markAsRead };

    return (
        <InboxContext.Provider value={value}>
            {children}
        </InboxContext.Provider>
    );
};

export const useInbox = (): InboxContextType => {
    const context = useContext(InboxContext);
    if (context === undefined) {
        throw new Error('useInbox must be used within an InboxProvider');
    }
    return context;
};