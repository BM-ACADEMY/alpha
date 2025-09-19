import React from "react";
import { motion } from "framer-motion";
import mainImage from "@/assets/images/aboutpic.png"; // replace with your image path
import bgImage from "@/assets/images/about.jpg"; // section background image

export default function About() {
  return (
    <section id="about" className="relative text-white px-6 md:px-16 lg:px-32 py-16 flex flex-col lg:flex-row items-center gap-12 overflow-hidden">
      
      {/* Background image with overlay */}
      <div className="absolute inset-0 -z-10">
        <img
          src={bgImage}
          alt="Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#0f1c3f]/90"></div>
      </div>

      {/* Left Image with Animation */}
      <motion.div
        className="relative flex-1"
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true }}
      >
        <img
          src={mainImage}
          alt="Alpha R Investment"
          className="w-full rounded-xl shadow-lg"
        />
      </motion.div>

      {/* Right Content with Animation */}
      <motion.div
        className="flex-1 relative z-10"
        initial={{ opacity: 0, x: 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
        viewport={{ once: true }}
      >
        <span className="bg-[#b68a3e52] text-[#d29e45] font-semibold uppercase text-sm px-2 py-1 rounded">
          About Alpha R
        </span>

        <p className="text-gray-300 mt-4 mb-4">
          Alpha R is a modern investment platform built to give users secure,
          transparent, and profitable financial opportunities. With dual
          investment options in INR and CRYPTO, Alpha R empowers investors to
          diversify and maximize their returns while keeping full control of
          their funds.
        </p>

        <h3 className="text-xl font-semibold mt-4 mb-2">Our Vision</h3>
        <p className="text-gray-300 mb-4">
          To become a trusted global investment brand where users can build
          sustainable wealth through technology-driven solutions.
        </p>

        <h3 className="text-xl font-semibold mt-4 mb-2">Our Mission</h3>
        <p className="text-gray-300 mb-6">
          We aim to simplify investments for everyone, whether new or
          experienced, by offering easy-to-use tools, transparent plans, and
          secure transactions.
        </p>
      </motion.div>
    </section>
  );
}
