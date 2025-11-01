import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Product, ProductType, Store, StoreLevel, DailyVisitPlan } from '../types';
import { STORE_LEVELS } from '../constants';
import ProgressBar from '../components/ProgressBar';
import Modal from '../components/Modal';
import { PencilSquareIcon, ArrowUpIcon, ArrowDownIcon, MinusIcon, SearchIcon, CalendarIcon, ChartBarIcon, PieChartIcon, XMarkIcon, FilterIcon, ChevronDownIcon } from '../components/icons';
import TargetProgressChart from '../components/TargetProgressChart';
import CalendarView from '../components/CalendarView';
import PhaseCountdown from '../components/PhaseCountdown';

const DailyPlanEditModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    day: number;
    dayName: string;
}> = ({ isOpen, onClose, day, dayName }) => {
    const { stores, dailyVisitPlan, setDailyVisitPlan } = useAppContext();
    const [selectedStoreIds, setSelectedStoreIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            setSelectedStoreIds(new Set(dailyVisitPlan[day] || []));
            setSearchTerm(''); // Reset search on open
        }
    }, [isOpen, day, dailyVisitPlan]);

    const filteredStores = useMemo(() => {
        if (!searchTerm) {
            return stores;
        }
        return stores.filter(store => 
            store.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [stores, searchTerm]);

    const handleToggleStore = (storeId: string) => {
        const newSet = new Set(selectedStoreIds);
        if (newSet.has(storeId)) {
            newSet.delete(storeId);
        } else {
            newSet.add(storeId);
        }
        setSelectedStoreIds(newSet);
    };

    const handleSave = () => {
        // FIX: Explicitly type `newPlan` to avoid type inference issues with index signatures.
        const newPlan: DailyVisitPlan = { ...dailyVisitPlan, [day]: Array.from(selectedStoreIds) };
        setDailyVisitPlan(newPlan);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Atur Rencana Kunjungan: ${dayName}`}>
            <div className="relative mb-4">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <SearchIcon />
                </span>
                <input
                    type="text"
                    placeholder="Cari toko untuk ditambahkan..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 pl-10 pr-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                />
            </div>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
                {filteredStores.length > 0 ? (
                    filteredStores.map(store => (
                        <label key={store.id} htmlFor={`store-plan-${store.id}`} className="flex items-center space-x-3 bg-slate-900 p-3 rounded-lg cursor-pointer hover:bg-slate-950 transition-colors">
                            <input
                                id={`store-plan-${store.id}`}
                                type="checkbox"
                                checked={selectedStoreIds.has(store.id)}
                                onChange={() => handleToggleStore(store.id)}
                                className="h-5 w-5 rounded bg-slate-700 border-slate-600 text-brand-500 focus:ring-brand-500"
                            />
                            <span className="font-semibold text-white">{store.name}</span>
                        </label>
                    ))
                ) : (
                    <p className="text-center text-slate-500 py-4">Toko tidak ditemukan.</p>
                )}
            </div>
            <div className="flex justify-end space-x-2 pt-4 mt-4 border-t border-slate-700">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-600 rounded-md hover:bg-slate-500">Batal</button>
                <button onClick={handleSave} className="px-4 py-2 bg-brand-600 rounded-md hover:bg-brand-500">Simpan</button>
            </div>
        </Modal>
    );
};

const TargetPopover: React.FC<{
    store: Store | null;
    anchorEl: HTMLElement | null;
    onClose: () => void;
}> = ({ store, anchorEl, onClose }) => {
    const { products, settings, sales, logSale, deleteSale } = useAppContext();
    const popoverRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<{ top: number, left: number }>({ top: -9999, left: -9999 });

    useEffect(() => {
        if (anchorEl && popoverRef.current) {
            const anchorRect = anchorEl.getBoundingClientRect();
            const popoverRect = popoverRef.current.getBoundingClientRect();
            
            let top = anchorRect.bottom + window.scrollY + 8;
            let left = anchorRect.left + window.scrollX + anchorRect.width / 2 - popoverRect.width / 2;

            // Boundary checks to prevent going off-screen
            if (left < 8) left = 8;
            if (left + popoverRect.width > window.innerWidth - 8) {
                left = window.innerWidth - popoverRect.width - 8;
            }
             if (top + popoverRect.height > window.innerHeight + window.scrollY - 8) {
                top = anchorRect.top + window.scrollY - popoverRect.height - 8;
            }

            setPosition({ top, left });
        }
    }, [anchorEl]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                popoverRef.current && 
                !popoverRef.current.contains(event.target as Node) &&
                anchorEl &&
                !anchorEl.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        if (anchorEl) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [anchorEl, onClose]);

    if (!store || !anchorEl) return null;

    const activeProducts = products.filter(p => p.isActive);
    const ddProducts = activeProducts.filter(p => p.type === ProductType.DD);
    const fokusProducts = activeProducts.filter(p => p.type === ProductType.Fokus);

    const handleCheckboxChange = (product: Product, isChecked: boolean) => {
        if (isChecked) {
            logSale({ storeId: store.id, productId: product.id, quantity: 1 });
        } else {
            deleteSale(store.id, product.id);
        }
    };
    
    const ProductChecklistItem: React.FC<{product: Product}> = ({ product }) => {
        const isChecked = sales.some(s => s.storeId === store.id && s.productId === product.id);
        const discountPercentage = settings.discounts[store.level];
        const finalPrice = product.basePrice * (1 - discountPercentage / 100);

        return (
             <label htmlFor={`product-${product.id}-${store.id}`} className="flex items-center space-x-3 bg-slate-900 p-3 rounded-lg cursor-pointer hover:bg-slate-950 transition-colors">
                <input
                    id={`product-${product.id}-${store.id}`}
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => handleCheckboxChange(product, e.target.checked)}
                    className="h-5 w-5 rounded bg-slate-700 border-slate-600 text-brand-500 focus:ring-brand-500"
                />
                <div className="flex-1">
                    <p className="font-semibold text-white">{product.name}</p>
                    <p className="text-xs text-slate-400">
                        Harga: Rp {product.basePrice.toLocaleString()} &rarr; <span className="font-bold text-brand-400">Rp {finalPrice.toLocaleString()}</span> (Disc. {discountPercentage}%)
                    </p>
                </div>
            </label>
        );
    };

    return (
        <div
            ref={popoverRef}
            style={{ top: `${position.top}px`, left: `${position.left}px` }}
            className="absolute z-50 w-[400px] bg-slate-800 rounded-lg shadow-2xl border border-slate-700 animate-fade-in"
        >
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-800 transform rotate-45 border-l border-t border-slate-700"></div>
            <div className="p-4 border-b border-slate-700">
                <h3 className="text-lg font-bold text-white">Target Produk: {store.name}</h3>
            </div>
            <div className="p-4 space-y-4 max-h-[50vh] overflow-y-auto">
                <div>
                    <h4 className="text-md font-bold text-brand-400">Distribusi Drive</h4>
                    <p className="text-xs text-slate-400 mb-2">Target jangka pendek & promosi.</p>
                    <div className="space-y-2">
                        {ddProducts.length > 0 ? ddProducts.map(p => <ProductChecklistItem key={p.id} product={p} />) : <p className="text-slate-500 text-sm">Tidak ada target produk DD aktif.</p>}
                    </div>
                </div>
                 <div>
                    <h4 className="text-md font-bold text-brand-400">Item Fokus</h4>
                    <p className="text-xs text-slate-400 mb-2">Produk prioritas jangka panjang.</p>
                    <div className="space-y-2">
                         {fokusProducts.length > 0 ? fokusProducts.map(p => <ProductChecklistItem key={p.id} product={p} />) : <p className="text-slate-500 text-sm">Tidak ada target produk Fokus aktif.</p>}
                    </div>
                </div>
            </div>
             <div className="flex justify-end p-4 border-t border-slate-700">
                <button onClick={onClose} className="px-4 py-2 bg-slate-600 rounded-md hover:bg-slate-500 text-sm">Tutup</button>
            </div>
        </div>
    );
};


const CalendarPopover: React.FC<{
    anchorEl: HTMLElement | null;
    onClose: () => void;
}> = ({ anchorEl, onClose }) => {
    const popoverRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<{ top: number, left: number }>({ top: -9999, left: -9999 });

    useEffect(() => {
        if (anchorEl && popoverRef.current) {
            const anchorRect = anchorEl.getBoundingClientRect();
            const popoverRect = popoverRef.current.getBoundingClientRect();
            
            let top = anchorRect.bottom + window.scrollY + 8;
            let left = anchorRect.right + window.scrollX - popoverRect.width;

            // Boundary checks
            if (left < 8) left = 8;
            if (left + popoverRect.width > window.innerWidth - 8) {
                left = window.innerWidth - popoverRect.width - 8;
            }
             if (top + popoverRect.height > window.innerHeight + window.scrollY - 8) {
                top = anchorRect.top + window.scrollY - popoverRect.height - 8;
            }

            setPosition({ top, left });
        }
    }, [anchorEl]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                popoverRef.current && 
                !popoverRef.current.contains(event.target as Node) &&
                anchorEl &&
                !anchorEl.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        if (anchorEl) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [anchorEl, onClose]);

    if (!anchorEl) return null;

    return (
        <div
            ref={popoverRef}
            style={{ top: `${position.top}px`, left: `${position.left}px` }}
            className="absolute z-50 w-full max-w-3xl bg-slate-800 rounded-lg shadow-2xl border border-slate-700 animate-fade-in"
        >
            <div className="absolute -top-2 right-6 w-4 h-4 bg-slate-800 transform rotate-45 border-l border-t border-slate-700"></div>
            <div className="p-4 border-b border-slate-700">
                <h3 className="text-lg font-bold text-white">Kalender & Hari Libur Nasional</h3>
            </div>
            <div className="p-6">
                <CalendarView />
            </div>
            <div className="flex justify-end p-4 border-t border-slate-700">
                <button onClick={onClose} className="px-4 py-2 bg-slate-600 rounded-md hover:bg-slate-500 text-sm">Tutup</button>
            </div>
        </div>
    );
};


const StoreCard: React.FC<{ store: Store; onCekTarget: (event: React.MouseEvent<HTMLButtonElement>, store: Store) => void; }> = ({ store, onCekTarget }) => {
    const { products, sales } = useAppContext();
    const buttonRef = useRef<HTMLButtonElement>(null);

    const activeProducts = products.filter(p => p.isActive);
    const ddProducts = activeProducts.filter(p => p.type === ProductType.DD);
    const fokusProducts = activeProducts.filter(p => p.type === ProductType.Fokus);

    const storeSales = sales.filter(s => s.storeId === store.id);
    
    const ddAchieved = ddProducts.filter(p => storeSales.some(s => s.productId === p.id)).length;
    const fokusAchieved = fokusProducts.filter(p => storeSales.some(s => s.productId === p.id)).length;

    const levelColorMap: Record<StoreLevel, string> = {
        [StoreLevel.WS1]: "bg-red-500",
        [StoreLevel.WS2]: "bg-orange-500",
        [StoreLevel.RitelL]: "bg-yellow-500",
        [StoreLevel.Ritel]: "bg-green-500",
        [StoreLevel.Others]: "bg-blue-500",
    };

    return (
        <div className="bg-slate-800 rounded-lg p-4 flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg">{store.name}</h3>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full text-white ${levelColorMap[store.level]}`}>{store.level}</span>
                </div>
                <div className="mt-4 space-y-4">
                    <ProgressBar value={ddAchieved} max={ddProducts.length} label="Distribusi Drive" />
                    <ProgressBar value={fokusAchieved} max={fokusProducts.length} label="Item Fokus" />
                </div>
            </div>
            <button 
                ref={buttonRef}
                onClick={(e) => onCekTarget(e, store)} 
                className="mt-4 w-full bg-brand-600 text-white font-semibold py-2 rounded-md hover:bg-brand-500 transition-colors">
                Cek Target
            </button>
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: number; change: number; }> = ({ title, value, change }) => {
    const changeIcon = change > 0 ? <ArrowUpIcon /> : change < 0 ? <ArrowDownIcon /> : <MinusIcon />;
    const changeColor = change > 0 ? 'text-green-400' : change < 0 ? 'text-red-400' : 'text-slate-400';
    const changeText = change > 0 ? `+${change}` : change;

    return (
        <div className="bg-slate-900 p-4 rounded-lg">
            <h4 className="text-sm text-slate-400">{title}</h4>
            <div className="flex justify-between items-baseline">
                <p className="text-3xl font-bold">{value}</p>
                <div className={`flex items-center gap-1 font-semibold ${changeColor}`}>
                    {changeIcon}
                    <span>{change === 0 ? '-' : changeText}</span>
                </div>
            </div>
            <p className="text-xs text-slate-500">vs minggu lalu</p>
        </div>
    );
};

type Panel = 'visitDetails' | 'performanceSummary' | 'productAnalysis';
type ProgressFilterStatus = 'all' | 'attention' | 'completed';

const Dashboard: React.FC = () => {
    const { stores, products, sales, dailyVisitPlan } = useAppContext();
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [activePanel, setActivePanel] = useState<Panel>('visitDetails');
    const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
    const [selectedStore, setSelectedStore] = useState<Store | null>(null);
    const [calendarPopoverAnchor, setCalendarPopoverAnchor] = useState<HTMLElement | null>(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLevels, setSelectedLevels] = useState<StoreLevel[]>([]);
    const [progressFilter, setProgressFilter] = useState<ProgressFilterStatus>('all');

    const handleLevelFilter = (level: StoreLevel) => {
        setSelectedLevels(prev =>
            prev.includes(level)
                ? prev.filter(l => l !== level)
                : [...prev, level]
        );
    };

    const handleCekTargetClick = (event: React.MouseEvent<HTMLButtonElement>, store: Store) => {
        // If clicking the same button, toggle off. Otherwise, set new anchor.
        if (popoverAnchor === event.currentTarget) {
            setPopoverAnchor(null);
            setSelectedStore(null);
        } else {
            setPopoverAnchor(event.currentTarget);
            setSelectedStore(store);
        }
    };

    const handleClosePopover = () => {
        setPopoverAnchor(null);
        setSelectedStore(null);
    };

    const handleCalendarClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (calendarPopoverAnchor === event.currentTarget) {
            setCalendarPopoverAnchor(null);
        } else {
            setCalendarPopoverAnchor(event.currentTarget);
        }
    };
    
    const handleCloseCalendarPopover = () => {
        setCalendarPopoverAnchor(null);
    };

    const activeProducts = products.filter(p => p.isActive);
    const ddProducts = activeProducts.filter(p => p.type === ProductType.DD);
    const fokusProducts = activeProducts.filter(p => p.type === ProductType.Fokus);
    
    const weeklyStats = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const getWeekStart = (date: Date) => {
            const d = new Date(date);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
            const startDate = new Date(d.setDate(diff));
            startDate.setHours(0, 0, 0, 0);
            return startDate;
        };

        const weekStart = getWeekStart(today);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const lastWeekStart = new Date(weekStart);
        lastWeekStart.setDate(weekStart.getDate() - 7);
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
        lastWeekEnd.setHours(23, 59, 59, 999);

        const getStatsForPeriod = (startDate: Date, endDate: Date) => {
            const periodSales = sales.filter(sale => {
                const saleDate = new Date(sale.date);
                return saleDate >= startDate && saleDate <= endDate;
            });

            const visitedStores = new Set(periodSales.map(s => s.storeId)).size;
            
            const achievedTargets = periodSales.reduce((acc, sale) => {
                const product = products.find(p => p.id === sale.productId);
                if (product) {
                    if (product.type === ProductType.DD) {
                        acc.dd++;
                    } else if (product.type === ProductType.Fokus) {
                        acc.fokus++;
                    }
                }
                return acc;
            }, { dd: 0, fokus: 0 });

            return {
                visitedStores,
                ddAchieved: achievedTargets.dd,
                fokusAchieved: achievedTargets.fokus
            };
        };

        const thisWeek = getStatsForPeriod(weekStart, weekEnd);
        const lastWeek = getStatsForPeriod(lastWeekStart, lastWeekEnd);

        return { thisWeek, lastWeek };
    }, [sales, products]);

    const overallStats = useMemo(() => {
        const storesByLevel = stores.reduce((acc, store) => {
            if (!acc[store.level]) {
                acc[store.level] = [];
            }
            acc[store.level].push(store);
            return acc;
        }, {} as Record<StoreLevel, Store[]>);

        let ddTargetsMet = 0;
        let fokusTargetsMet = 0;

        for (const product of activeProducts) {
            let isProductTargetMet = true;
            if (!product.targetCoverage || Object.keys(product.targetCoverage).length === 0) {
                isProductTargetMet = false;
                 continue; // Skip products without defined targets
            }

            for (const levelStr in product.targetCoverage) {
                const level = levelStr as StoreLevel;
                const coveragePercent = product.targetCoverage[level] || 0;
                
                const levelStores = storesByLevel[level] || [];
                if (levelStores.length === 0) continue; 

                const requiredCount = Math.ceil(levelStores.length * (coveragePercent / 100));
                
                const achievedCount = levelStores.filter(s => 
                    sales.some(sale => sale.storeId === s.id && sale.productId === product.id)
                ).length;
                
                if (achievedCount < requiredCount) {
                    isProductTargetMet = false;
                    break;
                }
            }

            if (isProductTargetMet) {
                if (product.type === ProductType.DD) {
                    ddTargetsMet++;
                } else {
                    fokusTargetsMet++;
                }
            }
        }
        
        return {
            ddTargetsMet,
            fokusTargetsMet
        };
    }, [activeProducts, stores, sales]);
    
    const filteredStores = useMemo(() => {
        const storesForSelectedDay = selectedDay === null 
            ? stores 
            : stores.filter(store => (dailyVisitPlan[selectedDay] || []).includes(store.id));
            
        const activeProducts = products.filter(p => p.isActive);
        const ddProducts = activeProducts.filter(p => p.type === ProductType.DD);
        const fokusProducts = activeProducts.filter(p => p.type === ProductType.Fokus);

        return storesForSelectedDay.filter(store => {
            // Filter 1: Search Term
            if (searchTerm && !store.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }

            // Filter 2: Selected Levels
            if (selectedLevels.length > 0 && !selectedLevels.includes(store.level)) {
                return false;
            }

            // Filter 3: Progress Status
            if (progressFilter !== 'all') {
                const storeSales = sales.filter(s => s.storeId === store.id);
                const ddAchieved = ddProducts.filter(p => storeSales.some(s => s.productId === p.id)).length;
                const fokusAchieved = fokusProducts.filter(p => storeSales.some(s => s.productId === p.id)).length;

                const ddTotal = ddProducts.length;
                const fokusTotal = fokusProducts.length;

                if (progressFilter === 'attention') {
                    const ddProgress = ddTotal > 0 ? ddAchieved / ddTotal : 1;
                    const fokusProgress = fokusTotal > 0 ? fokusAchieved / fokusTotal : 1;
                    const needsAttention = (ddTotal > 0 && ddProgress < 0.5) || (fokusTotal > 0 && fokusProgress < 0.5);
                    if (!needsAttention) return false;
                }

                if (progressFilter === 'completed') {
                    const isCompleted = ddAchieved === ddTotal && fokusAchieved === fokusTotal;
                    if (!isCompleted) return false;
                }
            }

            return true;
        });
    }, [stores, products, sales, dailyVisitPlan, selectedDay, searchTerm, selectedLevels, progressFilter]);


    const weekDays = useMemo(() => {
        const today = new Date();
        // Adjust to Monday (1) through Sunday (7, then mapped to 0)
        const currentDay = today.getDay() === 0 ? 6 : today.getDay() - 1; 
        const monday = new Date(today);
        monday.setDate(today.getDate() - currentDay);
        
        const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        return days.map((name, index) => {
            const date = new Date(monday);
            date.setDate(monday.getDate() + index);
            return {
                dayIndex: index + 1,
                name: name,
                date: date.getDate(),
                isToday: today.toDateString() === date.toDateString(),
            };
        });
    }, []);
    
    const panelItems = [
        { id: 'visitDetails' as Panel, title: 'Detail Kunjungan', icon: <CalendarIcon />, description: 'Atur & lihat rencana harian.' },
        { id: 'performanceSummary' as Panel, title: 'Ringkasan Performa', icon: <ChartBarIcon />, description: 'Lacak progres & statistik.' },
        { id: 'productAnalysis' as Panel, title: 'Progres Target', icon: <PieChartIcon />, description: 'Pantau sisa waktu & progres target.' },
    ];

    const renderPanelContent = () => {
        switch (activePanel) {
            case 'performanceSummary':
                return (
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-lg font-bold mb-4 text-slate-300">Kinerja Mingguan</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <StatCard
                                    title="Toko Dikunjungi"
                                    value={weeklyStats.thisWeek.visitedStores}
                                    change={weeklyStats.thisWeek.visitedStores - weeklyStats.lastWeek.visitedStores}
                                />
                                <StatCard
                                    title="Target DD Tercapai"
                                    value={weeklyStats.thisWeek.ddAchieved}
                                    change={weeklyStats.thisWeek.ddAchieved - weeklyStats.lastWeek.ddAchieved}
                                />
                                <StatCard
                                    title="Target Fokus Tercapai"
                                    value={weeklyStats.thisWeek.fokusAchieved}
                                    change={weeklyStats.thisWeek.fokusAchieved - weeklyStats.lastWeek.fokusAchieved}
                                />
                            </div>
                        </div>
                         <div>
                            <h3 className="text-lg font-bold mb-4 text-slate-300">Progres Total</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-slate-900 p-6 rounded-lg">
                                    <h3 className="text-slate-400">Total Toko</h3>
                                    <p className="text-4xl font-bold">{stores.length}<span className="text-lg text-slate-300">/96</span></p>
                                </div>
                                <div className="bg-slate-900 p-6 rounded-lg">
                                    <h3 className="text-slate-400">Target Distribusi Drive Tercapai</h3>
                                    <p className="text-4xl font-bold">{overallStats.ddTargetsMet}<span className="text-lg text-slate-300">/{ddProducts.length} produk</span></p>
                                    <ProgressBar value={overallStats.ddTargetsMet} max={ddProducts.length || 1} />
                                </div>
                                <div className="bg-slate-900 p-6 rounded-lg">
                                    <h3 className="text-slate-400">Target Item Fokus Tercapai</h3>
                                    <p className="text-4xl font-bold">{overallStats.fokusTargetsMet}<span className="text-lg text-slate-300">/{fokusProducts.length} produk</span></p>
                                    <ProgressBar value={overallStats.fokusTargetsMet} max={fokusProducts.length || 1} />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'productAnalysis':
                return (
                    <div className="space-y-12">
                        <div>
                            <div className="border-b border-slate-700 pb-4 mb-4">
                                <div className="flex justify-between items-start flex-wrap gap-4">
                                    <div>
                                        <h3 className="text-2xl font-bold">Distribusi Drive</h3>
                                        <p className="text-sm text-slate-400">Target jangka pendek untuk mendorong penetrasi produk baru atau promosi. Kecepatan adalah kunci!</p>
                                    </div>
                                    <PhaseCountdown />
                                </div>
                            </div>
                            {ddProducts.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                                    {ddProducts.map(product => (
                                        <TargetProgressChart key={product.id} product={product} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-slate-900 rounded-lg">
                                   <p className="text-slate-400">Tidak ada target Distribusi Drive yang aktif.</p>
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="border-b border-slate-700 pb-2 mb-4">
                                <h3 className="text-2xl font-bold">Item Fokus</h3>
                                <p className="text-sm text-slate-400">Produk prioritas jangka panjang yang menjadi andalan. Konsistensi dan cakupan luas adalah tujuan utama.</p>
                            </div>
                            {fokusProducts.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                                    {fokusProducts.map(product => (
                                        <TargetProgressChart key={product.id} product={product} />
                                    ))}
                                </div>
                            ) : (
                                 <div className="text-center py-12 bg-slate-900 rounded-lg">
                                   <p className="text-slate-400">Tidak ada target Item Fokus yang aktif.</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'visitDetails':
            default:
                return (
                    <>
                        <div className="bg-slate-900 p-4 rounded-lg mb-8 border border-slate-800 space-y-4">
                            <div className="flex items-center gap-2 text-slate-300">
                                <FilterIcon />
                                <h4 className="text-lg font-semibold">Filter Cerdas</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="relative md:col-span-2">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <SearchIcon />
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Cari nama toko..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-md py-2 pl-10 pr-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                                    />
                                </div>
                                <div className="relative">
                                    <select
                                        value={progressFilter}
                                        onChange={e => setProgressFilter(e.target.value as ProgressFilterStatus)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-md py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition appearance-none"
                                    >
                                        <option value="all">Semua Progres</option>
                                        <option value="attention">Perlu Perhatian</option>
                                        <option value="completed">Selesai</option>
                                    </select>
                                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 items-center pt-4 mt-4 border-t border-slate-700">
                                <span className="text-sm font-medium text-slate-400 mr-2">Level Toko:</span>
                                {STORE_LEVELS.map(level => (
                                    <button
                                        key={level}
                                        onClick={() => handleLevelFilter(level)}
                                        className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${
                                        selectedLevels.includes(level)
                                            ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                    >
                                        {level}
                                    </button>
                                ))}
                                {selectedLevels.length > 0 && (
                                    <button
                                        onClick={() => setSelectedLevels([])}
                                        className="text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-slate-700"
                                        title="Reset filter level"
                                    >
                                        <XMarkIcon />
                                    </button>
                                )}
                            </div>
                        </div>


                        <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                            <h3 className="text-2xl font-bold">Rencana Kunjungan Harian</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleCalendarClick}
                                    className="p-2 bg-slate-600 text-white rounded-md hover:bg-slate-500 transition-colors"
                                    aria-label="Buka Kalender"
                                >
                                    <CalendarIcon className="w-5 h-5" />
                                </button>
                                {selectedDay !== null && (
                                    <button onClick={() => setIsPlanModalOpen(true)} className="flex items-center gap-2 bg-slate-600 text-white font-semibold py-2 px-3 rounded-md hover:bg-slate-500 transition-colors">
                                        <PencilSquareIcon />
                                        <span>Atur Rencana</span>
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                            {weekDays.map(day => {
                                const isSelected = selectedDay === day.dayIndex;
                                const storeCount = dailyVisitPlan[day.dayIndex]?.length || 0;
                                return (
                                    <button
                                        key={day.dayIndex}
                                        onClick={() => setSelectedDay(prev => prev === day.dayIndex ? null : day.dayIndex)}
                                        className={`relative p-4 rounded-lg overflow-hidden h-32 text-left transition-all duration-300 group ${
                                            isSelected ? 'bg-brand-600 border-2 border-brand-400 shadow-lg shadow-brand-500/20' :
                                            day.isToday ? 'bg-slate-700/80 border border-slate-500 ring-2 ring-slate-600' : 
                                            'bg-slate-800 border border-slate-700 hover:bg-slate-700/70 hover:border-slate-600 hover:-translate-y-1'
                                        }`}
                                    >
                                        <div className="relative z-10 flex flex-col justify-between h-full">
                                            <div>
                                                <p className="font-bold text-lg text-white">{day.name}</p>
                                                <p className={`text-sm ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>{storeCount} Toko</p>
                                            </div>
                                        </div>
                                        <p className={`absolute -bottom-2 -right-2 text-8xl font-black transition-colors duration-300 z-0 ${isSelected ? 'text-white/20' : 'text-slate-700/60 group-hover:text-slate-600/80'}`}>{day.date}</p>
                                    </button>
                                )
                            })}
                        </div>
                        
                         {filteredStores.length === 0 ? (
                            <div className="text-center py-12 bg-slate-900 rounded-lg">
                                <p className="text-slate-400">
                                    {
                                        (searchTerm || selectedLevels.length > 0 || progressFilter !== 'all')
                                        ? "Tidak ada toko yang cocok dengan kriteria filter."
                                        : selectedDay !== null
                                            ? "Tidak ada toko yang direncanakan untuk hari ini."
                                            : "Belum ada toko yang ditambahkan."
                                    }
                                </p>
                                <p className="text-slate-500">
                                    {
                                        (searchTerm || selectedLevels.length > 0 || progressFilter !== 'all')
                                        ? "Coba ubah filter Anda."
                                        : selectedDay !== null
                                            ? "Klik 'Atur Rencana' untuk menambahkan toko."
                                            : "Mulai dengan menambahkan toko di halaman 'Stores'."
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredStores.map(store => <StoreCard key={store.id} store={store} onCekTarget={handleCekTargetClick} />)}
                            </div>
                        )}
                    </>
                );
        }
    };


    return (
        <div>
            <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
            <p className="text-slate-400 mb-6">Pusat kontrol interaktif untuk memantau kinerja penjualan Anda.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                {panelItems.map(item => {
                    const isActive = activePanel === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActivePanel(item.id)}
                            className={`group relative p-4 md:p-6 rounded-xl text-left transition-all duration-300 transform focus:outline-none focus:ring-4 focus:ring-brand-500/50 overflow-hidden ${
                                isActive
                                ? 'bg-slate-800 border-2 border-brand-500 shadow-2xl shadow-brand-500/20'
                                : 'bg-slate-800 hover:bg-slate-700/70 border-2 border-slate-700 hover:-translate-y-1'
                            }`}
                        >
                            {isActive && <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-500/30 to-transparent opacity-50"></div>}

                            <div className="relative z-10">
                                <div className={`w-10 h-10 mb-4 p-2 rounded-lg transition-colors duration-300 ${isActive ? 'bg-brand-500 text-white' : 'bg-slate-700 text-brand-400 group-hover:bg-brand-500 group-hover:text-white'}`}>
                                    {item.icon}
                                </div>
                                <h3 className="font-bold text-lg text-white">{item.title}</h3>
                                <p className="text-sm text-slate-400 mt-1">{item.description}</p>
                            </div>
                        </button>
                    )
                })}
            </div>
            
            <main key={activePanel} className="bg-slate-950/50 rounded-xl p-4 sm:p-6 lg:p-8 border border-slate-800 animate-fade-in">
                {renderPanelContent()}
            </main>

            <TargetPopover
                store={selectedStore}
                anchorEl={popoverAnchor}
                onClose={handleClosePopover}
            />

            <CalendarPopover
                anchorEl={calendarPopoverAnchor}
                onClose={handleCloseCalendarPopover}
            />

            {selectedDay !== null && (
                <DailyPlanEditModal
                    isOpen={isPlanModalOpen}
                    onClose={() => setIsPlanModalOpen(false)}
                    day={selectedDay}
                    dayName={weekDays.find(d => d.dayIndex === selectedDay)?.name || ''}
                />
            )}

        </div>
    );
};

export default Dashboard;