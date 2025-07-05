import { useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Plus, Download, Trash2, Upload, FileText, DollarSign } from 'lucide-react';

const OrganizationAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    type: 'income', // income or expense
    file: null
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'organizationAccounts'));
      const accountsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by date (newest first)
      accountsData.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB - dateA;
      });
      setAccounts(accountsData);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({
      ...prev,
      file: file
    }));
  };

  const uploadFile = async (file) => {
    if (!file) return null;
    
    const storageRef = ref(storage, `account-documents/${Date.now()}-${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let fileURL = null;
      if (formData.file) {
        fileURL = await uploadFile(formData.file);
      }

      const accountData = {
        title: formData.title,
        description: formData.description,
        amount: parseFloat(formData.amount),
        type: formData.type,
        fileURL: fileURL,
        fileName: formData.file?.name || null,
        createdAt: new Date()
      };

      await addDoc(collection(db, 'organizationAccounts'), accountData);

      setFormData({ title: '', description: '', amount: '', type: 'income', file: null });
      setShowAddForm(false);
      fetchAccounts();
    } catch (error) {
      console.error('Error saving account:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (accountId) => {
    if (window.confirm('আপনি কি এই হিসাব মুছে ফেলতে চান?')) {
      try {
        await deleteDoc(doc(db, 'organizationAccounts', accountId));
        fetchAccounts();
      } catch (error) {
        console.error('Error deleting account:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', amount: '', type: 'income', file: null });
    setShowAddForm(false);
  };

  const getTotalIncome = () => {
    return accounts
      .filter(account => account.type === 'income')
      .reduce((total, account) => total + account.amount, 0);
  };

  const getTotalExpense = () => {
    return accounts
      .filter(account => account.type === 'expense')
      .reduce((total, account) => total + account.amount, 0);
  };

  const getBalance = () => {
    return getTotalIncome() - getTotalExpense();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">সংগঠন হিসাব</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white px-4 py-2 rounded-lg transition-all duration-300"
        >
          <Plus className="w-5 h-5" />
          <span>নতুন হিসাব যোগ করুন</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-600/20 border border-green-500/30 rounded-2xl p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-500 rounded-full">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-green-300 text-sm">মোট আয়</p>
              <p className="text-2xl font-bold text-white">৳{getTotalIncome().toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-red-600/20 border border-red-500/30 rounded-2xl p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-500 rounded-full">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-red-300 text-sm">মোট খরচ</p>
              <p className="text-2xl font-bold text-white">৳{getTotalExpense().toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className={`${getBalance() >= 0 ? 'bg-blue-600/20 border-blue-500/30' : 'bg-orange-600/20 border-orange-500/30'} border rounded-2xl p-6`}>
          <div className="flex items-center space-x-3">
            <div className={`p-3 ${getBalance() >= 0 ? 'bg-blue-500' : 'bg-orange-500'} rounded-full`}>
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className={`${getBalance() >= 0 ? 'text-blue-300' : 'text-orange-300'} text-sm`}>ব্যালেন্স</p>
              <p className="text-2xl font-bold text-white">৳{getBalance().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">নতুন হিসাব যোগ করুন</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="title"
                placeholder="শিরোনাম"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              >
                <option value="income">আয়</option>
                <option value="expense">খরচ</option>
              </select>
            </div>
            <input
              type="number"
              name="amount"
              placeholder="পরিমাণ (টাকা)"
              value={formData.amount}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
            <textarea
              name="description"
              placeholder="বিবরণ"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
            <div>
              <label className="block text-gray-300 mb-2">ডকুমেন্ট আপলোড করুন (ঐচ্ছিক)</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cyan-500 file:text-white hover:file:bg-cyan-600"
              />
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white px-6 py-3 rounded-lg transition-all duration-300 disabled:opacity-50"
              >
                <Upload className="w-5 h-5" />
                <span>{loading ? 'সংরক্ষণ করা হচ্ছে...' : 'সংরক্ষণ করুন'}</span>
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors duration-300"
              >
                বাতিল
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Accounts List */}
      <div className="space-y-4">
        {accounts.map((account) => (
          <div key={account.id} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-white">{account.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    account.type === 'income' 
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    {account.type === 'income' ? 'আয়' : 'খরচ'}
                  </span>
                </div>
                <p className="text-gray-300 mb-2">{account.description}</p>
                <div className="flex items-center space-x-4">
                  <p className={`text-xl font-bold ${
                    account.type === 'income' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    ৳{account.amount.toLocaleString()}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {account.createdAt?.toDate().toLocaleDateString('bn-BD')}
                  </p>
                </div>
                {account.fileURL && (
                  <div className="mt-3">
                    <a
                      href={account.fileURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
                    >
                      <FileText className="w-4 h-4" />
                      <span>{account.fileName}</span>
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>
              <button
                onClick={() => handleDelete(account.id)}
                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {accounts.length === 0 && (
        <div className="text-center py-12">
          <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">কোন হিসাব পাওয়া যায়নি</p>
          <p className="text-gray-500">নতুন হিসাব যোগ করতে উপরের বাটনে ক্লিক করুন</p>
        </div>
      )}
    </div>
  );
};

export default OrganizationAccounts;

