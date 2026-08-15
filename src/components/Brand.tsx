"use client";

import { motion } from "framer-motion";

/** Geometric K mark — unique brand signal, not a mascot clone. */
export function BrandMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <motion.div
      initial={{ rotate: -8, scale: 0.92 }}
      animate={{ rotate: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      className={`brand-mark flex items-center justify-center rounded-2xl text-white ${className}`}
      aria-hidden
    >
      <svg viewBox="0 0 32 32" className="h-[58%] w-[58%]" fill="none">
        <path
          d="M9 6v20M9 16l12-10M9 16l12 10"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.div>
  );
}

export function BrandWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display font-extrabold tracking-tight ${className}`}>
      Kairos
    </span>
  );
}
