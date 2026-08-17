import { Home, LayoutGrid, FileText, Settings, ShoppingBag } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppContext } from "@/hooks/use-app-context";

const tabs = [
  { icon: Home,        label: "Home",      path: "/home" },
  { icon: ShoppingBag, label: "Items",     path: "/items" },
  { icon: LayoutGrid,  label: "Dashboard", path: "/dashboard" },
  { icon: FileText,    label: "Reports",   path: "/reports" },
  { icon: Settings,    label: "Settings",  path: "/settings" },
];

const BottomNav = () => {
  const { canAccessSettings } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const visibleTabs = canAccessSettings ? tabs : tabs.filter((tab) => tab.path !== "/settings");

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 safe-bottom"
      style={{
        background: "#000000",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Gold top accent — matches PageHeader bottom language */}
      <div
        className="h-[2px] w-full"
        style={{
          background: "linear-gradient(90deg, transparent 0%, hsl(var(--primary)) 30%, hsl(var(--primary)) 70%, transparent 100%)",
        }}
      />

      <div className="flex items-end justify-around max-w-lg mx-auto px-2" style={{ height: "60px" }}>
        {visibleTabs.map((tab, idx) => {
          const active = location.pathname === tab.path;
          const isCenter = idx === Math.floor(visibleTabs.length / 2);

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center gap-0.5 transition-all duration-200 py-1 px-3 rounded-xl"
              style={{
                color: active ? "hsl(var(--nav-active))" : "hsl(var(--nav-muted))",
                position: isCenter ? "relative" : undefined,
                top: isCenter ? "-16px" : undefined,
                minWidth: 0,
              }}
            >
              {isCenter ? (
                /* Floating center button */
                <div
                  className="w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all duration-200"
                  style={{
                    background: active
                      ? "hsl(var(--nav-active))"
                      : "linear-gradient(145deg, #1a1a1a, #0a0a0a)",
                    border: `2px solid ${active ? "hsl(var(--nav-active))" : "rgba(242,197,0,0.5)"}`,
                    boxShadow: active
                      ? "0 0 20px rgba(242,197,0,0.4), 0 4px 12px rgba(0,0,0,0.5)"
                      : "0 4px 12px rgba(0,0,0,0.4)",
                    color: active ? "hsl(var(--nav-active-foreground))" : "hsl(var(--nav-active))",
                  }}
                >
                  <tab.icon size={22} strokeWidth={active ? 2.5 : 2} />
                </div>
              ) : (
                <>
                  <tab.icon size={21} strokeWidth={active ? 2.5 : 2} />
                  <span
                    className="text-[9px] font-semibold tracking-wide"
                    style={{ letterSpacing: "0.04em" }}
                  >
                    {tab.label}
                  </span>
                  {/* Active indicator dot */}
                  <span
                    className="block rounded-full transition-all duration-200"
                    style={{
                      width: active ? "18px" : "0px",
                      height: "2px",
                      background: "hsl(var(--nav-active))",
                      marginTop: "1px",
                      opacity: active ? 1 : 0,
                    }}
                  />
                </>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
