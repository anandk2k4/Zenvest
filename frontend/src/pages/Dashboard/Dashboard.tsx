// src/pages/dashboard/DashboardLayout.tsx
import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster"

const DashboardLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Sidebar - fixed width */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 ml-48 flex flex-col h-screen overflow-hidden">
        {/* Topbar - fixed at top */}
        <Topbar />

        {/* Scrollable main content under Topbar */}
        <main className="flex-1 overflow-y-auto mt-14 p-6 bg-gray-50 dark:bg-gray-950">
        <Toaster />
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;