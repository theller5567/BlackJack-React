import React, { useEffect, useState } from 'react'
import { motion, animate } from "motion/react"

function PlayerBalance({ playerBalance }) {
  const [displayBalance, setDisplayBalance] = useState(playerBalance);
  const [previousBalance, setPreviousBalance] = useState(playerBalance);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animate balance changes
  useEffect(() => {
    if (previousBalance !== playerBalance) {
      setIsAnimating(true);

      // Animate the number counting smoothly
      const controls = animate(previousBalance, playerBalance, {
        duration: 1.2,
        ease: "easeOut",
        onUpdate: (value) => {
          setDisplayBalance(Math.round(value));
        },
        onComplete: () => {
          setIsAnimating(false);
          setPreviousBalance(playerBalance);
        }
      });

      return controls.stop;
    }
  }, [playerBalance, previousBalance]);

  // Determine color based on balance change
  const textColor = (playerBalance - previousBalance) > 0 ? "#22c55e" :
                   (playerBalance - previousBalance) < 0 ? "#ef4444" : "#ffffff";

  return (
    <motion.div className="player-balance">
      Balance: {" "}
      <motion.span
        style={{
          display: "inline-block",
          color: textColor
        }}
        animate={{
          scale: isAnimating ? [1, 1.15, 1] : 1,
          textShadow: isAnimating ? "0 0 12px currentColor" : "none"
        }}
        transition={{
          duration: 0.8,
          ease: "easeOut",
          scale: {
            times: [0, 0.4, 1],
            ease: "easeOut"
          }
        }}
      >
        ${displayBalance}
      </motion.span>
    </motion.div>
  )
};

export default PlayerBalance;