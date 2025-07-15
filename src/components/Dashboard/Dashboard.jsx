import React, { useState } from 'react';

function Dashboard() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true); // Default ke login
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userToken, setUserToken] = useState('');
  const [loading, setLoading] = useState(false);

  // Simulasi toast notification
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

      if (response.ok && data.token) {
        // Login berhasil
        setUserToken(data.token);
        setIsLoggedIn(true);
        showToast("Login berhasil! Selamat datang di dashboard.", 'success');
        // Reset form
        setUsername('');
        setPassword('');
      } else {
        // Handle error berdasarkan response API
        if (response.status === 401 || data.status === '401 UNAUTHORIZED') {
          // Pesan error sesuai dengan API response
          showToast(data.message || "Username atau password salah.", 'error');
        } else if (response.status === 400 || data.status === '400 BAD_REQUEST') {
          // Jika username tidak ditemukan (belum register)
          showToast("Akun tidak ditemukan. Silakan daftar terlebih dahulu.", 'error');
        } else {
          showToast(data.message || "Login gagal.", 'error');
        }
      }
    } catch (err) {
      console.error('Terjadi kesalahan jaringan:', err);
      showToast("Terjadi kesalahan jaringan.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserToken('');
    setUsername('');
    setPassword('');
    showToast("Berhasil logout.", 'success');
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
  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-green-800 mb-2">Selamat Datang!</h2>
              <p className="text-green-700">Anda berhasil login ke dashboard.</p>
              <p className="text-sm text-green-600 mt-2">Token: {userToken ? userToken.substring(0, 20) + '...' : 'N/A'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Fitur 1</h3>
                <p className="text-blue-700">Deskripsi fitur pertama</p>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-800 mb-2">Fitur 2</h3>
                <p className="text-purple-700">Deskripsi fitur kedua</p>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-orange-800 mb-2">Fitur 3</h3>
                <p className="text-orange-700">Deskripsi fitur ketiga</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tampilkan form login/register
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        {/* Title */}
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          {isLogin ? 'Masuk' : 'Daftar'}
        </h1>

        {/* Form */}
        <div className="space-y-6">
          {/* Username Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Pengguna
            </label>
            <input
              type="text"
              placeholder="Masukkan username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              disabled={loading}
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kata Sandi
            </label>
            <input
              type="password"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              disabled={loading}
            />
          </div>

          {/* Confirm Password Field (Only for Register) */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ulang Kata Sandi
              </label>
              <input
                type="password"
                placeholder="Konfirmasi password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                disabled={loading}
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={isLogin ? handleLogin : handleRegister}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {isLogin ? 'Masuk...' : 'Daftar...'}
              </div>
            ) : (
              isLogin ? 'Masuk' : 'Daftar'
            )}
          </button>

          {/* Toggle Login/Register */}
          <div className="text-center">
            {isLogin ? (
              <p className="text-gray-600">
                Belum punya akun?{' '}
                <button
                  onClick={toggleLoginRegister}
                  className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                  disabled={loading}
                >
                  Daftar
                </button>
              </p>
            ) : (
              <p className="text-gray-600">
                Sudah punya akun?{' '}
                <button
                  onClick={toggleLoginRegister}
                  className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                  disabled={loading}
                >
                  Masuk
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;