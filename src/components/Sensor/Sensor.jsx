"use client"
import { useState, useEffect } from "react"
import { ArrowLeft, RefreshCw, TrendingUp, Battery, Zap, Activity, Thermometer, Droplets } from "lucide-react"
import { useNavigate } from "react-router-dom"
import Sidebar from "../Sidebar/Sidebar"

// Simple Chart Component
const SimpleLineChart = ({ data, dataKey, color, title, unit = "" }) => {
  if (!data || data.length === 0) return <div className="text-gray-500">No data available</div>

  const maxValue = Math.max(...data.map((item) => item[dataKey] || 0))
  const minValue = Math.min(...data.map((item) => item[dataKey] || 0))
  const range = maxValue - minValue || 1

  return (
    <div className="w-full">
      <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>
      <div className="relative h-32 bg-gray-50 rounded border">
        <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2"
            points={data
              .map((item, index) => {
                const x = (index / (data.length - 1)) * 400
                const y = 120 - ((item[dataKey] - minValue) / range) * 100
                return `${x},${y}`
              })
              .join(" ")}
          />
        </svg>
        <div className="absolute top-2 right-2 text-xs text-gray-600">
          Max: {maxValue.toFixed(1)}
          {unit}
        </div>
        <div className="absolute bottom-2 right-2 text-xs text-gray-600">
          Min: {minValue.toFixed(1)}
          {unit}
        </div>
      </div>
    </div>
  )
}

