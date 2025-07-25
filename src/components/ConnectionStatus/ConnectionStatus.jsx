"use client"

import { Wifi, WifiOff, RefreshCw, AlertTriangle } from "lucide-react"

const ConnectionStatus = ({ status, lastUpdate, dataCount = 0 }) => {
  const getStatusConfig = () => {
    switch (status) {
      case "connected":
        return {
          icon: <Wifi className="text-lime-500" size={20} />,
          text: "Hardware Terhubung",
          bgColor: "bg-gradient-to-r from-lime-100 to-green-100 border-lime-300",
          textColor: "text-green-800",
          pulse: true,
        }
      case "sending":
        return {
          icon: <RefreshCw className="text-blue-500 animate-spin" size={20} />,
          text: "Mengirim Data...",
          bgColor: "bg-gradient-to-r from-blue-100 to-cyan-100 border-blue-300",
          textColor: "text-blue-800",
          pulse: false,
        }
      case "timeout":
        return {
          icon: <AlertTriangle className="text-yellow-500" size={20} />,
          text: "Koneksi Timeout",
          bgColor: "bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-300",
          textColor: "text-yellow-800",
          pulse: false,
        }
      case "error":
        return {
          icon: <WifiOff className="text-red-500" size={20} />,
          text: "Koneksi Error",
          bgColor: "bg-gradient-to-r from-red-100 to-pink-100 border-red-300",
          textColor: "text-red-800",
          pulse: false,
        }
      default:
        return {
          icon: <WifiOff className="text-gray-400" size={20} />,
          text: "Terputus",
          bgColor: "bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300",
          textColor: "text-gray-600",
          pulse: false,
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 ${config.bgColor} ${config.pulse ? "animate-pulse" : ""}`}
    >
      {config.icon}
      <div className="flex flex-col">
        <span className={`font-semibold text-sm ${config.textColor}`}>{config.text}</span>
        {lastUpdate && <span className="text-xs opacity-75">Update: {lastUpdate.toLocaleTimeString("id-ID")}</span>}
        {dataCount > 0 && <span className="text-xs opacity-75">Data: {dataCount} records</span>}
      </div>
    </div>
  )
}

export default ConnectionStatus
