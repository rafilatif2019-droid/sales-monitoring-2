

import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Settings, StoreLevel, User } from '../types';
import { STORE_LEVELS } from '../constants';
import { ArchiveBoxArrowDownIcon, ArchiveBoxArrowUpIcon, TrashIcon, UserCircleIcon, UploadIcon } from '../components/icons';

const ProfileForm: React.FC = () => {
    const { currentUser, updateCurrentUserData } = useAuth();
    const [formState, setFormState] = useState({
        name: '',
        nik: '',
        waNumber: '',
        profilePicture: '',
    });
    const [isSaved, setIsSaved] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (currentUser) {
            setFormState({
                name: currentUser.name || '',
                nik: currentUser.nik || '',
                waNumber: currentUser.waNumber || '',
                profilePicture: currentUser.profilePicture || '',
            });
        }
    }, [currentUser]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormState(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setFormState(prev => ({...prev, profilePicture: event.target?.result as string }));
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateCurrentUserData({
            name: formState.name,
            nik: formState.nik,
            waNumber: formState.waNumber,
            profilePicture: formState.profilePicture,
        });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };
    
    if (!currentUser) return null;

    return (
        <form onSubmit={handleSubmit} className="space-y-8 bg-slate-800 p-8 rounded-lg">
            <div>
                <h3 className="text-xl font-bold mb-4 border-b border-slate-700 pb-2">Profil Saya</h3>
                <p className="text-sm text-slate-400 mb-6">Kelola informasi personal dan preferensi akun Anda.</p>
            </div>
            <div className="flex items-center gap-6">
                <div className="relative w-24 h-24 rounded-full overflow-hidden bg-slate-700 flex-shrink-0">
                    {formState.profilePicture ? (
                        <img src={formState.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <UserCircleIcon className="text-slate-500" />
                    )}
                </div>
                <div>
                     <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-slate-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-slate-500 transition-colors text-sm">
                        <UploadIcon />
                        <span>Ganti Foto</span>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                    <p className="text-xs text-slate-400 mt-2">Gunakan foto PNG atau JPG, maks 1MB.</p>
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">Nama</label>
                    <input type="text" id="name" name="name" value={formState.name} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white" />
                </div>
                <div>
                    <label htmlFor="nik" className="block text-sm font-medium text-slate-300 mb-1">NIK (Nomor Induk Karyawan)</label>
                    <input type="text" id="nik" name="nik" value={formState.nik} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white" />
                </div>
                <div>
                    <label htmlFor="waNumber" className="block text-sm font-medium text-slate-300 mb-1">Nomor WhatsApp</label>
                    <input type="tel" id="waNumber" name="waNumber" value={formState.waNumber} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white" />
                </div>
             </div>
             <div className="flex justify-end items-center border-t border-slate-700 pt-6">
              {isSaved && <span className="text-green-400 mr-4 transition-opacity duration-300">Profil disimpan!</span>}
              <button type="submit" className="bg-brand-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-brand-500 transition-colors">
                  Simpan Profil
              </button>
          </div>
        </form>
    );
};


