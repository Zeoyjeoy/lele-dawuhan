"use client"

import { useState, useEffect } from "react"
import {
  ArrowLeft,
  RefreshCw,
  Send,
  Cpu,
  Zap,
  Database,
  CheckCircle,
  AlertCircle,
  Wifi,
  WifiOff,
  Battery,
  Sun,
  Droplets,
  Power,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import Sidebar from "../Sidebar/Sidebar"
import "./MicroController.css"

const MicroController = () => {
  const [pools, setPools] = useState([])
  const [selectedPool, setSelectedPool] = useState("")
  const [userSession, setUserSession] = useState(null)
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [activeTab, setActiveTab] = useState("sensor") // sensor or relay
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState("disconnected") // connected, disconnected, connecting

  // Sensor Data State
  const [sensorData, setSensorData] = useState({
    timestamp: "",
    pvVoltage: "",
    pvCurrent: "",
    pvPower: "",
    battVoltage: "",
    battChCurrent: "",
    battChPower: "",
    battDischCurrent: "",
    battTemp: "",
    battPercentage: "",
    loadCurrent: "",
    loadPower: "",
    envTemp: "",
    phBioflok: "",
    tempBioflok: "",
    doBioflok: "",
  })

  // Relay Data State
  const [relayData, setRelayData] = useState(null)
  const [relayLoading, setRelayLoading] = useState(false)

  const navigate = useNavigate()

  // API Base URLs - CORRECTED ENDPOINTS
  const MICRO_SENSOR_API = "http://43.165.198.49:8089/api/monitoring/micro/sensors"
  const MICRO_RELAY_API = "http://43.165.198.49:8089/api/control/micro/getByCode"
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

  // Auto-generate current timestamp
  const generateTimestamp = () => {
    return new Date().toISOString()
  }

  // Generate sample sensor data
  const generateSampleData = () => {
    setSensorData({
      timestamp: generateTimestamp(),
      pvVoltage: (12 + Math.random() * 2).toFixed(1),
      pvCurrent: (1 + Math.random() * 0.5).toFixed(1),
      pvPower: (15 + Math.random() * 5).toFixed(1),
      battVoltage: (11.5 + Math.random() * 1).toFixed(1),
      battChCurrent: (0.8 + Math.random() * 0.4).toFixed(1),
      battChPower: (10 + Math.random() * 3).toFixed(1),
      battDischCurrent: (0.1 + Math.random() * 0.3).toFixed(1),
      battTemp: (25 + Math.random() * 10).toFixed(1),
      battPercentage: (70 + Math.random() * 25).toFixed(0),
      loadCurrent: (0.3 + Math.random() * 0.4).toFixed(1),
      loadPower: (4 + Math.random() * 3).toFixed(1),
      envTemp: (26 + Math.random() * 6).toFixed(1),
      phBioflok: (6.5 + Math.random() * 1.5).toFixed(1),
      tempBioflok: (27 + Math.random() * 4).toFixed(1),
      doBioflok: (5 + Math.random() * 3).toFixed(1),
    })
  }

  // Send sensor data to server (POST) - FIXED ENDPOINT
  const sendSensorData = async () => {
    if (!selectedPool) {
      showNotification("Pilih kolam terlebih dahulu", "error")
      return
    }

    if (!userSession?.id || !userSession?.token) {
      showNotification("Session tidak valid", "error")
      return
    }

    try {
      setLoading(true)
      setConnectionStatus("connecting")

      const payload = {
        ...sensorData,
        code: selectedPool,
        iduser: userSession.id.toString(),
        timestamp: sensorData.timestamp || generateTimestamp(),
      }

      console.log("Sending sensor data to:", MICRO_SENSOR_API)
      console.log("Payload:", payload)

      const response = await fetch(MICRO_SENSOR_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userSession.token}`,
        },
        body: JSON.stringify(payload),
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.log("Error response:", errorText)
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("Response data:", data)

      // Check for different success response formats
      if (data.status === "success" || data.message === "Data berhasil disimpan") {
        showNotification("✅ Data sensor berhasil dikirim ke server!")
        setConnectionStatus("connected")
        // Auto disconnect after 3 seconds
        setTimeout(() => {
          setConnectionStatus("disconnected")
        }, 3000)
      } else {
        throw new Error(data.message || "Gagal mengirim data")
      }
    } catch (error) {
      console.error("Error sending sensor data:", error)
      showNotification("❌ Gagal mengirim data sensor: " + error.message, "error")
      setConnectionStatus("disconnected")
    } finally {
      setLoading(false)
    }
  }

  // Get relay status from microcontroller (GET) - FIXED ENDPOINT
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

  // Handle input changes
  const handleSensorInputChange = (field, value) => {
    setSensorData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Fetch data when userSession is available
  useEffect(() => {
    if (userSession?.id) {
      fetchPools()
    }
  }, [userSession])

  // Auto-generate timestamp when component mounts
  useEffect(() => {
    setSensorData((prev) => ({
      ...prev,
      timestamp: generateTimestamp(),
    }))
  }, [])

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
                    <Cpu size={36} />
                    MicroController
                  </h1>
                  <p className="text-lime-100 text-lg">Kelola komunikasi dengan microcontroller IoT</p>
                </div>
              </div>

              <div className="flex items-center gap-4 animate-slideInFromRight">
                {/* Connection Status */}
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 ${getConnectionStatusColor()} ${
                    connectionStatus === "connected" ? "connection-pulse" : ""
                  }`}
                >
                  {getConnectionIcon()}
                  <span className="font-semibold">{getConnectionText()}</span>
                </div>

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
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 -mt-4 relative z-10">
          <div className="bg-white rounded-2xl shadow-xl border-2 border-lime-100 p-2">
            <nav className="flex space-x-2">
              <button
                onClick={() => setActiveTab("sensor")}
                className={`flex-1 py-4 px-6 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-3 ${
                  activeTab === "sensor"
                    ? "bg-gradient-to-r from-lime-400 to-green-500 text-white shadow-lg transform scale-105"
                    : "text-gray-600 hover:bg-lime-50 hover:text-lime-700"
                }`}
              >
                <Database size={20} />
                Push Data Sensor
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
                Get Relay Status
              </button>
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          {/* Sensor Data Tab */}
          {activeTab === "sensor" && (
            <div className="space-y-8 tab-content">
              <div className="bg-white rounded-2xl shadow-xl border-2 border-lime-100 p-8 card-hover animate-fadeInUp">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-r from-lime-400 to-green-500 p-4 rounded-xl">
                      <Send size={28} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">Push Data Sensor ke Server</h3>
                      <p className="text-gray-600 mt-1">Kirim data sensor dari microcontroller ke database</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={generateSampleData}
                      className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl text-sm transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 btn-ripple"
                    >
                      Generate Sample
                    </button>
                    <button
                      onClick={sendSensorData}
                      disabled={loading || !selectedPool}
                      className="px-8 py-3 bg-gradient-to-r from-lime-400 to-green-500 hover:from-lime-500 hover:to-green-600 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl flex items-center gap-3 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 btn-ripple"
                    >
                      <Send size={18} />
                      {loading ? "Mengirim..." : "Kirim Data"}
                    </button>
                  </div>
                </div>

                {/* Sensor Input Form */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Solar Panel Section */}
                  <div className="space-y-4 form-section p-6 rounded-xl border-2 border-lime-100 animate-fadeInUp delay-100">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-3 rounded-lg">
                        <Sun size={24} className="text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-800">Panel Surya</h4>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">PV Voltage (V)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={sensorData.pvVoltage}
                        onChange={(e) => handleSensorInputChange("pvVoltage", e.target.value)}
                        className="w-full px-4 py-3 border-2 border-lime-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-lime-200 focus:border-lime-400 transition-all duration-300 input-focus-effect"
                        placeholder="12.5"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">PV Current (A)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={sensorData.pvCurrent}
                        onChange={(e) => handleSensorInputChange("pvCurrent", e.target.value)}
                        className="w-full px-4 py-3 border-2 border-lime-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-lime-200 focus:border-lime-400 transition-all duration-300 input-focus-effect"
                        placeholder="1.2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">PV Power (W)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={sensorData.pvPower}
                        onChange={(e) => handleSensorInputChange("pvPower", e.target.value)}
                        className="w-full px-4 py-3 border-2 border-lime-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-lime-200 focus:border-lime-400 transition-all duration-300 input-focus-effect"
                        placeholder="15.0"
                      />
                    </div>
                  </div>

                  {/* Battery Section */}
                  <div className="space-y-4 form-section p-6 rounded-xl border-2 border-lime-100 animate-fadeInUp delay-200">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-gradient-to-r from-green-400 to-emerald-500 p-3 rounded-lg">
                        <Battery size={24} className="text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-800">Baterai</h4>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Battery Voltage (V)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={sensorData.battVoltage}
                        onChange={(e) => handleSensorInputChange("battVoltage", e.target.value)}
                        className="w-full px-4 py-3 border-2 border-lime-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-lime-200 focus:border-lime-400 transition-all duration-300 input-focus-effect"
                        placeholder="11.8"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Charge Current (A)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={sensorData.battChCurrent}
                        onChange={(e) => handleSensorInputChange("battChCurrent", e.target.value)}
                        className="w-full px-4 py-3 border-2 border-lime-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-lime-200 focus:border-lime-400 transition-all duration-300 input-focus-effect"
                        placeholder="1.0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Discharge Current (A)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={sensorData.battDischCurrent}
                        onChange={(e) => handleSensorInputChange("battDischCurrent", e.target.value)}
                        className="w-full px-4 py-3 border-2 border-lime-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-lime-200 focus:border-lime-400 transition-all duration-300 input-focus-effect"
                        placeholder="0.2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Battery Temp (°C)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={sensorData.battTemp}
                        onChange={(e) => handleSensorInputChange("battTemp", e.target.value)}
                        className="w-full px-4 py-3 border-2 border-lime-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-lime-200 focus:border-lime-400 transition-all duration-300 input-focus-effect"
                        placeholder="30.0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Battery Percentage (%)</label>
                      <input
                        type="number"
                        step="1"
                        value={sensorData.battPercentage}
                        onChange={(e) => handleSensorInputChange("battPercentage", e.target.value)}
                        className="w-full px-4 py-3 border-2 border-lime-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-lime-200 focus:border-lime-400 transition-all duration-300 input-focus-effect"
                        placeholder="85"
                      />
                    </div>
                  </div>

                  {/* Environment & Bioflok Section */}
                  <div className="space-y-4 form-section p-6 rounded-xl border-2 border-lime-100 animate-fadeInUp delay-300">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-gradient-to-r from-blue-400 to-cyan-500 p-3 rounded-lg">
                        <Droplets size={24} className="text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-800">Lingkungan & Bioflok</h4>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Env Temperature (°C)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={sensorData.envTemp}
                        onChange={(e) => handleSensorInputChange("envTemp", e.target.value)}
                        className="w-full px-4 py-3 border-2 border-lime-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-lime-200 focus:border-lime-400 transition-all duration-300 input-focus-effect"
                        placeholder="29.0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">pH Bioflok</label>
                      <input
                        type="number"
                        step="0.1"
                        value={sensorData.phBioflok}
                        onChange={(e) => handleSensorInputChange("phBioflok", e.target.value)}
                        className="w-full px-4 py-3 border-2 border-lime-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-lime-200 focus:border-lime-400 transition-all duration-300 input-focus-effect"
                        placeholder="7.1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Temp Bioflok (°C)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={sensorData.tempBioflok}
                        onChange={(e) => handleSensorInputChange("tempBioflok", e.target.value)}
                        className="w-full px-4 py-3 border-2 border-lime-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-lime-200 focus:border-lime-400 transition-all duration-300 input-focus-effect"
                        placeholder="28.5"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">DO Bioflok (mg/L)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={sensorData.doBioflok}
                        onChange={(e) => handleSensorInputChange("doBioflok", e.target.value)}
                        className="w-full px-4 py-3 border-2 border-lime-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-lime-200 focus:border-lime-400 transition-all duration-300 input-focus-effect"
                        placeholder="6.8"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Load Current (A)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={sensorData.loadCurrent}
                        onChange={(e) => handleSensorInputChange("loadCurrent", e.target.value)}
                        className="w-full px-4 py-3 border-2 border-lime-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-lime-200 focus:border-lime-400 transition-all duration-300 input-focus-effect"
                        placeholder="0.5"
                      />
                    </div>
                  </div>
                </div>

                {/* Timestamp Section */}
                <div className="mt-8 pt-6 border-t-2 border-lime-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Timestamp</label>
                      <input
                        type="text"
                        value={sensorData.timestamp}
                        onChange={(e) => handleSensorInputChange("timestamp", e.target.value)}
                        className="w-full px-4 py-3 border-2 border-lime-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-lime-200 focus:border-lime-400 transition-all duration-300 input-focus-effect"
                        placeholder="2025-07-11T12:00:00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Kolam Terpilih</label>
                      <input
                        type="text"
                        value={selectedPool}
                        readOnly
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 font-semibold text-gray-600"
                        placeholder="Pilih kolam"
                      />
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
                      <h3 className="text-2xl font-bold text-gray-800">Get Relay Status dari MicroController</h3>
                      <p className="text-gray-600 mt-1">Ambil status relay dari microcontroller</p>
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
                          className={`text-2xl font-bold flex items-center gap-2 ${
                            relayData.val ? "text-green-600" : "text-red-600"
                          }`}
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
