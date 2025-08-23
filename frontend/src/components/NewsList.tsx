import { motion, AnimatePresence } from "motion/react";
import { useId, useRef, useState, useEffect } from "react";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { Button } from "@/components/ui/button";

const formatDateTime = (date: Date) => {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  const h = date.getHours().toString().padStart(2, "0");
  const min = date.getMinutes().toString().padStart(2, "0");
  return `${d}/${m}/${y} ${h}:${min}`;
};

const timeAgo = (date: Date) => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

export default function NewsList({ news }: { news: any[] }) {
  const [active, setActive] = useState<any | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useOutsideClick(ref, () => setActive(null));

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setActive(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      {/* Compact List View */}
      <ul className="space-y-3">
        {news.slice(0, 5).map((n) => {
          const pubDate = n.publishedAt ? new Date(n.publishedAt) : null;

          return (
            <motion.li
              key={n._id}
              layoutId={`news-${n._id}-${id}`}
              onClick={() => setActive(n)}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer border border-gray-200 dark:border-gray-700"
            >
              {/* Left: Image */}
              {n.urlToImage ? (
                <img
                  src={n.urlToImage}
                  alt={n.title}
                  className="w-20 h-16 object-cover rounded flex-shrink-0"
                />
              ) : (
                <div className="w-20 h-16 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-500 rounded">
                  No Img
                </div>
              )}

              {/* Middle: Title & Publisher */}
              <div className="flex-1 min-w-0">
                <h3 className="text-[16px] font-medium text-gray-800 dark:text-gray-200 text-left line-clamp truncate">
                  {n.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-left">
                  {n.publisher || "Unknown"}{" "}
                  {pubDate && `• ${timeAgo(pubDate)}`}
                </p>
              </div>

              {/* Right: Read More */}
              <a
                href={n.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 dark:text-green-400 text-xs font-medium hover:underline flex-shrink-0"
                onClick={(e) => e.stopPropagation()} // prevent triggering modal
              >
                Read More →
              </a>
            </motion.li>
          );
        })}
      </ul>

      {/* Expanded Modal */}
      <AnimatePresence>
        {active && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
            <motion.div
              layoutId={`news-${active._id}-${id}`}
              ref={ref}
              className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-2xl shadow-lg overflow-hidden"
            >
              {/* Image */}
              {active.urlToImage && (
                <div className="relative">
                  <img
                    src={active.urlToImage}
                    alt={active.title}
                    className="w-full h-56 object-cover"
                  />
                  <button
                    onClick={() => setActive(null)}
                    className="absolute top-3 right-3 bg-white/80 dark:bg-black/50 rounded-full p-1 px-2 text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Content */}
              <div className="p-5">
                <h2 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                  {active.title}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  {active.publisher}{" "}
                  {active.publishedAt &&
                    `• ${formatDateTime(new Date(active.publishedAt))}`}
                </p>

                {/* Read More */}
                <div className="mt-5 flex justify-end">
                  <Button
                    asChild
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    <a
                      href={active.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Read More
                    </a>
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
