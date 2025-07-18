import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Power, PowerOff, Edit3, Eye, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Homepage = () => {
  const [pools, setPools] = useState([]);
  const [selectedPools, setSelectedPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPoolName, setNewPoolName] = useState('');
  const [newPoolCode, setNewPoolCode] = useState('');
  const [notification, setNotification] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [userSession, setUserSession] = useState(null);

  const navigate = useNavigate();

  // API Base URL
  const API_BASE = 'http://43.165.198.49:8089/api/kolam';

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

  // Fetch all pools
  const fetchPools = async () => {
    if (!userSession?.id || !userSession?.token) {
      console.log('No user session or token, cannot fetch pools');
      return;
    }

    try {
      setLoading(true);
      const url = `${API_BASE}/select/all?id=${userSession.id}`;
      console.log('Fetching pools from:', url);

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
      console.log('Pools data received:', data);

      if (data.status === '200 OK' && data.payload) {
        setPools(data.payload);
        console.log('Pools set:', data.payload);
      } else {
        setPools([]);
        console.log('No pools found or invalid response');
      }

    } catch (error) {
      console.error('Error fetching pools:', error);
      setPools([]);
      showNotification('Gagal memuat data kolam: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch pools when userSession is available
  useEffect(() => {
    if (userSession?.id) {
      fetchPools();
    }
  }, [userSession]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedPools(pools.map(pool => pool.id));
    } else {
      setSelectedPools([]);
    }
  };

  const handleSelectPool = (poolId) => {
    setSelectedPools(prev =>
      prev.includes(poolId)
        ? prev.filter(id => id !== poolId)
        : [...prev, poolId]
    );
  };

  // Add new pool
  const handleAddPool = async () => {
    if (!newPoolCode.trim()) {
      showNotification('Kode kolam harus diisi', 'error');
      return;
    }

    if (!userSession?.id) {
      showNotification('Session tidak valid, silakan login ulang', 'error');
      return;
    }

    try {
      setApiLoading(true);

      const requestData = {
        name: newPoolName.trim() || null,
        code: newPoolCode.trim(),
        iduser: userSession.id.toString(),
        status: true
      };

      console.log('Adding pool with data:', requestData);

      const response = await fetch(`${API_BASE}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userSession.token}`, // Add Bearer token
        },
        body: JSON.stringify(requestData)
      });

      console.log('Add pool response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Add pool response data:', data);

      if (data.status === '201 CREATED' && data.payload) {
        setPools([...pools, data.payload]);
        setNewPoolName('');
        setNewPoolCode('');
        setShowAddForm(false);
        showNotification('Kolam berhasil ditambahkan');
      } else {
        throw new Error('Invalid response format');
      }

    } catch (error) {
      console.error('Error adding pool:', error);
      showNotification('Gagal menambahkan kolam: ' + error.message, 'error');
    } finally {
      setApiLoading(false);
    }
  };

  // Update pool status (bulk or single)
  const handleBulkStatusChange = async (activate) => {
    try {
      setApiLoading(true);

      const updatePromises = selectedPools.map(async (poolId) => {
        const pool = pools.find(p => p.id === poolId);
        if (!pool) return null;

        const requestData = {
          code: pool.code,
          val: activate,
          id: poolId
        };

        console.log('Updating pool status:', requestData);

        const response = await fetch(`${API_BASE}/updatestatus?code=${pool.code}&val=${activate}&id=${poolId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userSession.token}`, // Add Bearer token
          }
        });

        console.log(`Update status response for ${pool.code}:`, response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`Update status response data for ${pool.code}:`, data);

        return { poolId, success: data.status === '200 OK' };
      });

      const results = await Promise.all(updatePromises);
      console.log('Bulk update results:', results);

      const successCount = results.filter(r => r && r.success).length;

      if (successCount > 0) {
        setPools(pools.map(pool =>
          selectedPools.includes(pool.id)
            ? { ...pool, status: activate }
            : pool
        ));

        showNotification(
          `${successCount} kolam berhasil ${activate ? 'diaktifkan' : 'dinonaktifkan'}`
        );
      } else {
        showNotification('Gagal mengubah status kolam', 'error');
      }

      setSelectedPools([]);

    } catch (error) {
      console.error('Error updating pool status:', error);
      showNotification('Gagal mengubah status kolam: ' + error.message, 'error');
    } finally {
      setApiLoading(false);
    }
  };

  // Get single pool info
  const getSinglePool = async (code, id) => {
    try {
      console.log('Getting single pool:', { code, id });

      const response = await fetch(`${API_BASE}/select?code=${code}&id=${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userSession.token}`, // Add Bearer token
        },
      });

      console.log('Single pool response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Single pool data:', data);

      if (data.status === '200 OK' && data.payload) {
        showNotification(`Detail kolam ${code} berhasil dimuat`);
        return data;
      } else {
        throw new Error('Invalid response format');
      }

    } catch (error) {
      console.error('Error fetching single pool:', error);
      showNotification('Gagal memuat detail kolam: ' + error.message, 'error');
    }
  };

  // Handle single pool status toggle
  const handleSinglePoolToggle = async (pool) => {
    try {
      setApiLoading(true);

      const newStatus = !pool.status;
      console.log('Toggling pool status:', { pool, newStatus });

      const response = await fetch(`${API_BASE}/updatestatus?code=${pool.code}&val=${newStatus}&id=${pool.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userSession.token}`, // Add Bearer token
        }
      });

      console.log('Toggle status response:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Toggle status response data:', data);

      if (data.status === '200 OK') {
        setPools(pools.map(p =>
          p.id === pool.id
            ? { ...p, status: newStatus }
            : p
        ));

        showNotification(
          `${pool.name || pool.code} ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`
        );
      } else {
        throw new Error('Invalid response format');
      }

    } catch (error) {
      console.error('Error toggling pool status:', error);
      showNotification('Gagal mengubah status kolam: ' + error.message, 'error');
    } finally {
      setApiLoading(false);
    }
  };

  const handleDeleteSelected = () => {
    console.log('Deleting selected pools:', selectedPools);
    setPools(pools.filter(pool => !selectedPools.includes(pool.id)));
    setSelectedPools([]);
    showNotification(`${selectedPools.length} kolam berhasil dihapus`);
  };

  const getStatusColor = (status) => {
    return status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getStatusText = (status) => {
    return status ? 'Aktif' : 'Tidak Aktif';
  };

  // Show loading if no user session yet
  if (!userSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat session...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data kolam...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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

      {/* Loading Overlay */}
      {apiLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memproses...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Monitoring Kolam Budidaya</h1>
              <p className="text-gray-600 mt-1">
                Selamat datang, <span className="font-medium">{userSession.username}</span> 
                - Kelola dan pantau status kolam budidaya Anda
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus size={20} />
                Tambah Kolam
              </button>
              <button
                onClick={() => {
                  window.userSession = null;
                  navigate('/');
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Pool Form */}
      {showAddForm && (
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Tambah Kolam Baru</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Kolam
                  </label>
                  <input
                    type="text"
                    value={newPoolName}
                    onChange={(e) => setNewPoolName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Masukkan nama kolam"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kode Kolam *
                  </label>
                  <input
                    type="text"
                    value={newPoolCode}
                    onChange={(e) => setNewPoolCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Masukkan kode kolam"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleAddPool}
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Bulk Actions */}
        {selectedPools.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-blue-700 font-medium">
                {selectedPools.length} kolam dipilih
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkStatusChange(true)}
                  disabled={apiLoading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1 transition-colors"
                >
                  <Power size={16} />
                  Aktifkan
                </button>
                <button
                  onClick={() => handleBulkStatusChange(false)}
                  disabled={apiLoading}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1 transition-colors"
                >
                  <PowerOff size={16} />
                  Nonaktifkan
                </button>
                <button
                  onClick={handleDeleteSelected}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1 transition-colors"
                >
                  <Trash2 size={16} />
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pool Cards */}
        {pools.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada kolam</h3>
            <p className="text-gray-600 mb-4">Mulai dengan menambahkan kolam pertama Anda</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Tambah Kolam
            </button>
          </div>
        ) : (
          <>
            {/* Select All Checkbox */}
            <div className="bg-white rounded-lg shadow-sm border mb-4 p-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedPools.length === pools.length}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Pilih Semua Kolam ({pools.length})
                </span>
              </label>
            </div>

            {/* Pool Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pools.map((pool) => (
                <div key={pool.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedPools.includes(pool.id)}
                          onChange={() => handleSelectPool(pool.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {pool.name || `Kolam ${pool.code}`}
                          </h3>
                          <p className="text-sm text-gray-600">{pool.code}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pool.status)}`}>
                        {getStatusText(pool.status)}
                      </span>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleSinglePoolToggle(pool)}
                        disabled={apiLoading}
                        className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${
                          pool.status
                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {pool.status ? (
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
                        onClick={() => getSinglePool(pool.code, pool.id)}
                        disabled={apiLoading}
                        className="px-3 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 rounded-md text-sm transition-colors"
                      >
                        <Eye size={14} />
                      </button>
                      <button 
                        disabled={apiLoading}
                        className="px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 rounded-md text-sm transition-colors"
                      >
                        <Edit3 size={14} />
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

export default Homepage;
