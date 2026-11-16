import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaStore,
  FaChartLine,
  FaSeedling,
  FaCloudSun,
  FaLandmark,
  FaChevronDown,
  FaTachometerAlt,
  FaSignOutAlt,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { getCartItems } from "../services/marketplaceService";
import { authService } from "../services/api";

// Primary navigation: three top-level entries, the rest grouped beneath them.
const NAV_GROUPS = [
  {
    id: "market",
    labelKey: "navbar.market",
    items: [
      { to: "/marketplace", labelKey: "navbar.marketplace", descKey: "navbar.marketplaceDesc", Icon: FaStore },
      { to: "/market-price", labelKey: "navbar.marketPrice", descKey: "navbar.marketPriceDesc", Icon: FaChartLine },
    ],
  },
  {
    id: "advice",
    labelKey: "navbar.advice",
    items: [
      { to: "/crop-recommendation", labelKey: "navbar.cropAdvice", descKey: "navbar.cropAdviceDesc", Icon: FaSeedling },
      { to: "/weather", labelKey: "navbar.weather", descKey: "navbar.weatherDesc", Icon: FaCloudSun },
      { to: "/govt-schemes", labelKey: "navbar.govtSchemes", descKey: "navbar.govtSchemesDesc", Icon: FaLandmark },
    ],
  },
];

const HOVER_CLOSE_DELAY = 150; // ms; lets the pointer travel from trigger to panel

const isPathActive = (pathname, to) =>
  pathname === to || pathname.startsWith(`${to}/`);

