import { Link, useLocation } from "react-router-dom";
import {
  Home,
  BarChart,
  Target,
  BrainCog,
  FolderKanban,
  FileBarChart,
  Newspaper,
  LogOut,
} from "lucide-react";
import { SignOutButton } from "@clerk/clerk-react";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: <Home /> },
  { label: "Budget Planner", to: "/dashboard/budget", icon: <BarChart /> },
  { label: "Financial Goals", to: "/dashboard/goals", icon: <Target /> },
  { label: "AI Insight", to: "/dashboard/ai", icon: <BrainCog /> },
  { label: "Trending News", to: "/dashboard/news", icon: <Newspaper /> },
  { label: "Portfolio", to: "/dashboard/portfolio", icon: <FolderKanban /> },
  { label: "Reports", to: "/dashboard/reports", icon: <FileBarChart /> },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-48 h-full bg-white dark:bg-gray-900 fixed top-0 left-0 border-r border-gray-200 dark:border-gray-700 shadow-lg flex flex-col justify-between transition-all duration-300">
      
      {/* Logo Section */}
      <div>
        <Link to="/dashboard">
          <div className="flex items-center gap-3 h-15 px-6 border-b border-gray-200 dark:border-gray-700">
            <img
              src="/investment.png"
              alt="ZenVest Logo"
              className="h-8 w-8 object-contain"
            />
            <span className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 tracking-wide">
              ZenVest
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="px-3 py-6 space-y-1">
          {navItems.map(({ to, icon, label }) => (
            <SidebarLink
              key={to}
              to={to}
              icon={icon}
              label={label}
              active={location.pathname === to}
            />
          ))}
        </nav>
      </div>

      {/* Logout Section */}
      <div className="px-4 pb-6 border-t border-gray-100 dark:border-gray-800 pt-4">
        <SignOutButton>
          <button className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-md font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-800/20 transition-all">
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </SignOutButton>
      </div>
    </aside>
  );
};

export default Sidebar;

// 🔽 SidebarLink Component
const SidebarLink = ({
    to,
    icon,
    label,
    active,
  }: {
    to: string;
    icon: React.ReactNode;
    label: string;
    active: boolean;
  }) => {
    return (
      <Link
        to={to}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all
          border-b border-gray-100 dark:border-gray-800 last:border-b-0
          ${active
            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
      >
        <div className="w-5 h-5">{icon}</div>
        <span className="truncate">{label}</span>
      </Link>
    );
  };
  