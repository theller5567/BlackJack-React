import React, { useState, useRef } from "react";
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

    // Get positions
    const chipRect = chipElement.getBoundingClientRect();
    const placeholderRect = placeholderRef.current.getBoundingClientRect();

    // Calculate the translation needed
    const deltaX = placeholderRect.left - chipRect.left;
    const deltaY = placeholderRect.top - chipRect.top;

    // Create animation data
    const animationData = {
      src: chipData.src,
      startX: chipRect.left,
      startY: chipRect.top,
      endX: placeholderRect.left,
      endY: placeholderRect.top,
      deltaX,
      deltaY,
      value: chipData.value,
    };

    setAnimatingChip(animationData);

    // Start animation after a brief delay to ensure state update
    setTimeout(() => {
      setAnimatingChip((prev) => (prev ? { ...prev, animate: true } : null));
    }, 50);

    // Add the chip to placeholder after animation completes
    const currentId = chipIdCounter;
    setTimeout(() => {
      setAnimatingChip(null);
      setChipsInPlaceholder(prev => [...prev, { ...chipData, id: currentId }]);
      setChipIdCounter(prev => prev + 1);
    }, 500); // Match CSS transition duration
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

    // Calculate translation back to original position
    const deltaX = originalPosition.left - placeholderRect.left;
    const deltaY = originalPosition.top - placeholderRect.top;

    // Create animation data for moving back
    const animationData = {
      src: chipData.src,
      startX: placeholderRect.left,
      startY: placeholderRect.top,
      endX: originalPosition.left,
      endY: originalPosition.top,
      deltaX,
      deltaY,
      value: chipData.value,
      movingBack: true
    };

    setAnimatingChip(animationData);

    // Start animation after a brief delay
    setTimeout(() => {
      setAnimatingChip(prev => prev ? { ...prev, animate: true } : null);
    }, 50);

    // Remove the specific chip from placeholder after animation completes
    setTimeout(() => {
      setAnimatingChip(null);
      setChipsInPlaceholder(prev => prev.filter(chip => chip.id !== chipData.id));
      // Notify parent that chip was removed
      onChipRemoved(chipData.value);
    }, 800);
  };

  const setPokerChips = () => {
    return pokerChips.map((pokerChip, index) => {
      if (playerBalance >= pokerChip.value) {
        return (
          <button
            className="poker-chip"
            key={index}
            data-value={pokerChip.value}
            onClick={(event) => handleChipClick(event, pokerChip)}
            ref={(el) => (chipRefs.current[index] = el)}
          >
            <img src={pokerChip.src} alt="Poker Chip" />
          </button>
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
          {chipsInPlaceholder.map((chipData, index) => (
            <img
              key={chipData.id}
              src={chipData.src}
              alt={`Bet: $${chipData.value}`}
              onClick={() => handlePlaceholderChipClick(chipData)}
              style={{
                position: "absolute",
                top: `${index * 5}px`,
                left: `${index * 5}px`,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "50%",
                cursor: "pointer",
                transition: "transform 0.1s ease",
                zIndex: chipsInPlaceholder.length + index,
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "scale(1)";
              }}
            />
          ))}
        </div>
      </div>
      <div className="chips">
        {setPokerChips()}
      </div>

      {/* Animated chip */}
      {animatingChip && (
        <div
          className="animated-chip"
          style={{
            position: "fixed",
            left: animatingChip.startX,
            top: animatingChip.startY,
            width: "150px",
            height: "150px",
            pointerEvents: "none",
            zIndex: 1000,
            transform: animatingChip.animate
              ? `translate(${animatingChip.deltaX}px, ${animatingChip.deltaY}px)`
              : "translate(0, 0)",
            transition: animatingChip.animate
              ? "transform 500ms ease-out"
              : "none",
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
        </div>
      )}
    </div>
  );
}

export default PokerChips;
