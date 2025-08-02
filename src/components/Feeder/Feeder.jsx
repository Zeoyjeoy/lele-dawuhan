"use client"
import { useState, useEffect } from "react"
import {
  ArrowLeft,
  RefreshCw,
  Clock,
  Plus,
  Calendar,
  CheckCircle,
  AlertCircle,
  User,
  Key,
  Code,
  Activity,
  TrendingUp,
  CalendarDays,
  Timer,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import Sidebar from "../Sidebar/Sidebar"
import "./Feeder.css"
import imageSrc from '/assets/header.png';

const Feeder = () => {
  const [schedules, setSchedules] = useState([])
  const [pools, setPools] = useState([])
  const [selectedPool, setSelectedPool] = useState("")
  const [userSession, setUserSession] = useState(null)
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [apiLoading, setApiLoading] = useState(false)

  // Form state
  const [newSchedule, setNewSchedule] = useState({
    date: "",
    time: "",
    code: "",
  })

  const navigate = useNavigate()

  // API Base URLs
  const SCHEDULE_API_BASE = "https://monitoring.infarm.web.id/servers/api/schedule"
  const POOL_API_BASE = "https://monitoring.infarm.web.id/servers/api/kolam"

  // User and pool-specific localStorage keys
  const getUserSpecificKey = (key) => {
    return userSession?.id ? `${key}_user_${userSession.id}` : key
  }

  const getPoolSpecificKey = (key, poolCode) => {
    return userSession?.id && poolCode ? `${key}_user_${userSession.id}_pool_${poolCode}` : key
  }

  const SCHEDULES_STORAGE_KEY = "feeder_schedules_data"
  const LAST_SYNC_KEY = "feeder_last_sync"

  // Pool-specific localStorage functions
  const saveSchedulesToStorage = (schedulesData) => {
    try {
      if (userSession?.id && selectedPool) {
        const poolSpecificKey = getPoolSpecificKey(SCHEDULES_STORAGE_KEY, selectedPool)
        const syncKey = getPoolSpecificKey(LAST_SYNC_KEY, selectedPool)
        localStorage.setItem(poolSpecificKey, JSON.stringify(schedulesData))
        localStorage.setItem(syncKey, new Date().toISOString())
        console.log(`Schedules saved to localStorage for user: ${userSession.id}, pool: ${selectedPool}`, schedulesData)
      }
    } catch (error) {
      console.error("Error saving schedules to localStorage:", error)
    }
  }

  const loadSchedulesFromStorage = () => {
    try {
      if (userSession?.id && selectedPool) {
        const poolSpecificKey = getPoolSpecificKey(SCHEDULES_STORAGE_KEY, selectedPool)
        const savedSchedules = localStorage.getItem(poolSpecificKey)
        if (savedSchedules) {
          const parsedSchedules = JSON.parse(savedSchedules)
          console.log(
            `Schedules loaded from localStorage for user: ${userSession.id}, pool: ${selectedPool}`,
            parsedSchedules,
          )
          return parsedSchedules
        }
      }
    } catch (error) {
      console.error("Error loading schedules from localStorage:", error)
    }
    return []
  }

  const getLastSyncTime = () => {
    try {
      if (userSession?.id && selectedPool) {
        const syncKey = getPoolSpecificKey(LAST_SYNC_KEY, selectedPool)
        const lastSync = localStorage.getItem(syncKey)
        return lastSync ? new Date(lastSync) : null
      }
    } catch (error) {
      console.error("Error getting last sync time:", error)
    }
    return null
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
    setTimeout(() => setNotification(null), 5000)
  }

  // Generate unique schedule code
  const generateScheduleCode = () => {
    const prefix = "FEED"
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, "0")
    return `${prefix}-${timestamp}${random}`
  }

  // Fetch available pools
  const fetchPools = async () => {
    if (!userSession?.id || !userSession?.token) return
    try {
      const response = await fetch(`${POOL_API_BASE}/select/all?id=${userSession.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userSession.token}`,
        },
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      if (data.status === "200 OK" && data.payload) {
        setPools(data.payload)
        if (data.payload.length > 0 && !selectedPool) {
          setSelectedPool(data.payload[0].code)
        }
      }
    } catch (error) {
      console.error("Error fetching pools:", error)
      showNotification("Gagal memuat data kolam: " + error.message, "error")
    }
  }

  // Load schedules from localStorage only (no API fetch)
  const loadSchedules = () => {
    if (!selectedPool || !userSession?.id) {
      console.log("Missing required data for loading schedules")
      return
    }
    setLoading(true)
    const cachedSchedules = loadSchedulesFromStorage()
    setSchedules(cachedSchedules)
    console.log(`Loaded ${cachedSchedules.length} schedules from localStorage for pool: ${selectedPool}`)
    setLoading(false)
  }

  // Add new schedule using only save endpoint
  const handleAddSchedule = async () => {
    if (!newSchedule.date || !newSchedule.time) {
      showNotification("Tanggal dan waktu harus diisi", "error")
      return
    }
    if (!selectedPool || !userSession?.id || !userSession?.token) {
      showNotification("Session tidak valid atau kolam belum dipilih", "error")
      return
    }

    try {
      setApiLoading(true)
      const scheduleDateTime = `${newSchedule.date}T${newSchedule.time}:00`
      const scheduleCode = generateScheduleCode()

      // Request data sesuai dengan format yang diharapkan backend
      const requestData = {
        code: scheduleCode,
        iduser: userSession.id.toString(),
        schedule: scheduleDateTime,
      }

      console.log(`Adding schedule for pool ${selectedPool} with data:`, requestData)

      const response = await fetch(`${SCHEDULE_API_BASE}/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userSession.token}`,
        },
        body: JSON.stringify(requestData),
      })

      console.log("Add schedule response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.log("Error response:", errorText)
        if (response.status === 403) {
          throw new Error(`Akses ditolak. Pastikan token valid dan belum expired. Status: ${response.status}`)
        }
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("Add schedule response data:", data)

      if (data.status === "201 CREATED" || data.status === "200 OK") {
        // Use the actual response data from API
        const newScheduleItem = {
          id: data.payload?.id || Date.now(),
          code: data.payload?.code || scheduleCode,
          iduser: data.payload?.iduser || userSession.id,
          schedule: data.payload?.schedule || scheduleDateTime,
          poolCode: selectedPool,
          createdAt: new Date().toISOString(), // Add timestamp for tracking
        }
        const updatedSchedules = [...schedules, newScheduleItem]
        setSchedules(updatedSchedules)
        saveSchedulesToStorage(updatedSchedules)
        setNewSchedule({ date: "", time: "", code: "" })
        setShowAddForm(false)
        showNotification(
          `Jadwal pakan berhasil ditambahkan untuk kolam ${selectedPool} pada ${new Date(scheduleDateTime).toLocaleString("id-ID")}`,
        )
      } else {
        throw new Error("Invalid response format")
      }
    } catch (error) {
      console.error("Error adding schedule:", error)
      showNotification(`Gagal menambahkan jadwal untuk kolam ${selectedPool}: ${error.message}`, "error")
    } finally {
      setApiLoading(false)
    }
  }

  // Delete schedule function (remove from localStorage)
  const handleDeleteSchedule = (scheduleId) => {
    const updatedSchedules = schedules.filter((schedule) => schedule.id !== scheduleId)
    setSchedules(updatedSchedules)
    saveSchedulesToStorage(updatedSchedules)
    showNotification("Jadwal berhasil dihapus", "success")
  }

  // Get schedule status
  const getScheduleStatus = (scheduleTime) => {
    const now = new Date()
    const schedule = new Date(scheduleTime)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const scheduleDate = new Date(schedule.getFullYear(), schedule.getMonth(), schedule.getDate())

    if (schedule < now) {
      return { status: "completed", text: "Selesai", color: "bg-gray-100 text-gray-600 border-gray-200" }
    } else if (scheduleDate.getTime() === today.getTime()) {
      return { status: "today", text: "Hari Ini", color: "bg-blue-100 text-blue-600 border-blue-200" }
    } else {
      return { status: "upcoming", text: "Akan Datang", color: "bg-green-100 text-green-600 border-green-200" }
    }
  }

  // Calculate statistics
  const calculateStats = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const todaySchedules = schedules.filter((schedule) => {
      const scheduleDate = new Date(schedule.schedule)
      const scheduleDateOnly = new Date(scheduleDate.getFullYear(), scheduleDate.getMonth(), scheduleDate.getDate())
      return scheduleDateOnly.getTime() === today.getTime()
    })

    const weekSchedules = schedules.filter((schedule) => {
      const scheduleDate = new Date(schedule.schedule)
      return scheduleDate >= now && scheduleDate <= weekFromNow
    })

    const upcomingSchedules = schedules.filter((schedule) => {
      const scheduleDate = new Date(schedule.schedule)
      return scheduleDate > now
    })

    return {
      total: schedules.length,
      today: todaySchedules.length,
      week: weekSchedules.length,
      upcoming: upcomingSchedules.length,
    }
  }

  // Load data when userSession and selectedPool are available
  useEffect(() => {
    if (userSession?.id) {
      fetchPools()
    }
  }, [userSession])

  useEffect(() => {
    if (userSession?.id && selectedPool) {
      loadSchedules()
    }
  }, [userSession, selectedPool])

  const selectedPoolData = pools.find((pool) => pool.code === selectedPool)
  const stats = calculateStats()

  if (loading && schedules.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lime-50 via-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center animate-fadeInUp">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-lime-200 border-t-lime-500 mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-green-400 animate-pulse mx-auto"></div>
          </div>
          <p className="text-gray-700 font-medium text-lg">Memuat jadwal pakan...</p>
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
            className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-2xl border-l-4 animate-slideInFromRight max-w-md ${
              notification.type === "success"
                ? "bg-gradient-to-r from-lime-50 to-green-50 border-lime-400 text-green-800"
                : notification.type === "warning"
                  ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-400 text-yellow-800"
                  : notification.type === "info"
                    ? "bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-400 text-blue-800"
                    : "bg-gradient-to-r from-red-50 to-pink-50 border-red-400 text-red-800"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full ${
                  notification.type === "success"
                    ? "bg-lime-100"
                    : notification.type === "warning"
                      ? "bg-yellow-100"
                      : notification.type === "info"
                        ? "bg-blue-100"
                        : "bg-red-100"
                }`}
              >
                {notification.type === "success" ? (
                  <CheckCircle size={20} className="text-green-600" />
                ) : (
                  <AlertCircle
                    size={20}
                    className={
                      notification.type === "warning"
                        ? "text-yellow-600"
                        : notification.type === "info"
                          ? "text-blue-600"
                          : "text-red-600"
                    }
                  />
                )}
              </div>
              <div>
                <p className="font-semibold text-sm">{notification.message}</p>
                <p className="text-xs opacity-75 mt-1">
                  {notification.type === "success"
                    ? "Berhasil!"
                    : notification.type === "warning"
                      ? "Peringatan"
                      : notification.type === "info"
                        ? "Informasi"
                        : "Terjadi kesalahan"}
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

        {/* Header */}
        <div
          className="shadow-xl relative overflow-hidden"
          style={{
            backgroundImage: `url(${imageSrc})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
            <div className="flex justify-between items-center py-8">
              <div className="flex items-center gap-6 animate-slideInFromLeft">
                <button
                  onClick={() => navigate("/homepage")}
                  className="p-3 hover:bg-white/20 rounded-xl transition-all duration-300 transform hover:scale-110"
                >
                  <ArrowLeft size={24} className="text-white" />
                </button>
                <div>
                  <h1
                    className="text-4xl font-bold text-white mb-2 drop-shadow-2xl flex items-center gap-3"
                    style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5)" }}
                  >
                    <Clock size={36} />
                    Jadwal Pemberian Pakan
                  </h1>
                  <p className="text-white text-lg bg-black/20 px-3 py-1 rounded-lg backdrop-blur-sm inline-block mt-1">
                    Kelola jadwal pemberian pakan otomatis untuk kolam budidaya
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 animate-slideInFromRight">
                {/* Pool Selector */}
                <select
                  value={selectedPool}
                  onChange={(e) => setSelectedPool(e.target.value)}
                  className="px-4 py-3 border-2 border-white/30 rounded-xl focus:outline-none focus:ring-4 focus:ring-white/20 focus:border-white/50 bg-white/90 backdrop-blur-sm font-semibold text-gray-700 transition-all duration-300"
                >
                  <option value="">Pilih Kolam</option>
                  {pools.map((pool) => (
                    <option key={pool.id} value={pool.code}>
                      {pool.code} - {pool.name || `Kolam ${pool.code}`}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="bg-white hover:bg-lime-50 text-green-700 px-6 py-3 rounded-xl flex items-center gap-3 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 btn-ripple font-semibold"
                >
                  <Plus size={22} />
                  Tambah Jadwal
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* User Information Card */}
        {userSession && selectedPoolData && (
          <div className="max-w-7xl mx-auto px-6 lg:px-8 -mt-4 relative z-10">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl shadow-xl border-2 border-blue-200 p-6 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-blue-500 p-3 rounded-xl">
                  <Activity size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Informasi Sistem Pakan Otomatis</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <User size={16} className="text-blue-500" />
                    <span className="text-sm font-semibold text-gray-600">Username</span>
                  </div>
                  <p className="font-bold text-gray-800">{userSession.username}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Key size={16} className="text-blue-500" />
                    <span className="text-sm font-semibold text-gray-600">User ID</span>
                  </div>
                  <p className="font-bold text-gray-800">{userSession.id}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Code size={16} className="text-blue-500" />
                    <span className="text-sm font-semibold text-gray-600">Kode Kolam</span>
                  </div>
                  <p className="font-bold text-gray-800">{selectedPool}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Timer size={16} className="text-blue-500" />
                    <span className="text-sm font-semibold text-gray-600">Last Update</span>
                  </div>
                  <p className="font-bold text-gray-800 text-xs">
                    {getLastSyncTime() ? getLastSyncTime().toLocaleTimeString("id-ID") : "Belum ada data"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-lime-400 to-green-500 rounded-2xl p-6 text-white shadow-xl animate-fadeInUp delay-100 card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lime-100 text-sm font-medium">Total Jadwal</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <Calendar size={24} />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl p-6 text-white shadow-xl animate-fadeInUp delay-200 card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Hari Ini</p>
                  <p className="text-3xl font-bold">{stats.today}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <CalendarDays size={24} />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl p-6 text-white shadow-xl animate-fadeInUp delay-300 card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Minggu Ini</p>
                  <p className="text-3xl font-bold">{stats.week}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <Activity size={24} />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl p-6 text-white shadow-xl animate-fadeInUp delay-400 card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-100 text-sm font-medium">Akan Datang</p>
                  <p className="text-3xl font-bold">{stats.upcoming}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <TrendingUp size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Schedule Form */}
        {showAddForm && (
          <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-8">
            <div className="bg-gradient-to-r from-lime-50 to-green-50 border-2 border-lime-200 rounded-2xl p-8 shadow-xl animate-fadeInUp">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-lime-400 p-3 rounded-xl">
                  <Plus size={24} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Tambah Jadwal Pakan Baru</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Tanggal *</label>
                  <input
                    type="date"
                    value={newSchedule.date}
                    onChange={(e) => setNewSchedule({ ...newSchedule, date: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-lime-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-lime-200 focus:border-lime-400 transition-all duration-300 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Waktu *</label>
                  <input
                    type="time"
                    value={newSchedule.time}
                    onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-lime-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-lime-200 focus:border-lime-400 transition-all duration-300 bg-white"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <button
                  onClick={handleAddSchedule}
                  disabled={apiLoading || !newSchedule.date || !newSchedule.time || !selectedPool}
                  className="bg-gradient-to-r from-lime-400 to-green-500 hover:from-lime-500 hover:to-green-600 disabled:from-gray-300 disabled:to-gray-400 text-white px-8 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 btn-ripple disabled:transform-none disabled:hover:scale-100"
                >
                  {apiLoading ? "Menyimpan..." : "Simpan Jadwal"}
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setNewSchedule({ date: "", time: "", code: "" })
                  }}
                  className="bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white px-8 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-8">
          {/* Refresh Button */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Daftar Jadwal Pakan</h2>
            <button
              onClick={() => loadSchedules()}
              disabled={loading || !selectedPool}
              className="px-6 py-3 bg-gradient-to-r from-lime-400 to-green-500 hover:from-lime-500 hover:to-green-600 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl flex items-center gap-3 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 btn-ripple"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              {loading ? "Memuat..." : "Refresh"}
            </button>
          </div>

          {/* Schedule Cards */}
          {schedules.length === 0 ? (
            <div className="text-center py-16 animate-fadeInUp">
              <div className="w-32 h-32 bg-gradient-to-br from-lime-100 to-green-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                <Clock size={48} className="text-lime-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Belum ada jadwal pakan</h3>
              <p className="text-gray-600 mb-8 text-lg">
                {!selectedPool
                  ? "Pilih kolam terlebih dahulu untuk melihat jadwal"
                  : "Mulai dengan menambahkan jadwal pakan pertama Anda"}
              </p>
              {selectedPool && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-gradient-to-r from-lime-400 to-green-500 hover:from-lime-500 hover:to-green-600 text-white px-8 py-4 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 btn-ripple"
                >
                  Tambah Jadwal Pertama
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {schedules.map((schedule, index) => {
                const scheduleDate = new Date(schedule.schedule)
                const statusInfo = getScheduleStatus(schedule.schedule)
                return (
                  <div
                    key={schedule.id || index}
                    className="bg-white rounded-2xl shadow-lg border-2 border-lime-100 hover:border-lime-300 transition-all duration-300 card-hover animate-fadeInUp"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h3 className="font-bold text-xl text-gray-800 mb-2">
                            Jadwal Pakan #{schedule.code || `FEED-${index + 1}`}
                          </h3>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Calendar size={16} />
                              <span className="text-sm font-medium">
                                {scheduleDate.toLocaleDateString("id-ID", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Clock size={16} />
                              <span className="text-sm font-medium">
                                {scheduleDate.toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className={`px-4 py-2 rounded-xl text-sm font-bold border ${statusInfo.color}`}>
                          {statusInfo.text}
                        </span>
                      </div>

                      {/* Schedule Information */}
                      <div className="bg-gray-50 rounded-xl p-4 mb-4">
                        <div className="grid grid-cols-1 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500 font-medium">Kode Jadwal:</span>
                            <p className="text-gray-800 font-semibold font-mono">
                              {schedule.code || `FEED-${index + 1}`}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500 font-medium">Kolam:</span>
                            <p className="text-gray-800 font-semibold">{selectedPool}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 font-medium">User ID:</span>
                            <p className="text-gray-800 font-semibold">{schedule.iduser || userSession?.id}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 font-medium">Waktu Lengkap:</span>
                            <p className="text-gray-800 font-semibold">{scheduleDate.toLocaleString("id-ID")}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Feeder
