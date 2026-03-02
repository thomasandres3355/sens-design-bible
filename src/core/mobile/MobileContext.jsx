import { createContext, useContext, useState, useCallback, useEffect } from "react";

const MobileContext = createContext(null);

/** Detect iPhone or iPad based on user agent + screen width */
function detectMobileDevice() {
  const ua = navigator.userAgent || "";
  const isIPhone = /iPhone/i.test(ua);
  const isIPad = /iPad/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  const w = window.innerWidth;
  if (isIPhone && w <= 768) return true;
  if (isIPad && w <= 1024) return true;
  return false;
}

export const MobileProvider = ({ children }) => {
  const [isMobile, setIsMobile] = useState(() => {
    try {
      const saved = localStorage.getItem("sens-mobile-mode");
      if (saved !== null) return JSON.parse(saved);
    } catch { /* ignore */ }
    return detectMobileDevice();
  });

  useEffect(() => {
    try { localStorage.setItem("sens-mobile-mode", JSON.stringify(isMobile)); } catch {}
  }, [isMobile]);

  const toggleMobile = useCallback(() => {
    setIsMobile(prev => !prev);
  }, []);

  return (
    <MobileContext.Provider value={{ isMobile, toggleMobile }}>
      {children}
    </MobileContext.Provider>
  );
};

export const useMobile = () => {
  const ctx = useContext(MobileContext);
  if (!ctx) throw new Error("useMobile must be inside MobileProvider");
  return ctx;
};