const SettingsPage: React.FC = () => {
  const { settings, updateSettings, backupData, restoreData, resetApp } = useAppContext();
  const { currentUser, logout, requestAuthorization } = useAuth();
  const [formState, setFormState] = useState<Settings>(settings);
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormState(settings);
  }, [settings]);

  const handleDiscountChange = (level: StoreLevel, value: string) => {
    const percentage = parseFloat(value) || 0;
    setFormState(prev => ({
      ...prev,
      discounts: {
        ...prev.discounts,
        [level]: percentage,
      },
    }));
  };
  
  const handleDeadlineChange = (value: string) => {
    setFormState(prev => ({
      ...prev,
      deadline: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formState);
    if(currentUser) { // Only show saved message if logged in
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    restoreData(file);
    if(event.target) {
        event.target.value = '';
    }
  };


  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Pusat Kontrol</h2>
      
      <div className="space-y-12">

        {/* Account Management */}
        <div className="bg-slate-800 p-8 rounded-lg">
           <h3 className="text-xl font-bold mb-4 border-b border-slate-700 pb-2">Akun</h3>
           {currentUser ? (
             <div className="flex justify-between items-center">
               <div>
                  <p className="text-sm text-slate-400">Anda login sebagai:</p>
                  <p className="text-lg font-semibold text-white">{currentUser.name}</p>
               </div>
               <button onClick={logout} className="bg-slate-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-slate-500 transition-colors">
                   Logout
                </button>
             </div>
           ) : (
             <div className="flex justify-between items-center">
               <div>
                  <p className="text-sm text-slate-400">Anda sedang dalam mode tamu.</p>
                  <p className="text-lg font-semibold text-white">Login untuk Menyimpan Data</p>
               </div>
               <button onClick={requestAuthorization} className="bg-brand-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-brand-500 transition-colors">
                   Otorisasi
                </button>
             </div>
           )}
        </div>
        
        {currentUser && <ProfileForm />}


        {/* Core Configuration Form */}
        <form onSubmit={handleSubmit} className="space-y-8 bg-slate-800 p-8 rounded-lg">
          <div>
            <h3 className="text-xl font-bold mb-4 border-b border-slate-700 pb-2">Konfigurasi Inti</h3>
            <p className="text-sm text-slate-400 mb-6">Atur logika bisnis utama untuk perhitungan diskon dan tenggat waktu.</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-3">Skema Diskon</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {STORE_LEVELS.map(level => (
                <div key={level}>
                  <label className="block text-sm font-medium text-slate-300 mb-1">{level}</label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      step="0.01"
                      value={formState.discounts[level]}
                      onChange={(e) => handleDiscountChange(level, e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-l-md p-2 text-white"
                    />
                    <span className="bg-slate-600 p-2 rounded-r-md">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-3">Tenggat Waktu Distribusi</h4>
            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-slate-300 mb-1">Tanggal Berakhir</label>
              <input
                type="date"
                id="deadline"
                value={formState.deadline}
                onChange={(e) => handleDeadlineChange(e.target.value)}
                className="w-full md:w-1/2 bg-slate-700 border border-slate-600 rounded-md p-2 text-white"
              />
              <p className="text-xs text-slate-400 mt-2">Notifikasi akan muncul di dashboard 7 hari sebelum tanggal ini.</p>
            </div>
          </div>
          
          <div className="flex justify-end items-center border-t border-slate-700 pt-6">
              {isSaved && <span className="text-green-400 mr-4 transition-opacity duration-300">Konfigurasi disimpan!</span>}
              <button type="submit" className="bg-brand-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-brand-500 transition-colors">
                  Simpan Konfigurasi
              </button>
          </div>
        </form>

        {/* Data Management Zone */}
        <div className="bg-slate-800/50 p-8 rounded-lg border-2 border-red-900/50">
          <h3 className="text-xl font-bold text-red-400 mb-2">Zona Manajemen Data</h3>
          <p className="text-slate-400 text-sm mb-6">Aksi di bawah ini memerlukan otorisasi dan akan memengaruhi seluruh data aplikasi Anda. Lakukan dengan hati-hati.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button onClick={backupData} className="flex flex-col items-center justify-center gap-2 bg-slate-700 text-slate-200 font-semibold py-4 px-4 rounded-md hover:bg-slate-600 transition-colors">
                  <ArchiveBoxArrowDownIcon />
                  <span>Backup Seluruh Data</span>
              </button>
              <button onClick={handleRestoreClick} className="flex flex-col items-center justify-center gap-2 bg-slate-700 text-slate-200 font-semibold py-4 px-4 rounded-md hover:bg-slate-600 transition-colors">
                  <ArchiveBoxArrowUpIcon />
                  <span>Restore Data</span>
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileRestore} className="hidden" accept=".json" />
              <button onClick={resetApp} className="flex flex-col items-center justify-center gap-2 bg-red-900/50 text-red-300 font-semibold py-4 px-4 rounded-md hover:bg-red-900/80 transition-colors">
                  <TrashIcon />
                  <span>Reset Aplikasi</span>
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;