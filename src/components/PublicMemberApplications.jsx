import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { UserPlus, Plus, Eye, Send, Check, X, Clock, User } from 'lucide-react';
import { useUserRole } from '../UserRoleContext';

const PublicMemberApplications = () => {
  const [applications, setApplications] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isAdmin } = useUserRole();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    bloodtype: '',
    reason: ''
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'memberApplications'));
      const applicationsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by date (newest first)
      applicationsData.sort((a, b) => new Date(b.createdAt?.toDate()) - new Date(a.createdAt?.toDate()));
      setApplications(applicationsData);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const applicationData = {
        ...formData,
        status: 'pending',
        createdAt: new Date()
      };

      await addDoc(collection(db, 'memberApplications'), applicationData);

      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        bloodtype: '',
        reason: ''
      });
      setShowAddForm(false);
      fetchApplications();
      alert('আপনার আবেদন সফলভাবে জমা দেওয়া হয়েছে!');
    } catch (error) {
      console.error('Error saving application:', error);
      alert('আবেদন জমা দিতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      bloodtype: '',
      reason: ''
    });
    setShowAddForm(false);
  };

  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      await updateDoc(doc(db, 'memberApplications', applicationId), {
        status: newStatus,
        updatedAt: new Date()
      });
      fetchApplications();
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const handleDelete = async (applicationId) => {
    if (window.confirm('আপনি কি এই আবেদন মুছে ফেলতে চান?')) {
      try {
        await deleteDoc(doc(db, 'memberApplications', applicationId));
        fetchApplications();
      } catch (error) {
        console.error('Error deleting application:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'অনুমোদিত';
      case 'rejected':
        return 'প্রত্যাখ্যাত';
      default:
        return 'অপেক্ষমাণ';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <Check className="w-4 h-4" />;
      case 'rejected':
        return <X className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Eye className="w-6 h-6 text-green-400" />
          <h2 className="text-2xl font-bold text-white">নতুন সদস্য আবেদন</h2>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white px-4 py-2 rounded-lg transition-all duration-300"
        >
          <Plus className="w-5 h-5" />
          <span>নতুন আবেদন</span>
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">নতুন সদস্য আবেদন</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="name"
                placeholder="পূর্ণ নাম"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
              />
              <input
                type="tel"
                name="phone"
                placeholder="ফোন নম্বর"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
              />
            </div>
            <input
              type="email"
              name="email"
              placeholder="ইমেইল ঠিকানা"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            />
            <input
              type="text"
              name="address"
              placeholder="ঠিকানা"
              value={formData.address}
              onChange={handleInputChange}
              required
              className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            />
            <input
              type="text"
              name="bloodtype"
              placeholder="রক্তের গ্রুপ"
              value={formData.bloodtype}
              onChange={handleInputChange}
              required
              className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            />
            <textarea
              name="reason"
              placeholder="সদস্য হতে চাওয়ার কারণ"
              value={formData.reason}
              onChange={handleInputChange}
              required
              rows="4"
              className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            />
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white px-6 py-3 rounded-lg transition-all duration-300 disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
                <span>{loading ? 'জমা দেওয়া হচ্ছে...' : 'আবেদন জমা দিন'}</span>
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

      {/* Applications List */}
      <div className="space-y-6">
        {applications.map((application) => (
          <div key={application.id} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-green-500/50 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <h3 className="text-xl font-semibold text-white">{application.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm border flex items-center space-x-1 ${getStatusColor(application.status)}`}>
                    {getStatusIcon(application.status)}
                    <span>{getStatusText(application.status)}</span>
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
                  <div>
                    <p><span className="text-gray-400">ফোন:</span> {application.phone}</p>
                    <p><span className="text-gray-400">ইমেইল:</span> {application.email}</p>
                  </div>
                  <div>
                    <p><span className="text-gray-400">ঠিকানা:</span> {application.address}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-gray-400 text-sm">কারণ:</p>
                  <p className="text-gray-300">{application.reason}</p>
                </div>
              </div>
              
              {/* Admin Controls */}
              {isAdmin() && application.status === 'pending' && (
                <div className="flex flex-col space-y-2 ml-4">
                  <button
                    onClick={() => handleStatusUpdate(application.id, 'approved')}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    <Check className="w-4 h-4" />
                    <span>অনুমোদন</span>
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(application.id, 'rejected')}
                    className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    <X className="w-4 h-4" />
                    <span>প্রত্যাখ্যান</span>
                  </button>
                </div>
              )}
              
              {/* Delete button for processed applications (admin only) */}
              {isAdmin() && application.status !== 'pending' && (
                <button
                  onClick={() => handleDelete(application.id)}
                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="pt-4 border-t border-gray-700/50">
              <p className="text-gray-400 text-sm">
                আবেদনের তারিখ: {application.createdAt?.toDate().toLocaleDateString('bn-BD')}
              </p>
            </div>
          </div>
        ))}
      </div>

      {applications.length === 0 && (
        <div className="text-center py-12">
          <UserPlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">কোন আবেদন পাওয়া যায়নি</p>
          <p className="text-gray-500">নতুন আবেদন করতে উপরের বাটনে ক্লিক করুন</p>
        </div>
      )}
    </div>
  );
};

export default PublicMemberApplications;

