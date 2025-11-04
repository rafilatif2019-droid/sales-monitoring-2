import React, { useState, useMemo } from 'react';
import { useUsers } from '../contexts/UserContext';
import { User, UserRole } from '../types';
import Modal from '../components/Modal';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '../components/icons';

const UserForm: React.FC<{
    onClose: () => void;
    userToEdit?: User;
}> = ({ onClose, userToEdit }) => {
    const { addUser, updateUser, users } = useUsers();
    const [formData, setFormData] = useState({
        name: userToEdit?.name || '',
        nik: userToEdit?.nik || '',
        waNumber: userToEdit?.waNumber || '',
        accessCode: userToEdit?.accessCode || '',
        role: userToEdit?.role || 'user',
    });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.name || !formData.accessCode) {
            setError("Nama dan Kode Akses wajib diisi.");
            return;
        }

        if (formData.accessCode.length !== 6 || !/^\d+$/.test(formData.accessCode)) {
            setError("Kode Akses harus 6 digit angka.");
            return;
        }

        const isCodeTaken = users.some(u => u.accessCode === formData.accessCode && u.id !== userToEdit?.id);
        if (isCodeTaken) {
            setError("Kode Akses sudah digunakan user lain.");
            return;
        }

        const userData = {
            ...formData,
            role: formData.role as UserRole,
        };

        if (userToEdit) {
            updateUser({ ...userToEdit, ...userData });
        } else {
            addUser(userData);
        }
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-md text-sm">{error}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-300">Nama</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white" required />
                </div>
                <div>
                    <label htmlFor="accessCode" className="block text-sm font-medium text-slate-300">Kode Akses (6 Digit)</label>
                    <input type="text" id="accessCode" name="accessCode" value={formData.accessCode} onChange={handleChange} className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white" required maxLength={6} />
                </div>
                 <div>
                    <label htmlFor="nik" className="block text-sm font-medium text-slate-300">NIK</label>
                    <input type="text" id="nik" name="nik" value={formData.nik} onChange={handleChange} className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white" />
                </div>
                <div>
                    <label htmlFor="waNumber" className="block text-sm font-medium text-slate-300">Nomor WA</label>
                    <input type="text" id="waNumber" name="waNumber" value={formData.waNumber} onChange={handleChange} className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white" />
                </div>
                <div>
                    <label htmlFor="role" className="block text-sm font-medium text-slate-300">Role</label>
                    <select id="role" name="role" value={formData.role} onChange={handleChange} className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white">
                        <option value="user">User</option>
                        <option value="superuser">Super User</option>
                    </select>
                </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-600 rounded-md hover:bg-slate-500">Batal</button>
                <button type="submit" className="px-4 py-2 bg-brand-600 rounded-md hover:bg-brand-500">{userToEdit ? 'Update User' : 'Tambah User'}</button>
            </div>
        </form>
    );
};


const Admin: React.FC = () => {
    const { users, deleteUser } = useUsers();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | undefined>(undefined);

    const handleOpenModal = (user?: User) => {
        setUserToEdit(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setUserToEdit(undefined);
        setIsModalOpen(false);
    };

    const sortedUsers = useMemo(() => {
        return [...users].sort((a, b) => a.name.localeCompare(b.name));
    }, [users]);


    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h2 className="text-3xl font-bold">Manajemen User</h2>
                <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-brand-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-brand-500 transition-colors">
                    <PlusIcon />
                    <span>Tambah User</span>
                </button>
            </div>
            
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={userToEdit ? 'Edit User' : 'Tambah User Baru'} size="lg">
                <UserForm onClose={handleCloseModal} userToEdit={userToEdit} />
            </Modal>
            
            <div className="bg-slate-800 rounded-lg overflow-x-auto border border-slate-700">
                <table className="min-w-full">
                    <thead className="bg-slate-900">
                        <tr>
                            <th className="p-4 text-left text-sm font-semibold text-slate-300 tracking-wider">Nama</th>
                            <th className="p-4 text-left text-sm font-semibold text-slate-300 tracking-wider">Role</th>
                            <th className="p-4 text-left text-sm font-semibold text-slate-300 tracking-wider">NIK</th>
                            <th className="p-4 text-left text-sm font-semibold text-slate-300 tracking-wider">Nomor WA</th>
                            <th className="p-4 text-left text-sm font-semibold text-slate-300 tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                    {sortedUsers.map((user, index) => (
                        <tr key={user.id} className={`transition-colors duration-200 ${index % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/60'} hover:bg-slate-700/80`}>
                            <td className="p-4 font-medium text-white">{user.name}</td>
                            <td className="p-4 text-slate-300 capitalize">{user.role}</td>
                            <td className="p-4 text-slate-300">{user.nik || '-'}</td>
                            <td className="p-4 text-slate-300">{user.waNumber || '-'}</td>
                            <td className="p-4">
                                <div className="flex space-x-2">
                                    <button onClick={() => handleOpenModal(user)} className="text-brand-400 hover:text-brand-300 transition-colors p-2 rounded-lg hover:bg-slate-900/80" aria-label={`Edit ${user.name}`}>
                                        <PencilSquareIcon />
                                    </button>
                                    <button onClick={() => window.confirm(`Yakin ingin menghapus user ${user.name}?`) && deleteUser(user.id)} className="text-red-400 hover:text-red-300 transition-colors p-2 rounded-lg hover:bg-slate-900/80" aria-label={`Hapus ${user.name}`}>
                                        <TrashIcon />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Admin;
