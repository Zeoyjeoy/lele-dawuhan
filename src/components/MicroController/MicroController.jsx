import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';

const MicroController = () => {
  const [sensorData, setSensorData] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [userSession, setUserSession] = useState(null);
  const [notification, setNotification] = useState(null);
  const [selectedCode, setSelectedCode] = useState('KLM8');
  const [availablePools, setAvailablePools] = useState([]);
  const [loadingPools, setLoadingPools] = useState(false);

  const API_BASE = 'http://43.165.198.49:8089/api/monitoring';
  const CONTROL_API_BASE = 'http://43.165.198.49:8089/api/control';

  const navigate = useNavigate();

  // Check if user session exists and set the session
  useEffect(() => {
    const session = window.userSession;
    if (session) {
      setUserSession(session);
      console.log('User session found:', session);
      // Load available pools when user session is available
      fetchAvailablePools(session);
    } else {
      console.log('No user session found');
      navigate('/dashboard');
    }
  }, [navigate]);

  // Fetch available pools for the user
  const fetchAvailablePools = async (session = userSession) => {
  if (!session?.id) return;

  setLoadingPools(true);
  try {
    const response = await fetch(`${CONTROL_API_BASE}/micro/getByCode?iduser=${session.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`,
      },
    });
    console.log('Response Status:', response.status);

console.log('Response Data:', data);

    if (response.status === 403) {
      console.error('Access forbidden - User does not have permission to access this pool');
      showNotification('Tidak memiliki akses untuk melihat daftar kolam', 'warning');
      setAvailablePools([]);
      return;
    }

    // Check if response has content before parsing JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('Response is not JSON:', contentType);
      setAvailablePools([]);
      return;
    }

    const data = await response.json();
    console.log('API Response:', data); // Log response data

    if (data.payload) {
      const pools = Array.isArray(data.payload)
        ? data.payload.map(pool => pool.code).filter(Boolean)
        : [data.payload.code].filter(Boolean);

      setAvailablePools([...new Set(pools)]); // Remove duplicates
      if (pools.length > 0 && !selectedCode) {
        setSelectedCode(pools[0]);
      }

      console.log('Available pools loaded:', pools);
    } else {
      console.warn('No pools found in response');
      setAvailablePools([]);
    }
  } catch (error) {
    console.error('Error fetching available pools:', error);
    showNotification('Gagal memuat daftar kolam', 'error');
    setAvailablePools([]);
  } finally {
    setLoadingPools(false);
  }
};


  // Show notifications
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Handle change in selected pool code
  const handleCodeChange = (e) => {
    setSelectedCode(e.target.value);
    // Clear previous sensor data when changing pool
    setSensorData(null);
  };

  // Generate current timestamp in the required format
  const getCurrentTimestamp = () => {
    const now = new Date();
    return now.toISOString().slice(0, 19); // Format: YYYY-MM-DDTHH:mm:ss
  };

  // Push sensor data to the API
  const pushSensorData = async () => {
    if (!userSession?.id) {
      showNotification('User session not valid', 'error');
      return;
    }

    if (!selectedCode) {
      showNotification('Pilih kode kolam terlebih dahulu', 'error');
      return;
    }

    const requestData = {
      timestamp: getCurrentTimestamp(),
      pvVoltage: parseFloat((Math.random() * 5 + 10).toFixed(1)),
      pvCurrent: parseFloat((Math.random() * 0.5 + 1).toFixed(1)),
      pvPower: parseFloat((Math.random() * 5 + 12).toFixed(1)),
      battVoltage: parseFloat((Math.random() * 1 + 11).toFixed(1)),
      battChCurrent: parseFloat((Math.random() * 0.5 + 0.8).toFixed(1)),
      battChPower: parseFloat((Math.random() * 2 + 10).toFixed(1)),
      loadCurrent: parseFloat((Math.random() * 0.3 + 0.4).toFixed(1)),
      loadPower: parseFloat((Math.random() * 2 + 4).toFixed(1)),
      battPercentage: parseFloat((Math.random() * 20 + 75).toFixed(1)),
      battTemp: parseFloat((Math.random() * 5 + 28).toFixed(1)),
      battDischCurrent: parseFloat((Math.random() * 0.1 + 0.15).toFixed(1)),
      envTemp: parseFloat((Math.random() * 3 + 27).toFixed(1)),
      phBioflok: parseFloat((Math.random() * 1 + 6.5).toFixed(1)),
      tempBioflok: parseFloat((Math.random() * 2 + 27).toFixed(1)),
      doBioflok: parseFloat((Math.random() * 1 + 6).toFixed(1)),
      code: selectedCode,
      iduser: userSession.id.toString(),
    };

    setApiLoading(true);

    try {
      const response = await fetch(`${API_BASE}/micro/sensors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userSession.token}`,
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (response.ok) {
        showNotification('Data berhasil disimpan', 'success');
        console.log('Sensor data response:', data);
        setTimeout(() => getLatestSensorData(), 1000);
      } else {
        showNotification(`Error: ${data.message || 'Unknown error'}`, 'error');
        console.error('Error response:', data);
      }
    } catch (error) {
      console.error('Error sending data:', error);
      showNotification('Gagal mengirim data sensor', 'error');
    } finally {
      setApiLoading(false);
    }
  };

  // Fetch sensor data based on the selected pool code
  const fetchSensorData = async () => {
    if (!userSession?.id) {
      showNotification('User session not valid', 'error');
      return;
    }

    if (!selectedCode) {
      showNotification('Pilih kode kolam terlebih dahulu', 'error');
      return;
    }

    setApiLoading(true);

    try {
      const response = await fetch(`${API_BASE}/micro/sensors?code=${selectedCode}&iduser=${userSession.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userSession.token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setSensorData(data.payload);
        showNotification('Data sensor berhasil dimuat', 'success');
        console.log('Fetched sensor data:', data);
      } else {
        showNotification(`Error: ${data.message || 'Unknown error'}`, 'error');
        console.error('Error response:', data);
      }
    } catch (error) {
      console.error('Error fetching sensor data:', error);
      showNotification('Gagal memuat data sensor', 'error');
    } finally {
      setApiLoading(false);
    }
  };

  // Fetch the latest sensor data
  const getLatestSensorData = async () => {
    if (!userSession?.id) {
      showNotification('User session not valid', 'error');
      return;
    }

    if (!selectedCode) {
      showNotification('Pilih kode kolam terlebih dahulu', 'error');
      return;
    }

    setApiLoading(true);

    try {
      const response = await fetch(`${API_BASE}/micro/sensors/latest?code=${selectedCode}&iduser=${userSession.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userSession.token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setSensorData(data.payload);
        showNotification('Data sensor terbaru berhasil dimuat', 'success');
        console.log('Fetched latest sensor data:', data);
      } else {
        showNotification(`Error: ${data.message || 'Unknown error'}`, 'error');
        console.error('Error response:', data);
      }
    } catch (error) {
      console.error('Error fetching latest sensor data:', error);
      showNotification('Gagal memuat data sensor terbaru', 'error');
    } finally {
      setApiLoading(false);
    }
  };

  // Format sensor data for better display
  const formatSensorValue = (key, value) => {
    const units = {
      pvVoltage: 'V',
      pvCurrent: 'A',
      pvPower: 'W',
      battVoltage: 'V',
      battChCurrent: 'A',
      battChPower: 'W',
      loadCurrent: 'A',
      loadPower: 'W',
      battPercentage: '%',
      battTemp: '°C',
      battDischCurrent: 'A',
      envTemp: '°C',
      phBioflok: 'pH',
      tempBioflok: '°C',
      doBioflok: 'mg/L',
    };

    return `${value} ${units[key] || ''}`;
  };

  const formatFieldName = (key) => {
    const names = {
      pvVoltage: 'PV Voltage',
      pvCurrent: 'PV Current',
      pvPower: 'PV Power',
      battVoltage: 'Battery Voltage',
      battChCurrent: 'Battery Charge Current',
      battChPower: 'Battery Charge Power',
      loadCurrent: 'Load Current',
      loadPower: 'Load Power',
      battPercentage: 'Battery Percentage',
      battTemp: 'Battery Temperature',
      battDischCurrent: 'Battery Discharge Current',
      envTemp: 'Environment Temperature',
      phBioflok: 'pH Bioflok',
      tempBioflok: 'Temperature Bioflok',
      doBioflok: 'DO Bioflok',
      timestamp: 'Timestamp',
      code: 'Pool Code',
    };

    return names[key] || key;
  };

  return (
    <div className="container mx-auto p-4">
      <Sidebar />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Microcontroller Data</h1>

        {notification && (
          <div className={`notification p-4 rounded-lg mb-4 ${
            notification.type === 'success'
              ? 'bg-green-100 text-green-800 border border-green-200'
              : notification.type === 'warning'
              ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {notification.message}
          </div>
        )}

        {/* Pool Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="mb-4">
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              Pilih Kode Kolam:
            </label>
            {loadingPools ? (
              <div className="text-gray-500">Memuat daftar kolam...</div>
            ) : availablePools.length > 0 ? (
              <select
                id="code"
                value={selectedCode}
                onChange={handleCodeChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih kolam...</option>
                {availablePools.map((poolCode) => (
                  <option key={poolCode} value={poolCode}>
                    {poolCode}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="code"
                type="text"
                value={selectedCode}
                onChange={handleCodeChange}
                placeholder="Masukkan kode kolam"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          <div className="text-sm text-gray-600">
            User ID: {userSession?.id || 'Not logged in'}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={pushSensorData} 
              disabled={apiLoading || !selectedCode}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-md transition-colors"
            >
              {apiLoading ? 'Mengirim Data...' : 'Kirim Data Sensor'}
            </button>

            <button 
              onClick={fetchSensorData} 
              disabled={apiLoading || !selectedCode}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-md transition-colors"
            >
              {apiLoading ? 'Memuat Data...' : 'Ambil Semua Data'}
            </button>

            <button 
              onClick={getLatestSensorData} 
              disabled={apiLoading || !selectedCode}
              className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-md transition-colors"
            >
              {apiLoading ? 'Memuat Data Terbaru...' : 'Ambil Data Terbaru'}
            </button>
          </div>
        </div>

        {/* Sensor Data Display */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Data Sensor</h2>

          {sensorData ? (
            <div className="space-y-4">
              {Array.isArray(sensorData) ? (
                <div className="space-y-6">
                  <div className="text-sm text-gray-600">
                    Total data: {sensorData.length} record(s)
                  </div>
                  {sensorData.slice(0, 5).map((data, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4">
                      <div className="text-sm text-gray-500 mb-2">
                        Record {index + 1} - {new Date(data.timestamp).toLocaleString('id-ID')}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Object.entries(data)
                          .filter(([key]) => !['id', 'iduser', 'created_at', 'updated_at'].includes(key))
                          .map(([key, value]) => (
                          <div key={key} className="bg-gray-50 p-3 rounded">
                            <div className="text-sm font-medium text-gray-700">
                              {formatFieldName(key)}
                            </div>
                            <div className="text-lg font-semibold text-gray-900">
                              {key === 'timestamp' 
                                ? new Date(value).toLocaleString('id-ID')
                                : typeof value === 'number' 
                                  ? formatSensorValue(key, value)
                                  : value
                              }
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {sensorData.length > 5 && (
                    <div className="text-sm text-gray-500 text-center">
                      ... dan {sensorData.length - 5} data lainnya
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(sensorData)
                    .filter(([key]) => !['id', 'iduser', 'created_at', 'updated_at'].includes(key))
                    .map(([key, value]) => (
                    <div key={key} className="bg-gray-50 p-3 rounded">
                      <div className="text-sm font-medium text-gray-700">
                        {formatFieldName(key)}
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {key === 'timestamp' 
                          ? new Date(value).toLocaleString('id-ID')
                          : typeof value === 'number' 
                            ? formatSensorValue(key, value)
                            : value
                        }
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">📊</div>
              <div>Belum ada data sensor tersedia</div>
              <div className="text-sm mt-2">
                {selectedCode 
                  ? `Pilih salah satu tombol di atas untuk memuat data kolam ${selectedCode}`
                  : 'Pilih kode kolam terlebih dahulu'
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MicroController;
