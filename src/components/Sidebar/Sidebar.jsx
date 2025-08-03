"use client"
import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { Home, Cpu, Zap, Activity, Search, Menu, X, XCircle, SandwichIcon as Hamburger } from 'lucide-react'
import "./Sidebar.css"

// Animated Stars Component
const AnimatedStars = () => {
  const [stars, setStars] = useState([])
  useEffect(() => {
    const generateStars = () => {
      const newStars = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 3 + 2,
        delay: Math.random() * 2,
      }))
      setStars(newStars)
    }
    generateStars()
  }, [])

  return (
    <div className="stars-container">
      {stars.map((star) => (
        <div
          key={star.id}
          className="star"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDuration: `${star.duration}s`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
      {/* Shooting stars */}
      <div className="shooting-star shooting-star-1" />
      <div className="shooting-star shooting-star-2" />
    </div>
  )
}

const Sidebar = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [userSession, setUserSession] = useState(null)
  const [isMobileView, setIsMobileView] = useState(false) // New state for mobile view
  const location = useLocation()

  // Get user session
  useEffect(() => {
    const session = window.userSession
    if (session) {
      setUserSession(session)
    }
  }, [])

  // Detect mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768) // Assuming 768px as mobile breakpoint
    }

    // Set initial state
    handleResize()

    // Add event listener
    window.addEventListener("resize", handleResize)

    // Clean up
    return () => window.removeEventListener("resize", handleResize)
  }, [])

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
    // Menambahkan menu Feeder
    {
      name: "Feeder Schedule",
      link: "/feeder",
      icon: Hamburger,
      description: "Kontrol Feeder IoT",
    },
  ]

  // Filter menu items based on search query
  const filteredMenuItems = menuItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const isActiveLink = (link) => {
    return location.pathname === link
  }

  const clearSearch = () => {
    setSearchQuery("")
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
  }

  // Determine if content should be visible (not collapsed and not mobile view)
  const isContentVisible = !isCollapsed && !isMobileView

  return (
    <aside className={`sidebar ${isCollapsed || isMobileView ? "collapsed" : ""}`}>
      {/* Animated Stars Background */}
      <AnimatedStars />
      {/* Additional Animated Background Elements */}
      <div className="background-elements">
        <div className="floating-element floating-element-1"></div>
        <div className="floating-element floating-element-2"></div>
        <div className="floating-element floating-element-3"></div>
      </div>
      {/* Header */}
      <div className="sidebar-header">
        <div className="header-content">
          {isContentVisible && (
            <div className="logo-section">
              <div className="logo-icon">
                <Activity className="logo-activity-icon" />
              </div>
              <div className="logo-text">
                <h1 className="logo-title">AquaMonitor</h1>
                <p className="logo-subtitle">IoT Dashboard</p>
              </div>
            </div>
          )}
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="collapse-button">
            {isCollapsed || isMobileView ? <Menu className="collapse-icon" /> : <X className="collapse-icon" />}
          </button>
        </div>
      </div>
      {/* Enhanced Search Bar */}
      {isContentVisible && (
        <div className="search-section">
          <div className="search-container">
            {/* Search Icon */}
            <div className="search-icon-container">
              <Search className={`search-icon ${isSearchFocused || searchQuery ? "focused" : ""}`} />
            </div>
            {/* Search Input */}
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="search-input"
              placeholder="Cari menu atau fitur..."
              autoComplete="off"
            />
            {/* Clear Search Button */}
            {searchQuery && (
              <button onClick={clearSearch} className="clear-search-button" type="button">
                <XCircle className="clear-search-icon" />
              </button>
            )}
          </div>
          {/* Search Results Counter */}
          {searchQuery && (
            <div className="search-results-counter">
              <span className="search-results-text">
                {filteredMenuItems.length > 0 ? `${filteredMenuItems.length} hasil ditemukan` : "Tidak ada hasil"}
              </span>
            </div>
          )}
        </div>
      )}
      {/* Navigation Menu */}
      <nav className="navigation-menu">
        {filteredMenuItems.length > 0
          ? filteredMenuItems.map((item, index) => {
              const Icon = item.icon
              const isActive = isActiveLink(item.link)
              return (
                <Link
                  key={item.name}
                  to={item.link}
                  className={`menu-item ${isActive ? "active" : ""}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`menu-icon-container ${isActive ? "active" : ""}`}>
                    <Icon className="menu-icon" />
                  </div>
                  {isContentVisible && (
                    <div className="menu-content">
                      <div className="menu-header">
                        <span className="menu-title">
                          {/* Highlight search term */}
                          {searchQuery ? (
                            <span
                              dangerouslySetInnerHTML={{
                                __html: item.name.replace(
                                  new RegExp(`(${searchQuery})`, "gi"),
                                  '<mark class="search-highlight">$1</mark>',
                                ),
                              }}
                            />
                          ) : (
                            item.name
                          )}
                        </span>
                        {isActive && <div className="active-indicator"></div>}
                      </div>
                      <p className={`menu-description ${isActive ? "active" : ""}`}>
                        {/* Highlight search term in description */}
                        {searchQuery ? (
                          <span
                            dangerouslySetInnerHTML={{
                              __html: item.description.replace(
                                new RegExp(`(${searchQuery})`, "gi"),
                                '<mark class="search-highlight">$1</mark>',
                              ),
                            }}
                          />
                        ) : (
                          item.description
                        )}
                      </p>
                    </div>
                  )}
                  {/* Hover Effect */}
                  <div className="menu-hover-effect"></div>
                </Link>
              )
            })
          : isContentVisible && (
              <div className="no-results">
                <Search className="no-results-icon" />
                <p className="no-results-title">Tidak ada hasil ditemukan</p>
                <p className="no-results-subtitle">{searchQuery ? `untuk "${searchQuery}"` : "Coba kata kunci lain"}</p>
                {searchQuery && (
                  <button onClick={clearSearch} className="clear-search-results-button">
                    Hapus pencarian
                  </button>
                )}
              </div>
            )}
      </nav>
      {/* Footer */}
      {isContentVisible && (
        <div className="sidebar-footer">
          <div className="footer-content">
            <div className="status-indicator">
              <div className="status-dot"></div>
            </div>
            <div className="status-info">
              <p className="status-text">Status: Online</p>
              <p className="user-info">
                User <span className="username">{userSession?.username || "Guest"}</span>
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Glowing Edge Effect */}
      <div className="glowing-edge"></div>
    </aside>
  )
}

export default Sidebar
