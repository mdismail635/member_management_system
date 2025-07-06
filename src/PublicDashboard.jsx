import { useState } from 'react';
import { useAuth } from './AuthContext';
import { Users, Calculator, UserPlus, Calendar, LogOut, Menu, X, Eye, MessageCircle } from 'lucide-react';
import PublicMembersList from './components/PublicMembersList';
import PublicOrganizationAccounts from './components/PublicOrganizationAccounts';
import PublicMemberApplications from './components/PublicMemberApplications';
import PublicOrganizationEvents from './components/PublicOrganizationEvents';
import Chat from './components/Chat';

const PublicDashboard = () => {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'chat', label: 'কথাবার্তা', icon: MessageCircle, component: Chat },
    { id: 'members', label: 'সদস্য লিস্ট', icon: Users, component: PublicMembersList },
    { id: 'accounts', label: 'সংগঠন হিসাব', icon: Calculator, component: PublicOrganizationAccounts },
    { id: 'applications', label: 'নতুন সদস্য আবেদন', icon: UserPlus, component: PublicMemberApplications },
    { id: 'events', label: 'সংগঠন কার্যক্রম', icon: Calendar, component: PublicOrganizationEvents },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const renderActiveComponent = () => {
    if (activeSection === 'dashboard') {
      return (
        <div>
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">লালবাগ দক্ষিণ পাড়া যুবসমাজ সংঘ</h2>
            <p className="text-gray-300 text-lg">আমাদের সংগঠনের তথ্য দেখুন</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 cursor-pointer hover:border-cyan-500/50 transition-all duration-300 group"
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full group-hover:scale-110 transition-transform duration-300">
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-white font-medium">{item.label}</h3>
                    <div className="flex items-center space-x-1 text-gray-400 text-sm">
                      <Eye className="w-4 h-4" />
                      <span>দেখুন</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    const activeMenuItem = menuItems.find(item => item.id === activeSection);
    if (activeMenuItem) {
      const ComponentToRender = activeMenuItem.component;
      return <ComponentToRender />;
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* RGB Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-10 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full opacity-10 blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-r from-green-500 to-teal-500 rounded-full opacity-8 blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-gray-800/30 backdrop-blur-sm border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors duration-200"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div className="flex items-center space-x-3 ml-2">
                <Eye className="w-6 h-6 text-green-400" />
                <h1 className="text-xl font-bold text-white">সদস্য ড্যাশবোর্ড</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-white">
                <span className="text-sm text-gray-300">স্বাগতম, </span>
                <span className="font-medium">সদস্য</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span>লগআউট</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-64 bg-gray-800/30 backdrop-blur-sm border-r border-gray-700/50 transition-transform duration-300 ease-in-out`}>
          <nav className="mt-8 px-4">
            <button
              onClick={() => {
                setActiveSection('dashboard');
                setSidebarOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition-colors duration-200 ${
                activeSection === 'dashboard'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                  : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
              }`}
            >
              হোম
            </button>
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-left flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-colors duration-200 ${
                    activeSection === item.id
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8 relative z-10">
          {renderActiveComponent()}
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default PublicDashboard;

