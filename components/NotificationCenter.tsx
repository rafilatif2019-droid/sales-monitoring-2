
import React, { useEffect } from 'react';
import { useNotifier } from '../contexts/NotificationContext';
import { ExclamationTriangleIcon, XMarkIcon } from './icons';

const NotificationToast: React.FC<{
    id: string;
    type: 'warning' | 'info' | 'success' | 'error';
    title: string;
    message: string;
    onDismiss: (id: string) => void;
}> = ({ id, type, title, message, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss(id);
        }, 8000); // Auto-dismiss after 8 seconds

        return () => clearTimeout(timer);
    }, [id, onDismiss]);

    const typeClasses = {
        warning: 'bg-yellow-500/10 border-yellow-500 text-yellow-300',
        info: 'bg-sky-500/10 border-sky-500 text-sky-300',
        success: 'bg-green-500/10 border-green-500 text-green-300',
        error: 'bg-red-500/10 border-red-500 text-red-300',
    };

    const Icon = ExclamationTriangleIcon; // Only warning icon is needed for now

    return (
        <div className={`w-full max-w-sm rounded-lg shadow-lg border p-4 animate-fade-in ${typeClasses[type]}`}>
            <div className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6">
                    <Icon />
                </div>
                <div className="ml-3 w-0 flex-1">
                    <p className="text-sm font-bold">{title}</p>
                    <p className="mt-1 text-sm">{message}</p>
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                    <button
                        onClick={() => onDismiss(id)}
                        className="inline-flex rounded-md text-slate-400 hover:text-white focus:outline-none"
                    >
                        <span className="sr-only">Close</span>
                        <XMarkIcon />
                    </button>
                </div>
            </div>
        </div>
    );
};

const NotificationCenter: React.FC = () => {
    const { notifications, removeNotification } = useNotifier();

    if (notifications.length === 0) {
        return null;
    }

    return (
        <div className="fixed top-4 right-4 z-[100] w-full max-w-sm space-y-3">
            {notifications.map((notification) => (
                <NotificationToast
                    key={notification.id}
                    id={notification.id}
                    type={notification.type}
                    title={notification.title}
                    message={notification.message}
                    onDismiss={removeNotification}
                />
            ))}
        </div>
    );
};

export default NotificationCenter;
