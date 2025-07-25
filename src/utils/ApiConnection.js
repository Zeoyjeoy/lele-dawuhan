// API Connection Helper untuk Hardware → Web
export class HardwareAPIConnection {
  constructor() {
    this.baseURL = "http://43.165.198.49:8089/api"
    this.retryCount = 3
    this.retryDelay = 5000 // 5 detik
  }

  // Hardware mengirim data sensor ke server
  async sendSensorData(sensorData, poolCode, userId, token) {
    const payload = {
      ...sensorData,
      code: poolCode,
      iduser: userId.toString(),
      timestamp: new Date().toISOString(),
    }

    console.log("📡 Hardware sending data:", payload)

    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        const response = await fetch(`${this.baseURL}/monitoring/micro/sensors`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        })

        if (response.ok) {
          const result = await response.json()
          console.log("✅ Data sent successfully:", result)
          return { success: true, data: result }
        } else {
          throw new Error(`HTTP ${response.status}`)
        }
      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error)

        if (attempt < this.retryCount) {
          console.log(`🔄 Retrying in ${this.retryDelay / 1000} seconds...`)
          await this.delay(this.retryDelay)
        } else {
          return { success: false, error: error.message }
        }
      }
    }
  }

  // Web dashboard mengambil data dari server
  async getLatestSensorData(poolCode, userId, token) {
    try {
      const response = await fetch(`${this.baseURL}/monitoring/sensors/latest?code=${poolCode}&id=${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        return { success: true, data: result.payload }
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error("❌ Failed to fetch sensor data:", error)
      return { success: false, error: error.message }
    }
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
