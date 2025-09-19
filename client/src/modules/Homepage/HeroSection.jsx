import React from "react";
import { motion } from "framer-motion";
import Backgroundcolor from "@/assets/images/homepagebg.jpeg";

export default function HeroSection() {
  // Variants for staggered animation
  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <div id="home" className="relative min-h-[100vh] flex flex-col items-center justify-center text-sm px-4 md:px-16 lg:px-24 xl:px-32 text-white overflow-hidden">
      {/* Background image with low opacity */}
      <div className="absolute inset-0 -z-10">
        <img
          src={Backgroundcolor}
          alt="background"
          className="w-full h-full object-cover"
        />
        {/* Black overlay for contrast */}
        <div className="absolute inset-0 bg-[#0f1c3f]/60"></div>
      </div>

      {/* Animated Container */}
      <motion.div
        className="flex flex-col items-center justify-center gap-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Badge */}
        <motion.p
          className="group flex items-center gap-2 rounded-full p-1 pr-3 text-purple-100 bg-purple-200/15"
          variants={fadeUp}
        >
          <span className="bg-[#d29e45] text-white text-xs px-3.5 py-1 rounded-full">
            NEW
          </span>
          <span className="flex items-center gap-1">
            Welcome to Alpha
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="group-hover:translate-x-0.5 transition duration-300"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </span>
        </motion.p>

        {/* Heading */}
        <motion.h1
          className="text-5xl leading-[68px] md:text-6xl md:leading-[84px] font-medium max-w-5xl text-center"
          variants={fadeUp}
        >
          Simplicity & Innovation Angle
        </motion.h1>

        {/* Subtext */}
        <motion.p
          className="text-base text-center text-slate-200 max-w-lg"
          variants={fadeUp}
        >
          One platform, two powerful choices — seamless investing in INR and
          Crypto for the modern investor.
        </motion.p>

        {/* CTA Button */}
        <motion.button
          className="bg-[#d29e45] hover:bg-[#d29e45be] text-white rounded-full px-7 h-11 transition-colors duration-300"
          variants={fadeUp}
        >
          Get started
        </motion.button>
      </motion.div>
    </div>
  );
}
