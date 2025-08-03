"use client"
import { useState, useEffect } from "react"
import {
  ArrowLeft,
  RefreshCw,
  Cpu,
  Zap,
  CheckCircle,
  AlertCircle,
  Wifi,
  WifiOff,
  Power,
  Info,
  User,
  Key,
  Globe,
  Code,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import Sidebar from "../Sidebar/Sidebar"
import "./MicroController.css"

const MicroController = () => {
  const [pools, setPools] = useState([])
  const [selectedPool, setSelectedPool] = useState("")
  const [userSession, setUserSession] = useState(null)
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [activeTab, setActiveTab] = useState("guide") // guide, relay
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState("disconnected")
  // Relay Data State
  const [relayData, setRelayData] = useState(null)
  const [relayLoading, setRelayLoading] = useState(false)
  const navigate = useNavigate()

  // API Base URLs
  const MICRO_RELAY_API = "https://monitoring.infarm.web.id/servers/api/control/micro/getByCode"
  const POOL_API_BASE = "https://monitoring.infarm.web.id/servers/api/kolam"

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

  // Get relay status from microcontroller
  const getRelayStatus = async () => {
    if (!selectedPool) {
      showNotification("Pilih kolam terlebih dahulu", "error")
      return
    }
    if (!userSession?.id || !userSession?.token) {
      showNotification("Session tidak valid", "error")
      return
    }
    try {
      setRelayLoading(true)
      setConnectionStatus("connecting")
      const url = `${MICRO_RELAY_API}?code=${selectedPool}&iduser=${userSession.id}`
      console.log("Getting relay status from:", url)
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userSession.token}`,
        },
      })
      console.log("Relay response status:", response.status)
      if (!response.ok) {
        const errorText = await response.text()
        console.log("Relay error response:", errorText)
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }
      const data = await response.json()
      console.log("Relay response data:", data)
      if (data.status === "200 OK" && data.payload) {
        setRelayData(data.payload)
        showNotification(`✅ Relay ${data.payload.code} ditemukan! Status: ${data.payload.val ? "ON" : "OFF"}`)
        setConnectionStatus("connected")
        // Auto disconnect after 3 seconds
        setTimeout(() => {
          setConnectionStatus("disconnected")
        }, 3000)
      } else {
        throw new Error(data.message || "Relay tidak ditemukan")
      }
    } catch (error) {
      console.error("Error getting relay status:", error)
      showNotification("❌ Gagal mendapatkan status relay: " + error.message, "error")
      setRelayData(null)
      setConnectionStatus("disconnected")
    } finally {
      setRelayLoading(false)
    }
  }

  // Fetch data when userSession is available
  useEffect(() => {
    if (userSession?.id) {
      fetchPools()
    }
  }, [userSession])

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case "connected":
        return <Wifi className="text-lime-500" size={20} />
      case "connecting":
        return <RefreshCw className="text-blue-500 animate-spin" size={20} />
      default:
        return <WifiOff className="text-gray-400" size={20} />
    }
  }
  const getConnectionText = () => {
    switch (connectionStatus) {
      case "connected":
        return "Terhubung"
      case "connecting":
        return "Menghubungkan..."
      default:
        return "Terputus"
    }
  }
  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "bg-gradient-to-r from-lime-100 to-green-100 border-lime-300"
      case "connecting":
        return "bg-gradient-to-r from-blue-100 to-cyan-100 border-blue-300"
      default:
        return "bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300"
    }
  }

  const selectedPoolData = pools.find((pool) => pool.code === selectedPool)

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
        {/* Header */}
        <div className="shadow-xl relative overflow-hidden bg-green-900">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-8 gap-4 sm:gap-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 animate-slideInFromLeft">
                <button
                  onClick={() => navigate("/homepage")}
                  className="p-3 hover:bg-white/20 rounded-xl transition-all duration-300 transform hover:scale-110"
                >
                  <ArrowLeft size={24} className="text-white" />
                </button>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                    <Cpu size={36} />
                    MicroController ESP32
                  </h1>
                  <p className="text-white">Panduan koneksi dan status relay IoT</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto animate-slideInFromRight">
                {/* Connection Status */}
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 ${getConnectionStatusColor()} ${connectionStatus === "connected" ? "connection-pulse" : ""}`}
                >
                  {getConnectionIcon()}
                  <span className="font-semibold">{getConnectionText()}</span>
                </div>
                {/* Pool Selector */}
                <select
                  value={selectedPool}
                  onChange={(e) => setSelectedPool(e.target.value)}
                  className="w-full sm:w-auto px-4 py-3 border-2 border-white/30 rounded-xl focus:outline-none focus:ring-4 focus:ring-white/20 focus:border-white/50 bg-white/90 backdrop-blur-sm font-semibold text-gray-700 transition-all duration-300"
                >
                  <option value="">Pilih Kolam</option>
                  {pools.map((pool) => (
                    <option key={pool.id} value={pool.code}>
                      {pool.code} - {pool.name || `Kolam ${pool.code}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        {/* User Information Card */}
        {userSession && selectedPoolData && (
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 -mt-4 relative z-10">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl shadow-xl border-2 border-blue-200 p-6 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-blue-500 p-3 rounded-xl">
                  <Info size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Informasi Koneksi ESP32</h3>
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
                    <Globe size={16} className="text-blue-500" />
                    <span className="text-sm font-semibold text-gray-600">API Endpoint</span>
                  </div>
                  <p className="font-bold text-gray-800 text-xs">...micro/sensors</p>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Tab Navigation - Only 2 tabs now */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
          <div className="bg-white rounded-2xl shadow-xl border-2 border-lime-100 p-2 mb-6">
            <nav className="flex space-x-2">
              <button
                onClick={() => setActiveTab("guide")}
                className={`flex-1 py-4 px-6 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-3 ${
                  activeTab === "guide"
                    ? "bg-gradient-to-r from-lime-400 to-green-500 text-white shadow-lg transform scale-105"
                    : "text-gray-600 hover:bg-lime-50 hover:text-lime-700"
                }`}
              >
                <Info size={20} />
                Panduan Koneksi
              </button>
              <button
                onClick={() => setActiveTab("relay")}
                className={`flex-1 py-4 px-6 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-3 ${
                  activeTab === "relay"
                    ? "bg-gradient-to-r from-lime-400 to-green-500 text-white shadow-lg transform scale-105"
                    : "text-gray-600 hover:bg-lime-50 hover:text-lime-700"
                }`}
              >
                <Zap size={20} />
                Status Relay
              </button>
            </nav>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pb-8">
          {/* Connection Guide Tab */}
          {activeTab === "guide" && (
            <div className="space-y-8 tab-content">
              <div className="bg-white rounded-2xl shadow-xl border-2 border-lime-100 p-8 card-hover animate-fadeInUp">
                <div className="flex items-center gap-4 mb-8">
                  <div className="bg-gradient-to-r from-lime-400 to-green-500 p-4 rounded-xl">
                    <Cpu size={28} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">Hardware API Connection Setting 🔧</h3>
                    <p className="text-gray-600 mt-1">Panduan lengkap menghubungkan ESP32 ke sistem monitoring</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Connection Guide Image */}
                  <div className="bg-gradient-to-br from-teal-100 to-cyan-100 rounded-2xl p-6 border-2 border-teal-200">
                    <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Info size={24} className="text-teal-600" />📘 Cara Menggunakan API
                    </h4>
                    <img
                      src="/assets/Computer troubleshooting-bro.svg"
                      alt="Hardware API Connection Guide"
                      className="w-full rounded-xl shadow-lg mb-4"
                    />
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-3">
                        <span className="bg-teal-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                          1
                        </span>
                        <p className="text-gray-700">
                          <strong>Pastikan perangkat keras Anda terhubung ke internet</strong>
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="bg-teal-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                          2
                        </span>
                        <p className="text-gray-700">
                          <strong>Gunakan endpoint sesuai kebutuhan</strong> (insert sensor / kontrol relay)
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="bg-teal-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                          3
                        </span>
                        <p className="text-gray-700">
                          <strong>Masukkan API key Anda sebagai otorisasi</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Technical Implementation */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                      <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Code size={20} className="text-blue-600" />
                        Konfigurasi ESP32
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="bg-white p-3 rounded-lg border border-blue-200">
                          <p className="text-gray-600 font-semibold">API Endpoint:</p>
                          <code className="text-blue-600 text-xs break-all">
                            https://api.monitoring.infarm.web.id/api/control/micro/sensors
                          </code>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-blue-200">
                          <p className="text-gray-600 font-semibold">Method:</p>
                          <code className="text-green-600">POST</code>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-blue-200">
                          <p className="text-gray-600 font-semibold">Content-Type:</p>
                          <code className="text-purple-600">application/json</code>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                      <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Key size={20} className="text-green-600" />
                        Parameter Wajib
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center bg-white p-2 rounded border border-green-200">
                          <span className="font-semibold text-gray-700">iduser:</span>
                          <span className="text-green-600 font-mono">{userSession?.id || "USER_ID"}</span>
                        </div>
                        <div className="flex justify-between items-center bg-white p-2 rounded border border-green-200">
                          <span className="font-semibold text-gray-700">code:</span>
                          <span className="text-green-600 font-mono">{selectedPool || "POOL_CODE"}</span>
                        </div>
                        <div className="flex justify-between items-center bg-white p-2 rounded border border-green-200">
                          <span className="font-semibold text-gray-700">Authorization:</span>
                          <span className="text-green-600 font-mono">Bearer TOKEN</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-200">
                      <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Globe size={20} className="text-yellow-600" />
                        Contoh JSON Payload
                      </h4>
                      <pre className="bg-gray-800 text-green-400 p-4 rounded-lg text-xs overflow-x-auto">{`{  "iduser": "${userSession?.id || "USER_ID"}",  "code": "${selectedPool || "POOL_CODE"}",  "timestamp": "2025-07-26T12:00:00Z",  "pvVoltage": "12.5",  "pvCurrent": "1.2",  "battVoltage": "11.8",  "envTemp": "29.0",  "phBioflok": "7.1",  "tempBioflok": "28.5",  "doBioflok": "6.8"}`}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Relay Status Tab */}
          {activeTab === "relay" && (
            <div className="space-y-8 tab-content">
              <div className="bg-white rounded-2xl shadow-xl border-2 border-lime-100 p-8 card-hover animate-fadeInUp">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-r from-lime-400 to-green-500 p-4 rounded-xl">
                      <Zap size={28} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">Status Relay MicroController 🔋</h3>
                      <p className="text-gray-600 mt-1">Pantau status relay dari microcontroller ESP32</p>
                    </div>
                  </div>
                  <button
                    onClick={getRelayStatus}
                    disabled={relayLoading || !selectedPool}
                    className="px-8 py-3 bg-gradient-to-r from-lime-400 to-green-500 hover:from-lime-500 hover:to-green-600 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl flex items-center gap-3 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 btn-ripple"
                  >
                    <Cpu size={18} />
                    {relayLoading ? "Mengambil..." : "Get Status"}
                  </button>
                </div>
                {/* Relay Status Display */}
                {relayData ? (
                  <div className="bg-gradient-to-r from-lime-50 to-green-50 rounded-2xl p-8 border-2 border-lime-200 animate-fadeInUp">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-lime-400 p-3 rounded-xl">
                        <CheckCircle size={24} className="text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-800">Status Relay Ditemukan</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-white p-6 rounded-xl border-2 border-lime-100 shadow-lg card-hover">
                        <div className="text-sm text-gray-600 font-semibold mb-2">Kode Relay</div>
                        <div className="text-2xl font-bold text-gray-800">{relayData.code}</div>
                      </div>
                      <div className="bg-white p-6 rounded-xl border-2 border-lime-100 shadow-lg card-hover">
                        <div className="text-sm text-gray-600 font-semibold mb-2">Status</div>
                        <div
                          className={`text-2xl font-bold flex items-center gap-2 ${relayData.val ? "text-green-600" : "text-red-600"}`}
                        >
                          <Power size={24} />
                          {relayData.val ? "ON" : "OFF"}
                        </div>
                      </div>
                      <div className="bg-white p-6 rounded-xl border-2 border-lime-100 shadow-lg card-hover">
                        <div className="text-sm text-gray-600 font-semibold mb-2">User ID</div>
                        <div className="text-2xl font-bold text-gray-800">{relayData.iduser}</div>
                      </div>
                      <div className="bg-white p-6 rounded-xl border-2 border-lime-100 shadow-lg card-hover">
                        <div className="text-sm text-gray-600 font-semibold mb-2">Relay ID</div>
                        <div className="text-2xl font-bold text-gray-800">{relayData.id}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 animate-fadeInUp">
                    <div className="w-32 h-32 bg-gradient-to-br from-lime-100 to-green-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                      <Cpu size={48} className="text-lime-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Belum Ada Data Relay</h3>
                    <p className="text-gray-600 text-lg">
                      {!selectedPool
                        ? "Pilih kolam dan klik 'Get Status' untuk mengambil data relay"
                        : `Klik 'Get Status' untuk mengambil data relay dari kolam ${selectedPool}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MicroController
