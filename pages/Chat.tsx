
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI, Chat, FunctionDeclaration, Type, FunctionResponsePart, Part } from '@google/genai';
import { useAppContext } from '../contexts/AppContext';
import { StoreLevel, ProductType, ChatEntry } from '../types';
import { PaperAirplaneIcon } from '../components/icons';

// A simple component to render bot messages with basic formatting
const BotMessage: React.FC<{ text: string }> = ({ text }) => {
    // This regex splits by **bold** and `code` patterns, keeping the delimiters
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g).filter(Boolean);

    return (
        <p className="text-slate-200 whitespace-pre-wrap">
            {parts.map((part, index) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={index}>{part.slice(2, -2)}</strong>;
                }
                if (part.startsWith('`') && part.endsWith('`')) {
                    return <code key={index} className="bg-slate-900 text-brand-400 rounded px-1 py-0.5 text-sm font-mono">{part.slice(1, -1)}</code>;
                }
                return <span key={index}>{part}</span>;
            })}
        </p>
    );
};

const CHAT_HISTORY_LIMIT = 50;

const Chat: React.FC = () => {
    const { user, stores, addStore, deleteStore, products, addProduct, sales, chatHistory, setChatHistory } = useAppContext();
    const [loading, setLoading] = useState(true);
    const [input, setInput] = useState('');
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const isMounted = useRef(true);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const messages = useMemo(() => {
        return chatHistory
            .map(entry => ({
                role: entry.role,
                text: entry.parts[0]?.text ?? ''
            }))
            .filter(msg => msg.text.trim() !== ''); // Only show messages with actual text
    }, [chatHistory]);
    
    useEffect(scrollToBottom, [messages, loading]);
    
    useEffect(() => {
        isMounted.current = true;
        const tools: FunctionDeclaration[] = [
            { name: "listStores", description: "Get a list of all stores Rapi is currently managing.", parameters: { type: Type.OBJECT, properties: {} } },
            { name: "addStore", description: "Add a new store to the list.", parameters: { type: Type.OBJECT, properties: { name: { type: Type.STRING, description: "The name of the new store." }, level: { type: Type.STRING, description: `The store level. Must be one of: "${Object.values(StoreLevel).join('", "')}".` } }, required: ["name", "level"] } },
            { name: "deleteStore", description: "Delete a store from the list using its name.", parameters: { type: Type.OBJECT, properties: { name: { type: Type.STRING, description: "The exact name of the store to delete." } }, required: ["name"] } },
            { name: "listProducts", description: "Get a list of all target products.", parameters: { type: Type.OBJECT, properties: {} } },
            { name: "addProduct", description: "Add a new target product.", parameters: { type: Type.OBJECT, properties: { name: { type: Type.STRING, description: "The name of the new product." }, type: { type: Type.STRING, description: `The product type. Must be one of: "${ProductType.DD}", "${ProductType.Fokus}".` }, basePrice: { type: Type.NUMBER, description: "The base price of the product." } }, required: ["name", "type", "basePrice"] } },
            { name: "summarizePerformance", description: "Get a summary of Rapi's current sales performance, including store count and target coverage.", parameters: { type: Type.OBJECT, properties: {} } }
        ];

        const initChat = async () => {
            if (!user) { // Guest mode initialization
                setLoading(false);
                if (chatHistory.length === 0) {
                     setChatHistory([{ role: 'model', parts: [{ text: "Halo Rapi! Aku Selvy, asisten AI-mu. Kamu bisa tanya apa saja, tapi untuk menyimpan percakapan atau mengubah data, kamu perlu otorisasi dulu ya!" }] }]);
                }
                return;
            }
            
            setLoading(true);
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                // Re-create chat with persisted history
                const fullHistoryForGemini = chatHistory.map(entry => ({
                    role: entry.role,
                    parts: entry.parts
                }));
                
                const newChat = ai.chats.create({
                    model: 'gemini-2.5-flash',
                    history: fullHistoryForGemini,
                    config: {
                        systemInstruction: "Kamu adalah Selvy, asisten AI yang jenius dan sangat ahli dalam mengelola target penjualan. Kamu membantu pengguna bernama Rapi. Gaya bicaramu sangat friendly, suportif, dan tidak kaku. Kamu memiliki akses ke fungsi-fungsi aplikasi untuk membantu Rapi. Sapa Rapi dengan namanya saat memulai percakapan dan berikan ringkasan singkat tentang apa yang bisa kamu bantu.",
                        tools: [{ functionDeclarations: tools }],
                    },
                });
                chatRef.current = newChat;

                if (chatHistory.length === 0) {
                    const initialUserEntry: ChatEntry = { role: 'user', parts: [{ text: "Halo, perkenalkan dirimu." }] };
                    const response = await newChat.sendMessageStream({ message: initialUserEntry.parts });
                    let responseText = '';
                    for await (const chunk of response) {
                        responseText += chunk.text;
                    }
                    const initialModelEntry: ChatEntry = { role: 'model', parts: [{ text: responseText }] };
                    if(isMounted.current) setChatHistory([initialUserEntry, initialModelEntry]);
                }
            } catch (error) {
                console.error("Failed to initialize chat:", error);
                if(isMounted.current) setChatHistory([{ role: 'model', parts: [{ text: "Waduh, sepertinya Selvy lagi ada sedikit kendala nih buat terhubung. Coba refresh halaman ini ya, Rapi." }] }]);
            } finally {
                if(isMounted.current) setLoading(false);
            }
        };

        initChat();

        return () => {
            isMounted.current = false;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]); // Re-initialize chat when user logs in/out

    const sendMessage = async (messageText: string) => {
        setChatHistory(prev => {
            const userEntry: ChatEntry = { role: 'user', parts: [{ text: messageText }] };
            return [...prev, userEntry].slice(-CHAT_HISTORY_LIMIT);
        });

        if (!user || !chatRef.current) {
            setChatHistory(prev => {
                const modelEntry: ChatEntry = { role: 'model', parts: [{ text: "Untuk bisa ngobrol dan pakai fungsiku, kamu harus otorisasi dulu ya. Coba deh cek di halaman 'Settings' atau coba tambah data." }] };
                return [...prev, modelEntry].slice(-CHAT_HISTORY_LIMIT);
            });
            return;
        }

        setLoading(true);
        
        try {
            // Convert simplified history to full Part[] for Gemini
            const fullParts: Part[] = [{ text: messageText }];
            let response = await chatRef.current.sendMessage({ message: fullParts });
            
            while(response.functionCalls && response.functionCalls.length > 0) {
                 const modelFunctionCallEntry: ChatEntry = { role: 'model', parts: response.candidates[0].content.parts.map(p => ({ text: JSON.stringify(p) }))}; // Simple storage
                 setChatHistory(prev => [...prev, modelFunctionCallEntry].slice(-CHAT_HISTORY_LIMIT));

                const functionCall = response.functionCalls[0];
                const { name, args, id } = functionCall;
                let result: any;
                try {
                    switch (name) {
                        case "listStores": result = stores.length > 0 ? stores.map(s => ({ name: s.name, level: s.level })) : "Belum ada toko yang ditambahkan."; break;
                        case "addStore": if (!Object.values(StoreLevel).includes(args.level as StoreLevel)) throw new Error(`Store level "${args.level}" tidak valid.`); addStore({ name: args.name, level: args.level as StoreLevel }); result = `Toko "${args.name}" berhasil ditambahkan.`; break;
                        case "deleteStore": const storeToDelete = stores.find(s => s.name.toLowerCase() === args.name.toLowerCase()); if (storeToDelete) { deleteStore(storeToDelete.id); result = `Toko "${args.name}" berhasil dihapus.`; } else { result = `Toko dengan nama "${args.name}" tidak ditemukan.`; } break;
                        case "listProducts": result = products.length > 0 ? products.map(p => ({ name: p.name, type: p.type, basePrice: p.basePrice })) : "Belum ada produk yang ditambahkan."; break;
                        case "addProduct": if (!Object.values(ProductType).includes(args.type as ProductType)) throw new Error(`Tipe produk "${args.type}" tidak valid.`); addProduct({ name: args.name, type: args.type as ProductType, basePrice: args.basePrice, targetCoverage: {} }); result = `Produk "${args.name}" berhasil ditambahkan.`; break;
                        case "summarizePerformance": const ddProducts = products.filter(p => p.type === ProductType.DD); const fokusProducts = products.filter(p => p.type === ProductType.Fokus); const storesWithDD = new Set(sales.filter(s => ddProducts.some(p => p.id === s.productId)).map(s => s.storeId)); const storesWithFokus = new Set(sales.filter(s => fokusProducts.some(p => p.id === s.productId)).map(s => s.storeId)); result = { totalStores: stores.length, targetStoreCount: 96, ddCoverage: storesWithDD.size, fokusCoverage: storesWithFokus.size }; break;
                        default: result = "Fungsi tidak dikenali.";
                    }
                } catch (error) { result = `Terjadi error: ${(error as Error).message}`; }

                const functionResponsePart: FunctionResponsePart = { functionResponse: { id, name, response: { result: typeof result !== 'string' ? JSON.stringify(result) : result } } };
                const toolEntry: ChatEntry = { role: 'user', parts: [{ text: `[Function Response for ${name}]` }] }; // Simplified for display
                setChatHistory(prev => [...prev, toolEntry].slice(-CHAT_HISTORY_LIMIT));

                response = await chatRef.current.sendMessage({ message: [functionResponsePart] });
            }
            
            const finalModelEntry: ChatEntry = { role: 'model', parts: response.candidates[0].content.parts };
             setChatHistory(prev => [...prev, finalModelEntry].slice(-CHAT_HISTORY_LIMIT));

        } catch(e) {
            console.error(e);
            const errorEntry: ChatEntry = { role: 'model', parts: [{text: "Aduh, maaf Rapi. Selvy lagi pusing nih, coba tanya lagi ya."}]};
            setChatHistory(prev => [...prev, errorEntry].slice(-CHAT_HISTORY_LIMIT));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !loading) {
            sendMessage(input);
            setInput('');
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
            <header className="p-3 border-b border-slate-700 flex-shrink-0 bg-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-full flex-shrink-0"></div>
                <div>
                    <h2 className="text-lg font-bold text-white">Selvy</h2>
                     <p className="text-xs text-green-400 flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        online
                    </p>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xl px-4 py-2 rounded-xl text-white ${
                            msg.role === 'user' 
                            ? 'bg-teal-700 rounded-br-sm' 
                            : 'bg-slate-700 rounded-bl-sm'
                        }`}>
                            {msg.role === 'model' ? <BotMessage text={msg.text} /> : <p className="whitespace-pre-wrap">{msg.text}</p>}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex items-end gap-2 justify-start">
                        <div className="max-w-lg px-4 py-2 rounded-xl bg-slate-700 text-slate-400 rounded-bl-sm">
                            <div className="flex items-center space-x-2">
                                <span className="h-2 w-2 bg-slate-500 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                                <span className="h-2 w-2 bg-slate-500 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                                <span className="h-2 w-2 bg-slate-500 rounded-full animate-pulse"></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-slate-700 bg-slate-800 flex-shrink-0">
                <form onSubmit={handleSubmit} className="flex items-center space-x-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Tanya Selvy apa saja..."
                        className="flex-1 bg-slate-700 border border-slate-600 rounded-full py-2.5 px-5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="bg-brand-600 text-white w-11 h-11 flex items-center justify-center rounded-full hover:bg-brand-500 transition-colors disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed flex-shrink-0"
                        aria-label="Kirim"
                    >
                        <PaperAirplaneIcon />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Chat;