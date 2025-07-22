import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';

const Sensor = () => {
  const [sensorData, setSensorData] = useState([]);
  const [notification, setNotification] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [userSession, setUserSession] = useState(null);

  const navigate = useNavigate();

  // API Base URL
  const API_BASE = 'http://43.165.198.49:8089/api/monitoring';

  // Get user session on component mount
  useEffect(() => {
    const session = window.userSession;
    if (session) {
      setUserSession(session);
      console.log('User session found:', session);
    } else {
      console.log('No user session found');
      navigate('/');
    }
  }, [navigate]);

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Check token validity
  const checkTokenValidity = () => {
    const token = userSession?.token;
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      if (payload.exp) {
        const expiration = payload.exp * 1000;
        const now = Date.now();
        
        if (expiration < now) {
          showNotification('Token sudah expired, silakan login ulang', 'error');
          navigate('/');
          return false;
        }
        
        return expiration > now;
      }
      
      return true;
    } catch (error) {
      console.error('Error parsing token:', error);
      return false;
    }
  };

  // Fetch sensor data
  const fetchSensorData = async () => {
    if (!userSession?.id || !userSession?.token) {
      console.log('No user session or token, cannot fetch sensor data');
      return;
    }

    try {
      setApiLoading(true);
      const url = `${API_BASE}/sensors?code=KLM8&id=${userSession.id}`;
      console.log('Fetching sensor data from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userSession.token}`,
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Sensor data received:', data);

      if (data.status === '200 OK' && data.payload) {
        setSensorData(data.payload);
        console.log('Sensor data set:', data.payload);
      } else {
        setSensorData([]);
        console.log('No sensor data found or invalid response');
      }

    } catch (error) {
      console.error('Error fetching sensor data:', error);
      setSensorData([]);
      showNotification('Gagal memuat data sensor: ' + error.message, 'error');
    } finally {
      setApiLoading(false);
    }
  };

  // Fetch latest sensor data
  const fetchLatestSensorData = async () => {
    if (!userSession?.id || !userSession?.token) {
      console.log('No user session or token, cannot fetch latest sensor data');
      return;
    }

    try {
      setApiLoading(true);
      const url = `${API_BASE}/sensors/latest?code=KLM8&id=${userSession.id}`;
      console.log('Fetching latest sensor data from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userSession.token}`,
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Latest sensor data received:', data);

      if (data.status === '200 OK' && data.payload) {
        setSensorData(data.payload);
        console.log('Latest sensor data set:', data.payload);
      } else {
        setSensorData([]);
        console.log('No latest sensor data found or invalid response');
      }

    } catch (error) {
      console.error('Error fetching latest sensor data:', error);
      setSensorData([]);
      showNotification('Gagal memuat data sensor terbaru: ' + error.message, 'error');
    } finally {
      setApiLoading(false);
    }
  };

  // Fetch sensor data when userSession is available
  useEffect(() => {
    if (userSession?.id) {
      fetchSensorData();
    }
  }, [userSession]);

  // Loading state
  if (apiLoading && sensorData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data sensor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="flex-shrink-0 w-64 bg-white">
        {/* Sidebar content goes here */}
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-grow p-6">
        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            notification.type === 'success' 
              ? 'bg-green-100 border border-green-400 text-green-700' 
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle size={20} />
              ) : (
                <AlertCircle size={20} />
              )}
              <span>{notification.message}</span>
            </div>
          </div>
        )}

        {/* Sensor Data */}
        <h1 className="text-2xl font-semibold mb-4">Data Sensor</h1>
        <button
          onClick={fetchLatestSensorData}
          disabled={apiLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          {apiLoading ? 'Memuat...' : 'Muat Data Terbaru'}
        </button>

        <div className="mt-6">
          {sensorData.length === 0 ? (
            <p>Tidak ada data sensor untuk ditampilkan.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sensorData.map((sensor) => (
                <div key={sensor.id} className="bg-white p-4 rounded-lg shadow-md">
                  <h3 className="font-semibold">{sensor.timestamp}</h3>
                  <p><strong>PV Voltage:</strong> {sensor.pvVoltage} V</p>
                  <p><strong>PV Power:</strong> {sensor.pvPower} W</p>
                  <p><strong>Env Temp:</strong> {sensor.envTemp} °C</p>
                  <p><strong>Battery Voltage:</strong> {sensor.battVoltage} V</p>
                  <p><strong>Battery Current:</strong> {sensor.battChCurrent} A</p>
                  <p><strong>Load Power:</strong> {sensor.loadPower} W</p>
                  {/* Tampilkan data sensor lainnya */}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sensor;
