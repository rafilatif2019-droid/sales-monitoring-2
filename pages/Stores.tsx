

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Store, StoreLevel } from '../types';
import { STORE_LEVELS } from '../constants';
import Modal from '../components/Modal';
import { PlusIcon, UploadIcon, SearchIcon, PencilSquareIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from '../components/icons';

const StoreForm: React.FC<{
    onClose: () => void;
    storeToEdit?: Store;
}> = ({ onClose, storeToEdit }) => {
    const { addStore, updateStore } = useAppContext();
    const [name, setName] = useState('');
    const [level, setLevel] = useState<StoreLevel>(StoreLevel.Ritel);

    useEffect(() => {
        if (storeToEdit) {
            setName(storeToEdit.name);
            setLevel(storeToEdit.level);
        }
    }, [storeToEdit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) {
            alert("Nama toko tidak boleh kosong.");
            return;
        }

        if (storeToEdit) {
            updateStore({ ...storeToEdit, name, level });
        } else {
            addStore({ name, level });
        }
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300">Nama Toko</label>
                <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white"
                    required
                />
            </div>
            <div>
                <label htmlFor="level" className="block text-sm font-medium text-slate-300">Level Toko</label>
                <select
                    id="level"
                    value={level}
                    onChange={e => setLevel(e.target.value as StoreLevel)}
                    className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white"
                >
                    {STORE_LEVELS.map(lvl => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                    ))}
                </select>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-600 rounded-md hover:bg-slate-500">Batal</button>
                <button type="submit" className="px-4 py-2 bg-brand-600 rounded-md hover:bg-brand-500">{storeToEdit ? 'Update' : 'Tambah'}</button>
            </div>
        </form>
    );
};

type SortKey = keyof Store;
type SortDirection = 'ascending' | 'descending';

