"use client";

import { motion } from "framer-motion";

/** Geometric K whose inner stroke is a second-hand. */
export function BrandMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <motion.div
      initial={{ rotate: -8, scale: 0.92 }}
      animate={{ rotate: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      className={`brand-mark flex items-center justify-center rounded-2xl text-[#140e0a] ${className}`}
      aria-hidden
    >
      <svg viewBox="0 0 32 32" className="h-[62%] w-[62%]" fill="none">
        <path
          d="M9 6v20M9 16l13-11"
          stroke="currentColor"
          strokeWidth="3.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 16l11 10"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.55"
        />
        <circle cx="9" cy="16" r="1.7" fill="currentColor" />
      </svg>
    </motion.div>
  );
}

export function BrandWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display font-semibold tracking-tight ${className}`}>
      Kairos
    </span>
  );
}
