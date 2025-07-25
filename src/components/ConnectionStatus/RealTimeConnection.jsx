"use client"

import { useState, useEffect, useRef } from "react"
import { HardwareAPIConnection } from "../../utils/apiConnection.js";

const RealTimeConnection = ({ poolCode, userId, token, onDataReceived, onConnectionChange }) => {
  const [connectionStatus, setConnectionStatus] = useState("disconnected")
  const [lastDataTime, setLastDataTime] = useState(null)
  const apiConnection = useRef(new HardwareAPIConnection())
  const intervalRef = useRef(null)

  // Simulasi data dari hardware (untuk testing)
  const generateHardwareData = () => {
    return {
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
    }
  }

  // Simulasi hardware mengirim data setiap 30 detik
  const startHardwareSimulation = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)

    intervalRef.current = setInterval(async () => {
      if (!poolCode || !userId || !token) return

      setConnectionStatus("sending")

      // Simulasi data dari hardware
      const hardwareData = generateHardwareData()

      // Kirim data ke server (simulasi hardware)
      const result = await apiConnection.current.sendSensorData(hardwareData, poolCode, userId, token)

      if (result.success) {
        setConnectionStatus("connected")
        setLastDataTime(new Date())
        console.log("🔄 Hardware data sent successfully")
      } else {
        setConnectionStatus("error")
        console.error("❌ Hardware failed to send data:", result.error)
      }
    }, 30000) // 30 detik
  }

  // Web dashboard mengambil data setiap 30 detik
  const startWebDashboardPolling = () => {
    const pollData = async () => {
      if (!poolCode || !userId || !token) return

      const result = await apiConnection.current.getLatestSensorData(poolCode, userId, token)

      if (result.success && result.data && result.data.length > 0) {
        onDataReceived(result.data[0])
        setLastDataTime(new Date())
        console.log("📊 Web dashboard received data")
      }
    }

    // Poll immediately, then every 30 seconds
    pollData()
    const pollInterval = setInterval(pollData, 30000)

    return () => clearInterval(pollInterval)
  }

  useEffect(() => {
    if (poolCode && userId && token) {
      // Start hardware simulation
      startHardwareSimulation()

      // Start web dashboard polling
      const stopPolling = startWebDashboardPolling()

      setConnectionStatus("connected")
      onConnectionChange("connected")

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current)
        stopPolling()
      }
    } else {
      setConnectionStatus("disconnected")
      onConnectionChange("disconnected")
    }
  }, [poolCode, userId, token])

  // Check connection health
  useEffect(() => {
    const checkConnection = setInterval(() => {
      if (lastDataTime) {
        const timeDiff = Date.now() - lastDataTime.getTime()
        if (timeDiff > 60000) {
          // 1 menit tanpa data
          setConnectionStatus("timeout")
          onConnectionChange("timeout")
        }
      }
    }, 10000) // Check setiap 10 detik

    return () => clearInterval(checkConnection)
  }, [lastDataTime])

  return null // Component ini tidak render UI
}

export default RealTimeConnection
