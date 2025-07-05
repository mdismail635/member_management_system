import { useState, useEffect } from 'react';
import { Users, UserPlus, Clock, CheckCircle, BarChart3, RefreshCw } from 'lucide-react';
import { getMemberStatistics, bulkTransferApplications } from '../utils/memberUtils';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

const MemberStatistics = () => {
  const [statistics, setStatistics] = useState({
    totalMembers: 0,
    membersFromApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    manuallyAddedMembers: 0
  });
  const [loading, setLoading] = useState(true);
  const [bulkTransferLoading, setBulkTransferLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const stats = await getMemberStatistics();
      setStatistics(stats);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkTransfer = async () => {
    if (!window.confirm('আপনি কি সব অনুমোদিত আবেদনগুলো সদস্য তালিকায় যুক্ত করতে চান?')) {
      return;
    }

    try {
      setBulkTransferLoading(true);
      
      // Get all approved applications that haven't been transferred yet
      const approvedQuery = query(
        collection(db, 'memberApplications'),
        where('status', '==', 'approved'),
        where('transferredToMembers', '!=', true)
      );
      
      const approvedSnapshot = await getDocs(approvedQuery);
      const approvedApplications = approvedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (approvedApplications.length === 0) {
        alert('কোন অনুমোদিত আবেদন পাওয়া যায়নি যা এখনো সদস্য তালিকায় যুক্ত হয়নি।');
        return;
      }

      const results = await bulkTransferApplications(approvedApplications);
      
      let message = `বাল্ক ট্রান্সফার সম্পন্ন:\n`;
      message += `✅ সফল: ${results.successful.length}\n`;
      message += `❌ ব্যর্থ: ${results.failed.length}\n`;
      message += `⏭️ এড়িয়ে যাওয়া: ${results.skipped.length}`;
      
      if (results.failed.length > 0) {
        message += `\n\nব্যর্থ হওয়ার কারণ:\n`;
        results.failed.forEach((failure, index) => {
          message += `${index + 1}. ${failure.application.name}: ${failure.error}\n`;
        });
      }
      
      alert(message);
      
      // Refresh statistics
      await fetchStatistics();
      
    } catch (error) {
      console.error('Error in bulk transfer:', error);
      alert('বাল্ক ট্রান্সফারে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।');
    } finally {
      setBulkTransferLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = "blue" }) => {
    const colorClasses = {
      blue: "from-blue-500 to-cyan-500",
      green: "from-green-500 to-emerald-500",
      yellow: "from-yellow-500 to-orange-500",
      purple: "from-purple-500 to-pink-500",
      gray: "from-gray-500 to-slate-500"
    };

    return (
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold text-white mt-1">{value}</p>
            {subtitle && (
              <p className="text-gray-500 text-xs mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${colorClasses[color]} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">সদস্য পরিসংখ্যান</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-24"></div>
                  <div className="h-8 bg-gray-700 rounded w-16"></div>
                </div>
                <div className="w-12 h-12 bg-gray-700 rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">সদস্য পরিসংখ্যান</h2>
        <div className="flex space-x-3">
          <button
            onClick={fetchStatistics}
            disabled={loading}
            className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>রিফ্রেশ</span>
          </button>
          <button
            onClick={handleBulkTransfer}
            disabled={bulkTransferLoading || statistics.approvedApplications === 0}
            className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white px-4 py-2 rounded-lg transition-all duration-300 disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            <span>{bulkTransferLoading ? 'ট্রান্সফার করা হচ্ছে...' : 'বাল্ক ট্রান্সফার'}</span>
          </button>
        </div>
      </div>

      {lastUpdated && (
        <p className="text-gray-400 text-sm">
          সর্বশেষ আপডেট: {lastUpdated.toLocaleString('bn-BD')}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          icon={Users}
          title="মোট সদস্য"
          value={statistics.totalMembers}
          subtitle="সর্বমোট নিবন্ধিত সদস্য"
          color="blue"
        />
        
        <StatCard
          icon={UserPlus}
          title="আবেদন থেকে যুক্ত"
          value={statistics.membersFromApplications}
          subtitle="আবেদনের মাধ্যমে যুক্ত সদস্য"
          color="green"
        />
        
        <StatCard
          icon={Clock}
          title="অপেক্ষমাণ আবেদন"
          value={statistics.pendingApplications}
          subtitle="অনুমোদনের অপেক্ষায়"
          color="yellow"
        />
        
        <StatCard
          icon={CheckCircle}
          title="অনুমোদিত আবেদন"
          value={statistics.approvedApplications}
          subtitle="অনুমোদিত আবেদনসমূহ"
          color="green"
        />
        
        <StatCard
          icon={BarChart3}
          title="ম্যানুয়াল এন্ট্রি"
          value={statistics.manuallyAddedMembers}
          subtitle="সরাসরি যুক্ত করা সদস্য"
          color="purple"
        />
      </div>

      {/* Progress Overview */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">আবেদন প্রক্রিয়া অগ্রগতি</h3>
        
        <div className="space-y-4">
          {/* Pending Applications Progress */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-300">অপেক্ষমাণ আবেদন</span>
              <span className="text-gray-400">{statistics.pendingApplications}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${statistics.pendingApplications > 0 ? Math.min((statistics.pendingApplications / (statistics.pendingApplications + statistics.approvedApplications)) * 100, 100) : 0}%` 
                }}
              ></div>
            </div>
          </div>

          {/* Approved Applications Progress */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-300">অনুমোদিত আবেদন</span>
              <span className="text-gray-400">{statistics.approvedApplications}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${statistics.approvedApplications > 0 ? Math.min((statistics.approvedApplications / (statistics.pendingApplications + statistics.approvedApplications)) * 100, 100) : 0}%` 
                }}
              ></div>
            </div>
          </div>

          {/* Member Addition Rate */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-300">আবেদন থেকে সদস্য রূপান্তর হার</span>
              <span className="text-gray-400">
                {statistics.totalMembers > 0 
                  ? `${Math.round((statistics.membersFromApplications / statistics.totalMembers) * 100)}%`
                  : '0%'
                }
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${statistics.totalMembers > 0 ? (statistics.membersFromApplications / statistics.totalMembers) * 100 : 0}%` 
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">দ্রুত কার্যক্রম</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <h4 className="text-blue-300 font-medium mb-2">অটো-ট্রান্সফার সিস্টেম</h4>
            <p className="text-gray-400 text-sm mb-3">
              আবেদন অনুমোদন করলে স্বয়ংক্রিয়ভাবে সদস্য তালিকায় যুক্ত হয়
            </p>
            <div className="flex items-center space-x-2 text-green-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>সক্রিয় এবং কার্যকর</span>
            </div>
          </div>
          
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <h4 className="text-green-300 font-medium mb-2">ডুপ্লিকেট প্রতিরোধ</h4>
            <p className="text-gray-400 text-sm mb-3">
              ইমেইল ও ফোন নম্বর দিয়ে ডুপ্লিকেট এন্ট্রি প্রতিরোধ করা হয়
            </p>
            <div className="flex items-center space-x-2 text-green-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>সুরক্ষিত এবং নির্ভরযোগ্য</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberStatistics;

