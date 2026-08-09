import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Topbar } from '@/components/Topbar';
import { Sidebar } from '@/components/Sidebar';
import { MobileNotificationBanner } from '@/components/MobileNotificationBanner';
import { useAuth } from '@/context/AuthContext';

export function AppLayout() {
  const { updateLastActivity } = useAuth();
  const [collapsed, setCollapsed] = useState(true); // default compressed per hover requirement
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div
      className="flex h-screen overflow-hidden bg-dark-950 text-slate-100 relative"
      onMouseMove={updateLastActivity}
      onKeyDown={updateLastActivity}
    >
      {/* Mobile push notification banner */}
      <MobileNotificationBanner />

      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full z-40">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((prev) => !prev)}
        />
      </div>

      {/* Mobile Drawer Navigation Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
            />
            <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
              <Sidebar
                isMobile
                onCloseMobile={() => setMobileOpen(false)}
              />
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Topbar onToggleMobileMenu={() => setMobileOpen((prev) => !prev)} />
        <main className="flex-1 overflow-y-auto scrollbar-hide">
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="w-full min-h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
