import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 

function Dashboard() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true); 
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate(); 

  // toast notification
  const showToast = (message, type = 'info') => {
    const toastElement = document.createElement('div');
    toastElement.className = `fixed top-4 right-4 px-4 py-2 rounded shadow-lg z-50 ${
      type === 'error' ? 'bg-red-500 text-white' : 
      type === 'success' ? 'bg-green-500 text-white' : 
      'bg-blue-500 text-white'
    }`;
    toastElement.textContent = message;
    document.body.appendChild(toastElement);
    
    setTimeout(() => {
      document.body.removeChild(toastElement);
    }, 3000);
  };

  // Fungsi untuk handle Register
  const handleRegister = async () => {
    if (!username || !password || !confirmPassword) {
      showToast('Semua field harus diisi!', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Kata sandi tidak cocok!', 'error');
      return;
    }

    setLoading(true);
    try {
      console.log('Mengirim data pendaftaran...');
      console.log('Username:', username);
      console.log('Password:', password);

      const response = await fetch("http://43.165.198.49:8089/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log('Respon dari API:', data);

      if (response.ok && data.status !== '400 BAD_REQUEST') {
        showToast("Pendaftaran berhasil! Silakan login.", 'success');
        // Reset form dan beralih ke login
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setIsLogin(true);
      } else {
        // Handle error berdasarkan response API
        if (response.status === 400 || data.status === '400 BAD_REQUEST') {
          if (data.message && data.message.includes("Username sudah digunakan")) {
            showToast("Username sudah digunakan, coba dengan yang lain.", 'error');
          } else {
            showToast(data.message || "Pendaftaran gagal.", 'error');
          }
        } else {
          showToast(data.message || "Pendaftaran gagal.", 'error');
        }
      }
    } catch (err) {
      console.error('Terjadi kesalahan jaringan:', err);
      showToast("Terjadi kesalahan jaringan.", 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk handle Login
  const handleLogin = async () => {
    if (!username || !password) {
      showToast('Username dan password harus diisi!', 'error');
      return;
    }

    setLoading(true);
    try {
      console.log('Mengirim data login...');
      console.log('Username:', username);
      console.log('Password:', password);

      const response = await fetch("http://43.165.198.49:8089/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log('Respon dari API:', data);

      if (response.ok && data.status === '200 OK') {
        // Login berhasil, simpan data user ke sessionStorage
        const userSession = {
          id: data.payload.id,
          username: data.payload.username,
          token: data.payload.token,
          loginTime: new Date().toISOString()
        };
        
        // Simpan ke memory (bisa juga pakai state management seperti Context API)
        window.userSession = userSession;
        
        showToast("Login berhasil! Selamat datang di dashboard.", 'success');
        
        // Redirect ke halaman homepage
        navigate('/homepage');
        
        // Reset form
        setUsername('');
        setPassword('');
      } else {
        showToast(data.message || "Login gagal.", 'error');
      }
    } catch (err) {
      console.error('Terjadi kesalahan jaringan:', err);
      showToast("Terjadi kesalahan jaringan.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
  };

  const toggleLoginRegister = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  // Jika sudah login, tampilkan dashboard
  if (isLogin) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Wave */}
        <div className="absolute top-0 left-0 w-full h-full">
          <img 
            src="/src/assets/wave.png" 
            alt="" 
            className="absolute top-0 left-0 w-full h-full object-cover opacity-60"
          />
          <div className="absolute top-0 left-0 w-1/2 h-full"></div>
        </div>
        
        <div className="flex w-full max-w-6xl items-center justify-center relative z-10">
          {/* Left Side - Illustration */}
          <div className="hidden lg:flex lg:w-1/2 items-center justify-center">
            <div className="relative">
              <img 
                src="/src/assets/bg.svg" 
                alt="Login Illustration" 
                className="w-96 h-96 object-contain"
              />
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full lg:w-1/2 flex items-center justify-center">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
              {/* Avatar */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                  <img 
                    src="/src/assets/avatar.svg" 
                    alt="User Avatar" 
                    className="w-12 h-12 object-contain"
                  />
                </div>
              </div>

              <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">WELCOME</h1>
              <p className="text-center text-gray-600 mb-8">Silakan masuk ke akun Anda</p>

              {/* Form */}
              <div className="space-y-6">
                {/* Username Field */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-4 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all bg-gray-50/50 placeholder-gray-400"
                    disabled={loading}
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  </div>
                </div>

                {/* Password Field */}
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-4 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all bg-gray-50/50 placeholder-gray-400"
                    disabled={loading}
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-6V9a4 4 0 00-8 0v2m12 0H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2v-6a2 2 0 00-2-2z"></path>
                    </svg>
                  </div>
                </div>

                {/* Forgot Password */}
                <div className="text-right">
                  <button className="text-sm text-gray-500 hover:text-emerald-600 transition-colors">
                    Forgot Password?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-4 px-4 rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      LOGIN...
                    </div>
                  ) : (
                    'LOGIN'
                  )}
                </button>

                {/* Toggle Login/Register */}
                <div className="text-center">
                  <p className="text-gray-600">
                    Belum punya akun?{' '}
                    <button
                      onClick={toggleLoginRegister}
                      className="text-emerald-600 hover:text-emerald-800 font-medium hover:underline transition-colors"
                      disabled={loading}
                    >
                      Daftar Sekarang
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tampilkan form register
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Wave */}
      <div className="absolute top-0 left-0 w-full h-full">
        <img 
          src="/src/assets/wave.png" 
          alt="" 
          className="absolute top-0 left-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute top-0 left-0 w-1/2 h-full"></div>
      </div>
      
      <div className="flex w-full max-w-6xl items-center justify-center relative z-10">
        {/* Left Side - Illustration */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center">
          <div className="relative">
            <img 
              src="/src/assets/bg.svg" 
              alt="Register Illustration" 
              className="w-96 h-96 object-contain"
            />
          </div>
        </div>

        {/* Right Side - Register Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
            {/* Avatar */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <img 
                  src="/src/assets/avatar.svg" 
                  alt="User Avatar" 
                  className="w-12 h-12 object-contain"
                />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">DAFTAR</h1>
            <p className="text-center text-gray-600 mb-8">Buat akun baru untuk mulai</p>

            {/* Form */}
            <div className="space-y-6">
              {/* Username Field */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-4 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all bg-gray-50/50 placeholder-gray-400"
                  disabled={loading}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
              </div>

              {/* Password Field */}
              <div className="relative">
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-4 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all bg-gray-50/50 placeholder-gray-400"
                  disabled={loading}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-6V9a4 4 0 00-8 0v2m12 0H4a2 2 0 00-2 2v6a2 2 0 002-2v-6a2 2 0 00-2-2z"></path>
                  </svg>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="relative">
                <input
                  type="password"
                  placeholder="Konfirmasi Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-4 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all bg-gray-50/50 placeholder-gray-400"
                  disabled={loading}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-4 px-4 rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    DAFTAR...
                  </div>
                ) : (
                  'DAFTAR'
                )}
              </button>

              {/* Toggle Login/Register */}
              <div className="text-center">
                <p className="text-gray-600">
                  Sudah punya akun?{' '}
                  <button
                    onClick={toggleLoginRegister}
                    className="text-emerald-600 hover:text-emerald-800 font-medium hover:underline transition-colors"
                    disabled={loading}
                  >
                    Masuk Sekarang
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;