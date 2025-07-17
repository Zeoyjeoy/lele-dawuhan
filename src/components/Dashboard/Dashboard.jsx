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
        // Login berhasil, arahkan ke homepage
        showToast("Login berhasil! Selamat datang di dashboard.", 'success');
        
        // Redirect ke halaman homepage
        navigate('/homepage');  // Redirect ke homepage jika login berhasil
        
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Masuk</h1>

          {/* Form */}
          <div className="space-y-6">
            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nama Pengguna</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Kata Sandi</label>
              <input
                type="password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                disabled={loading}
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Masuk...
                </div>
              ) : (
                'Masuk'
              )}
            </button>

            {/* Toggle Login/Register */}
            <div className="text-center">
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
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tampilkan form register
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Daftar</h1>

        {/* Form */}
        <div className="space-y-6">
          {/* Username Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nama Pengguna</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Kata Sandi</label>
            <input
              type="password"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              disabled={loading}
            />
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ulang Kata Sandi</label>
            <input
              type="password"
              placeholder="Konfirmasi password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              disabled={loading}
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Daftar...
              </div>
            ) : (
              'Daftar'
            )}
          </button>

          {/* Toggle Login/Register */}
          <div className="text-center">
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
