
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useInbox } from '../contexts/InboxContext';
import { InboxMessage } from '../types';
import { MegaphoneIcon, PaperAirplaneIcon, UserCircleIcon } from '../components/icons';

const Message: React.FC<{ msg: InboxMessage; isCurrentUser: boolean }> = ({ msg, isCurrentUser }) => {
    const time = new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    if (msg.type === 'broadcast') {
        return (
            <div className="my-4">
                <div className="mx-auto max-w-3xl bg-gradient-to-br from-brand-700 to-brand-900 border-2 border-brand-500 rounded-xl shadow-lg shadow-brand-500/20 p-4">
                    <div className="flex items-center gap-3 border-b border-brand-600 pb-2 mb-2">
                        <MegaphoneIcon className="w-6 h-6 text-brand-300" />
                        <h3 className="font-bold text-lg text-white">PENGUMUMAN</h3>
                    </div>
                    <p className="text-white whitespace-pre-wrap">{msg.text}</p>
                    <p className="text-right text-xs text-brand-300 mt-2">{msg.senderName} - {time}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex items-end gap-3 my-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
            {!isCurrentUser && (
                 <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-700 flex-shrink-0">
                    {msg.senderProfilePicture ? (
                    <img src={msg.senderProfilePicture} alt={msg.senderName} className="w-full h-full object-cover" />
                    ) : (
                    <UserCircleIcon className="text-slate-500" />
                    )}
                </div>
            )}
            <div className={`max-w-lg px-4 py-2 rounded-xl text-white ${
                isCurrentUser 
                ? 'bg-brand-600 rounded-br-sm' 
                : 'bg-slate-700 rounded-bl-sm'
            }`}>
                {!isCurrentUser && <p className="font-bold text-brand-300 text-sm">{msg.senderName}</p>}
                <p className="whitespace-pre-wrap">{msg.text}</p>
                <p className={`text-xs mt-1 ${isCurrentUser ? 'text-brand-200' : 'text-slate-400'} text-right`}>{time}</p>
            </div>
        </div>
    );
};

const Inbox: React.FC = () => {
    const { currentUser } = useAuth();
    const { messages, sendMessage } = useInbox();
    const [input, setInput] = useState('');
    const [broadcastInput, setBroadcastInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    
    const messagesWithDates = useMemo(() => {
        const result: (InboxMessage | { type: 'date_marker'; date: string; id: string })[] = [];
        let lastDate: string | null = null;

        messages.forEach(msg => {
            const msgDateObj = new Date(msg.timestamp);
            const today = new Date();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            let msgDateStr: string;

            if (msgDateObj.toDateString() === today.toDateString()) {
                msgDateStr = 'Hari ini';
            } else if (msgDateObj.toDateString() === yesterday.toDateString()) {
                msgDateStr = 'Kemarin';
            } else {
                msgDateStr = msgDateObj.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            }
            
            if (msgDateStr !== lastDate) {
                result.push({
                    type: 'date_marker',
                    date: msgDateStr,
                    id: `date-${msgDateStr}`
                });
                lastDate = msgDateStr;
            }
            result.push(msg);
        });

        return result;
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            sendMessage(input, 'standard');
            setInput('');
        }
    };
    
    const handleBroadcast = (e: React.FormEvent) => {
        e.preventDefault();
        if (broadcastInput.trim()) {
            sendMessage(broadcastInput, 'broadcast');
            setBroadcastInput('');
        }
    };
    
    if (!currentUser) {
        return (
            <div className="h-full flex items-center justify-center p-8 text-center text-slate-400 bg-slate-800 rounded-lg border border-slate-700 shadow-xl">
                <div>
                    <h2 className="text-2xl font-bold mb-2">Inbox Tim</h2>
                    <p>Silakan login untuk mengakses dan berpartisipasi dalam percakapan tim.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 bg-slate-800 rounded-lg border border-slate-700 shadow-xl animate-fade-in overflow-hidden">
            <header className="p-4 border-b border-slate-700 flex-shrink-0 bg-slate-800 rounded-t-lg">
                <h2 className="text-xl font-bold text-white text-center">Inbox Tim</h2>
            </header>

            <div className="flex-1 overflow-y-auto p-4">
                {messagesWithDates.map((item) => {
                    if (item.type === 'date_marker') {
                        return (
                            <div key={item.id} className="text-center my-4">
                                <span className="bg-slate-700 text-slate-400 text-xs font-semibold px-3 py-1 rounded-full">{item.date}</span>
                            </div>
                        );
                    }
                    const msg = item as InboxMessage;
                    return <Message key={msg.id} msg={msg} isCurrentUser={currentUser.id === msg.senderId} />
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-slate-700 bg-slate-800 flex-shrink-0 space-y-3 rounded-b-lg">
                 {currentUser.role === 'superuser' && (
                     <form onSubmit={handleBroadcast} className="flex items-center space-x-3 bg-brand-900/50 border border-brand-700 p-2 rounded-lg">
                        <MegaphoneIcon className="w-6 h-6 text-brand-400 flex-shrink-0 mx-2" />
                        <input
                            type="text"
                            value={broadcastInput}
                            onChange={(e) => setBroadcastInput(e.target.value)}
                            placeholder="Kirim pengumuman ke semua user..."
                            className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-white placeholder-brand-300/70"
                        />
                        <button
                            type="submit"
                            disabled={!broadcastInput.trim()}
                            className="bg-brand-600 text-white w-9 h-9 flex items-center justify-center rounded-lg hover:bg-brand-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed flex-shrink-0"
                            aria-label="Kirim Pengumuman"
                        >
                            <PaperAirplaneIcon />
                        </button>
                    </form>
                 )}
                 <form onSubmit={handleSend} className="flex items-center space-x-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ketik pesan..."
                        className="flex-1 bg-slate-700 border border-slate-600 rounded-full py-2.5 px-5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="bg-brand-600 text-white w-11 h-11 flex items-center justify-center rounded-full hover:bg-brand-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed flex-shrink-0"
                        aria-label="Kirim Pesan"
                    >
                        <PaperAirplaneIcon />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Inbox;
