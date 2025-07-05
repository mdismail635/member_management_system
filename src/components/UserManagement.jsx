import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Shield, User, Trash2, Edit, Crown } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by creation date (newest first)
      usersData.sort((a, b) => new Date(b.createdAt?.toDate()) - new Date(a.createdAt?.toDate()));
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: new Date()
      });
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const deleteUser = async (userId) => {
    if (window.confirm('আপনি কি এই ব্যবহারকারীকে মুছে ফেলতে চান?')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        fetchUsers(); // Refresh the list
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-green-500/20 text-green-300 border-green-500/30';
    }
  };

  const getRoleText = (role) => {
    switch (role) {
      case 'admin':
        return 'অ্যাডমিন';
      default:
        return 'পাবলিক';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">ব্যবহারকারী ব্যবস্থাপনা</h2>
        <div className="flex items-center space-x-2 text-gray-300">
          <Shield className="w-5 h-5" />
          <span>মোট ব্যবহারকারী: {users.length}</span>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {users.map((user) => (
          <div key={user.id} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                    {getRoleIcon(user.role)}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white">
                      {user.displayName || 'নাম নেই'}
                    </h4>
                    <p className="text-gray-300">{user.email}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm border flex items-center space-x-1 ${getRoleColor(user.role)}`}>
                    {getRoleIcon(user.role)}
                    <span>{getRoleText(user.role)}</span>
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">যোগদানের তারিখ:</p>
                    <p className="text-white">
                      {user.createdAt?.toDate().toLocaleDateString('bn-BD')}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">শেষ লগইন:</p>
                    <p className="text-white">
                      {user.lastLogin?.toDate().toLocaleDateString('bn-BD')}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">ব্যবহারকারী ID:</p>
                    <p className="text-white font-mono text-xs">{user.id}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2 ml-4">
                {user.role === 'admin' ? (
                  <button
                    onClick={() => updateUserRole(user.id, 'public')}
                    className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    <User className="w-4 h-4" />
                    <span>পাবলিক করুন</span>
                  </button>
                ) : (
                  <button
                    onClick={() => updateUserRole(user.id, 'admin')}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    <Crown className="w-4 h-4" />
                    <span>অ্যাডমিন করুন</span>
                  </button>
                )}
                
                <button
                  onClick={() => deleteUser(user.id)}
                  className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>মুছুন</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">কোন ব্যবহারকারী পাওয়া যায়নি</p>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

