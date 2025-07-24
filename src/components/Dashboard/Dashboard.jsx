"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "./Dashboard.css"

function Dashboard() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  const [isFormVisible, setIsFormVisible] = useState(true)
  const navigate = useNavigate()

  // Enhanced toast notification with animations
  const showToast = (message, type = "info") => {
    const toastElement = document.createElement("div")
    toastElement.className = `
      fixed top-4 right-4 px-6 py-4 rounded-xl shadow-2xl z-50 toast-enter
      transform transition-all duration-300 max-w-sm
      ${
        type === "error"
          ? "bg-gradient-to-r from-red-500 to-red-600 text-white"
          : type === "success"
            ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
            : "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
      }
    `

    toastElement.innerHTML = `
      <div class="flex items-center space-x-3">
        <div class="flex-shrink-0">
          ${
            type === "error"
              ? '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>'
              : type === "success"
                ? '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>'
                : '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0016 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path></svg>'
          }
        </div>
        <div class="flex-1">
          <p class="font-medium">${message}</p>
        </div>
      </div>
    `

    document.body.appendChild(toastElement)

    setTimeout(() => {
      toastElement.classList.add("toast-exit")
      setTimeout(() => {
        if (document.body.contains(toastElement)) {
          document.body.removeChild(toastElement)
        }
      }, 300)
    }, 3000)
  }

  // Form validation
  const validateForm = () => {
    const errors = {}

    if (!username.trim()) {
      errors.username = "Username harus diisi"
    } else if (username.length < 3) {
      errors.username = "Username minimal 3 karakter"
    }

    if (!password.trim()) {
      errors.password = "Password harus diisi"
    } else if (password.length < 6) {
      errors.password = "Password minimal 6 karakter"
    }

    if (!isLogin && !confirmPassword.trim()) {
      errors.confirmPassword = "Konfirmasi password harus diisi"
    } else if (!isLogin && password !== confirmPassword) {
      errors.confirmPassword = "Password tidak cocok"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle Register with validation
  const handleRegister = async () => {
    if (!validateForm()) {
      showToast("Mohon periksa kembali form Anda!", "error")
      return
    }

    setLoading(true)
    try {
      console.log("Mengirim data pendaftaran...")
      console.log("Username:", username)
      console.log("Password:", password)

      const response = await fetch("http://43.165.198.49:8089/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()
      console.log("Respon dari API:", data)

      if (response.ok && data.status !== "400 BAD_REQUEST") {
        showToast("Pendaftaran berhasil! Silakan login.", "success")
        // Reset form dan beralih ke login dengan animasi
        setUsername("")
        setPassword("")
        setConfirmPassword("")
        setFormErrors({})

        // Smooth transition to login
        setIsFormVisible(false)
        setTimeout(() => {
          setIsLogin(true)
          setIsFormVisible(true)
        }, 300)
      } else {
        if (response.status === 400 || data.status === "400 BAD_REQUEST") {
          if (data.message && data.message.includes("Username sudah digunakan")) {
            showToast("Username sudah digunakan, coba dengan yang lain.", "error")
          } else {
            showToast(data.message || "Pendaftaran gagal.", "error")
          }
        } else {
          showToast(data.message || "Pendaftaran gagal.", "error")
        }
      }
    } catch (err) {
      console.error("Terjadi kesalahan jaringan:", err)
      showToast("Terjadi kesalahan jaringan.", "error")
    } finally {
      setLoading(false)
    }
  }

  // Handle Login with validation
  const handleLogin = async () => {
    if (!validateForm()) {
      showToast("Username dan password harus diisi!", "error")
      return
    }

    setLoading(true)
    try {
      console.log("Mengirim data login...")
      console.log("Username:", username)
      console.log("Password:", password)

      const response = await fetch("http://43.165.198.49:8089/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()
      console.log("Respon dari API:", data)

      if (response.ok && data.status === "200 OK") {
        const userSession = {
          id: data.payload.id,
          username: data.payload.username,
          token: data.payload.token,
          loginTime: new Date().toISOString(),
        }

        window.userSession = userSession
        showToast("Login berhasil! Selamat datang di dashboard.", "success")

        // Smooth navigation
        setTimeout(() => {
          navigate("/homepage")
        }, 1000)

        setUsername("")
        setPassword("")
        setFormErrors({})
      } else {
        showToast(data.message || "Login gagal.", "error")
      }
    } catch (err) {
      console.error("Terjadi kesalahan jaringan:", err)
      showToast("Terjadi kesalahan jaringan.", "error")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setUsername("")
    setPassword("")
    setConfirmPassword("")
    setFormErrors({})
  }

  const toggleLoginRegister = () => {
    setIsFormVisible(false)
    setTimeout(() => {
      setIsLogin(!isLogin)
      resetForm()
      setIsFormVisible(true)
    }, 300)
  }

  // Input change handlers with validation
  const handleUsernameChange = (e) => {
    setUsername(e.target.value)
    if (formErrors.username) {
      setFormErrors((prev) => ({ ...prev, username: null }))
    }
  }

  const handlePasswordChange = (e) => {
    setPassword(e.target.value)
    if (formErrors.password) {
      setFormErrors((prev) => ({ ...prev, password: null }))
    }
  }

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value)
    if (formErrors.confirmPassword) {
      setFormErrors((prev) => ({ ...prev, confirmPassword: null }))
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating Particles */}
      <div className="floating-particle"></div>
      <div className="floating-particle"></div>
      <div className="floating-particle"></div>
      <div className="floating-particle"></div>

      {/* Background Wave */}
      <div className="absolute top-0 left-0 w-full h-full">
        <img src="/assets/wave.png" alt="" className="absolute top-0 left-0 w-full h-full object-cover opacity-40" />
        <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-emerald-50/20 to-transparent"></div>
      </div>

      <div className="flex w-full max-w-6xl items-center justify-center relative z-10">
        {/* Left Side - Illustration */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center animate-fadeInLeft">
          <div className="relative">
            <img
              src="/assets/bg.svg"
              alt={isLogin ? "Login Illustration" : "Register Illustration"}
              className="w-96 h-96 object-contain animate-bounce"
            />
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-emerald-200 rounded-full animate-pulse"></div>
            <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-green-200 rounded-full animate-pulse delay-500"></div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center animate-fadeInRight">
          <div
            className={`
            bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-md 
            border border-white/20 transition-all duration-500 animate-glow
            ${isFormVisible ? "animate-fadeInUp" : "opacity-0 transform translate-y-4"}
          `}
          >
            {/* Avatar */}
            <div className="flex justify-center mb-6 animate-fadeInUp delay-100">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center animate-pulse">
                <img src="/assets/avatar.svg" alt="User Avatar" className="w-12 h-12 object-contain" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-center text-gray-800 mb-2 animate-fadeInUp delay-200">
              {isLogin ? "WELCOME" : "DAFTAR"}
            </h1>
            <p className="text-center text-gray-600 mb-8 animate-fadeInUp delay-300">
              {isLogin ? "Silakan masuk ke akun Anda" : "Buat akun baru untuk mulai"}
            </p>

            {/* Form */}
            <div className="space-y-6">
              {/* Username Field */}
              <div className="relative animate-fadeInUp delay-400">
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={handleUsernameChange}
                  className={`
                    w-full px-4 py-4 pr-12 border rounded-xl focus:ring-2 focus:ring-emerald-500 
                    focus:border-transparent outline-none transition-all bg-gray-50/50 
                    placeholder-gray-400 input-focus-effect
                    ${formErrors.username ? "input-error" : ""}
                    ${username && !formErrors.username ? "input-success" : "border-gray-200"}
                  `}
                  disabled={loading}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    ></path>
                  </svg>
                </div>
                {formErrors.username && (
                  <p className="text-red-500 text-xs mt-1 animate-fadeInUp">{formErrors.username}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="relative animate-fadeInUp delay-500">
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={handlePasswordChange}
                  className={`
                    w-full px-4 py-4 pr-12 border rounded-xl focus:ring-2 focus:ring-emerald-500 
                    focus:border-transparent outline-none transition-all bg-gray-50/50 
                    placeholder-gray-400 input-focus-effect
                    ${formErrors.password ? "input-error" : ""}
                    ${password && !formErrors.password ? "input-success" : "border-gray-200"}
                  `}
                  disabled={loading}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 2h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    ></path>
                  </svg>
                </div>
                {formErrors.password && (
                  <p className="text-red-500 text-xs mt-1 animate-fadeInUp">{formErrors.password}</p>
                )}
              </div>

              {/* Confirm Password Field - Only for Register */}
              {!isLogin && (
                <div className="relative animate-slideInFromRight">
                  <input
                    type="password"
                    placeholder="Konfirmasi Password"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    className={`
                      w-full px-4 py-4 pr-12 border rounded-xl focus:ring-2 focus:ring-emerald-500 
                      focus:border-transparent outline-none transition-all bg-gray-50/50 
                      placeholder-gray-400 input-focus-effect
                      ${formErrors.confirmPassword ? "input-error" : ""}
                      ${confirmPassword && !formErrors.confirmPassword ? "input-success" : "border-gray-200"}
                    `}
                    disabled={loading}
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 15v2m-6 2h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      ></path>
                    </svg>
                  </div>
                  {formErrors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1 animate-fadeInUp">{formErrors.confirmPassword}</p>
                  )}
                </div>
              )}

              {/* Forgot Password - Only for Login */}
              {isLogin && (
                <div className="text-right animate-fadeInUp delay-600">
                  <button className="text-sm text-gray-500 hover:text-emerald-600 transition-colors hover:underline">
                    Forgot Password?
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={isLogin ? handleLogin : handleRegister}
                disabled={loading}
                className="
                  w-full bg-gradient-to-r from-emerald-500 to-green-600 
                  hover:from-emerald-600 hover:to-green-700 
                  disabled:from-gray-300 disabled:to-gray-400 
                  text-white font-semibold py-4 px-4 rounded-xl 
                  transition-all duration-200 flex items-center justify-center 
                  shadow-lg hover:shadow-xl transform hover:scale-[1.02] 
                  button-ripple animate-fadeInUp delay-700
                "
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {isLogin ? "LOGIN..." : "DAFTAR..."}
                  </div>
                ) : isLogin ? (
                  "LOGIN"
                ) : (
                  "DAFTAR"
                )}
              </button>

              {/* Toggle Login/Register */}
              <div className="text-center animate-fadeInUp delay-800">
                <p className="text-gray-600">
                  {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
                  <button
                    onClick={toggleLoginRegister}
                    className="text-emerald-600 hover:text-emerald-800 font-medium hover:underline transition-colors transform hover:scale-105"
                    disabled={loading}
                  >
                    {isLogin ? "Daftar Sekarang" : "Masuk Sekarang"}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
