"use client";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
export default function Introduction() {
    return (
        <section className="min-h-screen flex flex-col md:flex-row items-center justify-center px-6 md:px-20 gap-10">
            {/* Text Section */}
            <motion.div
                initial={{ opacity: 0, x: -70 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="md:w-1/2 text-center md:text-left"
            >
                <h1 className="text-4xl md:text-6xl font-bold text-gray-700 mb-4 font-['Kanit']">
                    Peace of Mind Meets Smart Investing
                </h1>
                <p className="text-lg md:text-lg text-gray-700 max-w-xl mb-6 font-['Exo_2']">
                    ZenVest is your AI financial advisor—built to guide, not confuse.
                    Budget better, set real goals, and grow wealth effortlessly.
                </p>

                <button className="bg-emerald-400 no-underline group cursor-pointer relative shadow-2xl shadow-emerald-900 rounded-full p-px text-md leading-6 text-white inline-block transition-all duration-300">
                    <span className="absolute inset-0 overflow-hidden rounded-full">
                        <span className="absolute inset-0 rounded-full bg-[radial-gradient(75%_100%_at_50%_0%,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0)_75%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    </span>

                    <div className="relative flex space-x-2 items-center z-10 rounded-full bg-emerald-400 py-2 px-4 ring-1 ring-white/10 group-hover:bg-emerald-600 transition duration-300">
                        <span>
                            <a href="#get-started">Start Planning</a>
                        </span>
                        <svg
                            fill="none"
                            height="20"
                            viewBox="0 0 24 24"
                            width="20"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M10.75 8.75L14.25 12L10.75 15.25"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                            />
                        </svg>
                    </div>
                    <span className="absolute -bottom-0 left-[1.125rem] h-px w-[calc(100%-2.25rem)] bg-gradient-to-r from-white/0 via-white/60 to-white/0 transition-opacity duration-500 group-hover:opacity-40" />
                </button>

            </motion.div>

            {/* Video Section */}
            <motion.div
                initial={{ opacity: 0, x: 70 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="md:w-1/2 w-full max-w-xl "
            >
                <video
                    src="/introVideo.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="rounded-2xl shadow-lg w-full h-auto"
                />
            </motion.div>
        </section>
    );
}
