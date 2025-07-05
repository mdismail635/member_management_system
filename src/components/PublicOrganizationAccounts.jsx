import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Calculator, Eye, FileText, Download } from 'lucide-react';

const PublicOrganizationAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'accounts'));
      const accountsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by date (newest first)
      accountsData.sort((a, b) => new Date(b.createdAt?.toDate()) - new Date(a.createdAt?.toDate()));
      setAccounts(accountsData);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white text-lg">লোড হচ্ছে...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Eye className="w-6 h-6 text-green-400" />
        <h2 className="text-2xl font-bold text-white">সংগঠন হিসাব</h2>
      </div>

      {/* Accounts List */}
      <div className="space-y-6">
        {accounts.map((account) => (
          <div key={account.id} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-green-500/50 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">{account.title}</h3>
                <p className="text-gray-300 mb-3">{account.description}</p>
                <div className="flex items-center space-x-4 text-gray-300">
                  <span>পরিমাণ: ৳{account.amount}</span>
                  <span>•</span>
                  <span>ধরন: {account.type === 'income' ? 'আয়' : 'ব্যয়'}</span>
                </div>
              </div>
            </div>

            {/* Documents */}
            {account.documents && account.documents.length > 0 && (
              <div>
                <h4 className="text-lg font-medium text-white mb-3">সংযুক্ত নথি</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {account.documents.map((doc, index) => (
                    <div key={index} className="flex items-center space-x-3 bg-gray-700/50 rounded-lg p-3">
                      <FileText className="w-5 h-5 text-blue-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">{doc.name}</p>
                        <p className="text-gray-400 text-xs">{(doc.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-700/50">
              <p className="text-gray-400 text-sm">
                যোগ করা হয়েছে: {account.createdAt?.toDate().toLocaleDateString('bn-BD')}
              </p>
            </div>
          </div>
        ))}
      </div>

      {accounts.length === 0 && (
        <div className="text-center py-12">
          <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">কোন হিসাব পাওয়া যায়নি</p>
        </div>
      )}
    </div>
  );
};

export default PublicOrganizationAccounts;

