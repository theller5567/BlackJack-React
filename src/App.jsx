import { motion, AnimatePresence } from "motion/react";
import "./App.scss";
import Header from "./components/Header";
import PokerChips from "./components/PokerChips";
import PlayerBalance from "./components/PlayerBalance";
import { useBlackjackGame } from "./hooks/useBlackjackGame";



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
    // Functions
    dealCards,
    drawCards,
    stand,
    handlePokerChipClick,
    handleChipRemoved,
    resetGameState,
    countCards,
  } = useBlackjackGame();

  const overlap = 40;
  const risePattern = [0, 20, 0, 0, 20, 0];
  const rotationPattern = [-6,  2, 10, -6,  2, 10];
  const xPattern = [0,  1,  2,  0,  1,  2];

  
  

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
        <div className="card-table">
          {playerBet <= 0 && <p className="place-bets">Place Your Bets</p>}
          {gameOver && (
            <div className="game-over-text" onClick={resetGameState}>
              {playerWins === true && <p>Player wins!</p>}
              {playerWins === false && <p>Dealer wins!</p>}
              {playerWins === null && <p>It's a tie!</p>}
              {playerBalance <= 0 && <><p>Game Over!</p><button onClick={() => {}}>Play Again</button></>}
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
        {playerHand.length > 0 && <button onClick={drawCards}>Hit</button>}
        {(playerHand.length === 0 && playerBet > 0) && <button onClick={dealCards}>Deal</button>}
        {playerHand.length > 0 && <button onClick={stand}>Stand</button>}
      </div>
    </main>
    </>
  );
}

export default App;
