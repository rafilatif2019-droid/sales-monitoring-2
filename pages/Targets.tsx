

import React, { useState, useEffect, ReactNode, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Product, ProductType, StoreLevel } from '../types';
import Modal from '../components/Modal';
import Popover from '../components/Popover';
import { PlusIcon, UploadIcon, InformationCircleIcon } from '../components/icons';
import { STORE_LEVELS } from '../constants';
import PhaseCountdown from '../components/PhaseCountdown';

const ProductForm: React.FC<{
    onClose: () => void;
    productToEdit?: Product;
}> = ({ onClose, productToEdit }) => {
    const { addProduct, updateProduct } = useAppContext();
    const [name, setName] = useState('');
    const [type, setType] = useState<ProductType>(ProductType.DD);
    const [basePrice, setBasePrice] = useState(0);
    const [image, setImage] = useState<string | undefined>(undefined);
    const [targetCoverage, setTargetCoverage] = useState<{ [key in StoreLevel]?: number }>({});

    useEffect(() => {
        if (productToEdit) {
            setName(productToEdit.name);
            setType(productToEdit.type);
            setBasePrice(productToEdit.basePrice);
            setImage(productToEdit.image);
            setTargetCoverage(productToEdit.targetCoverage || {});
        }
    }, [productToEdit]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImage(event.target?.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleCoverageChange = (level: StoreLevel, value: string) => {
        const percentage = parseInt(value, 10);
        setTargetCoverage(prev => {
            const newCoverage = { ...prev };
            if (isNaN(percentage) || value === '') {
                delete newCoverage[level];
            } else {
                newCoverage[level] = Math.max(0, Math.min(100, percentage));
            }
            return newCoverage;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || basePrice <= 0) {
            alert("Nama produk dan harga dasar harus diisi.");
            return;
        }

        const productData = { name, type, basePrice, image, targetCoverage };
        if (productToEdit) {
            updateProduct({ ...productToEdit, ...productData });
        } else {
            addProduct(productData);
        }
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div>
                <label className="block text-sm font-medium text-slate-300">Nama Produk</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-300">Tipe Target</label>
                <select value={type} onChange={e => setType(e.target.value as ProductType)} className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white">
                    <option value={ProductType.DD}>Distribusi Drive</option>
                    <option value={ProductType.Fokus}>Item Fokus</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-300">Harga Dasar</label>
                <input type="number" value={basePrice} onChange={e => setBasePrice(parseFloat(e.target.value))} className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white" required />
            </div>
             <div>
                <h4 className="text-lg font-semibold text-slate-300 mb-2 mt-4 border-t border-slate-700 pt-4">Target Cakupan (%)</h4>
                <p className="text-xs text-slate-400 mb-3">Tentukan persentase minimum toko per level yang harus mengambil produk ini.</p>
                <div className="grid grid-cols-2 gap-4">
                    {STORE_LEVELS.map(level => (
                        <div key={level}>
                            <label className="block text-sm font-medium text-slate-400 mb-1">{level}</label>
                            <div className="flex items-center">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    placeholder="-"
                                    value={targetCoverage[level] || ''}
                                    onChange={e => handleCoverageChange(level, e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-l-md p-2 text-white"
                                />
                                <span className="bg-slate-600 p-2 rounded-r-md">%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-300">Gambar Produk</label>
                <input type="file" accept="image/*" onChange={handleImageChange} className="mt-1 w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"/>
                {image && <img src={image} alt="Preview" className="mt-2 w-24 h-24 object-cover rounded-md" />}
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-700 sticky bottom-0 bg-slate-800 py-4 -mx-6 px-6">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-600 rounded-md hover:bg-slate-500">Batal</button>
                <button type="submit" className="px-4 py-2 bg-brand-600 rounded-md hover:bg-brand-500">{productToEdit ? 'Update' : 'Tambah'}</button>
            </div>
        </form>
    );
};

const ProductList: React.FC<{ products: Product[], title: string, description: string, onEdit: (p: Product) => void, onToggleStatus: (id: string) => void, headerAccessory?: ReactNode }> = ({ products, title, description, onEdit, onToggleStatus, headerAccessory }) => (
    <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-lg">
        <div className="flex justify-between items-start mb-4 flex-wrap gap-4">
            <div>
                <h3 className="text-xl font-bold">{title}</h3>
                <p className="text-sm text-slate-400">{description}</p>
            </div>
            {headerAccessory && <div>{headerAccessory}</div>}
        </div>

        {products.length === 0 ? (
            <p className="text-slate-500">Belum ada produk untuk target ini.</p>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(p => (
                <div key={p.id} className={`bg-slate-900 rounded-lg p-4 flex flex-col justify-between transition-opacity ${!p.isActive ? 'opacity-50' : ''}`}>
                    <div>
                        {p.image ? <img src={p.image} alt={p.name} className="w-full h-32 object-cover rounded-md mb-2" /> : <div className="w-full h-32 bg-slate-700 rounded-md mb-2 flex items-center justify-center text-slate-500">No Image</div>}
                        <div className="flex justify-between items-start">
                            <h4 className="font-bold">{p.name}</h4>
                            {!p.isActive && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">Nonaktif</span>}
                        </div>
                        <p className="text-sm text-slate-400 mb-2">Rp {p.basePrice.toLocaleString()}</p>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2 text-xs">
                            {Object.entries(p.targetCoverage).length > 0 ? (
                                Object.entries(p.targetCoverage).map(([level, percent]) => (
                                    <div key={level} className="flex justify-between text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                                        <span className="font-medium">{level}:</span>
                                        <span className="font-bold text-slate-300">{percent}%</span>
                                    </div>
                                ))
                            ) : (
                                <p className="col-span-2 text-slate-500 text-xs italic">Belum ada target.</p>
                            )}
                        </div>
                    </div>
                    <div className="flex space-x-2 mt-4 pt-2 border-t border-slate-800">
                        <button onClick={() => onEdit(p)} className="text-sm text-brand-400 hover:text-brand-300">Edit</button>
                        <button 
                            onClick={() => onToggleStatus(p.id)} 
                            className={`text-sm font-semibold ${p.isActive ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'}`}
                        >
                           {p.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                    </div>
                </div>
            ))}
        </div>
        )}
    </div>
);


const Targets: React.FC = () => {
    const { products, toggleProductStatus, bulkUpsertProducts } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [guideAnchorEl, setGuideAnchorEl] = useState<HTMLElement | null>(null);
    const [productToEdit, setProductToEdit] = useState<Product | undefined>(undefined);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const ddProducts = products.filter(p => p.type === ProductType.DD);
    const fokusProducts = products.filter(p => p.type === ProductType.Fokus);

    const handleOpenModal = (product?: Product) => {
        setProductToEdit(product);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setProductToEdit(undefined);
        setIsModalOpen(false);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };
    
    const handleGuideClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setGuideAnchorEl(guideAnchorEl ? null : event.currentTarget);
    };

    const handleCloseGuide = () => {
        setGuideAnchorEl(null);
    };

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
            const headerRow = rows.shift()?.toLowerCase().replace(/\r/g, '');
            const headers = headerRow?.split(',') || [];
            
            const expectedHeaders = ['name', 'baseprice', 'targetws1', 'targetws2', 'targetritell', 'targetritel', 'targetothers'];
            
            if (JSON.stringify(headers) !== JSON.stringify(expectedHeaders)) {
                alert("Format header CSV tidak sesuai. Klik ikon (?) untuk panduan format.");
                return;
            }

            const newProducts: Omit<Product, 'id' | 'isActive'>[] = [];
            const errorLines: number[] = [];
            
            rows.forEach((row, index) => {
                const values = row.split(',');
                const lineNumber = index + 2;

                if (values.length !== expectedHeaders.length) {
                    errorLines.push(lineNumber);
                    return;
                }
                
                const name = values[0].trim();
                const basePrice = parseFloat(values[1]);

                if (!name || isNaN(basePrice)) {
                    errorLines.push(lineNumber);
                    return;
                }

                const targetCoverage: { [key in StoreLevel]?: number } = {};
                const storeLevelKeys: StoreLevel[] = [StoreLevel.WS1, StoreLevel.WS2, StoreLevel.RitelL, StoreLevel.Ritel, StoreLevel.Others];
                
                values.slice(2).forEach((targetStr, i) => {
                    const percentage = parseInt(targetStr, 10);
                    if (!isNaN(percentage) && percentage >= 0 && percentage <= 100) {
                        targetCoverage[storeLevelKeys[i]] = percentage;
                    }
                });
                
                newProducts.push({
                    name,
                    type: ProductType.DD,
                    basePrice,
                    targetCoverage
                });
            });

            if (newProducts.length > 0) {
                bulkUpsertProducts(newProducts);
            }
            
            if (errorLines.length > 0) {
                alert(`Beberapa baris gagal diimpor (baris ke: ${errorLines.join(', ')}). Pastikan format angka dan jumlah kolom sudah benar.`);
            }
        };

        reader.readAsText(file);

        if(event.target) {
            event.target.value = '';
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h2 className="text-3xl font-bold">Manajemen Target Produk</h2>
                <div className="flex gap-2">
                    <button onClick={handleImportClick} className="flex items-center gap-2 bg-slate-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-slate-500 transition-colors">
                        <UploadIcon />
                        <span>Import Distribusi Drive</span>
                    </button>
                    <button onClick={handleGuideClick} className="p-2 bg-slate-600 text-white rounded-md hover:bg-slate-500 transition-colors" aria-label="Tampilkan panduan import">
                        <InformationCircleIcon />
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileImport} className="hidden" accept=".csv" />
                    <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-brand-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-brand-500 transition-colors">
                        <PlusIcon />
                        <span>Tambah Produk</span>
                    </button>
                </div>
            </div>
            
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={productToEdit ? 'Edit Produk Target' : 'Tambah Produk Target Baru'}>
                <ProductForm onClose={handleCloseModal} productToEdit={productToEdit} />
            </Modal>

            <Popover
                isOpen={Boolean(guideAnchorEl)}
                onClose={handleCloseGuide}
                anchorEl={guideAnchorEl}
                title="Panduan Import Distribusi Drive via CSV"
            >
                 <div className="prose prose-invert prose-sm text-slate-300 max-w-none">
                    <p>Untuk mengimpor beberapa produk 'Distribusi Drive' sekaligus, siapkan file CSV dengan format berikut:</p>
                    <ol>
                        <li>Baris pertama <strong>harus</strong> menjadi header dengan judul kolom yang sama persis seperti di bawah ini.</li>
                        <li>Gunakan koma (,) sebagai pemisah antar kolom.</li>
                    </ol>
                    <p className="font-bold">Header Wajib:</p>
                    <pre className="block bg-slate-900 p-2 rounded text-brand-300 overflow-x-auto">
                        <code>name,baseprice,targetws1,targetws2,targetritell,targetritel,targetothers</code>
                    </pre>
                    <p className="font-bold">Penjelasan Kolom:</p>
                    <ul>
                        <li><code>name</code>: Nama produk.</li>
                        <li><code>baseprice</code>: Harga dasar (hanya angka).</li>
                        <li><code>targetws1</code>: Target cakupan untuk level <strong>Ws 1</strong> (angka 0-100). Kosongkan jika tidak ada.</li>
                        <li><code>targetws2</code>: Target cakupan untuk <strong>Ws 2</strong>.</li>
                        <li><code>targetritell</code>: Target cakupan untuk <strong>Ritel L</strong>.</li>
                        <li><code>targetritel</code>: Target cakupan untuk <strong>Ritel</strong>.</li>
                        <li><code>targetothers</code>: Target cakupan untuk <strong>Others</strong>.</li>
                    </ul>
                     <p className="font-bold">Contoh Baris Data:</p>
                    <code className="block bg-slate-900 p-2 rounded text-brand-300">SEDAAP MIE GORENG,95000,70,60,50,40,</code>
                    <p className="mt-4 text-xs text-yellow-400"><strong>Catatan:</strong> Jika produk dengan nama yang sama sudah ada, data harga dan targetnya akan diperbarui. Jika belum ada, produk baru akan dibuat.</p>
                </div>
            </Popover>
            
            <div className="space-y-8 mt-6">
                <ProductList 
                    products={ddProducts} 
                    title="Distribusi Drive" 
                    description="Target jangka pendek (biasanya 2 mingguan) untuk mendorong penetrasi produk baru atau promosi."
                    onEdit={handleOpenModal} 
                    onToggleStatus={toggleProductStatus}
                    headerAccessory={<PhaseCountdown />}
                />
                <ProductList 
                    products={fokusProducts} 
                    title="Item Fokus" 
                    description="Produk prioritas jangka panjang yang menjadi andalan dan harus selalu tersedia di toko."
                    onEdit={handleOpenModal} 
                    onToggleStatus={toggleProductStatus} 
                />
            </div>
        </div>
    );
};

export default Targets;