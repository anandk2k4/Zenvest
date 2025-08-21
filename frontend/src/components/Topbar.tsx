import { useEffect, useState } from "react";
import { UserButton, useUser } from "@clerk/clerk-react";
import { Bell, Sun, Moon } from "lucide-react";
import { Link } from "react-router-dom"; // needed for logo link
import { useTheme } from "@/context/ThemeProvider";
import Notifications from "@/pages/Dashboard/Notification"
const Topbar = () => {
  const { user } = useUser();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
  }, [theme]);

  return (
    <header className="fixed top-0 left-48 right-0 h-15 bg-white dark:bg-gray-900 shadow-md flex items-center justify-end px-6 z-10 transition-colors duration-300">
      
      {/* 🔔 Right Side: Actions */}
      <div className="flex items-center gap-4">

        {/* 👋 Greeting */}
        {user && (
          <span className="text-sm text-gray-600 dark:text-gray-200 hidden sm:inline">
            Hi, {user.firstName} 👋
          </span>
        )}

        {/* Notification Bell */}
        <Notifications/>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-2xl dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300"
        >
          {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        {/* User Profile */}
        <div className="rounded-xl overflow-hidden transition-all duration-300">
          <UserButton />
        </div>
      </div>
    </header>
  );
};

export default Topbar;
