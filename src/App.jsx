import { useState } from 'react';
import { AuthProvider } from './AuthContext';
import { UserRoleProvider } from './UserRoleContext';
import { useAuth } from './AuthContext';
import { useUserRole } from './UserRoleContext';
import AdminDashboard from './AdminDashboard';
import PublicDashboard from './PublicDashboard';
import { Facebook, Instagram, Github, Eye, EyeOff } from 'lucide-react';
import './App.css';

function LoginForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const { login, register, loginWithGoogle, resetPassword } = useAuth();

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
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        if (formData.password !== formData.confirmPassword) {
          alert('পাসওয়ার্ড মিলছে না');
          return;
        }
        await register(formData.email, formData.password);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Google login error:', error);
      alert(error.message);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      alert('অনুগ্রহ করে ইমেইল ঠিকানা দিন');
      return;
    }

    try {
      await resetPassword(resetEmail);
      alert('পাসওয়ার্ড রিসেট লিঙ্ক আপনার ইমেইলে পাঠানো হয়েছে');
      setShowResetModal(false);
      setResetEmail('');
    } catch (error) {
      console.error('Password reset error:', error);
      alert('পাসওয়ার্ড রিসেট করতে সমস্যা হয়েছে: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center relative overflow-hidden">
      {/* RGB Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full opacity-20 blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-r from-green-500 to-teal-500 rounded-full opacity-15 blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">লালবাগ দক্ষিণ পাড়া যুবসমাজ সংঘ</h1>
          <p className="text-gray-300">সংগঠন ব্যবস্থাপনা সিস্টেম</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex mb-8 bg-gray-800/30 backdrop-blur-sm rounded-2xl p-1">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 px-6 rounded-xl transition-all duration-300 ${
              isLogin
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 px-6 rounded-xl transition-all duration-300 ${
              !isLogin
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {/* Social Icons */}
        <div className="flex justify-center space-x-6 mb-8">
          <Facebook className="w-8 h-8 text-blue-400 hover:text-blue-300 cursor-pointer transition-colors duration-200" />
          <Instagram className="w-8 h-8 text-pink-400 hover:text-pink-300 cursor-pointer transition-colors duration-200" />
          <Github className="w-8 h-8 text-gray-400 hover:text-gray-300 cursor-pointer transition-colors duration-200" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-600/50 rounded-2xl px-6 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300"
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-600/50 rounded-2xl px-6 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {!isLogin && (
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-600/50 rounded-2xl px-6 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-semibold text-white transition-all duration-300 ${
              isLogin
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400'
                : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400'
            } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl`}
          >
            {loading ? 'লোড হচ্ছে...' : (isLogin ? 'Log In' : 'Register')}
          </button>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full bg-white hover:bg-gray-100 text-gray-800 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Google দিয়ে লগইন করুন
          </button>
        </form>

        {isLogin && (
          <div className="text-center mt-4">
            <button
              onClick={() => setShowResetModal(true)}
              className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors duration-200"
            >
              পাসওয়ার্ড ভুলে গেছেন?
            </button>
          </div>
        )}

        <div className="text-center mt-6">
          <span className="text-gray-400">Already have an account? </span>
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors duration-200"
          >
            {isLogin ? 'Register' : 'Log In'}
          </button>
        </div>

        {/* Password Reset Modal */}
        {showResetModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-semibold text-white mb-4">পাসওয়ার্ড রিসেট</h3>
              <form onSubmit={handlePasswordReset}>
                <input
                  type="email"
                  placeholder="আপনার ইমেইল ঠিকানা"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 mb-4"
                />
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white py-3 rounded-lg font-semibold transition-all duration-300"
                  >
                    রিসেট লিঙ্ক পাঠান
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetModal(false);
                      setResetEmail('');
                    }}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition-colors duration-300"
                  >
                    বাতিল
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardRouter() {
  const { user } = useAuth();
  const { userRole, loading, isAdmin } = useUserRole();

  console.log('DashboardRouter - user:', user?.email);
  console.log('DashboardRouter - userRole:', userRole);
  console.log('DashboardRouter - isAdmin():', isAdmin());
  console.log('DashboardRouter - loading:', loading);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">লোড হচ্ছে...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  // Force admin role for southparayouthsociety@gmail.com
  if (user.email === 'southparayouthsociety@gmail.com' || isAdmin()) {
    console.log('Rendering AdminDashboard');
    return <AdminDashboard />;
  } else {
    console.log('Rendering PublicDashboard');
    return <PublicDashboard />;
  }
}

function App() {
  return (
    <AuthProvider>
      <UserRoleProvider>
        <DashboardRouter />
      </UserRoleProvider>
    </AuthProvider>
  );
}

export default App;

