
import React, { useState, useEffect } from 'react';
import Modal from './Modal';

interface AuthorizationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: (accessCode: string) => boolean;
}

const AuthorizationModal: React.FC<AuthorizationModalProps> = ({ isOpen, onClose, onLogin }) => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setCode('');
            setError('');
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length !== 6) {
            setError('Kode akses harus 6 digit.');
            return;
        }
        const success = onLogin(code);
        if (!success) {
            setError('Kode akses salah. Silakan coba lagi.');
            // Vibrate feedback on mobile
            if (navigator.vibrate) {
                navigator.vibrate(200);
            }
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Otorisasi Diperlukan">
            <div className="w-full max-w-sm mx-auto p-4">
                <p className="text-slate-400 text-center mb-6">Masukkan Kode Akses untuk melanjutkan dan menyimpan data.</p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="auth-code" className="sr-only">
                            Kode Akses
                        </label>
                        <input
                            id="auth-code"
                            type="password"
                            value={code}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, ''); // Only allow digits
                                if (val.length <= 6) {
                                    setCode(val);
                                    setError('');
                                }
                            }}
                            maxLength={6}
                            className="w-full bg-slate-900 border border-slate-600 rounded-md p-4 text-center text-2xl tracking-[0.5em] font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                            placeholder="------"
                            autoComplete="current-password"
                            autoFocus
                        />
                    </div>
                    {error && <p className="text-red-400 text-sm text-center -mt-2">{error}</p>}
                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-600 rounded-md hover:bg-slate-500">Batal</button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-brand-600 rounded-md hover:bg-brand-500 disabled:bg-slate-600"
                            disabled={code.length !== 6}
                        >
                            Otorisasi
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default AuthorizationModal;