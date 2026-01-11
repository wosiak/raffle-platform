import React from 'react';
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function GlassCard({ 
  children, 
  className, 
  hover = true,
  blur = 12,
  opacity = 0.7,
  border = true,
  animate = true,
  ...props 
}) {
  const Comp = animate ? motion.div : 'div';
  
  const animationProps = animate ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
  } : {};

  return (
    <Comp
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-white/70 dark:bg-gray-900/70",
        border && "border border-white/20 dark:border-white/10",
        "shadow-xl shadow-black/5 dark:shadow-black/20",
        hover && "transition-all duration-300 hover:shadow-2xl hover:shadow-black/10 hover:-translate-y-0.5",
        className
      )}
      style={{
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`,
      }}
      {...animationProps}
      {...props}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </Comp>
  );
}