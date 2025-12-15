import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import pk25 from "../assets/pk-25@2x.png";
import pk50 from "../assets/pk-50@2x.png";
import pk100 from "../assets/pk-100@2x.png";
import pk500 from "../assets/pk-500@2x.png";

const pokerChips = [
  { src: pk25, value: 25 },
  { src: pk50, value: 50 },
  { src: pk100, value: 100 },
  { src: pk500, value: 500 },
];

function PokerChips({
  playerBalance,
  playerBet,
  handlePokerChipClick,
  clearPlaceholder = false,
  onChipRemoved = () => {},
}) {
  const [animatingChip, setAnimatingChip] = useState(null);
  const [chipsInPlaceholder, setChipsInPlaceholder] = useState([]);
  const [chipIdCounter, setChipIdCounter] = useState(0);
  const placeholderRef = useRef(null);
  const chipRefs = useRef([]);

  // Track original chip positions for animation back
  const [chipPositions, setChipPositions] = useState({});

  // Clear placeholder when game outcome occurs
  React.useEffect(() => {
    if (clearPlaceholder) {
      setChipsInPlaceholder([]);
    }
  }, [clearPlaceholder]);

  const animateChipToPlaceholder = (chipElement, chipData) => {
    if (!placeholderRef.current || !chipElement) return;

    // Prevent multiple simultaneous animations
    if (animatingChip) {
      console.warn('Animation already in progress, ignoring new animation request');
      return;
    }

    // Get positions for animation
    const chipRect = chipElement.getBoundingClientRect();
    const placeholderRect = placeholderRef.current.getBoundingClientRect();

    const currentId = chipIdCounter;

    // Create animation data for Framer Motion
    const animationData = {
      src: chipData.src,
      value: chipData.value,
      id: currentId,
      startX: chipRect.left,
      startY: chipRect.top,
      endX: placeholderRect.left,
      endY: placeholderRect.top,
      deltaX: placeholderRect.left - chipRect.left,
      deltaY: placeholderRect.top - chipRect.top,
    };

    console.log('Starting chip animation:', animationData);
    setAnimatingChip(animationData);
    setChipIdCounter(prev => prev + 1);
  };

  const handleChipClick = (event, chipData) => {
    const chipElement = event.currentTarget;

    // Store the original position of this chip for potential animation back
    const chipRect = chipElement.getBoundingClientRect();
    setChipPositions(prev => ({
      ...prev,
      [chipIdCounter]: {
        left: chipRect.left,
        top: chipRect.top,
        width: chipRect.width,
        height: chipRect.height
      }
    }));

    // Start the animation
    animateChipToPlaceholder(chipElement, chipData);

    // Call the original click handler after animation starts
    setTimeout(() => {
      handlePokerChipClick(event);
    }, 200);
  };

  const handlePlaceholderChipClick = (chipData) => {
    if (!chipPositions[chipData.id]) {
      return;
    }

    const originalPosition = chipPositions[chipData.id];
    const placeholderRect = placeholderRef.current.getBoundingClientRect();

    // Create animation data for moving back
    const animationData = {
      src: chipData.src,
      value: chipData.value,
      id: chipData.id,
      startX: placeholderRect.left,
      startY: placeholderRect.top,
      endX: originalPosition.left,
      endY: originalPosition.top,
      deltaX: originalPosition.left - placeholderRect.left,
      deltaY: originalPosition.top - placeholderRect.top,
      movingBack: true
    };

    setAnimatingChip(animationData);
  };

  const setPokerChips = () => {
    return pokerChips.map((pokerChip, index) => {
      if (playerBalance >= pokerChip.value) {
        return (
          <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.1, transition: { duration: 0.1 } }}
          transition={{ duration: 0.2, type: "spring", stiffness: 500, damping: 30 }}
            className="poker-chip"
            key={index}
            data-value={pokerChip.value}
            onClick={(event) => handleChipClick(event, pokerChip)}
            ref={(el) => (chipRefs.current[index] = el)}
          >
            <img src={pokerChip.src} alt="Poker Chip" />
          </motion.button>
        );
      } else {
        return <div className="chip-placeholder" key={index}></div>;
      }
    });
  };

  return (
    <div className="poker-chips">
      <div className="chip-placeholder-container">
        <p className="balance">Betting: ${playerBet}</p>
        <div className="chip-placeholder" ref={placeholderRef}>
          <AnimatePresence>
            {chipsInPlaceholder.map((chipData, index) => (
              <motion.img
                key={chipData.id}
                src={chipData.src}
                alt={`Bet: $${chipData.value}`}
                onClick={() => handlePlaceholderChipClick(chipData)}
                layout
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  x: index * 8,
                  y: index * 8
                }}
                exit={{
                  scale: 0,
                  opacity: 0,
                  transition: { duration: 0.2 }
                }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                  layout: { duration: 0.3 }
                }}
                whileHover={{
                  scale: 1.1,
                  transition: { duration: 0.1 }
                }}
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "50%",
                  cursor: "pointer",
                }}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
      <div className="chips">
        {setPokerChips()}
      </div>

      {/* Animated chip */}
      <AnimatePresence>
        {animatingChip && (
          <motion.div
            className="animated-chip"
            initial={{
              x: 0,
              y: 0,
              scale: 1,
            }}
            animate={{
              x: animatingChip.deltaX,
              y: animatingChip.deltaY,
              scale: animatingChip.movingBack ? 0.9 : 1.1,
            }}
            exit={{
              scale: 0,
              opacity: 0,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              scale: { duration: 0.2 }
            }}
            onAnimationComplete={() => {
              console.log('Animation completed for chip:', animatingChip.id, animatingChip.movingBack ? 'moving back' : 'arriving at placeholder');

              if (animatingChip.movingBack) {
                // Chip is moving back - remove from placeholder
                setChipsInPlaceholder(prev => {
                  const filtered = prev.filter(chip => chip.id !== animatingChip.id);
                  console.log('Removed chip from placeholder. Before:', prev.length, 'After:', filtered.length);
                  return filtered;
                });
                onChipRemoved(animatingChip.value);
              } else {
                // Chip reached placeholder - add to chips array (prevent duplicates)
                setChipsInPlaceholder(prev => {
                  // Check if this chip is already in the placeholder
                  const alreadyExists = prev.some(chip => chip.id === animatingChip.id);
                  console.log('Chip arrived at placeholder. ID:', animatingChip.id, 'Already exists:', alreadyExists, 'Current count:', prev.length);

                  if (alreadyExists) {
                    console.warn('Prevented duplicate chip addition');
                    return prev; // Don't add duplicate
                  }

                  const newChips = [...prev, {
                    id: animatingChip.id,
                    src: animatingChip.src,
                    value: animatingChip.value
                  }];
                  console.log('Added chip to placeholder. New count:', newChips.length);
                  return newChips;
                });
              }
              setAnimatingChip(null);
            }}
            style={{
              position: "fixed",
              left: animatingChip.startX,
              top: animatingChip.startY,
              width: "150px",
              height: "150px",
              pointerEvents: "none",
              zIndex: 1000,
            }}
          >
            <img
              src={animatingChip.src}
              alt="Animating Poker Chip"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "50%",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PokerChips;
