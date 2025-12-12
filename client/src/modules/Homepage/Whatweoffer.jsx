import React from "react";
import {
  Shield,
  Coins,
  BarChart3,
  Users,
  Wallet,
  Headphones,
} from "lucide-react";
import { motion } from "framer-motion";

const offers = [
  {
    icon: Shield,
    title: "Safety & Security",
    desc: "All accounts are KYC-verified and admin-approved. Transactions are encrypted, and user funds are managed with complete transparency.",
  },
  {
    icon: Coins,
    title: "Dual Investment Options",
    desc: "Invest in Indian Rupees (INR) or USDT (crypto). Wallets are separate, so users can clearly track balances and profits in both.",
  },
  {
    icon: BarChart3,
    title: "Daily Profit Tracking",
    desc: "Real-time dashboard shows daily profits, total capital, and remaining plan duration. Earnings are updated automatically.",
  },
  {
    icon: Users,
    title: "Referral Program",
    desc: "Invite friends and earn 1% of your referral’s daily profit. Simple, fair, and designed to help you grow with your community.",
  },
  {
    icon: Wallet,
    title: "Easy Deposits & Withdrawals",
    desc: "INR: Deposit via Bank/UPI, upload payment proof with reference number. USDT: Deposit via blockchain transfer with TXN hash verification. Withdrawals are processed directly to the verified bank/crypto account after admin approval.",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    desc: "Built-in Complaint System where users can raise issues, attach screenshots, and track status (Pending/Resolved).",
  },
];

export default function WhatWeOffer() {
  return (
    <section className="relative bg-[#0f1c3f] text-white px-6 md:px-16 lg:px-32 py-16 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#1a1a1a] via-[#0e0e0e] to-black"></div>

      <motion.h2
        initial={{ opacity: 0, y: -30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        viewport={{ once: true }}
        className="text-4xl md:text-5xl font-extrabold text-center mb-12 text-white"
      >
        What We Offer
      </motion.h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {offers?.map((offer, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, filter: "blur(20px)", y: 30 }}
            whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: idx * 0.1, ease: "easeOut" }}
            className="backdrop-blur-lg bg-white/10 border border-white/20 shadow-lg rounded-2xl p-6 text-center hover:bg-white/15 hover:shadow-xl transition-all duration-300"
          >
            <offer.icon className="w-12 h-12 mx-auto text-[#e4a944] mb-4" />
            <h3 className="text-lg font-semibold mb-2">{offer.title}</h3>
            <p className="text-sm text-gray-300">{offer.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
