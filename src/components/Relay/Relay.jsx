"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Power, PowerOff, Edit3, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"
import Sidebar from "../Sidebar/Sidebar"

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

  // localStorage management
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

  // Show notification
  const showNotification = (message, type = "success") => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
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

  // Fetch existing relays from server
  const fetchRelays = async () => {
    if (!userSession?.id || !userSession?.token) {
      console.log("No user session or token, cannot fetch relays")
      return
    }

    try {
      setLoading(true)
      console.log("Loading relays from localStorage...")

      // Load dari localStorage terlebih dahulu
      const storedRelays = loadRelaysFromStorage()
      if (storedRelays.length > 0) {
        setRelays(storedRelays)
        console.log("Loaded", storedRelays.length, "relays from localStorage")
      }

      setLoading(false)
    } catch (error) {
      console.error("Error fetching relays:", error)
      setRelays([])
      showNotification("Gagal memuat data relay: " + error.message, "error")
      setLoading(false)
    }
  }

  // Auto-save relays to localStorage whenever relays state changes
  useEffect(() => {
    if (relays.length > 0 && userSession?.id) {
      saveRelaysToStorage(relays)
    }
  }, [relays, userSession?.id])

  // Fetch data when userSession is available
  useEffect(() => {
    if (userSession?.id) {
      fetchPools()
    }
  }, [userSession])

  // Fetch relays after pools are loaded
  useEffect(() => {
    if (pools.length > 0 && userSession?.id) {
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

  // Add new relay - IMPROVED VERSION
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
        setRelays(updatedRelays)

        // Langsung save ke localStorage
        saveRelaysToStorage(updatedRelays)

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

  // Update relay value - MULTIPLE APPROACH VERSION
  const updateRelayValue = async (code, val, relayId) => {
    try {
      setApiLoading(true)
      console.log("Updating relay value:", { code, val, relayId, userId: userSession.id })

      // Gunakan userSession.id untuk parameter id, bukan relayId
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
        const updatedRelays = relays.map((relay) => (relay.id === relayId ? { ...relay, val: val } : relay))
        setRelays(updatedRelays)

        // Save updated status ke localStorage
        saveRelaysToStorage(updatedRelays)

        showNotification(`Relay ${code} berhasil ${val ? "diaktifkan" : "dinonaktifkan"}`)
      } else {
        throw new Error(data.message || "Gagal mengubah nilai relay")
      }
    } catch (error) {
      console.error("Error updating relay:", error)
      showNotification("Gagal mengubah nilai relay: " + error.message, "error")
    } finally {
      setApiLoading(false)
    }
  }

  // Handle single relay toggle
  const handleSingleRelayToggle = async (relay) => {
    const newVal = !relay.val
    await updateRelayValue(relay.code, newVal, relay.id) // relay.id tetap digunakan untuk update state
  }

  // Handle bulk relay operations
  const handleBulkRelayChange = async (activate) => {
    try {
      setApiLoading(true)
      const updatePromises = selectedRelays.map(async (relayId) => {
        const relay = relays.find((r) => r.id === relayId)
        if (!relay) return { relayId, success: false, error: "Relay tidak ditemukan" }

        try {
          await updateRelayValue(relay.code, activate, relayId)
          return { relayId, success: true }
        } catch (error) {
          console.error(`Error updating relay ${relay.code}:`, error)
          return { relayId, success: false, error: error.message }
        }
      })

      const results = await Promise.all(updatePromises)
      const successCount = results.filter((r) => r && r.success).length
      const failureCount = results.filter((r) => r && !r.success).length

      if (successCount > 0) {
        showNotification(
          `${successCount} relay berhasil ${activate ? "diaktifkan" : "dinonaktifkan"}${failureCount > 0 ? `, ${failureCount} gagal` : ""}`,
        )
      } else {
        showNotification("Semua relay gagal diubah. Periksa kembali kode relay.", "error")
      }

      setSelectedRelays([])
    } catch (error) {
      console.error("Error in bulk relay update:", error)
      showNotification("Gagal mengubah nilai relay: " + error.message, "error")
    } finally {
      setApiLoading(false)
    }
  }

  const handleDeleteSelected = () => {
    console.log("Deleting selected relays:", selectedRelays)
    const updatedRelays = relays.filter((relay) => !selectedRelays.includes(relay.id))
    setRelays(updatedRelays)

    // Save setelah delete
    saveRelaysToStorage(updatedRelays)

    setSelectedRelays([])
    showNotification(`${selectedRelays.length} relay berhasil dihapus`)
  }

  const getStatusColor = (val) => {
    return val ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
  }

  const getStatusText = (val) => {
    return val ? "ON" : "OFF"
  }

  // Get available pools that don't have relays yet
  const getAvailablePools = () => {
    return pools.filter((pool) => !relays.some((relay) => relay.code === pool.code))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data relay...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      {sidebarVisible && <Sidebar />}

      {/* Main Content */}
      <div className="flex-grow p-6">
        {/* Notification */}
        {notification && (
          <div
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
              notification.type === "success"
                ? "bg-green-100 border border-green-400 text-green-700"
                : "bg-red-100 border border-red-400 text-red-700"
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <span>{notification.message}</span>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {apiLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Memproses...</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate("/homepage")}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Manajemen Relay</h1>
                  <p className="text-gray-600 mt-1">Kelola relay untuk kolam budidaya Anda</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  disabled={getAvailablePools().length === 0}
                >
                  <Plus size={20} />
                  Tambah Relay
                </button>
                <button
                  onClick={() => {
                    // Clear relay data saat logout
                    clearRelaysFromStorage()
                    window.userSession = null
                    navigate("/")
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Add Relay Form */}
        {showAddForm && (
          <div className="bg-white border-b shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Tambah Relay Baru</h3>

                {getAvailablePools().length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-600">
                      Semua kolam sudah memiliki relay. Tidak ada kolam yang tersedia untuk ditambahkan relay baru.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Kode Kolam *</label>
                        <select
                          value={newRelayCode}
                          onChange={(e) => setNewRelayCode(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status Awal</label>
                        <select
                          value={newRelayVal}
                          onChange={(e) => setNewRelayVal(e.target.value === "true")}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={true}>ON (Aktif)</option>
                          <option value={false}>OFF (Tidak Aktif)</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={handleAddRelay}
                        disabled={apiLoading}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md transition-colors"
                      >
                        {apiLoading ? "Menyimpan..." : "Simpan"}
                      </button>
                      <button
                        onClick={() => setShowAddForm(false)}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md transition-colors"
                      >
                        Batal
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Bulk Actions */}
          {selectedRelays.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-blue-700 font-medium">{selectedRelays.length} relay dipilih</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBulkRelayChange(true)}
                    disabled={apiLoading}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1 transition-colors"
                  >
                    <Power size={16} />
                    Aktifkan
                  </button>
                  <button
                    onClick={() => handleBulkRelayChange(false)}
                    disabled={apiLoading}
                    className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1 transition-colors"
                  >
                    <PowerOff size={16} />
                    Nonaktifkan
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1 transition-colors"
                  >
                    <Trash2 size={16} />
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Relay Cards */}
          {relays.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada relay</h3>
              <p className="text-gray-600 mb-4">
                {pools.length === 0
                  ? "Anda perlu membuat kolam terlebih dahulu sebelum menambahkan relay"
                  : "Mulai dengan menambahkan relay pertama Anda"}
              </p>
              {pools.length > 0 && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Tambah Relay
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Select All Checkbox */}
              <div className="bg-white rounded-lg shadow-sm border mb-4 p-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedRelays.length === relays.length}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Pilih Semua Relay ({relays.length})</span>
                </label>
              </div>

              {/* Relay Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {relays.map((relay) => (
                  <div
                    key={relay.id}
                    className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedRelays.includes(relay.id)}
                            onChange={() => handleSelectRelay(relay.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div>
                            <h3 className="font-semibold text-gray-900">{relay.poolName || `Relay ${relay.code}`}</h3>
                            <p className="text-sm text-gray-600">Kode: {relay.code}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(relay.val)}`}>
                          {getStatusText(relay.val)}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleSingleRelayToggle(relay)}
                          disabled={apiLoading}
                          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${
                            relay.val
                              ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                              : "bg-green-100 text-green-700 hover:bg-green-200"
                          }`}
                        >
                          {relay.val ? (
                            <>
                              <PowerOff size={14} className="inline mr-1" />
                              Turn OFF
                            </>
                          ) : (
                            <>
                              <Power size={14} className="inline mr-1" />
                              Turn ON
                            </>
                          )}
                        </button>
                        <button
                          disabled={apiLoading}
                          className="px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 rounded-md text-sm transition-colors"
                        >
                          <Edit3 size={14} />
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
