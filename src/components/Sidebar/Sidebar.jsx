"use client"

import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Home, Cpu, Zap, Activity, Search, Menu, X } from "lucide-react"

const Sidebar = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [isCollapsed, setIsCollapsed] = useState(false)
  const location = useLocation()

  const menuItems = [
    {
      name: "Homepage",
      link: "/homepage",
      icon: Home,
      description: "Dashboard utama",
    },
    {
      name: "Microcontroller",
      link: "/microcontroller",
      icon: Cpu,
      description: "Kontrol perangkat IoT",
    },
    {
      name: "Relay",
      link: "/relay",
      icon: Zap,
      description: "Manajemen relay",
    },
    {
      name: "Sensor",
      link: "/sensor",
      icon: Activity,
      description: "Monitoring sensor",
    },
  ]

  // Filter menu items based on search query
  const filteredMenuItems = menuItems.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const isActiveLink = (link) => {
    return location.pathname === link
  }

  return (
    <aside
      className={`
      flex flex-col h-screen overflow-hidden transition-all duration-500 ease-in-out
      ${isCollapsed ? "w-20" : "w-80"}
      bg-gradient-to-br from-green-400 via-green-500 to-green-600
      shadow-2xl relative
    `}
    >
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="animate-pulse absolute top-10 left-10 w-32 h-32 bg-white rounded-full opacity-20"></div>
          <div className="animate-pulse absolute top-40 right-10 w-24 h-24 bg-white rounded-full opacity-15 animation-delay-1000"></div>
          <div className="animate-pulse absolute bottom-20 left-16 w-20 h-20 bg-white rounded-full opacity-25 animation-delay-2000"></div>
        </div>
      </div>

      {/* Header */}
      <div className="relative z-10 px-6 py-8">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3 animate-fadeIn">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <Activity className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">AquaMonitor</h1>
                <p className="text-green-100 text-sm">IoT Dashboard</p>
              </div>
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-all duration-300 hover:scale-110"
          >
            {isCollapsed ? <Menu className="w-5 h-5 text-white" /> : <X className="w-5 h-5 text-white" />}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {!isCollapsed && (
        <div className="relative z-10 px-6 mb-6 animate-slideDown">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <Search className="w-5 h-5 text-green-200 group-focus-within:text-white transition-colors duration-300" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full py-3 pl-12 pr-4 text-white placeholder-green-200
                bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50
                transition-all duration-300 hover:bg-white/25
              "
              placeholder="Cari menu..."
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="relative z-10 flex-1 px-4 space-y-2 overflow-y-auto scrollbar-hide">
        {filteredMenuItems.length > 0
          ? filteredMenuItems.map((item, index) => {
              const Icon = item.icon
              const isActive = isActiveLink(item.link)

              return (
                <Link
                  key={item.name}
                  to={item.link}
                  className={`
                  group flex items-center px-4 py-4 rounded-xl transition-all duration-300
                  hover:scale-105 hover:shadow-lg transform
                  ${
                    isActive
                      ? "bg-white text-green-600 shadow-xl scale-105"
                      : "text-white hover:bg-white/20 hover:text-white"
                  }
                  animate-slideUp
                `}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div
                    className={`
                  flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300
                  ${
                    isActive
                      ? "bg-green-100 text-green-600"
                      : "bg-white/20 text-white group-hover:bg-white/30 group-hover:scale-110"
                  }
                `}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {!isCollapsed && (
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{item.name}</span>
                        {isActive && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
                      </div>
                      <p className={`text-xs mt-1 ${isActive ? "text-green-500" : "text-green-100"}`}>
                        {item.description}
                      </p>
                    </div>
                  )}

                  {/* Hover Effect */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </Link>
              )
            })
          : !isCollapsed && (
              <div className="text-center py-8 animate-fadeIn">
                <Search className="w-12 h-12 text-green-200 mx-auto mb-3 opacity-50" />
                <p className="text-green-100 text-sm">Tidak ada hasil ditemukan</p>
                <p className="text-green-200 text-xs mt-1">Coba kata kunci lain</p>
              </div>
            )}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="relative z-10 px-6 py-4 border-t border-white/20 animate-fadeIn">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-green-300 rounded-full animate-pulse"></div>
            </div>
            <div>
              <p className="text-white text-sm font-medium">Status: Online</p>
              <p className="text-green-100 text-xs">Sistem berjalan normal</p>
            </div>
          </div>
        </div>
      )}

      {/* Glowing Edge Effect */}
      <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-green-300 via-green-400 to-green-500 opacity-50"></div>
    </aside>
  )
}

export default Sidebar
