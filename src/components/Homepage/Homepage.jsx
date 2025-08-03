"use client"
import { useState, useEffect } from "react"
import { Plus, Power, PowerOff, AlertCircle, CheckCircle, Users, Activity, TrendingUp, Droplets } from "lucide-react"
import { useNavigate } from "react-router-dom"
import Sidebar from "../Sidebar/Sidebar"
import "./Homepage.css"
// import imageSrc from '/assets/header.png'; 

const Homepage = () => {
  const [pools, setPools] = useState([])
  const [selectedPools, setSelectedPools] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newPoolName, setNewPoolName] = useState("")
  const [generatedCode, setGeneratedCode] = useState("")
  const [notification, setNotification] = useState(null)
  const [apiLoading, setApiLoading] = useState(false)
  const [userSession, setUserSession] = useState(null)
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const navigate = useNavigate()

  // API Base URL
  const API_BASE = "https://monitoring.infarm.web.id/servers/api/kolam"

  // User-specific localStorage keys
  const getUserSpecificKey = (key) => {
    return userSession?.id ? `${key}_user_${userSession.id}` : key
  }
  const POOLS_STORAGE_KEY = "kolam_pools_data"
  const LAST_SYNC_KEY = "kolam_last_sync"

  // localStorage functions with user-specific keys
  const savePoolsToStorage = (poolsData) => {
    try {
      if (userSession?.id) {
        localStorage.setItem(getUserSpecificKey(POOLS_STORAGE_KEY), JSON.stringify(poolsData))
        localStorage.setItem(getUserSpecificKey(LAST_SYNC_KEY), new Date().toISOString())
        console.log("Pools saved to localStorage for user:", userSession.id, poolsData)
      }
    } catch (error) {
      console.error("Error saving pools to localStorage:", error)
    }
  }
  const loadPoolsFromStorage = () => {
    try {
      if (userSession?.id) {
        const savedPools = localStorage.getItem(getUserSpecificKey(POOLS_STORAGE_KEY))
        if (savedPools) {
          const parsedPools = JSON.parse(savedPools)
          console.log("Pools loaded from localStorage for user:", userSession.id, parsedPools)
          return parsedPools
        }
      }
    } catch (error) {
      console.error("Error loading pools from localStorage:", error)
    }
    return []
  }
  const getLastSyncTime = () => {
    try {
      if (userSession?.id) {
        const lastSync = localStorage.getItem(getUserSpecificKey(LAST_SYNC_KEY))
        return lastSync ? new Date(lastSync) : null
      }
    } catch (error) {
      console.error("Error getting last sync time:", error)
    }
    return null
  }

  // Generate unique pool code
  const generatePoolCode = () => {
    const prefix = "KLM"
    const timestamp = Date.now().toString().slice(-6) // Last 6 digits of timestamp
    const random = Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, "0")
    return `${prefix}${timestamp}${random}`
  }

  // Get user session on component mount
  useEffect(() => {
    const session = window.userSession
    if (session) {
      setUserSession(session)
      console.log("User session found:", session)
    } else {
      console.log("No user session found")
      navigate("/")
    }
  }, [navigate])

  // Enhanced notification with animations
  const showNotification = (message, type = "success") => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  // Fetch all pools
  const fetchPools = async () => {
    if (!userSession?.id || !userSession?.token) {
      console.log("No user session or token")
      setLoading(false)
      return
    }
    // Load from localStorage first (user-specific)
    const cachedPools = loadPoolsFromStorage()
    if (cachedPools.length > 0) {
      setPools(cachedPools)
      console.log("Loaded pools from localStorage for user:", userSession.id)
    }
    try {
      setLoading(true)
      const url = `${API_BASE}/select/all?id=${userSession.id}`
      console.log("Fetching pools from API:", url)
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userSession.token}`,
        },
      })
      console.log("Response status:", response.status)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log("Pools data received from API:", data)
      if (data.status === "200 OK" && data.payload && Array.isArray(data.payload)) {
        setPools(data.payload)
        savePoolsToStorage(data.payload) // Save to localStorage
        console.log("Pools updated from API and saved to localStorage")
      } else {
        // If no pools from API, clear localStorage and set empty array
        setPools([])
        savePoolsToStorage([])
        console.log("No pools found from API, cleared localStorage")
      }
    } catch (error) {
      console.error("Error fetching pools from API:", error)
      // If API fails and no cached data, show empty state
      if (cachedPools.length === 0) {
        setPools([])
        showNotification("Tidak dapat memuat data kolam. " + error.message, "error")
      } else {
        showNotification("Menggunakan data tersimpan. " + error.message, "error")
      }
    } finally {
      setLoading(false)
    }
  }

  // Fetch pools when userSession is available
  useEffect(() => {
    if (userSession?.id) {
      fetchPools()
    }
  }, [userSession])

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedPools(pools.map((pool) => pool.id))
    } else {
      setSelectedPools([])
    }
  }

  const handleSelectPool = (poolId) => {
    setSelectedPools((prev) => (prev.includes(poolId) ? prev.filter((id) => id !== poolId) : [...prev, poolId]))
  }

  // Generate new code when form is opened
  useEffect(() => {
    if (showAddForm) {
      const newCode = generatePoolCode()
      setGeneratedCode(newCode)
    }
  }, [showAddForm])

  // Add new pool
  const handleAddPool = async () => {
    if (!newPoolName.trim()) {
      showNotification("Nama kolam harus diisi", "error")
      return
    }
    if (!userSession?.id) {
      showNotification("Session tidak valid, silakan login ulang", "error")
      return
    }
    try {
      setApiLoading(true)
      const requestData = {
        name: newPoolName.trim(),
        code: generatedCode,
        iduser: userSession.id.toString(),
        status: true,
      }
      console.log("Adding pool with data:", requestData)
      const response = await fetch(`${API_BASE}/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userSession.token}`,
        },
        body: JSON.stringify(requestData),
      })
      console.log("Add pool response status:", response.status)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log("Add pool response data:", data)
      if (data.status === "201 CREATED" && data.payload) {
        const updatedPools = [...pools, data.payload]
        setPools(updatedPools)
        savePoolsToStorage(updatedPools) // Save to localStorage
        setNewPoolName("")
        setGeneratedCode("")
        setShowAddForm(false)
        showNotification(`Kolam berhasil ditambahkan dengan kode: ${generatedCode}`)
      } else {
        throw new Error("Invalid response format")
      }
    } catch (error) {
      console.error("Error adding pool:", error)
      showNotification("Gagal menambahkan kolam: " + error.message, "error")
    } finally {
      setApiLoading(false)
    }
  }

  // Update pool status (bulk or single)
  const handleBulkStatusChange = async (activate) => {
    try {
      setApiLoading(true)
      const updatePromises = selectedPools.map(async (poolId) => {
        const pool = pools.find((p) => p.id === poolId)
        if (!pool) return null
        console.log("Updating pool status:", { code: pool.code, val: activate, id: poolId })
        const response = await fetch(`${API_BASE}/updatestatus?code=${pool.code}&val=${activate}&id=${poolId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userSession.token}`,
          },
        })
        console.log(`Update status response for ${pool.code}:`, response.status)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        console.log(`Update status response data for ${pool.code}:`, data)
        return { poolId, success: data.status === "200 OK" }
      })
      const results = await Promise.all(updatePromises)
      console.log("Bulk update results:", results)
      const successCount = results.filter((r) => r && r.success).length
      if (successCount > 0) {
        const updatedPools = pools.map((pool) =>
          selectedPools.includes(pool.id) ? { ...pool, status: activate } : pool,
        )
        setPools(updatedPools)
        savePoolsToStorage(updatedPools) // Save to localStorage
        showNotification(`${successCount} kolam berhasil ${activate ? "diaktifkan" : "dinonaktifkan"}`)
      } else {
        showNotification("Gagal mengubah status kolam", "error")
      }
      setSelectedPools([])
    } catch (error) {
      console.error("Error updating pool status:", error)
      showNotification("Gagal mengubah status kolam: " + error.message, "error")
    } finally {
      setApiLoading(false)
    }
  }

  // Handle single pool status toggle
  const handleSinglePoolToggle = async (pool) => {
    try {
      setApiLoading(true)
      const newStatus = !pool.status
      console.log("Toggling pool status:", { pool, newStatus })
      const response = await fetch(`${API_BASE}/updatestatus?code=${pool.code}&val=${newStatus}&id=${pool.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userSession.token}`,
        },
      })
      console.log("Toggle status response:", response.status)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log("Toggle status response data:", data)
      if (data.status === "200 OK") {
        const updatedPools = pools.map((p) => (p.id === pool.id ? { ...p, status: newStatus } : p))
        setPools(updatedPools)
        savePoolsToStorage(updatedPools) // Save to localStorage
        showNotification(`${pool.name || pool.code} ${newStatus ? "diaktifkan" : "dinonaktifkan"}`)
      } else {
        throw new Error("Invalid response format")
      }
    } catch (error) {
      console.error("Error toggling pool status:", error)
      showNotification("Gagal mengubah status kolam: " + error.message, "error")
    } finally {
      setApiLoading(false)
    }
  }

  const getStatusColor = (status) => {
    return status
      ? "bg-gradient-to-r from-lime-100 to-green-100 text-green-800 border border-green-200"
      : "bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200"
  }
  const getStatusText = (status) => {
    return status ? "Aktif" : "Tidak Aktif"
  }

  // Calculate stats
  const activePoolsCount = pools.filter((pool) => pool.status).length
  const inactivePoolsCount = pools.length - activePoolsCount

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lime-50 via-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center animate-fadeInUp">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-lime-200 border-t-lime-500 mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-green-400 animate-pulse mx-auto"></div>
          </div>
          <p className="text-gray-700 font-medium text-lg">Memuat data kolam...</p>
          <p className="text-gray-500 text-sm mt-2">Mohon tunggu sebentar</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 via-green-50 to-emerald-50 flex">
      {/* Sidebar */}
      {sidebarVisible && <Sidebar />}
      {/* Main Content */}
      <div className="flex-grow">
        {/* Enhanced Notification */}
        {notification && (
          <div
            className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-2xl border-l-4 animate-slideInFromRight ${
              notification.type === "success"
                ? "bg-gradient-to-r from-lime-50 to-green-50 border-lime-400 text-green-800"
                : "bg-gradient-to-r from-red-50 to-pink-50 border-red-400 text-red-800"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${notification.type === "success" ? "bg-lime-100" : "bg-red-100"}`}>
                {notification.type === "success" ? (
                  <CheckCircle size={20} className="text-green-600" />
                ) : (
                  <AlertCircle size={20} className="text-red-600" />
                )}
              </div>
              <div>
                <p className="font-semibold">{notification.message}</p>
                <p className="text-xs opacity-75 mt-1">
                  {notification.type === "success" ? "Berhasil!" : "Terjadi kesalahan"}
                </p>
              </div>
            </div>
          </div>
        )}
        {/* Loading Overlay */}
        {apiLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-2xl shadow-2xl border border-lime-200 animate-fadeInUp">
              <div className="flex items-center space-x-4">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-lime-200 border-t-lime-500"></div>
                <div>
                  <p className="text-gray-800 font-semibold">Memproses...</p>
                  <p className="text-gray-500 text-sm">Mohon tunggu sebentar</p>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Header with Background Image */}
        <div
          className="relative shadow-xl overflow-hidden bg-green-900" // Mengubah background menjadi hijau gelap
        >
          <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-8 gap-4 sm:gap-0">
              <div className="animate-slideInFromLeft">
                <h1
                  className="text-4xl font-bold text-white mb-2" // Menghapus drop-shadow dan style textShadow
                >
                  Monitoring Kolam Budidaya 🐟🫧
                </h1>
                <p
                  className="text-white text-lg" // Menghapus drop-shadow dan style textShadow
                >
                  Selamat datang, <span className="font-semibold text-white">{userSession?.username}</span>
                  <br />
                  <span className="text-sm inline-block mt-1">
                    Kelola dan pantau status kolam budidaya Anda dengan mudah
                  </span>
                  <br />
                  {getLastSyncTime() && (
                    <span className="text-xs opacity-90 inline-block mt-1">
                      Terakhir disinkronkan: {getLastSyncTime().toLocaleString("id-ID")}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto animate-slideInFromRight">
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="w-full sm:w-auto bg-white hover:bg-lime-50 text-green-700 px-6 py-3 rounded-xl flex items-center justify-center sm:justify-start gap-3 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 btn-ripple font-semibold"
                >
                  <Plus size={22} />
                  Tambah Kolam
                </button>
                <button
                  onClick={() => {
                    window.userSession = null
                    navigate("/")
                  }}
                  className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 btn-ripple font-semibold"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Stats Cards */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 -mt-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-lime-400 to-green-500 rounded-2xl p-6 text-white shadow-xl animate-fadeInUp delay-100 card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lime-100 text-sm font-medium">Total Kolam</p>
                  <p className="text-3xl font-bold">{pools.length}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <Droplets size={24} />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl p-6 text-white shadow-xl animate-fadeInUp delay-200 card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Kolam Aktif</p>
                  <p className="text-3xl font-bold">{activePoolsCount}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <Activity size={24} />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl p-6 text-white shadow-xl animate-fadeInUp delay-300 card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Tidak Aktif</p>
                  <p className="text-3xl font-bold">{inactivePoolsCount}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <PowerOff size={24} />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl p-6 text-white shadow-xl animate-fadeInUp delay-400 card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-100 text-sm font-medium">Efisiensi</p>
                  <p className="text-3xl font-bold">
                    {pools.length > 0 ? Math.round((activePoolsCount / pools.length) * 100) : 0}%
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <TrendingUp size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Add Pool Form */}
        {showAddForm && (
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 mb-8">
            <div className="bg-gradient-to-r from-lime-50 to-green-50 border-2 border-lime-200 rounded-2xl p-8 shadow-xl animate-fadeInUp">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-lime-400 p-3 rounded-xl">
                  <Plus size={24} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Tambah Kolam Baru</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Nama Kolam *</label>
                  <input
                    type="text"
                    value={newPoolName}
                    onChange={(e) => setNewPoolName(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-lime-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-lime-200 focus:border-lime-400 transition-all duration-300 bg-white"
                    placeholder="Masukkan nama kolam"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Kode Kolam (Auto Generated)</label>
                  <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-600 font-mono text-lg">
                    {generatedCode || "Kode akan digenerate otomatis"}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Kode kolam akan digenerate otomatis untuk menghindari duplikasi
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button
                  onClick={handleAddPool}
                  disabled={apiLoading || !newPoolName.trim()}
                  className="w-full sm:w-auto bg-gradient-to-r from-lime-400 to-green-500 hover:from-lime-500 hover:to-green-600 disabled:from-gray-300 disabled:to-gray-400 text-white px-8 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 btn-ripple disabled:transform-none disabled:hover:scale-100"
                >
                  {apiLoading ? "Menyimpan..." : "Simpan Kolam"}
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setNewPoolName("")
                    setGeneratedCode("")
                  }}
                  className="w-full sm:w-auto bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white px-8 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pb-8">
          {/* Bulk Actions */}
          {selectedPools.length > 0 && (
            <div className="bg-gradient-to-r from-lime-100 to-green-100 border-2 border-lime-300 rounded-2xl p-6 mb-8 shadow-lg animate-fadeInUp">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
                <div className="flex items-center gap-3">
                  <div className="bg-lime-400 p-2 rounded-lg">
                    <Users size={20} className="text-white" />
                  </div>
                  <span className="text-green-800 font-bold text-lg">{selectedPools.length} kolam dipilih</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => handleBulkStatusChange(true)}
                    disabled={apiLoading}
                    className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 text-white px-4 py-2 rounded-xl text-sm flex items-center justify-center sm:justify-start gap-2 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 btn-ripple"
                  >
                    <Power size={16} />
                    Aktifkan
                  </button>
                  <button
                    onClick={() => handleBulkStatusChange(false)}
                    disabled={apiLoading}
                    className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-300 disabled:to-gray-400 text-white px-4 py-2 rounded-xl text-sm flex items-center justify-center sm:justify-start gap-2 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 btn-ripple"
                  >
                    <PowerOff size={16} />
                    Nonaktifkan
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Pool Cards */}
          {pools.length === 0 ? (
            <div className="text-center py-16 animate-fadeInUp">
              <div className="w-32 h-32 bg-gradient-to-br from-lime-100 to-green-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                <Plus size={48} className="text-lime-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Belum ada kolam</h3>
              <p className="text-gray-600 mb-8 text-lg">Mulai dengan menambahkan kolam pertama Anda</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-lime-400 to-green-500 hover:from-lime-500 hover:to-green-600 text-white px-8 py-4 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 btn-ripple"
              >
                Tambah Kolam Pertama
              </button>
            </div>
          ) : (
            <>
              {/* Select All Checkbox */}
              <div className="bg-white rounded-2xl shadow-lg border-2 border-lime-100 mb-6 p-6 animate-fadeInUp">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedPools.length === pools.length}
                    onChange={handleSelectAll}
                    className="h-5 w-5 text-lime-500 focus:ring-lime-400 border-2 border-lime-300 rounded transition-all duration-300"
                  />
                  <span className="ml-4 text-lg font-semibold text-gray-700 group-hover:text-lime-600 transition-colors">
                    Pilih Semua Kolam ({pools.length})
                  </span>
                </label>
              </div>
              {/* Pool Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {pools.map((pool, index) => (
                  <div
                    key={pool.id}
                    className="bg-white rounded-2xl shadow-lg border-2 border-lime-100 hover:border-lime-300 transition-all duration-300 card-hover animate-fadeInUp"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <input
                            type="checkbox"
                            checked={selectedPools.includes(pool.id)}
                            onChange={() => handleSelectPool(pool.id)}
                            className="h-5 w-5 text-lime-500 focus:ring-lime-400 border-2 border-lime-300 rounded transition-all duration-300"
                          />
                          <div>
                            <h3 className="font-bold text-xl text-gray-800 mb-1">
                              {pool.name || `Kolam ${pool.code}`}
                            </h3>
                            <p className="text-lime-600 font-semibold bg-lime-50 px-3 py-1 rounded-lg text-sm border border-lime-200">
                              {pool.code}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-4 py-2 rounded-xl text-sm font-bold status-badge ${getStatusColor(pool.status)}`}
                        >
                          {getStatusText(pool.status)}
                        </span>
                      </div>
                      {/* Pool Information */}
                      <div className="bg-gray-50 rounded-xl p-4 mb-4">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500 font-medium">ID Kolam:</span>
                            <p className="text-gray-800 font-semibold">{pool.id}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 font-medium">ID User:</span>
                            <p className="text-gray-800 font-semibold">{pool.iduser || userSession?.id}</p>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-500 font-medium">Nama Kolam:</span>
                            <p className="text-gray-800 font-semibold">{pool.name || `Kolam ${pool.code}`}</p>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-500 font-medium">Kode Kolam:</span>
                            <p className="text-gray-800 font-semibold font-mono">{pool.code}</p>
                          </div>
                        </div>
                      </div>
                      {/* Action Button */}
                      <div className="w-full">
                        <button
                          onClick={() => handleSinglePoolToggle(pool)}
                          disabled={apiLoading}
                          className={`w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105 btn-ripple ${
                            pool.status
                              ? "bg-gradient-to-r from-orange-400 to-red-500 text-white hover:from-orange-500 hover:to-red-600"
                              : "bg-gradient-to-r from-lime-400 to-green-500 text-white hover:from-lime-500 hover:to-green-600"
                          }`}
                        >
                          {pool.status ? (
                            <>
                              <PowerOff size={16} className="inline mr-2" />
                              Nonaktifkan
                            </>
                          ) : (
                            <>
                              <Power size={16} className="inline mr-2" />
                              Aktifkan
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Homepage
