"use client"

import { Pill } from "./pill"
import { Button } from "./ui/button"
import { motion } from "framer-motion"
import { ParticleWave } from "./particle-wave"

export function Hero() {
  // Animation variants for fade-in + slide-up effect
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  }

  return (
    <div className="flex flex-col h-screen justify-between bg-black">
      <ParticleWave />

      <div className="pb-16 mt-auto text-center relative z-10">
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeInUp}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <Pill className="mb-6">BETA RELEASE</Pill>
        </motion.div>

        <motion.h1
          className="text-5xl sm:text-6xl md:text-7xl font-bold"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="text-white">Prompts</span>
          <span className="text-[#FF8C1A]">Genie</span>
        </motion.h1>

        <motion.p
          className="font-mono text-sm sm:text-base text-foreground/60 text-balance mt-8 max-w-[440px] mx-auto"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
          transition={{ duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          AI-Powered Creative Tools for Image Analysis
        </motion.p>

        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeInUp}
          transition={{ duration: 0.6, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <Button className="mt-14 bg-[#FF8C1A] hover:bg-[#FF8C1A]/90 text-white">Get Started</Button>
        </motion.div>
      </div>
    </div>
  )
}
