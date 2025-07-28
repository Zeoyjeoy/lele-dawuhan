"use client"

import { useState, useEffect, useRef } from "react"
import {
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  Battery,
  Activity,
  Thermometer,
  Droplets,
  Sun,
  Power,
  BarChart3,
  Eye,
  Download,
  Calendar,
  ImageIcon,
  FileText,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import html2canvas from "html2canvas"
import Sidebar from "../Sidebar/Sidebar"
import "./Sensor.css"

// Enhanced Chart Component with detailed data display
const SimpleLineChart = ({ data, dataKey, color, title, unit = "", chartRef }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null)
  const [showTable, setShowTable] = useState(false)

  if (!data || data.length === 0) return <div className="text-gray-500">No data available</div>

  const maxValue = Math.max(...data.map((item) => item[dataKey] || 0))
  const minValue = Math.min(...data.map((item) => item[dataKey] || 0))
  const range = maxValue - minValue || 1
  const avgValue = data.reduce((sum, item) => sum + (item[dataKey] || 0), 0) / data.length

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pointIndex = Math.round((x / rect.width) * (data.length - 1))
    if (pointIndex >= 0 && pointIndex < data.length) {
      setHoveredPoint({ index: pointIndex, data: data[pointIndex] })
    }
  }

  const handleMouseLeave = () => {
    setHoveredPoint(null)
  }

  return (
    <div className="w-full chart-container p-4" ref={chartRef}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
        <button
          onClick={() => setShowTable(!showTable)}
          className="text-xs text-lime-600 hover:text-lime-800 underline font-medium transition-colors"
        >
          {showTable ? "Hide Details" : "Show Details"}
        </button>
      </div>
      <div className="relative h-32 bg-gradient-to-br from-lime-50 to-green-50 rounded-xl border-2 border-lime-100 chart-hover">
        <svg
          className="w-full h-full cursor-crosshair"
          viewBox="0 0 400 120"
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Grid lines */}
          <defs>
            <pattern id={`grid-${dataKey}`} width="40" height="24" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 24" fill="none" stroke="#d1fae5" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="400" height="120" fill={`url(#grid-${dataKey})`} />

          {/* Main line */}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="3"
            className="animate-chartPulse"
            points={data
              .map((item, index) => {
                const x = (index / (data.length - 1)) * 400
                const y = 120 - ((item[dataKey] - minValue) / range) * 100
                return `${x},${y}`
              })
              .join(" ")}
          />

          {/* Data points */}
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 400
            const y = 120 - ((item[dataKey] - minValue) / range) * 100
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill={color}
                className="opacity-80 hover:opacity-100 transition-opacity"
              />
            )
          })}

          {/* Hover indicator */}
          {hoveredPoint && (
            <g>
              <line
                x1={(hoveredPoint.index / (data.length - 1)) * 400}
                y1="0"
                x2={(hoveredPoint.index / (data.length - 1)) * 400}
                y2="120"
                stroke="#374151"
                strokeWidth="2"
                strokeDasharray="4,4"
              />
              <circle
                cx={(hoveredPoint.index / (data.length - 1)) * 400}
                cy={120 - ((hoveredPoint.data[dataKey] - minValue) / range) * 100}
                r="6"
                fill={color}
                stroke="white"
                strokeWidth="3"
                className="animate-pulse"
              />
            </g>
          )}
        </svg>

        {/* Stats display */}
        <div className="absolute top-2 right-2 text-xs text-gray-700 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-sm border border-lime-200">
          <div className="font-semibold text-green-600">
            Max: {maxValue.toFixed(1)}
            {unit}
          </div>
          <div className="font-medium text-lime-600">
            Avg: {avgValue.toFixed(1)}
            {unit}
          </div>
          <div className="font-medium text-gray-600">
            Min: {minValue.toFixed(1)}
            {unit}
          </div>
        </div>

        {/* Hover tooltip */}
        {hoveredPoint && (
          <div className="absolute bottom-2 left-2 text-xs bg-gradient-to-r from-lime-600 to-green-600 text-white p-3 rounded-lg shadow-xl border border-lime-300">
            <div className="font-semibold">{hoveredPoint.data.time || "N/A"}</div>
            <div className="font-medium">
              {title}: {Number.parseFloat(hoveredPoint.data[dataKey] || 0).toFixed(2)}
              {unit}
            </div>
            <div className="text-lime-100 text-xs">{hoveredPoint.data.date || "N/A"}</div>
          </div>
        )}
      </div>

      {/* Detailed data table */}
      {showTable && (
        <div className="mt-4 max-h-48 overflow-y-auto border-2 border-lime-200 rounded-xl data-table">
          <table className="w-full text-xs">
            <thead className="bg-gradient-to-r from-lime-100 to-green-100 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-800">Time</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-800">Date</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-800">{title}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index} className="border-t border-lime-100 hover:bg-lime-50 transition-colors">
                  <td className="px-3 py-2 font-medium">{item.time || "N/A"}</td>
                  <td className="px-3 py-2">{item.date || "N/A"}</td>
                  <td className="px-3 py-2 text-right font-mono font-semibold text-green-600">
                    {Number.parseFloat(item[dataKey] || 0).toFixed(2)}
                    {unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// Comprehensive Data Table Component
const ComprehensiveDataTable = ({ data }) => {
  const [sortField, setSortField] = useState("timestamp")
  const [sortDirection, setSortDirection] = useState("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const sortedData = [...data].sort((a, b) => {
    const aVal = a[sortField] || 0
    const bVal = b[sortField] || 0
    if (sortDirection === "asc") {
      return aVal > bVal ? 1 : -1
    }
    return aVal < bVal ? 1 : -1
  })

  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.ceil(sortedData.length / itemsPerPage)

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const fields = [
    { key: "timestamp", label: "Waktu", format: (val) => new Date(val).toLocaleString("id-ID") },
    { key: "pvVoltage", label: "PV Voltage", unit: "V" },
    { key: "pvCurrent", label: "PV Current", unit: "A" },
    { key: "pvPower", label: "PV Power", unit: "W" },
    { key: "battVoltage", label: "Batt Voltage", unit: "V" },
    { key: "battChCurrent", label: "Batt Ch Current", unit: "A" },
    { key: "battDischCurrent", label: "Batt Disch Current", unit: "A" },
    { key: "battTemp", label: "Batt Temp", unit: "°C" },
    { key: "battPercentage", label: "Batt %", unit: "%" },
    { key: "loadCurrent", label: "Load Current", unit: "A" },
    { key: "loadPower", label: "Load Power", unit: "W" },
    { key: "envTemp", label: "Env Temp", unit: "°C" },
    { key: "phBioflok", label: "pH", unit: "" },
    { key: "tempBioflok", label: "Water Temp", unit: "°C" },
    { key: "doBioflok", label: "DO", unit: "mg/L" },
  ]

  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-lime-100 p-8 data-table animate-fadeInUp">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-800 gradient-text">Data Detail Lengkap</h3>
        <div className="text-sm text-gray-600 bg-lime-100 px-4 py-2 rounded-xl font-semibold">
          Total: {data.length} records
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-lime-100 to-green-100">
              {fields.map((field) => (
                <th
                  key={field.key}
                  className="px-3 py-3 text-left border-2 border-lime-200 cursor-pointer hover:bg-lime-200 transition-colors font-semibold"
                  onClick={() => handleSort(field.key)}
                >
                  <div className="flex items-center gap-2">
                    {field.label}
                    {field.unit && <span className="text-gray-500">({field.unit})</span>}
                    {sortField === field.key && (
                      <span className="text-lime-600 font-bold">{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item, index) => (
              <tr key={index} className="hover:bg-lime-50 transition-colors">
                {fields.map((field) => (
                  <td key={field.key} className="px-3 py-3 border border-lime-100 font-mono text-right">
                    {field.format
                      ? field.format(item[field.key])
                      : item[field.key]
                        ? Number.parseFloat(item[field.key]).toFixed(2)
                        : "N/A"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t-2 border-lime-100">
          <div className="text-sm text-gray-600">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, data.length)} of{" "}
            {data.length} entries
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm border-2 border-lime-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-lime-50 transition-colors font-semibold"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm bg-lime-100 rounded-xl font-semibold">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm border-2 border-lime-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-lime-50 transition-colors font-semibold"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Date Range Picker Component
const DateRangePicker = ({ startDate, endDate, onStartDateChange, onEndDateChange, onApply, onReset }) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-lime-100 p-6 mb-6 animate-fadeInUp">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Calendar size={20} />
        Filter Tanggal
      </h3>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-600 mb-1">Tanggal Mulai</label>
          <input
            type="datetime-local"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="px-3 py-2 border-2 border-lime-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-lime-400 text-sm"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-600 mb-1">Tanggal Akhir</label>
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="px-3 py-2 border-2 border-lime-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-lime-400 text-sm"
          />
        </div>
        <div className="flex gap-2 mt-6">
          <button
            onClick={onApply}
            className="px-4 py-2 bg-gradient-to-r from-lime-400 to-green-500 hover:from-lime-500 hover:to-green-600 text-white rounded-lg text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Terapkan Filter
          </button>
          <button
            onClick={onReset}
            className="px-4 py-2 border-2 border-lime-200 hover:bg-lime-50 text-gray-700 rounded-lg text-sm font-semibold transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}

const Sensor = () => {
  const [latestData, setLatestData] = useState(null)
  const [historicalData, setHistoricalData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [pools, setPools] = useState([])
  const [selectedPool, setSelectedPool] = useState("")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [userSession, setUserSession] = useState(null)
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [activeTab, setActiveTab] = useState("realtime")
  const [showAllDetails, setShowAllDetails] = useState(false)

  // Date filtering states
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [dateFilterActive, setDateFilterActive] = useState(false)

  // Chart refs for image download
  const chartRefs = useRef({})

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
        setFilteredData(processedData.reverse())
      } else {
        console.log("No historical data found")
        setHistoricalData([])
        setFilteredData([])
      }
    } catch (error) {
      console.error("Error fetching historical sensor data:", error)
      setHistoricalData([])
      setFilteredData([])
    } finally {
      setLoading(false)
    }
  }

  // Filter data by date range
  const applyDateFilter = () => {
    if (!startDate || !endDate) {
      alert("Mohon pilih tanggal mulai dan tanggal akhir")
      return
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start > end) {
      alert("Tanggal mulai tidak boleh lebih besar dari tanggal akhir")
      return
    }

    const filtered = historicalData.filter((item) => {
      const itemDate = new Date(item.timestamp)
      return itemDate >= start && itemDate <= end
    })

    setFilteredData(filtered)
    setDateFilterActive(true)
  }

  // Reset date filter
  const resetDateFilter = () => {
    setStartDate("")
    setEndDate("")
    setFilteredData(historicalData)
    setDateFilterActive(false)
  }

  // Download CSV function
  const downloadCSV = () => {
    const dataToDownload = dateFilterActive ? filteredData : historicalData

    if (dataToDownload.length === 0) {
      alert("Tidak ada data untuk diunduh")
      return
    }

    const headers = [
      "Timestamp",
      "PV Voltage (V)",
      "PV Current (A)",
      "PV Power (W)",
      "Battery Voltage (V)",
      "Battery Charge Current (A)",
      "Battery Discharge Current (A)",
      "Battery Temperature (°C)",
      "Battery Percentage (%)",
      "Load Current (A)",
      "Load Power (W)",
      "Environment Temperature (°C)",
      "pH Bioflok",
      "Water Temperature (°C)",
      "Dissolved Oxygen (mg/L)",
    ]

    const csvContent = [
      headers.join(","),
      ...dataToDownload.map((item) =>
        [
          new Date(item.timestamp).toLocaleString("id-ID"),
          item.pvVoltage || 0,
          item.pvCurrent || 0,
          item.pvPower || 0,
          item.battVoltage || 0,
          item.battChCurrent || 0,
          item.battDischCurrent || 0,
          item.battTemp || 0,
          item.battPercentage || 0,
          item.loadCurrent || 0,
          item.loadPower || 0,
          item.envTemp || 0,
          item.phBioflok || 0,
          item.tempBioflok || 0,
          item.doBioflok || 0,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `sensor-data-${selectedPool}-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Download chart image function
  const downloadChartImage = async (chartType, period = "1day") => {
    const chartElement = document.querySelector(`[data-chart-type="${chartType}"]`)
    if (!chartElement) {
      alert("Chart tidak ditemukan")
      return
    }

    try {
      const canvas = await html2canvas(chartElement, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
      })

      const link = document.createElement("a")
      link.download = `${chartType}-chart-${selectedPool}-${period}-${new Date().toISOString().split("T")[0]}.png`
      link.href = canvas.toDataURL()
      link.click()
    } catch (error) {
      console.error("Error downloading chart:", error)
      alert("Gagal mengunduh gambar chart")
    }
  }

  // Quick date filter functions
  const setQuickDateFilter = (days) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)

    setStartDate(start.toISOString().slice(0, 16))
    setEndDate(end.toISOString().slice(0, 16))
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

  // Update latest data every 1 hour (changed from 1 minute)
  useEffect(() => {
    if (selectedPool && activeTab === "realtime") {
      const interval = setInterval(() => {
        fetchLatestSensorData(selectedPool)
      }, 3600000) // Refresh every 1 hour (3600000 ms)
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
      <div className="min-h-screen bg-gradient-to-br from-lime-50 via-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center animate-fadeInUp">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-lime-200 border-t-lime-500 mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-green-400 animate-pulse mx-auto"></div>
          </div>
          <p className="text-gray-700 font-medium text-lg">Memuat data sensor...</p>
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
                    <Activity size={36} />
                    Monitoring Sensor
                  </h1>
                  <p className="text-lime-100 text-lg">
                    Pantau data sensor kolam budidaya secara real-time (Update per jam)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 animate-slideInFromRight">
                <select
                  value={selectedPool}
                  onChange={(e) => handlePoolChange(e.target.value)}
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
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="bg-white hover:bg-lime-50 text-green-700 px-6 py-3 rounded-xl flex items-center gap-3 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 btn-ripple font-semibold"
                >
                  <RefreshCw size={20} className={refreshing ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 -mt-4 relative z-10">
          <div className="bg-white rounded-2xl shadow-xl border-2 border-lime-100 p-2">
            <nav className="flex space-x-2">
              <button
                onClick={() => setActiveTab("realtime")}
                className={`flex-1 py-4 px-6 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-3 ${
                  activeTab === "realtime"
                    ? "bg-gradient-to-r from-lime-400 to-green-500 text-white shadow-lg transform scale-105"
                    : "text-gray-600 hover:bg-lime-50 hover:text-lime-700"
                }`}
              >
                <Activity size={20} />
                Data Real-time
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`flex-1 py-4 px-6 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-3 ${
                  activeTab === "history"
                    ? "bg-gradient-to-r from-lime-400 to-green-500 text-white shadow-lg transform scale-105"
                    : "text-gray-600 hover:bg-lime-50 hover:text-lime-700"
                }`}
              >
                <TrendingUp size={20} />
                Grafik Historis
              </button>
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          {/* Real-time Data Tab */}
          {activeTab === "realtime" && (
            <div className="tab-content">
              {!selectedPool ? (
                <div className="text-center py-16 animate-fadeInUp">
                  <div className="w-32 h-32 bg-gradient-to-br from-lime-100 to-green-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                    <Activity size={48} className="text-lime-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">Pilih Kolam</h3>
                  <p className="text-gray-600 text-lg">Pilih kolam untuk melihat data sensor</p>
                </div>
              ) : !latestData ? (
                <div className="text-center py-16 animate-fadeInUp">
                  <div className="w-32 h-32 bg-gradient-to-br from-lime-100 to-green-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                    <Activity size={48} className="text-lime-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">Tidak Ada Data</h3>
                  <p className="text-gray-600 text-lg mb-4">Belum ada data sensor untuk kolam {selectedPool}</p>
                  <p className="text-gray-500 text-sm">Gunakan MicroController untuk mengirim data sensor ke server</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 realtime-data">
                  {/* Solar Panel Metrics */}
                  <div className="bg-white rounded-2xl shadow-xl border-2 border-lime-100 p-8 sensor-card animate-fadeInUp delay-100">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-800">Panel Surya</h3>
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-3 rounded-xl">
                        <Sun size={24} className="text-white" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Tegangan:</span>
                        <span className="font-bold text-lg metric-value">{formatValue(latestData.pvVoltage, "V")}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Arus:</span>
                        <span className="font-bold text-lg metric-value">{formatValue(latestData.pvCurrent, "A")}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Daya:</span>
                        <span className="font-bold text-lg text-green-600 metric-value">
                          {formatValue(latestData.pvPower, "W")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Battery Metrics - ENHANCED */}
                  <div className="bg-white rounded-2xl shadow-xl border-2 border-lime-100 p-8 sensor-card animate-fadeInUp delay-200">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-800">Baterai</h3>
                      <div className="bg-gradient-to-r from-green-400 to-emerald-500 p-3 rounded-xl">
                        <Battery size={24} className="text-white" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Tegangan:</span>
                        <span className="font-bold text-lg metric-value">
                          {formatValue(latestData.battVoltage, "V")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Arus Charge:</span>
                        <span className="font-bold text-lg metric-value">
                          {formatValue(latestData.battChCurrent, "A")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Daya Charge:</span>
                        <span className="font-bold text-lg text-green-600 metric-value">
                          {formatValue(latestData.battChPower, "W")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Arus Discharge:</span>
                        <span className="font-bold text-lg text-orange-600 metric-value">
                          {formatValue(latestData.battDischCurrent, "A")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Suhu Baterai:</span>
                        <span className="font-bold text-lg metric-value">{formatValue(latestData.battTemp, "°C")}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Persentase:</span>
                        <span className={`font-bold text-xl ${getStatusColor(latestData.battPercentage)} metric-value`}>
                          {getBatteryIcon(latestData.battPercentage)} {formatValue(latestData.battPercentage, "%")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Load Metrics */}
                  <div className="bg-white rounded-2xl shadow-xl border-2 border-lime-100 p-8 sensor-card animate-fadeInUp delay-300">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-800">Beban</h3>
                      <div className="bg-gradient-to-r from-purple-400 to-pink-500 p-3 rounded-xl">
                        <Power size={24} className="text-white" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Arus:</span>
                        <span className="font-bold text-lg metric-value">
                          {formatValue(latestData.loadCurrent, "A")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Daya:</span>
                        <span className="font-bold text-lg text-purple-600 metric-value">
                          {formatValue(latestData.loadPower, "W")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Waktu:</span>
                        <span className="font-medium text-sm text-gray-700">
                          {latestData.timestamp ? new Date(latestData.timestamp).toLocaleString("id-ID") : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Environment Metrics */}
                  <div className="bg-white rounded-2xl shadow-xl border-2 border-lime-100 p-8 sensor-card animate-fadeInUp delay-400">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-800">Lingkungan</h3>
                      <div className="bg-gradient-to-r from-orange-400 to-red-500 p-3 rounded-xl">
                        <Thermometer size={24} className="text-white" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Suhu Lingkungan:</span>
                        <span className="font-bold text-lg metric-value">{formatValue(latestData.envTemp, "°C")}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Status:</span>
                        <span
                          className={`font-bold text-lg ${getTempStatusColor(latestData.envTemp)} status-indicator`}
                        >
                          {latestData.envTemp >= 26 && latestData.envTemp <= 32 ? "🟢 Normal" : "🟡 Perlu Perhatian"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bioflok Water Quality */}
                  <div className="bg-white rounded-2xl shadow-xl border-2 border-lime-100 p-8 sensor-card animate-fadeInUp delay-500">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-800">Kualitas Air</h3>
                      <div className="bg-gradient-to-r from-cyan-400 to-blue-500 p-3 rounded-xl">
                        <Droplets size={24} className="text-white" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">pH Bioflok:</span>
                        <span className={`font-bold text-lg ${getPhStatusColor(latestData.phBioflok)} metric-value`}>
                          {formatValue(latestData.phBioflok)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Suhu Air:</span>
                        <span
                          className={`font-bold text-lg ${getTempStatusColor(latestData.tempBioflok)} metric-value`}
                        >
                          {formatValue(latestData.tempBioflok, "°C")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">DO (Oksigen):</span>
                        <span className={`font-bold text-lg ${getDoStatusColor(latestData.doBioflok)} metric-value`}>
                          {formatValue(latestData.doBioflok, " mg/L")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* System Status Summary */}
                  <div className="bg-white rounded-2xl shadow-xl border-2 border-lime-100 p-8 sensor-card animate-fadeInUp delay-600">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-800">Status Sistem</h3>
                      <div className="bg-gradient-to-r from-lime-400 to-green-500 p-3 rounded-xl animate-pulse">
                        <BarChart3 size={24} className="text-white" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Kode Kolam:</span>
                        <span className="font-bold text-lg text-lime-600">{latestData.code}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">User ID:</span>
                        <span className="font-bold text-lg">{latestData.iduser}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Status Keseluruhan:</span>
                        <span className="font-bold text-lg text-green-600 animate-pulse">🟢 Normal</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Historical Data Tab */}
          {activeTab === "history" && (
            <div className="tab-content">
              {!selectedPool ? (
                <div className="text-center py-16 animate-fadeInUp">
                  <div className="w-32 h-32 bg-gradient-to-br from-lime-100 to-green-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                    <TrendingUp size={48} className="text-lime-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">Pilih Kolam</h3>
                  <p className="text-gray-600 text-lg">Pilih kolam untuk melihat grafik historis</p>
                </div>
              ) : historicalData.length === 0 ? (
                <div className="text-center py-16 animate-fadeInUp">
                  <div className="w-32 h-32 bg-gradient-to-br from-lime-100 to-green-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                    <TrendingUp size={48} className="text-lime-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">Tidak Ada Data Historis</h3>
                  <p className="text-gray-600 text-lg mb-4">Belum ada data historis untuk kolam {selectedPool}</p>
                  <p className="text-gray-500 text-sm">Gunakan MicroController untuk mengirim data sensor ke server</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Date Range Picker */}
                  <DateRangePicker
                    startDate={startDate}
                    endDate={endDate}
                    onStartDateChange={setStartDate}
                    onEndDateChange={setEndDate}
                    onApply={applyDateFilter}
                    onReset={resetDateFilter}
                  />

                  {/* Quick Date Filters */}
                  <div className="bg-white rounded-2xl shadow-xl border-2 border-lime-100 p-6 animate-fadeInUp">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Filter Cepat</h3>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => setQuickDateFilter(1)}
                        className="px-4 py-2 bg-lime-100 hover:bg-lime-200 text-lime-700 rounded-lg text-sm font-semibold transition-colors"
                      >
                        1 Hari Terakhir
                      </button>
                      <button
                        onClick={() => setQuickDateFilter(7)}
                        className="px-4 py-2 bg-lime-100 hover:bg-lime-200 text-lime-700 rounded-lg text-sm font-semibold transition-colors"
                      >
                        1 Minggu Terakhir
                      </button>
                      <button
                        onClick={() => setQuickDateFilter(30)}
                        className="px-4 py-2 bg-lime-100 hover:bg-lime-200 text-lime-700 rounded-lg text-sm font-semibold transition-colors"
                      >
                        1 Bulan Terakhir
                      </button>
                    </div>
                  </div>

                  {/* Download Controls */}
                  <div className="bg-white rounded-2xl shadow-xl border-2 border-lime-100 p-6 animate-fadeInUp">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Download size={20} />
                      Unduh Data
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={downloadCSV}
                        className="px-4 py-2 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white rounded-lg text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                      >
                        <FileText size={16} />
                        Unduh CSV {dateFilterActive ? "(Filtered)" : "(All Data)"}
                      </button> 
                    </div>
                  </div>

                  {/* View Toggle */}
                  <div className="flex items-center justify-between animate-fadeInUp">
                    <h2 className="text-2xl font-bold text-gray-800 gradient-text">
                      Data Historis - {selectedPool} {dateFilterActive && "(Filtered)"}
                    </h2>
                    <button
                      onClick={() => setShowAllDetails(!showAllDetails)}
                      className="px-6 py-3 bg-gradient-to-r from-lime-400 to-green-500 hover:from-lime-500 hover:to-green-600 text-white rounded-xl text-sm transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 btn-ripple flex items-center gap-2"
                    >
                      <Eye size={18} />
                      {showAllDetails ? "Show Charts" : "Show All Details"}
                    </button>
                  </div>

                  {showAllDetails ? (
                    <ComprehensiveDataTable data={filteredData} />
                  ) : (
                    <>
                      {/* Power Chart */}
                      <div
                        className="bg-white rounded-2xl shadow-xl border-2 border-lime-100 p-8 animate-fadeInUp delay-100"
                        data-chart-type="power"
                      >
                        <h3 className="text-2xl font-bold text-gray-800 mb-6 gradient-text">Grafik Daya (Power)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <SimpleLineChart
                            data={filteredData}
                            dataKey="pvPower"
                            color="#f59e0b"
                            title="Panel Surya"
                            unit="W"
                          />
                          <SimpleLineChart
                            data={filteredData}
                            dataKey="battChPower"
                            color="#3b82f6"
                            title="Charge Baterai"
                            unit="W"
                          />
                          <SimpleLineChart
                            data={filteredData}
                            dataKey="loadPower"
                            color="#8b5cf6"
                            title="Beban"
                            unit="W"
                          />
                        </div>
                      </div>

                      {/* Temperature Charts */}
                      <div
                        className="bg-white rounded-2xl shadow-xl border-2 border-lime-100 p-8 animate-fadeInUp delay-200"
                        data-chart-type="temperature"
                      >
                        <h3 className="text-2xl font-bold text-gray-800 mb-6 gradient-text">
                          Grafik Suhu (Temperature)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <SimpleLineChart
                            data={filteredData}
                            dataKey="envTemp"
                            color="#f97316"
                            title="Suhu Lingkungan"
                            unit="°C"
                          />
                          <SimpleLineChart
                            data={filteredData}
                            dataKey="tempBioflok"
                            color="#06b6d4"
                            title="Suhu Air Bioflok"
                            unit="°C"
                          />
                          <SimpleLineChart
                            data={filteredData}
                            dataKey="battTemp"
                            color="#8b5cf6"
                            title="Suhu Baterai"
                            unit="°C"
                          />
                        </div>
                      </div>

                      {/* Water Quality Charts */}
                      <div
                        className="bg-white rounded-2xl shadow-xl border-2 border-lime-100 p-8 animate-fadeInUp delay-300"
                        data-chart-type="water-quality"
                      >
                        <h3 className="text-2xl font-bold text-gray-800 mb-6 gradient-text">Kualitas Air Bioflok</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <SimpleLineChart
                            data={filteredData}
                            dataKey="phBioflok"
                            color="#10b981"
                            title="pH Bioflok"
                            unit=""
                          />
                          <SimpleLineChart
                            data={filteredData}
                            dataKey="doBioflok"
                            color="#3b82f6"
                            title="Dissolved Oxygen"
                            unit=" mg/L"
                          />
                        </div>
                      </div>

                      {/* Battery Enhanced Charts */}
                      <div className="bg-white rounded-2xl shadow-xl border-2 border-lime-100 p-8 animate-fadeInUp delay-400">
                        <h3 className="text-2xl font-bold text-gray-800 mb-6 gradient-text">
                          Monitoring Baterai Lengkap
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <SimpleLineChart
                            data={filteredData}
                            dataKey="battPercentage"
                            color="#10b981"
                            title="Persentase Baterai"
                            unit="%"
                          />
                          <SimpleLineChart
                            data={filteredData}
                            dataKey="battDischCurrent"
                            color="#ef4444"
                            title="Arus Discharge"
                            unit="A"
                          />
                        </div>
                      </div>

                      {/* Voltage Chart */}
                      <div className="bg-white rounded-2xl shadow-xl border-2 border-lime-100 p-8 animate-fadeInUp delay-500">
                        <h3 className="text-2xl font-bold text-gray-800 mb-6 gradient-text">
                          Grafik Tegangan (Voltage)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <SimpleLineChart
                            data={filteredData}
                            dataKey="pvVoltage"
                            color="#f59e0b"
                            title="Panel Surya"
                            unit="V"
                          />
                          <SimpleLineChart
                            data={filteredData}
                            dataKey="battVoltage"
                            color="#3b82f6"
                            title="Baterai"
                            unit="V"
                          />
                        </div>
                      </div>

                      {/* Current Chart */}
                      <div className="bg-white rounded-2xl shadow-xl border-2 border-lime-100 p-8 animate-fadeInUp delay-600">
                        <h3 className="text-2xl font-bold text-gray-800 mb-6 gradient-text">Grafik Arus (Current)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <SimpleLineChart
                            data={filteredData}
                            dataKey="pvCurrent"
                            color="#f59e0b"
                            title="Panel Surya"
                            unit="A"
                          />
                          <SimpleLineChart
                            data={filteredData}
                            dataKey="battChCurrent"
                            color="#3b82f6"
                            title="Charge Baterai"
                            unit="A"
                          />
                          <SimpleLineChart
                            data={filteredData}
                            dataKey="loadCurrent"
                            color="#8b5cf6"
                            title="Beban"
                            unit="A"
                          />
                        </div>
                      </div>
                    </>
                  )}
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
