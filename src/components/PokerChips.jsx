import React, { useReducer, useRef } from "react";
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

// Chip state actions
const CHIP_ACTIONS = {
  START_ANIMATION: 'START_ANIMATION',
  COMPLETE_ANIMATION: 'COMPLETE_ANIMATION',
  CLEAR_CHIPS: 'CLEAR_CHIPS',
};

// Initial chip state
const initialChipState = {
  animatingChip: null,
  chipsInPlaceholder: [],
  chipIdCounter: 0,
  processedAnimations: new Set(), // Track completed animations to prevent duplicates
};

// Chip state reducer - handles all chip-related state changes atomically
function chipReducer(state, action) {
  switch (action.type) {
    case CHIP_ACTIONS.START_ANIMATION:
      return {
        ...state,
        animatingChip: action.payload.animationData,
        chipIdCounter: state.chipIdCounter + 1,
        processedAnimations: new Set(), // Reset for new animation
      };

    case CHIP_ACTIONS.COMPLETE_ANIMATION:
      const { chipData } = action.payload;
      const animationKey = `${chipData.id}-${chipData.movingBack ? 'back' : 'forward'}`;

      // Prevent processing the same animation multiple times
      if (state.processedAnimations.has(animationKey)) {
        console.log('Animation already processed:', animationKey);
        return state;
      }

      if (chipData.movingBack) {
            // Chip is moving back - remove from placeholder
            const alreadyRemoved = !state.chipsInPlaceholder.some(chip => chip.id === chipData.id);
            if (alreadyRemoved) {
              return {
                ...state,
                animatingChip: null,
                processedAnimations: new Set([...state.processedAnimations, animationKey]),
              };
            }

            const filteredChips = state.chipsInPlaceholder.filter(chip => chip.id !== chipData.id);

        return {
          ...state,
          chipsInPlaceholder: filteredChips,
          animatingChip: null,
          processedAnimations: new Set([...state.processedAnimations, animationKey]),
        };
      } else {
            // Chip arrived at placeholder - add to array
            const alreadyExists = state.chipsInPlaceholder.some(chip => chip.id === chipData.id);
            if (alreadyExists) {
              return {
                ...state,
                animatingChip: null,
                processedAnimations: new Set([...state.processedAnimations, animationKey]),
              };
            }

            const newChips = [...state.chipsInPlaceholder, {
              id: chipData.id,
              src: chipData.src,
              value: chipData.value
            }];

        return {
          ...state,
          chipsInPlaceholder: newChips,
          animatingChip: null,
          processedAnimations: new Set([...state.processedAnimations, animationKey]),
        };
      }

    case CHIP_ACTIONS.CLEAR_CHIPS:
      return {
        ...state,
        chipsInPlaceholder: [],
        processedAnimations: new Set(),
      };

    default:
      return state;
  }
}

function PokerChips({
  playerBalance,
  playerBet,
  handlePokerChipClick,
  clearPlaceholder = false,
  onChipRemoved = () => {},
}) {
  const [chipState, dispatch] = useReducer(chipReducer, initialChipState);
  const placeholderRef = useRef(null);
  const chipRefs = useRef([]);

  // Track original chip positions for animation back
  const [chipPositions, setChipPositions] = React.useState({});

  // Clear placeholder when game outcome occurs
  React.useEffect(() => {
    if (clearPlaceholder) {
      dispatch({ type: CHIP_ACTIONS.CLEAR_CHIPS });
    }
  }, [clearPlaceholder]);

  const animateChipToPlaceholder = (chipElement, chipData) => {
    if (!placeholderRef.current || !chipElement) return;

    // Prevent multiple simultaneous animations
    if (chipState.animatingChip) {
      console.warn('Animation already in progress, ignoring new animation request');
      return;
    }

    // Get positions for animation
    const chipRect = chipElement.getBoundingClientRect();
    const placeholderRect = placeholderRef.current.getBoundingClientRect();

    const currentId = chipState.chipIdCounter;

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

        dispatch({
          type: CHIP_ACTIONS.START_ANIMATION,
          payload: { animationData }
        });
  };

  const handleChipClick = (event, chipData) => {
    const chipElement = event.currentTarget;

    // Store the original position of this chip for potential animation back
    const chipRect = chipElement.getBoundingClientRect();
    setChipPositions(prev => ({
      ...prev,
      [chipState.chipIdCounter]: {
        left: chipRect.left,
        top: chipRect.top,
        width: chipRect.width,
        height: chipRect.height
      }
    }));

    // Start the animation
    animateChipToPlaceholder(chipElement, chipData);

    // Call the original click handler immediately for snappier feel
    handlePokerChipClick(event);
  };

  const handlePlaceholderChipClick = (chipData) => {
    if (!chipPositions[chipData.id]) {
      return;
    }

    // Prevent multiple simultaneous animations
    if (chipState.animatingChip) {
      console.warn('Animation already in progress, ignoring chip removal request');
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

    dispatch({
      type: CHIP_ACTIONS.START_ANIMATION,
      payload: { animationData }
    });
  };

  const setPokerChips = () => {
    return pokerChips.map((pokerChip, index) => {
      if (playerBalance >= pokerChip.value) {
        return (
          <motion.button
          initial={{ scale: 0, opacity: 0, x: -100 }}
          animate={{ scale: 1, opacity: 1, x: 0 }}
          exit={{ scale: 0, opacity: 0, x: -100 }}
          whileHover={{ scale: 1.05, transition: { duration: 0.15, ease: "easeOut" } }}
          transition={{ duration: 0.2, ease: "easeOut", delay: (0.05 * index) }}
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
            {chipState.chipsInPlaceholder.map((chipData, index) => (
              <motion.img
                key={chipData.id}
                src={chipData.src}
                alt={`Bet: $${chipData.value}`}
                onClick={() => handlePlaceholderChipClick(chipData)}
                layout
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: 0.9,
                  opacity: 1,
                  x: index * 10
                }}
                exit={{
                  scale: 0,
                  opacity: 0,
                  transition: { duration: 0.1 }
                }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                  layout: { duration: 0.3 }
                }}
                whileHover={{
                  scale: 1.1,
                  transition: { duration: 0.3 }
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
        {chipState.animatingChip && (
          <motion.div
            className="animated-chip"
            initial={{
              x: 0,
              y: 0,
              scale: 0.9, // Start closer to final size for less "pop"
            }}
            animate={{
              x: chipState.animatingChip.deltaX,
              y: chipState.animatingChip.deltaY,
              scale: chipState.animatingChip.movingBack ? 1 : 0.8,
            }}
            exit={{
              scale: 0,
              opacity: 0,
            }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 35,
              mass: 0.8,
              scale: { duration: 0.15 }
            }}
            onAnimationComplete={() => {
              // Dispatch completion action - reducer handles all state updates atomically
              dispatch({
                type: CHIP_ACTIONS.COMPLETE_ANIMATION,
                payload: { chipData: chipState.animatingChip }
              });

              // Handle balance update for chip removal
              if (chipState.animatingChip.movingBack) {
                setTimeout(() => onChipRemoved(chipState.animatingChip.value), 0);
              }
            }}
            style={{
              position: "fixed",
              left: chipState.animatingChip.startX,
              top: chipState.animatingChip.startY,
              width: "150px",
              height: "150px",
              pointerEvents: "none",
              zIndex: 1000,
            }}
          >
            <img
              src={chipState.animatingChip.src}
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
