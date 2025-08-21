import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

function Notifications() {
  const [open, setOpen] = useState(false);

  const notifications = [
    { id: 1, title: "Goal milestone 🎯", desc: "Vacation Fund is 40% complete", time: "2h ago" },
    { id: 2, title: "Budget alert ⚠️", desc: "Food category exceeded by ₹2,000", time: "1d ago" },
    { id: 3, title: "Advisor tip 💡", desc: "Shift ₹1,500 from Entertainment to Savings", time: "3d ago" }
  ];

  // Close on Esc key
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="Open notifications"
      >
        <Bell className="h-5 w-5" />
        {notifications.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] h-4 min-w-4 px-1">
            {notifications.length}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 rounded-2xl border bg-white dark:bg-neutral-900 shadow-xl overflow-hidden z-20"
          >
            <div className="px-4 py-3 font-semibold border-b dark:border-neutral-800">
              Notifications
            </div>

            <ul className="max-h-72 overflow-y-auto">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  <div className="text-sm font-medium">{n.title}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{n.desc}</div>
                  <div className="text-xs text-gray-400 mt-1">{n.time}</div>
                </li>
              ))}
            </ul>

            <button className="w-full px-4 py-2 text-sm text-blue-600 dark:text-blue-400 border-t dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800">
              View all
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Notifications;
