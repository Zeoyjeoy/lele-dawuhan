import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';

const MicroController = () => {
  const [sensorData, setSensorData] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [userSession, setUserSession] = useState(null);
  const [notification, setNotification] = useState(null);
  const [selectedCode, setSelectedCode] = useState('KLM8'); // Default to 'KLM8' for now

  const API_BASE = 'http://43.165.198.49:8089/api/monitoring';

  const navigate = useNavigate();

  // Check if user session exists and set the session
  useEffect(() => {
    const session = window.userSession; // Ensure the session is stored in window.userSession
    if (session) {
      setUserSession(session);
      console.log('User session found:', session);
    } else {
      console.log('No user session found');
      // Redirect to login if session not found
      navigate('/dashboard'); // You can change this to your desired route
    }
  }, [navigate]);

  // Show notifications
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Handle change in selected pool code
  const handleCodeChange = (e) => {
    setSelectedCode(e.target.value);
  };

  // Push sensor data to the API
  const pushSensorData = async () => {
    if (!userSession?.id) {
      showNotification('User session not valid', 'error');
      return;
    }

    const requestData = {
      timestamp: "2025-07-11T12:00:00",
      pvVoltage: 12.5,
      pvCurrent: 1.2,
      pvPower: 15.0,
      battVoltage: 11.8,
      battChCurrent: 1.0,
      battChPower: 11.8,
      loadCurrent: 0.5,
      loadPower: 5.0,
      battPercentage: 85.0,
      battTemp: 30.0,
      battDischCurrent: 0.2,
      envTemp: 29.0,
      phBioflok: 7.1,
      tempBioflok: 28.5,
      doBioflok: 6.8,
      code: selectedCode, // Use selected code from the input
      iduser: userSession.id.toString()
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

  return (
    <div className="container">
      <Sidebar />
      <h1>Microcontroller Data</h1>

      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Dropdown or input to choose the pool code */}
      <div>
        <label htmlFor="code">Kode Kolam: </label>
        <input
          id="code"
          type="text"
          value={selectedCode}
          onChange={handleCodeChange}
          className="border p-2"
        />
      </div>

      <button onClick={pushSensorData} disabled={apiLoading}>
        {apiLoading ? 'Sending Data...' : 'Send Sensor Data'}
      </button>

      <button onClick={fetchSensorData} disabled={apiLoading}>
        {apiLoading ? 'Loading Data...' : 'Get Sensor Data'}
      </button>

      <button onClick={getLatestSensorData} disabled={apiLoading}>
        {apiLoading ? 'Loading Latest Data...' : 'Get Latest Sensor Data'}
      </button>

      <div className="sensor-data">
        {sensorData ? (
          <pre>{JSON.stringify(sensorData, null, 2)}</pre>
        ) : (
          <p>No sensor data available</p>
        )}
      </div>
    </div>
  );
};

export default MicroController;