const topLinkClass = (active) =>
  // Full-height link with a yellow indicator that grows along the bar's bottom edge
  `relative flex items-center gap-1.5 h-16 px-3 text-[15px] font-medium transition-colors focus:outline-none focus-visible:bg-white/10 after:content-[''] after:absolute after:left-3 after:right-3 after:bottom-0 after:h-[3px] after:rounded-t-full after:bg-yellow-400 after:transition-transform after:duration-200 ${
    active
      ? "text-yellow-300 after:scale-x-100"
      : "text-white/90 hover:text-white after:scale-x-0 hover:after:scale-x-100"
  }`;

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null); // "market" | "advice" | "profile" | null
  const [cartCount, setCartCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const navRef = useRef(null);
  const closeTimer = useRef(null);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "en" ? "hi" : "en");
  };

  // Load cart count (can be called from event listener too)
  const loadCartCount = async () => {
    try {
      const items = await getCartItems();
      setCartCount(items.length);
    } catch (error) {
      console.error("Failed to load cart count:", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const currentUser = authService.getCurrentUser();
    if (token && currentUser) {
      setIsAuthenticated(true);
      setUser(currentUser);
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }

    loadCartCount();

    // Any navigation closes whatever was open
    setOpenMenu(null);
    setIsMenuOpen(false);

    const onCartUpdated = () => loadCartCount();
    window.addEventListener("cartUpdated", onCartUpdated);
    return () => window.removeEventListener("cartUpdated", onCartUpdated);
  }, [location]);

  // Lift the bar off the page with a deeper shadow once content scrolls under it
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on outside click and Escape
  useEffect(() => {
    const onPointerDown = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setOpenMenu(null);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpenMenu(null);
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      clearTimeout(closeTimer.current);
    };
  }, []);

  // Hover opens immediately; leaving closes after a short delay so the
  // pointer can cross the gap between the trigger and the panel.
  const hoverOpen = (id) => {
    clearTimeout(closeTimer.current);
    setOpenMenu(id);
  };
  const hoverClose = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMenu(null), HOVER_CLOSE_DELAY);
  };
  const toggleOpen = (id) => {
    clearTimeout(closeTimer.current);
    setOpenMenu((current) => (current === id ? null : id));
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setOpenMenu(null);
    setIsMenuOpen(false);
    navigate("/");
  };

  const dashboardPath =
    user?.userType === "seller"
      ? "/seller-dashboard"
      : user?.userType === "buyer"
      ? "/farmer-dashboard"
      : null;
  const dashboardLabel =
    user?.userType === "seller" ? t("navbar.sellerDashboard") : t("navbar.dashboard");
  const firstName = user?.name?.trim().split(/\s+/)[0] || "";
  const initial = firstName.charAt(0).toUpperCase() || "?";

  return (
    <nav
      ref={navRef}
      className={`sticky top-0 z-50 bg-gradient-to-r from-green-800 via-green-700 to-green-700 transition-shadow duration-300 ${
        isScrolled ? "shadow-lg shadow-green-950/30" : "shadow-sm"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="group flex items-center gap-2.5 shrink-0">
            <img
              src="/favicon/favicon.png"
              alt="Krishak Shayak Logo"
              className="h-9 w-9 rounded-full object-cover ring-2 ring-white/25 transition group-hover:ring-yellow-300/70"
            />
            <span className="text-white font-bold text-xl tracking-tight whitespace-nowrap">
              Krishak Shayak
            </span>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-stretch gap-2 lg:gap-6">
            <NavLink to="/" end className={({ isActive }) => topLinkClass(isActive)}>
              {t("navbar.home")}
            </NavLink>

            {NAV_GROUPS.map((group) => {
              const isOpen = openMenu === group.id;
              const isActive = group.items.some((item) =>
                isPathActive(location.pathname, item.to)
              );
              return (
                <div
                  key={group.id}
                  className="relative"
                  onMouseEnter={() => hoverOpen(group.id)}
                  onMouseLeave={hoverClose}
                >
                  <button
                    type="button"
                    onClick={() => toggleOpen(group.id)}
                    aria-haspopup="true"
                    aria-expanded={isOpen}
                    className={topLinkClass(isActive || isOpen)}
                  >
                    {t(group.labelKey)}
                    <FaChevronDown
                      className={`h-3 w-3 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    // the top padding keeps the hover area continuous between trigger and panel
                    <div className="absolute left-0 top-full pt-2 z-50">
                      <div className="w-72 rounded-xl bg-white shadow-xl ring-1 ring-black/5 p-2 origin-top animate-menu-in motion-reduce:animate-none">
                        {group.items.map((item) => {
                          const { to, labelKey, descKey } = item;
                          const Icon = item.Icon;
                          const itemActive = isPathActive(location.pathname, to);
                          return (
                            <Link
                              key={to}
                              to={to}
                              onClick={() => setOpenMenu(null)}
                              className={`flex items-start gap-3 rounded-lg p-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${
                                itemActive ? "bg-green-50" : "hover:bg-gray-50"
                              }`}
                            >
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-700">
                                <Icon className="h-4 w-4" />
                              </span>
                              <span>
                                <span className="block text-sm font-semibold text-gray-900">
                                  {t(labelKey)}
                                </span>
                                <span className="block text-xs text-gray-500 leading-snug mt-0.5">
                                  {t(descKey)}
                                </span>
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right side: language, cart, account */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleLanguage}
              title={t("navbar.switchLanguage")}
              aria-label={t("navbar.switchLanguage")}
              className="hidden md:flex items-center gap-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-sm font-semibold px-3 py-1.5 rounded-full transition-all border border-white border-opacity-30"
            >
              <span>{i18n.language === "en" ? "🇮🇳 हिंदी" : "🇬🇧 English"}</span>
            </button>

            <Link
              to="/cart"
              aria-label={t("navbar.cart")}
              title={t("navbar.cart")}
              className="relative text-white hover:text-yellow-300 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-green-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Account (desktop) */}
            <div className="hidden md:block">
              {!isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <Link
                    to="/login"
                    className="text-white text-sm font-medium hover:text-yellow-300 transition-colors"
                  >
                    {t("navbar.login")}
                  </Link>
                  <Link
                    to="/register"
                    className="bg-yellow-400 hover:bg-yellow-300 text-green-900 text-sm font-semibold py-2 px-4 rounded-full transition-colors"
                  >
                    {t("navbar.register")}
                  </Link>
                </div>
              ) : (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => toggleOpen("profile")}
                    aria-haspopup="true"
                    aria-expanded={openMenu === "profile"}
                    className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 text-white hover:bg-green-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 text-green-900 text-sm font-bold">
                      {initial}
                    </span>
                    <span className="hidden lg:block text-sm font-medium max-w-[8rem] truncate">
                      {firstName}
                    </span>
                    <FaChevronDown
                      className={`h-3 w-3 transition-transform duration-200 ${
                        openMenu === "profile" ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {openMenu === "profile" && (
                    <div className="absolute right-0 top-full mt-4 w-60 rounded-xl bg-white shadow-xl ring-1 ring-black/5 py-2 z-50 origin-top animate-menu-in motion-reduce:animate-none">
                      <div className="px-4 pb-2 mb-1 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {user?.name}
                        </p>
                        {user?.email && (
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        )}
                      </div>
                      {dashboardPath && (
                        <Link
                          to={dashboardPath}
                          onClick={() => setOpenMenu(null)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <FaTachometerAlt className="h-4 w-4 text-green-700" />
                          {dashboardLabel}
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <FaSignOutAlt className="h-4 w-4" />
                        {t("navbar.logout")}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-label={t("navbar.menu")}
              aria-expanded={isMenuOpen}
              className="md:hidden flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-green-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300"
            >
              {isMenuOpen ? <FaTimes className="h-5 w-5" /> : <FaBars className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile navigation: same grouping, laid out as labelled sections */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 border-t border-white/15 max-h-[calc(100vh-4rem)] overflow-y-auto">
            {isAuthenticated && user && (
              <div className="flex items-center gap-3 px-2 py-3 border-b border-green-600">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400 text-green-900 font-bold">
                  {initial}
                </span>
                <div className="min-w-0">
                  <p className="text-white font-medium truncate">{user.name}</p>
                  {user.email && (
                    <p className="text-green-100 text-xs truncate">{user.email}</p>
                  )}
                </div>
              </div>
            )}

            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `block mt-2 px-3 py-2.5 rounded-md font-medium ${
                  isActive ? "bg-green-800 text-yellow-300" : "text-white hover:bg-green-600"
                }`
              }
            >
              {t("navbar.home")}
            </NavLink>

            {NAV_GROUPS.map((group) => (
              <div key={group.id} className="mt-3">
                <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-green-200">
                  {t(group.labelKey)}
                </p>
                {group.items.map((item) => {
                  const Icon = item.Icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-md ${
                          isActive ? "bg-green-800 text-yellow-300" : "text-white hover:bg-green-600"
                        }`
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {t(item.labelKey)}
                    </NavLink>
                  );
                })}
              </div>
            ))}

            <div className="border-t border-green-600 mt-3 pt-2">
              {isAuthenticated && dashboardPath && (
                <NavLink
                  to={dashboardPath}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-md ${
                      isActive ? "bg-green-800 text-yellow-300" : "text-white hover:bg-green-600"
                    }`
                  }
                >
                  <FaTachometerAlt className="h-4 w-4 shrink-0" />
                  {dashboardLabel}
                </NavLink>
              )}

              <button
                type="button"
                onClick={toggleLanguage}
                className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-white hover:bg-green-600"
              >
                <span>{i18n.language === "en" ? "🇮🇳 हिंदी में देखें" : "🇬🇧 View in English"}</span>
              </button>

              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-white hover:bg-green-600"
                >
                  <FaSignOutAlt className="h-4 w-4 shrink-0" />
                  {t("navbar.logout")}
                </button>
              ) : (
                <div className="flex gap-3 px-3 pt-3">
                  <Link
                    to="/login"
                    className="flex-1 text-center border border-white/40 text-white font-medium py-2 rounded-full hover:bg-green-600"
                  >
                    {t("navbar.login")}
                  </Link>
                  <Link
                    to="/register"
                    className="flex-1 text-center bg-yellow-400 text-green-900 font-semibold py-2 rounded-full hover:bg-yellow-300"
                  >
                    {t("navbar.register")}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
