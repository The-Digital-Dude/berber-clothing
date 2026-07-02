"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"

export default function FadeIn({
  children,
  delay = 0,
  duration = 0.6,
  className = "",
  yOffset = 30,
}: {
  children: ReactNode
  delay?: number
  duration?: number
  className?: string
  yOffset?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
