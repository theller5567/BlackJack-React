import { useState, useEffect, useRef } from "react";
import { cardDeck } from "./constants/cardDeck";
import { motion, AnimatePresence } from "motion/react";
import "./App.scss";
import Header from "./components/Header";
import PokerChips from "./components/PokerChips";
import PlayerBalance from "./components/PlayerBalance";



function App() {
  
  const [deck, setDeck] = useState({});
  const [cardsInPlay, setCardsInPlay] = useState({
    playerHand: [],
    dealerHand: [],
  });
  const localGameState = useRef({
    playerHand: [],
    dealerHand: [],
  });
  const [playerBalance, setPlayerBalance] = useState(2500);
  const [playerBet, setPlayerBet] = useState(0);
  // Keep local state in sync with React state
  useEffect(() => {
    localGameState.current = { ...cardsInPlay };
  }, [cardsInPlay]);

  const resetGameState = () => {
    localGameState.current = {
      playerHand: [],
      dealerHand: [],
    };
    setPlayerWins(null);
    setGameOver(false);
    setShowDealerCards(false);
    setCardsInPlay({
      playerHand: [],
      dealerHand: [],
    });
    setPlayerBet(0);
    
  };

  // Initialize/reset game state on mount
  useEffect(() => {
    resetGameState();
  }, []);
  const [playerWins, setPlayerWins] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showDealerCards, setShowDealerCards] = useState(false);

  useEffect(() => {
    getDeck();
  }, []);

  // Log current totals whenever cards change
  useEffect(() => {
    if (cardsInPlay.playerHand.length > 0 || cardsInPlay.dealerHand.length > 0) {
      const playerCount = countCards(cardsInPlay.playerHand);
      const dealerCount = countCards(cardsInPlay.dealerHand);
      console.log('Player total:', playerCount.display);
      console.log('Dealer total:', dealerCount.display);
      if(playerCount.optimal > 21) {
        endGame('dealerWins');
      }
      if(playerCount.optimal === 21){
        endGame('playerWins');
      }
    }
  }, [cardsInPlay]);

  // Debug balance and bet changes
  useEffect(() => {
    console.log('Balance changed to: $' + playerBalance + ', Bet: $' + playerBet);
  }, [playerBalance, playerBet]);

  function endGame(winner){
    if (winner === 'playerWins') {
      setPlayerBalance(prevBalance => prevBalance + (playerBet * 2));
    } else if (winner === 'dealerWins') {
      setPlayerBalance(prevBalance => prevBalance - playerBet);
    } else {
      // tie
      setPlayerBalance(prevBalance => prevBalance + playerBet);
    }
    
    setTimeout(() => {
      setPlayerWins(winner === 'playerWins' ? true : winner === 'dealerWins' ? false : null);
      setGameOver(true);
    }, 1000);
  }


  function getDeck() {
    const data = cardDeck;
    console.log("Deck fetched:", data);
    setDeck(data);
  }

  function drawCardSync(handKey) {
    // Use local game state for tracking used cards
    const usedCards = [
      ...localGameState.current.playerHand,
      ...localGameState.current.dealerHand
    ];

    const usedSet = new Set(usedCards.map(card => card.code));

    // Filter available cards
    const available = cardDeck.filter(card => !usedSet.has(card.code));

    if (available.length < 1) {
      console.warn("Not enough cards left to draw.");
      return null;
    }

    // Shuffle
    const shuffled = [...available];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const drawnCard = shuffled[0];
    console.log(`Drew ${drawnCard.rank}${drawnCard.suit[0]} for ${handKey} (${52 - usedSet.size - 1} left)`);

    // Update local state synchronously
    localGameState.current[handKey] = [...localGameState.current[handKey], drawnCard];

    // Sync to React state
    setCardsInPlay({ ...localGameState.current });

    return drawnCard;
  }

  async function getCards(numCards, handKey) {
    // For backward compatibility - draw multiple cards with delays
    for (let i = 0; i < numCards; i++) {
      drawCardSync(handKey);
      // Small delay to ensure state updates between draws
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  const dealerPlay = async () => {
    if (gameOver) {
      return;
    }
    let hitCount = 0;
    const maxHits = 10;
    // Check dealer's total after drawing using local state
    let dealerCount = countCards(localGameState.current.dealerHand);
    let dealerTotal = dealerCount.optimal;
    // Dealer hits until they reach 17 or higher (or bust)
    while (hitCount < maxHits && !gameOver) {
      // Check current total BEFORE hitting using local state
      const currentCount = countCards(localGameState.current.dealerHand);
      const currentTotal = currentCount.optimal;

      // If dealer already has 17 or higher, stand (except soft 17)
      if (currentTotal >= 17) {
        const hasAce = isSoftHand(localGameState.current.dealerHand);
        if (!(currentTotal === 17 && hasAce)) {
          console.log(`Dealer stands with ${currentTotal}`);
          break; // Dealer stands without hitting
        }
      }

      hitCount++;
      console.log(`Dealer hits (attempt ${hitCount})`);

      // Draw one card for dealer
      const drawnCard = drawCardSync("dealerHand");

      if (!drawnCard) {
        console.log("No cards left to draw");
        break;
      }

      // Update dealer total after drawing
      dealerCount = countCards(localGameState.current.dealerHand);
      dealerTotal = dealerCount.optimal;
      console.log("Dealer total after hit:", dealerTotal);

      if (dealerTotal > 21) {
        console.log("Dealer busts!");
        endGame('playerWins');
        return;
      }

      // If dealer now has 17 or higher after hitting, check if they should stand
      if (dealerTotal >= 17) {
        const hasAce = isSoftHand(localGameState.current.dealerHand);
        if (!(dealerTotal === 17 && hasAce)) {
          console.log("Dealer stands with", dealerTotal);
          break; // Dealer stands
        }
        // If soft 17 after hitting, continue the loop to hit again
      }

      // Small delay for visual effect
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Dealer finished playing - determine winner
    console.log("Dealer finished playing", dealerTotal);
    determineWinner(localGameState.current.dealerHand);
  };

  const determineWinner = (finalDealerCards = null) => {
    const playerCount = countCards(cardsInPlay.playerHand);
    const dealerCards = finalDealerCards || cardsInPlay.dealerHand;
    const dealerCount = countCards(dealerCards);
    const playerTotal = playerCount.optimal;
    const dealerTotal = dealerCount.optimal;
    console.log('determineWinner - Player:', playerTotal, 'Dealer:', dealerTotal);
    // Check for busts first
    if (playerTotal > 21) {
      endGame('dealerWins');
    } else if (dealerTotal > 21) {
      endGame('playerWins');
    } else if(playerTotal === 21 && dealerTotal === 21) {
      endGame('tie');
    } else if(playerTotal === 21) {
      endGame('playerWins');
    } else if(dealerTotal === 21) {
      endGame('dealerWins');
    } else if (playerTotal > dealerTotal) {
      endGame('playerWins');
    } else if (dealerTotal > playerTotal) {
      endGame('dealerWins');
    } else {
      endGame('tie');
    }
  };

  const stand = () => {
    setShowDealerCards(true);
    dealerPlay();
  };

  const countCards = (cards) => {
    let baseTotal = 0;  // Total without aces
    let aces = 0;

    // First pass: count aces and add non-ace values
    for (let card of cards) {
      if (card.rank === 'A') {  // Check rank for Ace
        aces++;
      } else if (['K', 'Q', 'J'].includes(card.rank)) {  // Face cards
        baseTotal += 10;
      } else {
        // Numeric cards (2-10) - use rank to get the number
        baseTotal += parseInt(card.rank) || 0;
      }
    }

    // Calculate different totals
    const hardTotal = baseTotal + aces;        // All Aces as 1
    const softTotal = baseTotal + (aces * 11); // All Aces as 11

    // Choose optimal total for gameplay
    let optimalTotal = baseTotal;
    for (let i = 0; i < aces; i++) {
      if (optimalTotal + 11 <= 21) {
        optimalTotal += 11;
      } else {
        optimalTotal += 1;
      }
    }

    return {
      optimal: optimalTotal,  // What the game uses for logic
      display: aces > 0 ? `${hardTotal} | ${softTotal}` : optimalTotal,
      hard: hardTotal,        // Aces as 1
      soft: softTotal,        // Aces as 11
      hasAces: aces > 0,
      aces: aces
    };
  }

  const isSoftHand = (cards) => {
    // A hand is soft if it contains at least one Ace
    return cards.some((card) => card.rank === "A");
  };

  const dealCards = async () => {
    await getCards(2, "playerHand");
    await getCards(2, "dealerHand");
  };

  const drawCards = async () => {
    console.log('Player hits - drawing card...');
    const drawnCard = drawCardSync("playerHand");

    if (drawnCard) {
      // Wait for state update and let useEffect handle logging
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  const overlap = 40;
  const risePattern = [0, 20, 0, 0, 20, 0];
  const rotationPattern = [-6,  2, 10, -6,  2, 10];
  const xPattern = [0,  1,  2,  0,  1,  2];

  const handlePokerChipClick = (e) => {
    const value = Number(e.target.parentNode.dataset.value);
    console.log('Adding chip worth $' + value + ', current bet: $' + playerBet);
    setPlayerBet(prevBet => {
      const newBet = prevBet + value;
      console.log('New bet after adding chip: $' + newBet);
      return newBet;
    });
    setPlayerBalance(prevBalance => {
      const newBalance = prevBalance - value;
      console.log('New balance after adding chip: $' + newBalance);
      return newBalance;
    });
  }

  const handleChipRemoved = (chipValue) => {
    console.log('=== CHIP REMOVAL START ===');
    console.log('Removing chip worth $' + chipValue);
    console.log('Current state - Bet: $' + playerBet + ', Balance: $' + playerBalance);

    // Add the chip value back to balance and remove from bet
    setPlayerBalance(prevBalance => {
      console.log('Balance update - Previous: $' + prevBalance + ', Adding: $' + chipValue);
      const newBalance = prevBalance + chipValue;
      console.log('Balance update - New: $' + newBalance);
      return newBalance;
    });

    setPlayerBet(prevBet => {
      console.log('Bet update - Previous: $' + prevBet + ', Subtracting: $' + chipValue);
      const newBet = Math.max(0, prevBet - chipValue); // Prevent negative bets
      console.log('Bet update - New: $' + newBet);
      console.log('=== CHIP REMOVAL END ===');
      return newBet;
    });
  }

  
  

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
              {playerBalance <= 0 && <><p>Game Over!</p><button onClick={() => {setPlayerBalance(2500)}}>Play Again</button></>}
            </div>
          )}
          <div className="playerHand">
            <p className="card-total">{cardsInPlay.playerHand.length > 0 ? countCards(cardsInPlay.playerHand).display : ''}</p>
            <div className="cards">
              <AnimatePresence>
                {cardsInPlay.playerHand.map((card, index) => {
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
            <p className="card-total">{(gameOver && cardsInPlay.dealerHand.length > 0) ? countCards(cardsInPlay.dealerHand).display : ''}</p>
            <div className="cards">
              <AnimatePresence>
                {cardsInPlay.dealerHand.map((card, index) => {
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
        {cardsInPlay.playerHand.length > 0 && <button onClick={drawCards}>Hit</button>}
        {(cardsInPlay.playerHand.length === 0 && playerBet > 0) && <button onClick={dealCards}>Deal</button>}
        {cardsInPlay.playerHand.length > 0 && <button onClick={stand}>Stand</button>}
      </div>
    </main>
    </>
  );
}

export default App;

// create a play game button that will show the board
// create a place your bets button that will allow the user to place a bet
// create a deal button that will deal the cards to the player and dealer
// the dealer will draw 2 cards with the first card face down and the second card face up
// the player will draw 2 cards with both cards face up
// create a function that will check the value of the cards and determine the points of the players hand
// create a function that will check the value of the cards and determine the points of the dealers hand
// check if the players hand is greater than 21, if so, the player loses
// check if the dealers hand is greater than 21, if so, the dealer loses
// check if the players hand is equal to 21, if so, the player wins
// check if the dealers hand is equal to 21, if so, the dealer wins
// if the players hand and the dealers hand are both less than 21, allow the player to hit or stand
// if the players hits both the dealer and the player will draw 1 extra card.
// if the players stands both the dealer and the player will reveal their cards and the winner will be determined