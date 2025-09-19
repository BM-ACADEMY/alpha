import React from "react";
import Logo from "@/assets/images/logo.png";
import { Link } from "react-router-dom";

export default function Footer() {
  const currentYear = new Date().getFullYear(); // get current year dynamically

  return (
    <footer className="flex flex-col items-center justify-around w-full py-16 text-sm bg-[#0f1c3f] text-gray-200">
      {/* Logo */}
      <img src={Logo} alt="BMTechx Logo" width={180} height={50} />

      {/* Copyright */}
      <p className="mt-4 text-center">
        © {currentYear}{" "}
        <a
          href="https://bmtechx.in"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          <span className="hover:text-[#d29e45] transition">BMTechx.in</span>
        </a>{" "}
        All Rights Reserved.
      </p>

      {/* Login Links */}
      <div className="flex items-center gap-4 mt-6">
        <Link
          to="/user-login"
          className="font-medium text-gray-300 hover:text-[#d29e45] transition-all"
        >
          Login as User
        </Link>
        <div className="h-4 w-px bg-white/60"></div>
        <Link
          to="/user-admin"
          className="font-medium text-gray-300 hover:text-[#d29e45] transition-all"
        >
          Login as Admin
        </Link>
      </div>
    </footer>
  );
}
