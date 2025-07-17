import React, { useState } from 'react';
import { Menu, X, Code2 } from 'lucide-react';

function Homepage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-800 text-white">
      {/* Header */}
      <div className="bg-gray-700 p-4">
        <button className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded text-white">
          Home
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-gray-700 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:inset-0`}>
          <div className="flex items-center justify-between p-4 border-b border-gray-600">
            <div className="flex items-center space-x-2">
              <Code2 className="w-6 h-6 text-green-400" />
              <h2 className="text-lg font-semibold text-gray-300">Overlay Menu</h2>
            </div>
            <button 
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded hover:bg-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-4">
            <div className="bg-blue-700 text-white p-3 rounded-t flex items-center space-x-2">
              <Menu className="w-5 h-5" />
              <span className="font-semibold">Menu</span>
            </div>
            <div className="bg-gray-200 text-gray-800 p-4 rounded-b space-y-2">
              <div className="hover:bg-gray-300 p-2 rounded cursor-pointer">Halaman Utama</div>
              <div className="hover:bg-gray-300 p-2 rounded cursor-pointer">Monitor Data</div>
              <div className="hover:bg-gray-300 p-2 rounded cursor-pointer">Monitor Sistem</div>
              <div className="hover:bg-gray-300 p-2 rounded cursor-pointer">Perangkat Terhubung</div>
              <div className="hover:bg-gray-300 p-2 rounded cursor-pointer">Beri Makan</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:ml-0">
          {/* Mobile menu button */}
          <div className="lg:hidden p-4">
            <button 
              onClick={toggleSidebar}
              className="p-2 rounded hover:bg-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Home Page Section */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-semibold text-gray-300">Home Page</h1>
              <Code2 className="w-6 h-6 text-green-400" />
            </div>

            {/* Bioflok Monitoring Section */}
            <div className="bg-white text-black rounded-lg shadow-lg">
              <div className="bg-blue-700 text-white p-4 rounded-t-lg flex items-center space-x-2">
                <Menu className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Bioflok Monitoring</h2>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-6">Monitoring Smart Bioflok</h3>
                
                {/* Monitor Data Section */}
                <div className="bg-gray-200 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold mb-4">Monitor Data</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Kolam 1</span>
                      <span className="text-gray-600">Bagus</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kolam 2</span>
                      <span className="text-gray-600">Butuh Perhatian</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kolam 3</span>
                      <span className="text-gray-600">Buruk</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-2">Selengkapnya</div>
                  </div>
                </div>

                {/* Monitor Sistem Section */}
                <div className="bg-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-4">Monitor Sistem</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Kolam 1</span>
                      <span className="text-green-600 font-semibold">OK</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kolam 2</span>
                      <span className="text-gray-600">Butuh Perhatian</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kolam 3</span>
                      <span className="text-red-600 font-semibold">Error</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-2">Selengkapnya</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </div>
  );
}

export default Homepage;