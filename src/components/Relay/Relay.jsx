"use client"
import { useState, useEffect } from "react"
import {
  Plus,
  Power,
  PowerOff,
  Edit3,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Zap,
  Activity,
  Settings,
  TrendingUp,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import Sidebar from "../Sidebar/Sidebar"
import "./Relay.css"

const Relay = () => {
  const [relays, setRelays] = useState([])
  const [pools, setPools] = useState([]) // Available pools for selection
  const [selectedRelays, setSelectedRelays] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newRelayCode, setNewRelayCode] = useState("")
  const [newRelayVal, setNewRelayVal] = useState(true)
  const [notification, setNotification] = useState(null)
  const [apiLoading, setApiLoading] = useState(false)
  const [userSession, setUserSession] = useState(null)
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const navigate = useNavigate()

  // localStorage management - FIXED: Include user ID in key
  const RELAY_STORAGE_KEY = `relays_user_${userSession?.id || "default"}`

  const saveRelaysToStorage = (relaysData) => {
    try {
      localStorage.setItem(RELAY_STORAGE_KEY, JSON.stringify(relaysData))
      console.log("Relays saved to localStorage:", relaysData)
    } catch (error) {
      console.error("Error saving relays to localStorage:", error)
    }
  }

  const loadRelaysFromStorage = () => {
    try {
      const stored = localStorage.getItem(RELAY_STORAGE_KEY)
      if (stored) {
        const parsedRelays = JSON.parse(stored)
        console.log("Relays loaded from localStorage:", parsedRelays)
        return parsedRelays
      }
    } catch (error) {
      console.error("Error loading relays from localStorage:", error)
    }
    return []
  }

  const clearRelaysFromStorage = () => {
    try {
      localStorage.removeItem(RELAY_STORAGE_KEY)
      console.log("Relays cleared from localStorage")
    } catch (error) {
      console.error("Error clearing relays from localStorage:", error)
    }
  }

  // API Base URLs
  const RELAY_API_BASE = "http://43.165.198.49:8089/api/control"
  const POOL_API_BASE = "http://43.165.198.49:8089/api/kolam"

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

  // Fetch available pools for dropdown
  const fetchPools = async () => {
    if (!userSession?.id || !userSession?.token) {
      console.log("No user session or token, cannot fetch pools")
      return
    }

    try {
      const url = `${POOL_API_BASE}/select/all?id=${userSession.id}`
      console.log("Fetching pools from:", url)

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userSession.token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Pools data received:", data)

      if (data.status === "200 OK" && data.payload) {
        setPools(data.payload)
      } else {
        setPools([])
      }
    } catch (error) {
      console.error("Error fetching pools:", error)
      showNotification("Gagal memuat data kolam: " + error.message, "error")
    }
  }

  // FIXED: Fetch existing relays from server using the correct endpoint
  const fetchRelays = async () => {
    if (!userSession?.id || !userSession?.token) {
      console.log("No user session or token, cannot fetch relays")
      return
    }

    try {
      setLoading(true)
      console.log("Fetching relays from server...")

      // FIXED: Use the correct endpoint for fetching user's relays
      const url = `${RELAY_API_BASE}/relay/all?id=${userSession.id}`
      console.log("Fetching relays from:", url)

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userSession.token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Relays data received:", data)

      let serverRelays = []
      if (data.status === "200 OK" && data.payload && Array.isArray(data.payload)) {
        // Map server data to include pool names
        serverRelays = data.payload.map((relay) => {
          const pool = pools.find((p) => p.code === relay.code)
          return {
            ...relay,
            poolName: pool?.name || `Kolam ${relay.code}`,
          }
        })
      }

      // FIXED: Always use server data as source of truth for new sessions
      console.log("Setting relays from server:", serverRelays)
      setRelays(serverRelays)

      // Save to localStorage for offline access
      if (serverRelays.length > 0) {
        saveRelaysToStorage(serverRelays)
      } else {
        // FIXED: Clear localStorage if server returns empty (new user)
        clearRelaysFromStorage()
      }
    } catch (error) {
      console.error("Error fetching relays from server:", error)

      // FIXED: Only fallback to localStorage if server is unreachable
      // and user has existing data
      const storedRelays = loadRelaysFromStorage()
      if (storedRelays.length > 0) {
        console.log("Server unreachable, using localStorage fallback")
        setRelays(storedRelays)
        showNotification("Menggunakan data offline. Koneksi server bermasalah.", "error")
      } else {
        // FIXED: New user with no server data and no localStorage = empty state
        setRelays([])
        showNotification("Gagal memuat data relay: " + error.message, "error")
      }
    } finally {
      setLoading(false)
    }
  }

  // FIXED: Only save to localStorage when relays are updated via user actions
  // Remove automatic save on every relays state change
  const saveRelaysAfterAction = (updatedRelays) => {
    setRelays(updatedRelays)
    saveRelaysToStorage(updatedRelays)
  }

  // Fetch data when userSession is available
  useEffect(() => {
    if (userSession?.id) {
      fetchPools()
    }
  }, [userSession])

  // FIXED: Fetch relays after pools are loaded AND user session is available
  useEffect(() => {
    if (userSession?.id && pools.length >= 0) {
      // Allow fetching even if no pools
      fetchRelays()
    }
  }, [pools, userSession])

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRelays(relays.map((relay) => relay.id))
    } else {
      setSelectedRelays([])
    }
  }

  const handleSelectRelay = (relayId) => {
    setSelectedRelays((prev) => (prev.includes(relayId) ? prev.filter((id) => id !== relayId) : [...prev, relayId]))
  }

  // FIXED: Add new relay with proper server sync
  const handleAddRelay = async () => {
    if (!newRelayCode.trim()) {
      showNotification("Kode kolam harus dipilih", "error")
      return
    }

    if (!userSession?.id) {
      showNotification("Session tidak valid, silakan login ulang", "error")
      return
    }

    // Check if relay already exists for this pool
    const existingRelay = relays.find((relay) => relay.code === newRelayCode)
    if (existingRelay) {
      showNotification("Relay untuk kolam ini sudah ada", "error")
      return
    }

    // Get the selected pool info
    const selectedPool = pools.find((pool) => pool.code === newRelayCode)
    if (!selectedPool) {
      showNotification("Kolam tidak ditemukan", "error")
      return
    }

    try {
      setApiLoading(true)
      const requestData = {
        val: newRelayVal,
        code: newRelayCode.trim(),
        iduser: userSession.id.toString(),
      }

      console.log("Adding relay with data:", requestData)

      const response = await fetch(`${RELAY_API_BASE}/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userSession.token}`,
        },
        body: JSON.stringify(requestData),
      })

      console.log("Add relay response status:", response.status)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Add relay response data:", data)

      if (data.status === "201 CREATED" && data.payload) {
        // Store the exact data returned from server
        const newRelay = {
          id: data.payload.id,
          code: data.payload.code || newRelayCode,
          val: data.payload.val !== undefined ? data.payload.val : newRelayVal,
          iduser: data.payload.iduser || userSession.id,
          poolName: selectedPool.name,
        }

        console.log("New relay object:", newRelay)
        const updatedRelays = [...relays, newRelay]

        // FIXED: Use the new save function
        saveRelaysAfterAction(updatedRelays)

        setNewRelayCode("")
        setNewRelayVal(true)
        setShowAddForm(false)
        showNotification("Relay berhasil ditambahkan")
      } else {
        throw new Error("Invalid response format")
      }
    } catch (error) {
      console.error("Error adding relay:", error)
      showNotification("Gagal menambahkan relay: " + error.message, "error")
    } finally {
      setApiLoading(false)
    }
  }

  // FIXED: Update single relay value with proper server sync
  const updateSingleRelayValue = async (code, val, relayId) => {
    try {
      console.log("Updating single relay value:", { code, val, relayId, userId: userSession.id })

      const response = await fetch(`${RELAY_API_BASE}/updateValByCode?code=${code}&val=${val}&id=${userSession.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userSession.token}`,
        },
      })

      console.log("Update relay response status:", response.status)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Update relay response data:", data)

      if (data.status === "200 OK") {
        return { success: true, relayId, code, val }
      } else {
        throw new Error(data.message || "Gagal mengubah nilai relay")
      }
    } catch (error) {
      console.error("Error updating relay:", error)
      return { success: false, relayId, code, error: error.message }
    }
  }

  // Handle single relay toggle
  const handleSingleRelayToggle = async (relay) => {
    const newVal = !relay.val

    try {
      setApiLoading(true)
      const result = await updateSingleRelayValue(relay.code, newVal, relay.id)

      if (result.success) {
        const updatedRelays = relays.map((r) => (r.id === relay.id ? { ...r, val: newVal } : r))
        saveRelaysAfterAction(updatedRelays)
        showNotification(`Relay ${relay.code} berhasil ${newVal ? "diaktifkan" : "dinonaktifkan"}`)
      } else {
        showNotification("Gagal mengubah nilai relay: " + result.error, "error")
      }
    } catch (error) {
      console.error("Error in single relay toggle:", error)
      showNotification("Gagal mengubah nilai relay: " + error.message, "error")
    } finally {
      setApiLoading(false)
    }
  }

  // FIXED: Handle bulk relay operations - Sequential processing
  const handleBulkRelayChange = async (activate) => {
    try {
      setApiLoading(true)

      const selectedRelayObjects = selectedRelays.map((relayId) => relays.find((r) => r.id === relayId)).filter(Boolean)

      console.log(
        "Starting bulk update for relays:",
        selectedRelayObjects.map((r) => r.code),
      )

      let successCount = 0
      let failureCount = 0
      const results = []

      // FIXED: Process relays sequentially to avoid race conditions
      for (const relay of selectedRelayObjects) {
        try {
          // Add small delay between requests to avoid overwhelming the server
          if (results.length > 0) {
            await new Promise((resolve) => setTimeout(resolve, 200))
          }

          const result = await updateSingleRelayValue(relay.code, activate, relay.id)
          results.push(result)

          if (result.success) {
            successCount++
            console.log(`✓ Relay ${relay.code} updated successfully`)
          } else {
            failureCount++
            console.log(`✗ Relay ${relay.code} failed: ${result.error}`)
          }
        } catch (error) {
          failureCount++
          console.log(`✗ Relay ${relay.code} failed: ${error.message}`)
          results.push({ success: false, relayId: relay.id, code: relay.code, error: error.message })
        }
      }

      // FIXED: Update all successful relays in one batch
      if (successCount > 0) {
        const updatedRelays = relays.map((relay) => {
          const successResult = results.find((r) => r.success && r.relayId === relay.id)
          if (successResult) {
            return { ...relay, val: activate }
          }
          return relay
        })

        saveRelaysAfterAction(updatedRelays)
      }

      // Show comprehensive notification
      if (successCount > 0 && failureCount === 0) {
        showNotification(`Semua ${successCount} relay berhasil ${activate ? "diaktifkan" : "dinonaktifkan"}`, "success")
      } else if (successCount > 0 && failureCount > 0) {
        showNotification(
          `${successCount} relay berhasil ${activate ? "diaktifkan" : "dinonaktifkan"}, ${failureCount} gagal`,
          "error",
        )
      } else {
        showNotification(`Semua relay gagal diubah. Periksa koneksi dan coba lagi.`, "error")
      }

      setSelectedRelays([])
    } catch (error) {
      console.error("Error in bulk relay update:", error)
      showNotification("Gagal mengubah nilai relay: " + error.message, "error")
    } finally {
      setApiLoading(false)
    }
  }

  const getStatusColor = (val) => {
    return val
      ? "bg-gradient-to-r from-lime-100 to-green-100 text-green-800 border border-green-200"
      : "bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200"
  }

  const getStatusText = (val) => {
    return val ? "ON" : "OFF"
  }

  // Get available pools that don't have relays yet
  const getAvailablePools = () => {
    return pools.filter((pool) => !relays.some((relay) => relay.code === pool.code))
  }

  // Calculate stats
  const activeRelaysCount = relays.filter((relay) => relay.val).length
  const inactiveRelaysCount = relays.length - activeRelaysCount

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lime-50 via-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center animate-fadeInUp">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-lime-200 border-t-lime-500 mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-green-400 animate-pulse mx-auto"></div>
          </div>
          <p className="text-gray-700 font-medium text-lg">Memuat data relay...</p>
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
                <p className="font-semibold text-sm">{notification.message}</p>
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

        {/* Header */}
        <div className="bg-gradient-to-r from-lime-400 via-green-400 to-emerald-400 shadow-xl">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between items-center py-8">
              <div className="flex items-center gap-6 animate-slideInFromLeft">
                <button
                  onClick={() => navigate("/homepage")}
                  className="p-3 hover:bg-white/20 rounded-xl transition-all duration-300 transform hover:scale-110"
                >
                  <ArrowLeft size={24} className="text-white" />
                </button>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg flex items-center gap-3">
                    <Zap size={36} />
                    Manajemen Relay
                  </h1>
                  <p className="text-lime-100 text-lg">Kelola relay untuk kolam budidaya Anda</p>
                </div>
              </div>
              <div className="flex items-center gap-4 animate-slideInFromRight">
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="bg-white hover:bg-lime-50 text-green-700 px-6 py-3 rounded-xl flex items-center gap-3 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 btn-ripple font-semibold"
                  disabled={getAvailablePools().length === 0}
                >
                  <Plus size={22} />
                  Tambah Relay
                </button>
                <button
                  onClick={() => {
                    // FIXED: Clear relay data saat logout
                    clearRelaysFromStorage()
                    window.userSession = null
                    navigate("/")
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 btn-ripple font-semibold"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 -mt-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-lime-400 to-green-500 rounded-2xl p-6 text-white shadow-xl animate-fadeInUp delay-100 card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lime-100 text-sm font-medium">Total Relay</p>
                  <p className="text-3xl font-bold">{relays.length}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <Zap size={24} />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl p-6 text-white shadow-xl animate-fadeInUp delay-200 card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Relay Aktif</p>
                  <p className="text-3xl font-bold">{activeRelaysCount}</p>
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
                  <p className="text-3xl font-bold">{inactiveRelaysCount}</p>
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
                    {relays.length > 0 ? Math.round((activeRelaysCount / relays.length) * 100) : 0}%
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <TrendingUp size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Relay Form */}
        {showAddForm && (
          <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-8">
            <div className="bg-gradient-to-r from-lime-50 to-green-50 border-2 border-lime-200 rounded-2xl p-8 shadow-xl animate-fadeInUp form-slide-down">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-lime-400 p-3 rounded-xl">
                  <Plus size={24} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Tambah Relay Baru</h3>
              </div>

              {getAvailablePools().length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-lime-100 to-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Settings size={32} className="text-lime-500" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Semua Kolam Sudah Memiliki Relay</h4>
                  <p className="text-gray-600">Tidak ada kolam yang tersedia untuk ditambahkan relay baru.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Kode Kolam *</label>
                      <select
                        value={newRelayCode}
                        onChange={(e) => setNewRelayCode(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-lime-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-lime-200 focus:border-lime-400 transition-all duration-300 bg-white"
                        required
                      >
                        <option value="">Pilih Kode Kolam</option>
                        {getAvailablePools().map((pool) => (
                          <option key={pool.id} value={pool.code}>
                            {pool.code} - {pool.name || `Kolam ${pool.code}`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Status Awal</label>
                      <select
                        value={newRelayVal}
                        onChange={(e) => setNewRelayVal(e.target.value === "true")}
                        className="w-full px-4 py-3 border-2 border-lime-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-lime-200 focus:border-lime-400 transition-all duration-300 bg-white"
                      >
                        <option value={true}>ON (Aktif)</option>
                        <option value={false}>OFF (Tidak Aktif)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-8">
                    <button
                      onClick={handleAddRelay}
                      disabled={apiLoading}
                      className="bg-gradient-to-r from-lime-400 to-green-500 hover:from-lime-500 hover:to-green-600 disabled:from-gray-300 disabled:to-gray-400 text-white px-8 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 btn-ripple"
                    >
                      {apiLoading ? "Menyimpan..." : "Simpan Relay"}
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-8 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Batal
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-8">
          {/* Bulk Actions */}
          {selectedRelays.length > 0 && (
            <div className="bg-gradient-to-r from-lime-100 to-green-100 border-2 border-lime-300 rounded-2xl p-6 mb-8 shadow-lg animate-fadeInUp bulk-actions">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-lime-400 p-2 rounded-lg">
                    <Zap size={20} className="text-white" />
                  </div>
                  <span className="text-green-800 font-bold text-lg">{selectedRelays.length} relay dipilih</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleBulkRelayChange(true)}
                    disabled={apiLoading}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 btn-ripple"
                  >
                    <Power size={16} />
                    Aktifkan
                  </button>
                  <button
                    onClick={() => handleBulkRelayChange(false)}
                    disabled={apiLoading}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-300 disabled:to-gray-400 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 btn-ripple"
                  >
                    <PowerOff size={16} />
                    Nonaktifkan
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Relay Cards */}
          {relays.length === 0 ? (
            <div className="text-center py-16 animate-fadeInUp">
              <div className="w-32 h-32 bg-gradient-to-br from-lime-100 to-green-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                <Zap size={48} className="text-lime-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Belum ada relay</h3>
              <p className="text-gray-600 mb-8 text-lg">
                {pools.length === 0
                  ? "Anda perlu membuat kolam terlebih dahulu sebelum menambahkan relay"
                  : "Mulai dengan menambahkan relay pertama Anda"}
              </p>
              {pools.length > 0 && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-gradient-to-r from-lime-400 to-green-500 hover:from-lime-500 hover:to-green-600 text-white px-8 py-4 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 btn-ripple"
                >
                  Tambah Relay Pertama
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Select All Checkbox */}
              <div className="bg-white rounded-2xl shadow-lg border-2 border-lime-100 mb-6 p-6 animate-fadeInUp">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedRelays.length === relays.length}
                    onChange={handleSelectAll}
                    className="h-5 w-5 text-lime-500 focus:ring-lime-400 border-2 border-lime-300 rounded transition-all duration-300"
                  />
                  <span className="ml-4 text-lg font-semibold text-gray-700 group-hover:text-lime-600 transition-colors">
                    Pilih Semua Relay ({relays.length})
                  </span>
                </label>
              </div>

              {/* Relay Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {relays.map((relay, index) => (
                  <div
                    key={relay.id}
                    className="bg-white rounded-2xl shadow-lg border-2 border-lime-100 hover:border-lime-300 transition-all duration-300 relay-card animate-fadeInUp"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="p-6 relative z-10">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <input
                            type="checkbox"
                            checked={selectedRelays.includes(relay.id)}
                            onChange={() => handleSelectRelay(relay.id)}
                            className="h-5 w-5 text-lime-500 focus:ring-lime-400 border-2 border-lime-300 rounded transition-all duration-300"
                          />
                          <div>
                            <h3 className="font-bold text-xl text-gray-800 mb-1">
                              {relay.poolName || `Relay ${relay.code}`}
                            </h3>
                            <p className="text-lime-600 font-semibold">Kode: {relay.code}</p>
                          </div>
                        </div>
                        <span
                          className={`px-4 py-2 rounded-xl text-sm font-bold status-badge ${getStatusColor(relay.val)} ${
                            relay.val ? "animate-relayPulse" : ""
                          }`}
                        >
                          {getStatusText(relay.val)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleSingleRelayToggle(relay)}
                          disabled={apiLoading}
                          className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105 btn-ripple ${
                            relay.val
                              ? "bg-gradient-to-r from-orange-400 to-red-500 text-white hover:from-orange-500 hover:to-red-600"
                              : "bg-gradient-to-r from-lime-400 to-green-500 text-white hover:from-lime-500 hover:to-green-600"
                          }`}
                        >
                          {relay.val ? (
                            <>
                              <PowerOff size={16} className="inline mr-2" />
                              Turn OFF
                            </>
                          ) : (
                            <>
                              <Power size={16} className="inline mr-2" />
                              Turn ON
                            </>
                          )}
                        </button>
                        <button
                          disabled={apiLoading}
                          className="px-4 py-3 bg-gradient-to-r from-gray-400 to-gray-500 text-white hover:from-gray-500 hover:to-gray-600 disabled:opacity-50 rounded-xl text-sm transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 btn-ripple"
                        >
                          <Edit3 size={16} />
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

export default Relay
