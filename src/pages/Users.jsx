import { useEffect, useState } from 'react';
import axios from '../api/axiosConfig';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiSearch, FiPlus, FiX } from 'react-icons/fi';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'staff'
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/users', { params: { page, search } });
      setUsers(res.data.data);
      setTotalPages(Math.ceil(res.data.total / 10));
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const openModal = (user = null) => {
    setErrors({});  // clear previous errors
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        password_confirmation: '',
        role: user.role
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'staff'
      });
    }
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error for this field when user starts typing
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: undefined });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      if (editingUser) {
        await axios.put(`/users/${editingUser.id}`, formData);
        toast.success('User updated');
      } else {
        await axios.post('/users', formData);
        toast.success('User created');
      }
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      if (error.response?.status === 422 && error.response?.data?.errors) {
        setErrors(error.response.data.errors);
        // Show first error as toast for better UX
        const firstError = Object.values(error.response.data.errors)[0]?.[0];
        if (firstError) toast.error(firstError);
      } else {
        toast.error(error.response?.data?.message || 'Operation failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this user?')) {
      try {
        await axios.delete(`/users/${id}`);
        toast.success('User deleted');
        fetchUsers();
      } catch (error) {
        toast.error(error.response?.data?.error || 'Cannot delete yourself or last admin');
      }
    }
  };

  return (
    <div className="dark:bg-gray-900 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Users</h1>
        <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition">
          <FiPlus /> Add User
        </button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search User</label>
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Name or Email"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-4 py-2"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="text-center py-4 dark:text-gray-300">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="5" className="text-center py-4 dark:text-gray-300">No users found</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{user.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm capitalize text-gray-900 dark:text-gray-200">{user.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                    <button onClick={() => openModal(user)} className="text-blue-600 dark:text-blue-400"><FiEdit2 size={18} /></button>
                    <button onClick={() => handleDelete(user.id)} className="text-red-600 dark:text-red-400"><FiTrash2 size={18} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 space-x-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 dark:text-gray-300">Prev</button>
          <span className="px-3 py-1 dark:text-gray-300">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 dark:text-gray-300">Next</button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold dark:text-white">{editingUser ? 'Edit User' : 'Add User'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 dark:text-gray-400"><FiX size={24} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <input name="name" value={formData.name} onChange={handleInputChange} placeholder="Full Name" className={`w-full border rounded p-2 dark:bg-gray-700 dark:text-white ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} required />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name[0]}</p>}
                </div>
                <div>
                  <input name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="Email" className={`w-full border rounded p-2 dark:bg-gray-700 dark:text-white ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} required />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email[0]}</p>}
                </div>
                <div>
                  <input name="password" type="password" value={formData.password} onChange={handleInputChange} placeholder={editingUser ? "New password (leave blank to keep)" : "Password (min. 6 characters)"} className={`w-full border rounded p-2 dark:bg-gray-700 dark:text-white ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} required={!editingUser} />
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password[0]}</p>}
                </div>
                <div>
                  <input name="password_confirmation" type="password" value={formData.password_confirmation} onChange={handleInputChange} placeholder="Confirm Password" className={`w-full border rounded p-2 dark:bg-gray-700 dark:text-white ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} required={!editingUser} />
                </div>
                <div>
                  <select name="role" value={formData.role} onChange={handleInputChange} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded p-2">
                    <option value="admin">Admin</option>
                    <option value="staff">Staff / Cashier</option>
                  </select>
                  {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role[0]}</p>}
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded dark:text-gray-300">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;