const Stores: React.FC = () => {
    const { stores, deleteStore, bulkAddStores } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [storeToEdit, setStoreToEdit] = useState<Store | undefined>(undefined);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLevels, setSelectedLevels] = useState<StoreLevel[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'name', direction: 'ascending' });

    const handleOpenModal = (store?: Store) => {
        setStoreToEdit(store);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setStoreToEdit(undefined);
        setIsModalOpen(false);
    };
    
    const handleImportClick = () => {
        fileInputRef.current?.click();
    };
    
    const handleLevelFilter = (level: StoreLevel) => {
        setSelectedLevels(prev => 
            prev.includes(level) 
                ? prev.filter(l => l !== level) 
                : [...prev, level]
        );
    };

    const requestSort = (key: SortKey) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedAndFilteredStores = useMemo(() => {
        let sortableItems = [...stores]
            .filter(store => {
                if (selectedLevels.length > 0 && !selectedLevels.includes(store.level)) {
                    return false;
                }
                if (searchTerm && !store.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                    return false;
                }
                return true;
            });

        sortableItems.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
        
        return sortableItems;
    }, [stores, searchTerm, selectedLevels, sortConfig]);

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (!text) {
                alert("File kosong atau tidak bisa dibaca.");
                return;
            }

            const rows = text.split('\n').map(row => row.trim()).filter(Boolean);
            const header = rows.shift()?.toLowerCase().replace(/\r/g, '');

            if (header !== 'name,level') {
                alert('Format CSV tidak valid. Header harus "name,level".');
                return;
            }

            const newStores: Omit<Store, 'id'>[] = [];
            const errorLines: number[] = [];

            const isValidStoreLevel = (level: string): level is StoreLevel => {
                return Object.values(StoreLevel).includes(level as StoreLevel);
            };
            
            rows.forEach((row, index) => {
                const [name, level] = row.split(',').map(cell => cell.trim());
                const lineNumber = index + 2;

                if (name && level && isValidStoreLevel(level)) {
                    newStores.push({ name, level });
                } else {
                    errorLines.push(lineNumber);
                }
            });

            if (newStores.length > 0) {
                bulkAddStores(newStores);
            }

            let summary = `Impor selesai. Berhasil menambahkan ${newStores.length} toko.`;
            if (errorLines.length > 0) {
                summary += `\n\n${errorLines.length} baris gagal diimpor (baris ke: ${errorLines.join(', ')}). Pastikan format level toko sudah benar.`;
            }
            alert(summary);
            
            if(event.target) {
                event.target.value = '';
            }
        };

        reader.readAsText(file);
    };

    const SortIndicator = ({ direction }: { direction: SortDirection }) => {
        const Icon = direction === 'ascending' ? ArrowUpIcon : ArrowDownIcon;
        return <Icon />;
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h2 className="text-3xl font-bold">
                    Manajemen Toko
                    <span className="text-xl font-normal text-slate-400 ml-2">({sortedAndFilteredStores.length} hasil)</span>
                </h2>
                <div className="flex gap-2">
                     <button onClick={handleImportClick} className="flex items-center gap-2 bg-slate-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-slate-500 transition-colors">
                        <UploadIcon />
                        <span>Import CSV</span>
                    </button>
                    <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-brand-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-brand-500 transition-colors">
                        <PlusIcon />
                        <span>Tambah Toko</span>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileImport} className="hidden" accept=".csv" />
                </div>
            </div>

            {/* --- Filter and Search Controls --- */}
            <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-lg mb-6 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative w-full md:w-auto md:flex-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <SearchIcon />
                    </span>
                    <input
                        type="text"
                        placeholder="Cari nama toko..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-md py-2 pl-10 pr-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                    />
                </div>
                <div className="w-full md:w-auto flex flex-wrap gap-2 items-center justify-center">
                    {STORE_LEVELS.map(level => (
                        <button
                            key={level}
                            onClick={() => handleLevelFilter(level)}
                            className={`px-3 py-1 text-sm font-semibold rounded-full transition-all duration-200 ${
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
                            className="text-sm text-slate-400 hover:text-white transition-colors"
                            title="Reset filter"
                        >
                            &#x2715;
                        </button>
                    )}
                </div>
            </div>
            
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={storeToEdit ? 'Edit Toko' : 'Tambah Toko Baru'}>
                <StoreForm onClose={handleCloseModal} storeToEdit={storeToEdit} />
            </Modal>
            
            <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                <table className="min-w-full">
                    <thead className="bg-slate-900">
                        <tr>
                            <th className="p-4 text-left text-sm font-semibold text-slate-300 tracking-wider">
                                <button onClick={() => requestSort('name')} className="flex items-center gap-2 hover:text-white transition-colors">
                                    Nama Toko
                                    {sortConfig.key === 'name' && <SortIndicator direction={sortConfig.direction} />}
                                </button>
                            </th>
                            <th className="p-4 text-left text-sm font-semibold text-slate-300 tracking-wider">
                                <button onClick={() => requestSort('level')} className="flex items-center gap-2 hover:text-white transition-colors">
                                    Level
                                    {sortConfig.key === 'level' && <SortIndicator direction={sortConfig.direction} />}
                                </button>
                            </th>
                            <th className="p-4 text-left text-sm font-semibold text-slate-300 tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                    {sortedAndFilteredStores.length > 0 ? (
                        sortedAndFilteredStores.map((store, index) => (
                            <tr key={store.id} className={`transition-colors duration-200 ${index % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/60'} hover:bg-slate-700/80`}>
                                <td className="p-4 font-medium text-white">{store.name}</td>
                                <td className="p-4 text-slate-300">{store.level}</td>
                                <td className="p-4">
                                    <div className="flex space-x-2">
                                        <button onClick={() => handleOpenModal(store)} className="text-brand-400 hover:text-brand-300 transition-colors p-2 rounded-lg hover:bg-slate-900/80" aria-label={`Edit ${store.name}`}>
                                            <PencilSquareIcon />
                                        </button>
                                        <button onClick={() => window.confirm(`Yakin ingin menghapus ${store.name}?`) && deleteStore(store.id)} className="text-red-400 hover:text-red-300 transition-colors p-2 rounded-lg hover:bg-slate-900/80" aria-label={`Hapus ${store.name}`}>
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                     ) : (
                        <tr>
                            <td colSpan={3} className="text-center p-8 text-slate-500">
                                <p className="font-semibold text-lg">Toko Tidak Ditemukan</p>
                                <p className="text-sm">Coba ubah kata kunci pencarian atau filter Anda.</p>
                            </td>
                        </tr>
                     )}
                    </tbody>
                </table>
            </div>

        </div>
    );
};

export default Stores;
