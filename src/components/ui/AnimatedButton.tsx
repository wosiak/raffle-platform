import React from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function AnimatedButton({ 
  children, 
  className,
  variant = "default",
  ...props 
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Button
        className={cn(
          'relative overflow-hidden',
          'transition-all duration-300',
          'focus-visible:ring-2 focus-visible:ring-offset-2',
          className
        )}
        variant={variant}
        {...props}
      >
        {children}
      </Button>
    </motion.div>
  );
}