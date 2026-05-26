'use client';

import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";

export function DashboardPreview() {
  return (
    <div className="relative w-full h-[680px] flex items-center justify-center overflow-visible">
      
      {/* Main Revenue Card - Moved MUCH HIGHER */}
      <motion.div
        animate={{
          y: [-60, -95, -60],     // Significantly moved upwards
          rotate: [-1, -0.5, -1],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative z-30"
      >
        <Card className="p-9 shadow-2xl border border-border/80 bg-card w-96">
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">Monthly Revenue</p>
            <div className="flex items-end justify-between">
              <span className="text-4xl font-bold text-foreground">$24,500.00</span>
              <span className="text-sm font-medium text-emerald-600 bg-emerald-100 px-3 py-1 rounded">
                +14.5%
              </span>
            </div>

            <div className="flex items-end gap-2 h-28 pt-4">
              {[40, 65, 45, 80, 55, 95, 75, 110, 85, 120, 100, 130].map((height, i) => (
                <motion.div
                  key={i}
                  className="flex-1 bg-primary/30 rounded-t hover:bg-primary/50"
                  initial={{ height: 0 }}
                  animate={{ height: `${(height / 130) * 100}%` }}
                  transition={{ duration: 1.2, delay: i * 0.04 }}
                />
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Available Credits - Bottom Left */}
      <motion.div
        animate={{
          y: [0,15, 0],
          x: [0, -20, 0],
        }}
        transition={{
          duration: 6.8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
        className="absolute -left-8 bottom-28 z-20"
      >
        <Card className="p-7 shadow-2xl border border-border/80 bg-card w-56">
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Available Credits</p>
            <p className="text-4xl font-bold text-foreground">1,250</p>
            
            <div className="w-full bg-muted rounded-full h-3">
              <motion.div
                className="bg-foreground h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "75%" }}
                transition={{ duration: 1.5 }}
              />
            </div>
            <p className="text-xs text-muted-foreground">75% utilized</p>
          </div>
        </Card>
      </motion.div>

      {/* Active Bids - Bottom Right (Now should be clearly visible) */}
      <motion.div
        animate={{
          y: [0, 15, 0],
          x: [0, 35, 0],
        }}
        transition={{
          duration: 8.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.1,
        }}
        className="absolute -right-8 bottom-32 z-10"
      >
        <Card className="p-7 shadow-2xl border border-border/80 bg-card w-72">
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">Active Bids</p>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 bg-foreground rounded-full" />
                  <div>
                    <p className="text-sm font-medium">Design System</p>
                    <p className="text-xs text-muted-foreground">In Review</p>
                  </div>
                </div>
                <span className="font-semibold text-lg">$4.2k</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full" />
                  <div>
                    <p className="text-sm font-medium">API Integration</p>
                    <p className="text-xs text-emerald-600">Awarded</p>
                  </div>
                </div>
                <span className="font-semibold text-lg">$8.5k</span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}