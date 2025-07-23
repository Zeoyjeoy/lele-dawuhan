"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, RefreshCw, Send, Cpu, Zap, Database, CheckCircle, AlertCircle, Wifi, WifiOff } from "lucide-react"
import { useNavigate } from "react-router-dom"
import Sidebar from "../Sidebar/Sidebar"

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

  // Show notification
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
        return <Wifi className="text-green-500" size={20} />
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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      {sidebarVisible && <Sidebar />}

      {/* Main Content */}
      <div className="flex-grow p-6">
        {/* Notification */}
        {notification && (
          <div
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${
              notification.type === "success"
                ? "bg-green-100 border border-green-400 text-green-700"
                : "bg-red-100 border border-red-400 text-red-700"
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <span className="text-sm">{notification.message}</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white shadow-sm border-b mb-6">
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
                  <h1 className="text-3xl font-bold text-gray-900">MicroController</h1>
                  <p className="text-gray-600 mt-1">Kelola komunikasi dengan microcontroller IoT</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {/* Connection Status */}
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                  {getConnectionIcon()}
                  <span className="text-sm font-medium">{getConnectionText()}</span>
                </div>

                {/* Debug Info */}
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                  <span className="text-xs text-blue-700">
                    User: {userSession?.id || "N/A"} | Token: {userSession?.token ? "✅" : "❌"}
                  </span>
                </div>

                <select
                  value={selectedPool}
                  onChange={(e) => setSelectedPool(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("sensor")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "sensor"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Database className="inline mr-2" size={16} />
                Push Data Sensor
              </button>
              <button
                onClick={() => setActiveTab("relay")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "relay"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Zap className="inline mr-2" size={16} />
                Get Relay Status
              </button>
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Sensor Data Tab */}
          {activeTab === "sensor" && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Push Data Sensor ke Server</h3>
                    <p className="text-sm text-gray-600 mt-1">Endpoint: {MICRO_SENSOR_API}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={generateSampleData}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
                    >
                      Generate Sample
                    </button>
                    <button
                      onClick={sendSensorData}
                      disabled={loading || !selectedPool}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Send size={16} />
                      {loading ? "Mengirim..." : "Kirim Data"}
                    </button>
                  </div>
                </div>

                {/* Sensor Input Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Solar Panel */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 border-b pb-2">Panel Surya</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">PV Voltage (V)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={sensorData.pvVoltage}
                        onChange={(e) => handleSensorInputChange("pvVoltage", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="12.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">PV Current (A)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={sensorData.pvCurrent}
                        onChange={(e) => handleSensorInputChange("pvCurrent", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="1.2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">PV Power (W)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={sensorData.pvPower}
                        onChange={(e) => handleSensorInputChange("pvPower", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="15.0"
                      />
                    </div>
                  </div>

                  {/* Battery */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 border-b pb-2">Baterai</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Battery Voltage (V)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={sensorData.battVoltage}
                        onChange={(e) => handleSensorInputChange("battVoltage", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="11.8"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Charge Current (A)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={sensorData.battChCurrent}
                        onChange={(e) => handleSensorInputChange("battChCurrent", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="1.0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Discharge Current (A)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={sensorData.battDischCurrent}
                        onChange={(e) => handleSensorInputChange("battDischCurrent", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Battery Temp (°C)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={sensorData.battTemp}
                        onChange={(e) => handleSensorInputChange("battTemp", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="30.0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Battery Percentage (%)</label>
                      <input
                        type="number"
                        step="1"
                        value={sensorData.battPercentage}
                        onChange={(e) => handleSensorInputChange("battPercentage", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="85"
                      />
                    </div>
                  </div>

                  {/* Environment & Bioflok */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 border-b pb-2">Lingkungan & Bioflok</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Env Temperature (°C)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={sensorData.envTemp}
                        onChange={(e) => handleSensorInputChange("envTemp", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="29.0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">pH Bioflok</label>
                      <input
                        type="number"
                        step="0.1"
                        value={sensorData.phBioflok}
                        onChange={(e) => handleSensorInputChange("phBioflok", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="7.1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Temp Bioflok (°C)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={sensorData.tempBioflok}
                        onChange={(e) => handleSensorInputChange("tempBioflok", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="28.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">DO Bioflok (mg/L)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={sensorData.doBioflok}
                        onChange={(e) => handleSensorInputChange("doBioflok", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="6.8"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Load Current (A)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={sensorData.loadCurrent}
                        onChange={(e) => handleSensorInputChange("loadCurrent", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.5"
                      />
                    </div>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="mt-6 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Timestamp</label>
                      <input
                        type="text"
                        value={sensorData.timestamp}
                        onChange={(e) => handleSensorInputChange("timestamp", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="2025-07-11T12:00:00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kolam Terpilih</label>
                      <input
                        type="text"
                        value={selectedPool}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
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
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Get Relay Status dari MicroController</h3>
                    <p className="text-sm text-gray-600 mt-1">Endpoint: {MICRO_RELAY_API}</p>
                  </div>
                  <button
                    onClick={getRelayStatus}
                    disabled={relayLoading || !selectedPool}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Cpu size={16} />
                    {relayLoading ? "Mengambil..." : "Get Status"}
                  </button>
                </div>

                {/* Relay Status Display */}
                {relayData ? (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-medium text-gray-900 mb-4">✅ Status Relay Ditemukan:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white p-4 rounded-lg border">
                        <div className="text-sm text-gray-600">Kode Relay</div>
                        <div className="text-lg font-semibold">{relayData.code}</div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border">
                        <div className="text-sm text-gray-600">Status</div>
                        <div className={`text-lg font-semibold ${relayData.val ? "text-green-600" : "text-red-600"}`}>
                          {relayData.val ? "🟢 ON" : "🔴 OFF"}
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border">
                        <div className="text-sm text-gray-600">User ID</div>
                        <div className="text-lg font-semibold">{relayData.iduser}</div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border">
                        <div className="text-sm text-gray-600">Relay ID</div>
                        <div className="text-lg font-semibold">{relayData.id}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Cpu size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Data Relay</h3>
                    <p className="text-gray-600">
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
