"use client";

import { motion, useScroll } from "motion/react";

/** Linha no topo que enche conforme a página é rolada. */
export default function BarraRolagem() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      aria-hidden
      style={{ scaleX: scrollYProgress }}
      className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-primary"
    />
  );
}
