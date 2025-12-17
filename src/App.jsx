import { motion, AnimatePresence } from "motion/react";
import "./App.scss";
import Header from "./components/Header";
import PokerChips from "./components/PokerChips";
import PlayerBalance from "./components/PlayerBalance";
import { useBlackjackGame } from "./hooks/useBlackjackGame";
import { useRef, useMemo } from "react";

// Game configuration constants
const CARD_OVERLAP = 40;
const RISE_PATTERN = [0, 20, 0, 0, 20, 0];
const ROTATION_PATTERN = [-6,  2, 10, -6,  2, 10];
const X_PATTERN = [0,  1,  2,  0,  1,  2];

function App() {
  const {
    // State
    playerHand,
    dealerHand,
    playerBalance,
    playerBet,
    playerWins,
    gameOver,
    showDealerCards,
    cardsDealt,
    // Functions
    dealCards,
    drawCards,
    stand,
    handlePokerChipClick,
    handleChipRemoved,
    resetGameState,
    startNewHand,
    countCards,
  } = useBlackjackGame();

  // Memoize props to prevent unnecessary re-renders
  const pokerChipsProps = useMemo(() => ({
    playerBalance,
    playerBet,
    handlePokerChipClick,
    clearPlaceholder: gameOver || playerBet === 0,
    onChipRemoved: handleChipRemoved,
  }), [playerBalance, playerBet, gameOver, handlePokerChipClick, handleChipRemoved]);

  return (
    <>
    <Header />
    <PokerChips {...pokerChipsProps} />
    <PlayerBalance playerBalance={playerBalance} />
    <main>
      <div className="game-status">
      <AnimatePresence>
            {playerBet <= 0 &&
            <motion.p
            key="place-bets"
            layout
            className="place-bets"
            initial={{ opacity: 0, y: -300, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -300, x: '-50%' }}
            transition={{ duration: 0.2, delay: 0.5, type: "spring", stiffness: 400, damping: 25, ease: "easeOut" }}>
            Place Your Bets
            </motion.p>}
          </AnimatePresence>
        <div className="card-table">
          
          <AnimatePresence>
            {gameOver && (
              <motion.div
                className="game-over-text"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {playerWins === true && <p>Player wins!</p>}
                {playerWins === false && <p>Dealer wins!</p>}
                {playerWins === null && <p>It's a tie!</p>}
                <motion.button
                  className="deal-again-button"
                  onClick={startNewHand}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Deal Again
                </motion.button>
                {playerBalance <= 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <p>Game Over! You've run out of money.</p>
                    <motion.button
                      onClick={resetGameState}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Reset Game
                    </motion.button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          <div className="playerHand">
            <p className="card-total">{playerHand.length > 0 ? countCards(playerHand).display : ''}</p>
            <div className="cards">
              <AnimatePresence>
                {playerHand.map((card, index) => {
                  // fallback ensures the layout still works beyond 6 cards
                  const xIndex = X_PATTERN[index] ?? index;
                  const rise = RISE_PATTERN[index] ?? index * 20;
                  const rotation = ROTATION_PATTERN[index] ?? 0;

                  return (
                    <motion.div
                      layout
                      initial={{
                        scale: 0,
                        opacity: 0,
                        x: -900,
                        y: -100,
                        rotate: 0
                      }}
                      animate={{
                        scale: 1,
                        opacity: 1,
                        x: -xIndex * CARD_OVERLAP,
                        y: -rise,
                        rotate: rotation
                      }}
                      exit={{
                        scale: 0,
                        opacity: 0,
                        transition: { duration: 0.2 }
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 25,
                        delay: index * 0.1 // Stagger card appearances
                      }}
                      className="card"
                      key={card.code}
                      style={{
                        zIndex: index + 1
                      }}
                    >
                      <img src={card.image} alt={card.value} />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
          <div className="dealerHand">
            <p className="card-total">{(gameOver && dealerHand.length > 0) ? countCards(dealerHand).display : ''}</p>
            <div className="cards">
              <AnimatePresence>
                {dealerHand.map((card, index) => {
                  // fallback ensures the layout still works beyond 6 cards
                  const xIndex = X_PATTERN[index] ?? index;
                  const rise = RISE_PATTERN[index] ?? index * 20;
                  const rotation = ROTATION_PATTERN[index] ?? 0;
                  const style = index === 0 && !showDealerCards && "hide";
                  return (
                    <motion.div
                      layout
                      initial={{
                        scale: 0,
                        opacity: 0,
                        x: 900,
                        y: -100,
                        rotate: 0
                      }}
                      animate={{
                        scale: 1,
                        opacity: 1,
                        x: -xIndex * CARD_OVERLAP,
                        y: -rise,
                        rotate: rotation
                      }}
                      exit={{
                        scale: 0,
                        opacity: 0,
                        transition: { duration: 0.2 }
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 25,
                        delay: index * 0.1 // Stagger card appearances
                      }}
                      className={`card ${style}`}
                      key={card.code}
                      style={{
                        zIndex: index + 1
                      }}
                    >
                      <img src={card.image} alt={card.value} />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      <div className="buttons">
        <AnimatePresence>
          {(cardsDealt && !gameOver) && (
            <motion.button
              initial={{ opacity: 0, x: -500 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -500 }}
              transition={{ duration: 0.3, ease: "easeOut", delay: 0.6, type: "spring", stiffness: 400, damping: 25 }}
              className="hit-button"
              onClick={drawCards}
              key="hit-button"
            >
              Hit
            </motion.button>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {((playerHand.length === 0 && playerBet > 0) || (!cardsDealt && playerBet > 0 && playerHand.length > 0)) && (
            <motion.button
              initial={{ opacity: 1, y: 500 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 1, y: 500 }}
              transition={{ duration: 0.2, ease: "easeOut", type: "spring", stiffness: 400, damping: 25 }}
              className="deal-button"
              onClick={dealCards}
              key="deal-button"
            >
              Deal
            </motion.button>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {(cardsDealt && !gameOver) && (
            <motion.button
              initial={{ opacity: 0, x: 500 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 500 }}
              transition={{ duration: 0.3, ease: "easeOut", delay: 0.6, type: "spring", stiffness: 400, damping: 25 }}
              className="stand-button"
              onClick={stand}
              key="stand-button"
            >
              Stand
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </main>
    </>
  );
}

export default App;