const Sensor = () => {
  const [latestData, setLatestData] = useState(null)
  const [historicalData, setHistoricalData] = useState([])
  const [pools, setPools] = useState([])
  const [selectedPool, setSelectedPool] = useState("")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [userSession, setUserSession] = useState(null)
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [activeTab, setActiveTab] = useState("realtime")

  const navigate = useNavigate()

  // API Base URLs
  const SENSOR_API_BASE = "http://43.165.198.49:8089/api/monitoring/sensors"
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
    }
  }

  // Fetch latest sensor data
  const fetchLatestSensorData = async (poolCode) => {
    if (!userSession?.id || !userSession?.token || !poolCode) return

    try {
      setRefreshing(true)

      const response = await fetch(`${SENSOR_API_BASE}/latest?code=${poolCode}&id=${userSession.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userSession.token}`,
        },
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()
      console.log("Latest sensor data:", data)

      if (data.status === "200 OK" && data.payload && data.payload.length > 0) {
        setLatestData(data.payload[0])
      } else {
        console.log("No data found")
        setLatestData(null)
      }
    } catch (error) {
      console.error("Error fetching latest sensor data:", error)
      setLatestData(null)
    } finally {
      setRefreshing(false)
    }
  }

  // Fetch historical sensor data
  const fetchHistoricalSensorData = async (poolCode) => {
    if (!userSession?.id || !userSession?.token || !poolCode) return

    try {
      setLoading(true)

      const response = await fetch(`${SENSOR_API_BASE}?code=${poolCode}&id=${userSession.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userSession.token}`,
        },
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()
      console.log("Historical sensor data:", data)

      if (data.status === "200 OK" && data.payload) {
        const processedData = data.payload.map((item) => ({
          ...item,
          time: new Date(item.timestamp).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          date: new Date(item.timestamp).toLocaleDateString("id-ID"),
        }))
        setHistoricalData(processedData.reverse())
      } else {
        console.log("No historical data found")
        setHistoricalData([])
      }
    } catch (error) {
      console.error("Error fetching historical sensor data:", error)
      setHistoricalData([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch data when userSession is available
  useEffect(() => {
    if (userSession?.id) {
      fetchPools()
    }
  }, [userSession])

  // Fetch sensor data when pool is selected
  useEffect(() => {
    if (selectedPool && userSession?.id) {
      fetchLatestSensorData(selectedPool)
      fetchHistoricalSensorData(selectedPool)
    }
  }, [selectedPool, userSession])

  // Auto refresh latest data every 30 seconds
  useEffect(() => {
    if (selectedPool && activeTab === "realtime") {
      const interval = setInterval(() => {
        fetchLatestSensorData(selectedPool)
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [selectedPool, activeTab, userSession])

  const handlePoolChange = (poolCode) => {
    setSelectedPool(poolCode)
  }

  const handleRefresh = () => {
    if (selectedPool) {
      fetchLatestSensorData(selectedPool)
      fetchHistoricalSensorData(selectedPool)
    }
  }

  const formatValue = (value, unit = "") => {
    if (value === null || value === undefined) return "N/A"
    return `${Number.parseFloat(value).toFixed(1)}${unit}`
  }

  const getStatusColor = (percentage) => {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 50) return "text-yellow-600"
    return "text-red-600"
  }

  const getBatteryIcon = (percentage) => {
    if (percentage >= 80) return "🔋"
    if (percentage >= 50) return "🔋"
    return "🪫"
  }

  // pH Status Color
  const getPhStatusColor = (ph) => {
    if (ph >= 7.0 && ph <= 8.0) return "text-green-600" // Optimal
    if (ph >= 6.5 && ph < 7.0) return "text-yellow-600" // Acceptable
    return "text-red-600" // Critical
  }

  // DO Status Color
  const getDoStatusColor = (doValue) => {
    if (doValue >= 6.0) return "text-green-600" // Good
    if (doValue >= 4.0) return "text-yellow-600" // Acceptable
    return "text-red-600" // Critical
  }

  // Temperature Status Color
  const getTempStatusColor = (temp) => {
    if (temp >= 28 && temp <= 30) return "text-green-600" // Optimal
    if (temp >= 26 && temp <= 32) return "text-yellow-600" // Acceptable
    return "text-red-600" // Critical
  }

  if (loading && !latestData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data sensor...</p>
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
                  <h1 className="text-3xl font-bold text-gray-900">Monitoring Sensor</h1>
                  <p className="text-gray-600 mt-1">Pantau data sensor kolam budidaya secara real-time</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <select
                  value={selectedPool}
                  onChange={(e) => handlePoolChange(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Pilih Kolam</option>
                  {pools.map((pool) => (
                    <option key={pool.id} value={pool.code}>
                      {pool.code} - {pool.name || `Kolam ${pool.code}`}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <RefreshCw size={20} className={refreshing ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("realtime")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "realtime"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Activity className="inline mr-2" size={16} />
                Data Real-time
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "history"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <TrendingUp className="inline mr-2" size={16} />
                Grafik Historis
              </button>
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Real-time Data Tab */}
          {activeTab === "realtime" && (
            <div>
              {!selectedPool ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Activity size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Pilih Kolam</h3>
                  <p className="text-gray-600">Pilih kolam untuk melihat data sensor</p>
                </div>
              ) : !latestData ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Activity size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Data</h3>
                  <p className="text-gray-600">Belum ada data sensor untuk kolam {selectedPool}</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Gunakan MicroController untuk mengirim data sensor ke server
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Solar Panel Metrics */}
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Panel Surya</h3>
                      <Zap className="text-yellow-500" size={24} />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tegangan:</span>
                        <span className="font-medium">{formatValue(latestData.pvVoltage, "V")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Arus:</span>
                        <span className="font-medium">{formatValue(latestData.pvCurrent, "A")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Daya:</span>
                        <span className="font-medium text-green-600">{formatValue(latestData.pvPower, "W")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Battery Metrics - ENHANCED */}
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Baterai</h3>
                      <Battery className="text-blue-500" size={24} />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tegangan:</span>
                        <span className="font-medium">{formatValue(latestData.battVoltage, "V")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Arus Charge:</span>
                        <span className="font-medium">{formatValue(latestData.battChCurrent, "A")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Arus Discharge:</span>
                        <span className="font-medium text-orange-600">
                          {formatValue(latestData.battDischCurrent, "A")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Suhu Baterai:</span>
                        <span className="font-medium">{formatValue(latestData.battTemp, "°C")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Persentase:</span>
                        <span className={`font-bold ${getStatusColor(latestData.battPercentage)}`}>
                          {getBatteryIcon(latestData.battPercentage)} {formatValue(latestData.battPercentage, "%")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Load Metrics */}
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Beban</h3>
                      <Activity className="text-purple-500" size={24} />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Arus:</span>
                        <span className="font-medium">{formatValue(latestData.loadCurrent, "A")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Daya:</span>
                        <span className="font-medium text-purple-600">{formatValue(latestData.loadPower, "W")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Waktu:</span>
                        <span className="font-medium text-sm">
                          {latestData.timestamp ? new Date(latestData.timestamp).toLocaleString("id-ID") : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Environment Metrics */}
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Lingkungan</h3>
                      <Thermometer className="text-orange-500" size={24} />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Suhu Lingkungan:</span>
                        <span className="font-medium">{formatValue(latestData.envTemp, "°C")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-medium ${getTempStatusColor(latestData.envTemp)}`}>
                          {latestData.envTemp >= 26 && latestData.envTemp <= 32 ? "Normal" : "Perlu Perhatian"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bioflok Water Quality */}
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Kualitas Air</h3>
                      <Droplets className="text-cyan-500" size={24} />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">pH Bioflok:</span>
                        <span className={`font-medium ${getPhStatusColor(latestData.phBioflok)}`}>
                          {formatValue(latestData.phBioflok)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Suhu Air:</span>
                        <span className={`font-medium ${getTempStatusColor(latestData.tempBioflok)}`}>
                          {formatValue(latestData.tempBioflok, "°C")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">DO (Oksigen):</span>
                        <span className={`font-medium ${getDoStatusColor(latestData.doBioflok)}`}>
                          {formatValue(latestData.doBioflok, " mg/L")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* System Status Summary */}
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Status Sistem</h3>
                      <Activity className="text-green-500" size={24} />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Kode Kolam:</span>
                        <span className="font-medium">{latestData.code}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">User ID:</span>
                        <span className="font-medium">{latestData.iduser}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status Keseluruhan:</span>
                        <span className="font-medium text-green-600">🟢 Normal</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Historical Data Tab */}
          {activeTab === "history" && (
            <div>
              {!selectedPool ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Pilih Kolam</h3>
                  <p className="text-gray-600">Pilih kolam untuk melihat grafik historis</p>
                </div>
              ) : historicalData.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Data Historis</h3>
                  <p className="text-gray-600">Belum ada data historis untuk kolam {selectedPool}</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Gunakan MicroController untuk mengirim data sensor ke server
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Power Chart */}
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Grafik Daya (Power)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <SimpleLineChart
                        data={historicalData}
                        dataKey="pvPower"
                        color="#f59e0b"
                        title="Panel Surya"
                        unit="W"
                      />
                      <SimpleLineChart
                        data={historicalData}
                        dataKey="battChPower"
                        color="#3b82f6"
                        title="Charge Baterai"
                        unit="W"
                      />
                      <SimpleLineChart
                        data={historicalData}
                        dataKey="loadPower"
                        color="#8b5cf6"
                        title="Beban"
                        unit="W"
                      />
                    </div>
                  </div>

                  {/* Temperature Charts */}
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Grafik Suhu (Temperature)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <SimpleLineChart
                        data={historicalData}
                        dataKey="envTemp"
                        color="#f97316"
                        title="Suhu Lingkungan"
                        unit="°C"
                      />
                      <SimpleLineChart
                        data={historicalData}
                        dataKey="tempBioflok"
                        color="#06b6d4"
                        title="Suhu Air Bioflok"
                        unit="°C"
                      />
                      <SimpleLineChart
                        data={historicalData}
                        dataKey="battTemp"
                        color="#8b5cf6"
                        title="Suhu Baterai"
                        unit="°C"
                      />
                    </div>
                  </div>

                  {/* Water Quality Charts */}
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Kualitas Air Bioflok</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <SimpleLineChart
                        data={historicalData}
                        dataKey="phBioflok"
                        color="#10b981"
                        title="pH Bioflok"
                        unit=""
                      />
                      <SimpleLineChart
                        data={historicalData}
                        dataKey="doBioflok"
                        color="#3b82f6"
                        title="Dissolved Oxygen"
                        unit=" mg/L"
                      />
                    </div>
                  </div>

                  {/* Battery Enhanced Charts */}
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Monitoring Baterai Lengkap</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <SimpleLineChart
                        data={historicalData}
                        dataKey="battPercentage"
                        color="#10b981"
                        title="Persentase Baterai"
                        unit="%"
                      />
                      <SimpleLineChart
                        data={historicalData}
                        dataKey="battDischCurrent"
                        color="#ef4444"
                        title="Arus Discharge"
                        unit="A"
                      />
                    </div>
                  </div>

                  {/* Voltage Chart */}
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Grafik Tegangan (Voltage)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <SimpleLineChart
                        data={historicalData}
                        dataKey="pvVoltage"
                        color="#f59e0b"
                        title="Panel Surya"
                        unit="V"
                      />
                      <SimpleLineChart
                        data={historicalData}
                        dataKey="battVoltage"
                        color="#3b82f6"
                        title="Baterai"
                        unit="V"
                      />
                    </div>
                  </div>

                  {/* Current Chart */}
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Grafik Arus (Current)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <SimpleLineChart
                        data={historicalData}
                        dataKey="pvCurrent"
                        color="#f59e0b"
                        title="Panel Surya"
                        unit="A"
                      />
                      <SimpleLineChart
                        data={historicalData}
                        dataKey="battChCurrent"
                        color="#3b82f6"
                        title="Charge Baterai"
                        unit="A"
                      />
                      <SimpleLineChart
                        data={historicalData}
                        dataKey="loadCurrent"
                        color="#8b5cf6"
                        title="Beban"
                        unit="A"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Sensor
