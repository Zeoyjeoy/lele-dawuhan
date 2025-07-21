import React, { useState, useEffect } from 'react';
import { Plus, Power, PowerOff, Eye, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';

const Relay = () => {
  const [relays, setRelays] = useState([]);
  const [selectedRelays, setSelectedRelays] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRelayCode, setNewRelayCode] = useState('');
  const [notification, setNotification] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [userSession, setUserSession] = useState(null);

  const navigate = useNavigate();

  // API Base URL
  const API_BASE = 'http://43.165.198.49:8089/api/control';

  // Get user session on component mount
  useEffect(() => {
    const session = window.userSession;
    if (session) {
      setUserSession(session);
      console.log('User session found:', session);
    } else {
      console.log('No user session found');
      // Redirect to login if no session
      navigate('/');
    }
  }, [navigate]);

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

 const fetchRelays = async () => {
    if (!userSession?.id || !userSession?.token) {
      console.log('No user session or token, cannot fetch relays');
      return;
    }

    try {
      setApiLoading(true);
      const url = `${API_BASE}/select/all?id=${userSession.id}`;
      console.log('Fetching relays from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userSession.token}`,  // Cek token yang digunakan
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Relays data received:', data);

      if (data.status === '200 OK' && data.payload) {
        setRelays(data.payload);
        console.log('Relays set:', data.payload);
      } else {
        setRelays([]);
        console.log('No relays found or invalid response');
      }

    } catch (error) {
      console.error('Error fetching relays:', error);
      setRelays([]);
      showNotification('Gagal memuat data relay: ' + error.message, 'error');
    } finally {
      setApiLoading(false);
    }
  };


  // Fetch relays when userSession is available
  useEffect(() => {
    if (userSession?.id) {
      fetchRelays();
    }
  }, [userSession]);

  // Add new relay
  const handleAddRelay = async () => {
    if (!newRelayCode.trim()) {
      showNotification('Kode relay harus diisi', 'error');
      return;
    }

    if (!userSession?.id) {
      showNotification('Session tidak valid, silakan login ulang', 'error');
      return;
    }

    try {
      setApiLoading(true);

      const requestData = {
        code: newRelayCode.trim(),
        iduser: userSession.id.toString(),
        status: true,  // Assume relay should be active when added
      };

      console.log('Adding relay with data:', requestData);

      const response = await fetch(`${API_BASE}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userSession.token}`,
        },
        body: JSON.stringify(requestData)
      });

      console.log('Add relay response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Add relay response data:', data);

      if (data.status === '201 CREATED' && data.payload) {
        setRelays([...relays, data.payload]);
        setNewRelayCode('');
        setShowAddForm(false);
        showNotification('Relay berhasil ditambahkan');
      } else {
        throw new Error('Invalid response format');
      }

    } catch (error) {
      console.error('Error adding relay:', error);
      showNotification('Gagal menambahkan relay: ' + error.message, 'error');
    } finally {
      setApiLoading(false);
    }
  };

  // Handle relay toggle (active/inactive)
  const handleRelayToggle = async (relay) => {
    try {
      setApiLoading(true);

      const newStatus = !relay.status;
      console.log('Toggling relay status:', { relay, newStatus });

      const response = await fetch(`${API_BASE}/updatestatus?code=${relay.code}&val=${newStatus}&id=${relay.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userSession.token}`,
        }
      });

      console.log('Toggle relay status response:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Toggle relay status response data:', data);

      if (data.status === '200 OK') {
        setRelays(relays.map(r =>
          r.id === relay.id
            ? { ...r, status: newStatus }
            : r
        ));

        showNotification(
          `${relay.code} ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`
        );
      } else {
        throw new Error('Invalid response format');
      }

    } catch (error) {
      console.error('Error toggling relay status:', error);
      showNotification('Gagal mengubah status relay: ' + error.message, 'error');
    } finally {
      setApiLoading(false);
    }
  };

  const getStatusColor = (status) => {
    return status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getStatusText = (status) => {
    return status ? 'Aktif' : 'Tidak Aktif';
  };

  // Notification and Loading handling
  if (apiLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memproses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar />

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

        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Relay Control</h1>
                <p className="text-gray-600 mt-1">Kelola dan pantau status relay Anda</p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Plus size={20} />
                  Tambah Relay
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Add Relay Form */}
        {showAddForm && (
          <div className="bg-white border-b shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Tambah Relay Baru</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kode Relay *
                  </label>
                  <input
                    type="text"
                    value={newRelayCode}
                    onChange={(e) => setNewRelayCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Masukkan kode relay"
                    required
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleAddRelay}
                    disabled={apiLoading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    {apiLoading ? 'Menyimpan...' : 'Simpan'}
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Relay Cards */}
        {relays.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada relay</h3>
            <p className="text-gray-600 mb-4">Mulai dengan menambahkan relay pertama Anda</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Tambah Relay
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm border mb-4 p-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedRelays.length === relays.length}
                  onChange={() => {
                    if (selectedRelays.length === relays.length) {
                      setSelectedRelays([]);
                    } else {
                      setSelectedRelays(relays.map(relay => relay.id));
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Pilih Semua Relay ({relays.length})
                </span>
              </label>
            </div>

            {/* Relay Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relays.map((relay) => (
                <div key={relay.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedRelays.includes(relay.id)}
                          onChange={() => setSelectedRelays(prev => prev.includes(relay.id) ? prev.filter(id => id !== relay.id) : [...prev, relay.id])}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {relay.code}
                          </h3>
                          <p className="text-sm text-gray-600">{relay.code}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(relay.status)}`}>
                        {getStatusText(relay.status)}
                      </span>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleRelayToggle(relay)}
                        disabled={apiLoading}
                        className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${
                          relay.status
                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {relay.status ? (
                          <>
                            <PowerOff size={14} className="inline mr-1" />
                            Nonaktifkan
                          </>
                        ) : (
                          <>
                            <Power size={14} className="inline mr-1" />
                            Aktifkan
                          </>
                        )}
                      </button>
                      <button 
                        onClick={() => getSingleRelay(relay.code, relay.id)}
                        disabled={apiLoading}
                        className="px-3 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 rounded-md text-sm transition-colors"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Relay;
