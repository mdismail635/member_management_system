import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, query, where } from 'firebase/firestore';
import { UserPlus, Check, X, Clock, User, AlertCircle } from 'lucide-react';
import { useUserRole } from '../UserRoleContext';

const MemberApplications = () => {
  const [applications, setApplications] = useState([]);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transferLoading, setTransferLoading] = useState({});
  const { isAdmin } = useUserRole();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    bloodtype:'রক্তের গ্রুপ' '',
    reason: '',
    experience: ''
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

      console.log("Submitting application data:", applicationData);
      await addDoc(collection(db, 'memberApplications'), applicationData);

      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        bloodtype:'রক্তের গ্রুপ' '',
        reason: '',
        experience: ''
      });
      setShowApplicationForm(false);
      fetchApplications();
      alert('আবেদন সফলভাবে জমা দেওয়া হয়েছে!');
    } catch (error) {
      console.error('Error submitting application:', error.message);
      alert('আবেদন জমা দিতে সমস্যা হয়েছে। Firebase permissions চেক করুন অথবা পরে আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  // Check if member already exists in members collection
  const checkMemberExists = async (email, phone) => {
    try {
      // Check by email
      if (email) {
        const emailQuery = query(collection(db, 'members'), where('email', '==', email));
        const emailSnapshot = await getDocs(emailQuery);
        if (!emailSnapshot.empty) {
          return { exists: true, field: 'email' };
        }
      }

      // Check by phone
      if (phone) {
        const phoneQuery = query(collection(db, 'members'), where('phone', '==', phone));
        const phoneSnapshot = await getDocs(phoneQuery);
        if (!phoneSnapshot.empty) {
          return { exists: true, field: 'phone' };
        }
      }

      return { exists: false };
    } catch (error) {
      console.error('Error checking member existence:', error);
      return { exists: false };
    }
  };

  // Auto-transfer approved application to members list
  const transferToMembersList = async (application) => {
    try {
      setTransferLoading(prev => ({ ...prev, [application.id]: true }));

      // Check if member already exists
      const memberCheck = await checkMemberExists(application.email, application.phone);
      if (memberCheck.exists) {
        alert(`এই সদস্য ইতিমধ্যে সদস্য তালিকায় রয়েছে (${memberCheck.field === 'email' ? 'ইমেইল' : 'ফোন নম্বর'} দিয়ে)!`);
        return false;
      }

      // Create member data from application
      const memberData = {
        name: application.name,
        phone: application.phone,
        email: application.email || '',
        address: application.address || '',
        bloodtype: application.bloodtype || '',
        photoURL: null, // No photo from application
        createdAt: new Date(),
        updatedAt: new Date(),
        addedFrom: 'application', // Track source
        applicationId: application.id // Reference to original application
      };

      // Add to members collection
      await addDoc(collection(db, 'members'), memberData);
      
      console.log('Member successfully added to members list:', memberData);
      return true;
    } catch (error) {
      console.error('Error transferring to members list:', error);
      alert('সদস্য তালিকায় যুক্ত করতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।');
      return false;
    } finally {
      setTransferLoading(prev => ({ ...prev, [application.id]: false }));
    }
  };

  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      const application = applications.find(app => app.id === applicationId);
      
      if (newStatus === 'approved') {
        // Show confirmation dialog
        const confirmTransfer = window.confirm(
          `আপনি কি "${application.name}" এর আবেদন অনুমোদন করে তাকে সদস্য তালিকায় যুক্ত করতে চান?`
        );
        
        if (confirmTransfer) {
          // Transfer to members list first
          const transferSuccess = await transferToMembersList(application);
          
          if (transferSuccess) {
            // Update application status
            await updateDoc(doc(db, 'memberApplications', applicationId), {
              status: newStatus,
              updatedAt: new Date(),
              transferredToMembers: true,
              transferredAt: new Date()
            });
            
            alert(`${application.name} সফলভাবে সদস্য তালিকায় যুক্ত হয়েছে!`);
            fetchApplications();
          }
        }
      } else {
        // For rejection, just update status
        await updateDoc(doc(db, 'memberApplications', applicationId), {
          status: newStatus,
          updatedAt: new Date()
        });
        fetchApplications();
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      alert('আবেদনের স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে।');
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

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      bloodtype:'রক্তের গ্রুপ' '',
      reason: '',
      experience: ''
    });
    setShowApplicationForm(false);
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

  const pendingApplications = applications.filter(app => app.status === 'pending');
  const processedApplications = applications.filter(app => app.status !== 'pending');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">
          {isAdmin() ? 'সদস্য আবেদন ব্যবস্থাপনা' : 'লালবাগ দক্ষিণ পাড়া যুবসমাজ সংঘ'}
        </h2>
        {!isAdmin() && (
          <button
            onClick={() => setShowApplicationForm(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white px-4 py-2 rounded-lg transition-all duration-300"
          >
            <UserPlus className="w-5 h-5" />
            <span>নতুন আবেদন করুন</span>
          </button>
        )}
      </div>

      {/* Auto-transfer notification for admins */}
      {isAdmin() && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-blue-400" />
            <p className="text-blue-300 text-sm">
              <strong>নোট:</strong> আবেদন অনুমোদন করলে স্বয়ংক্রিয়ভাবে সদস্য তালিকায় যুক্ত হবে। ডুপ্লিকেট এন্ট্রি প্রতিরোধ করা হয়।
            </p>
          </div>
        </div>
      )}

      {/* Application Form */}
      {showApplicationForm && !isAdmin() && (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">সদস্যপদের জন্য আবেদন</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="name"
                placeholder="পূর্ণ নাম"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
              <input
                type="tel"
                name="phone"
                placeholder="ফোন নাম্বার"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
              <input
                type="email"
                name="email"
                placeholder="ইমেইল"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
              <input
                type="text"
                name="address"
                placeholder="ঠিকানা"
                value={formData.address}
                onChange={handleInputChange}
                required
                className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
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
            </div>
            <textarea
              name="reason"
              placeholder="কেন আপনি এই সংগঠনের সদস্য হতে চান?"
              value={formData.reason}
              onChange={handleInputChange}
              required
              rows="3"
              className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
            <textarea
              name="experience"
              placeholder="আপনার পূর্ব অভিজ্ঞতা (ঐচ্ছিক)"
              value={formData.experience}
              onChange={handleInputChange}
              rows="3"
              className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white px-6 py-3 rounded-lg transition-all duration-300 disabled:opacity-50"
              >
                <UserPlus className="w-5 h-5" />
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

      {/* Pending Applications */}
      {pendingApplications.length > 0 && isAdmin() && (
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">অপেক্ষমাণ আবেদনসমূহ</h3>
          <div className="space-y-4">
            {pendingApplications.map((application) => (
              <div key={application.id} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300">
                <div className="flex justify-between items-start flex-wrap">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-white">{application.name}</h4>
                        <p className="text-gray-300">{application.phone}</p>
                        <p className="text-gray-400 text-sm">{application.email}</p>
                        <p><span className="text-gray-400">রক্তের গ্রুপ:</span> {application.bloodtype}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm border flex items-center space-x-1 ${getStatusColor(application.status)}`}>
                        {getStatusIcon(application.status)}
                        <span>{getStatusText(application.status)}</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-gray-400 text-sm">ঠিকানা:</p>
                        <p className="text-white">{application.address}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">আবেদনের তারিখ:</p>
                        <p className="text-white">{application.createdAt?.toDate().toLocaleDateString("bn-BD")}</p>
                      </div>
                    </div>
                    <div className="mb-4">
                      <p className="text-gray-400 text-sm mb-1">সদস্য হওয়ার কারণ:</p>
                      <p className="text-white">{application.reason}</p>
                    </div>
                    {application.experience && (
                      <div className="mb-4">
                        <p className="text-gray-400 text-sm mb-1">পূর্ব অভিজ্ঞতা:</p>
                        <p className="text-white">{application.experience}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col space-y-2 ml-4 md:flex-row md:space-y-0 md:space-x-2">
                    <button
                      onClick={() => handleStatusUpdate(application.id, "approved")}
                      disabled={transferLoading[application.id]}
                      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>{transferLoading[application.id] ? 'যুক্ত করা হচ্ছে...' : 'অনুমোদন ও যুক্ত করুন'}</span>
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(application.id, "rejected")}
                      disabled={transferLoading[application.id]}
                      className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      <span>প্রত্যাখ্যান</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processed Applications */}
      {processedApplications.length > 0 && isAdmin() && (
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">প্রক্রিয়াকৃত আবেদনসমূহ</h3>
          <div className="space-y-4">
            {processedApplications.map((application) => (
              <div key={application.id} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-white">{application.name}</h4>
                        <p className="text-gray-300">{application.phone}</p>
                        <p><span className="text-gray-300">রক্তের গ্রুপ:</span> {application.bloodtype}</p>
                        
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm border flex items-center space-x-1 ${getStatusColor(application.status)}`}>
                        {getStatusIcon(application.status)}
                        <span>{getStatusText(application.status)}</span>
                      </span>
                      {application.transferredToMembers && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs">
                          সদস্য তালিকায় যুক্ত
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm">
                      আবেদনের তারিখ: {application.createdAt?.toDate().toLocaleDateString('bn-BD')}
                    </p>
                    {application.transferredAt && (
                      <p className="text-gray-400 text-sm">
                        সদস্য তালিকায় যুক্ত: {application.transferredAt?.toDate().toLocaleDateString('bn-BD')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(application.id)}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {applications.length === 0 && (
        <div className="text-center py-12">
          <UserPlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">কোন আবেদন পাওয়া যায়নি</p>
          {!isAdmin() && (
            <p className="text-gray-500">নতুন আবেদন করতে উপরের বাটনে ক্লিক করুন</p>
          )}
          {isAdmin() && (
            <p className="text-gray-500">এখনো কোন সদস্যপদের আবেদন জমা পড়েনি</p>
          )}
        </div>
      )}
    </div>
  );
};

export default MemberApplications;

