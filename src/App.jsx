import { motion, AnimatePresence } from "motion/react";
import "./App.scss";
import Header from "./components/Header";
import PokerChips from "./components/PokerChips";
import PlayerBalance from "./components/PlayerBalance";
import { useBlackjackGame } from "./hooks/useBlackjackGame";
import { useRef } from "react";

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

  const overlap = 40;
  const risePattern = [0, 20, 0, 0, 20, 0];
  const rotationPattern = [-6,  2, 10, -6,  2, 10];
  const xPattern = [0,  1,  2,  0,  1,  2];
  const buttonsRef = useRef(null);
  
  

  return (
    <>
    <Header />
    <PokerChips
      playerBalance={playerBalance}
      playerBet={playerBet}
      handlePokerChipClick={handlePokerChipClick}
      clearPlaceholder={gameOver}
      onChipRemoved={handleChipRemoved}
    />
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
          
          {gameOver && (
            <div className="game-over-text">
              {playerWins === true && <p>Player wins!</p>}
              {playerWins === false && <p>Dealer wins!</p>}
              {playerWins === null && <p>It's a tie!</p>}
              <button className="deal-again-button" onClick={startNewHand}>Deal Again</button>
              {playerBalance <= 0 && <><p>Game Over! You've run out of money.</p><button onClick={resetGameState}>Reset Game</button></>}
            </div>
          )}
          <div className="playerHand">
            <p className="card-total">{playerHand.length > 0 ? countCards(playerHand).display : ''}</p>
            <div className="cards">
              <AnimatePresence>
                {playerHand.map((card, index) => {
                  // fallback ensures the layout still works beyond 6 cards
                  const xIndex = xPattern[index] ?? index;
                  const rise = risePattern[index] ?? index * 20;
                  const rotation = rotationPattern[index] ?? 0;

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
                        x: -xIndex * overlap,
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
                  const xIndex = xPattern[index] ?? index;
                  const rise = risePattern[index] ?? index * 20;
                  const rotation = rotationPattern[index] ?? 0;
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
                        x: -xIndex * overlap,
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
              transition={{ duration: 0.2, ease: "easeOut", delay: 0.9, type: "spring", stiffness: 400, damping: 25 }}
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
              transition={{ duration: 0.2, ease: "easeOut", delay: 0.9, type: "spring", stiffness: 400, damping: 25 }}
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
