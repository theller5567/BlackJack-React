import { useReducer, useEffect, useCallback } from "react";
import { cardDeck } from "../constants/cardDeck";

// Action types for the reducer
const ACTIONS = {
  SET_DECK: 'SET_DECK',
  DRAW_CARD: 'DRAW_CARD',
  PLACE_BET: 'PLACE_BET',
  REMOVE_BET: 'REMOVE_BET',
  END_GAME: 'END_GAME',
  RESET_GAME: 'RESET_GAME',
  SHOW_DEALER_CARDS: 'SHOW_DEALER_CARDS',
};

// Initial state for the reducer
const initialState = {
  deck: [],
  playerHand: [],
  dealerHand: [],
  playerBalance: 2500,
  playerBet: 0,
  playerWins: null, // true, false, or null (tie)
  gameOver: false,
  showDealerCards: false,
  usedCards: new Set(), // Track used cards to prevent duplicates
};

// Reducer function to handle all state changes
function gameReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_DECK:
      return {
        ...state,
        deck: action.payload,
      };

    case ACTIONS.DRAW_CARD: {
      const { handKey, card } = action.payload;
      const newUsedCards = new Set(state.usedCards);
      newUsedCards.add(card.code);

      return {
        ...state,
        [handKey]: [...state[handKey], card],
        usedCards: newUsedCards,
      };
    }

    case ACTIONS.PLACE_BET: {
      const { amount } = action.payload;
      return {
        ...state,
        playerBet: state.playerBet + amount,
        playerBalance: state.playerBalance - amount,
      };
    }

    case ACTIONS.REMOVE_BET: {
      const { amount } = action.payload;
      return {
        ...state,
        playerBet: Math.max(0, state.playerBet - amount),
        playerBalance: state.playerBalance + amount,
      };
    }

    case ACTIONS.END_GAME: {
      const { winner } = action.payload;
      let newBalance = state.playerBalance;

      if (winner === 'playerWins') {
        newBalance = state.playerBalance + (state.playerBet * 2);
      } else if (winner === 'dealerWins') {
        newBalance = state.playerBalance - state.playerBet;
      } else {
        // tie
        newBalance = state.playerBalance + state.playerBet;
      }

      return {
        ...state,
        playerWins: winner === 'playerWins' ? true : winner === 'dealerWins' ? false : null,
        gameOver: true,
        playerBalance: newBalance,
      };
    }

    case ACTIONS.RESET_GAME:
      return {
        ...initialState,
        deck: state.deck, // Preserve the loaded deck
      };

    case ACTIONS.SHOW_DEALER_CARDS:
      return {
        ...state,
        showDealerCards: true,
      };

    default:
      return state;
  }
}

// Card counting utility functions
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
};

const isSoftHand = (cards) => {
  // A hand is soft if it contains at least one Ace
  return cards.some((card) => card.rank === "A");
};

// Custom hook for Blackjack game logic
export function useBlackjackGame() {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Initialize deck on mount
  useEffect(() => {
    const data = cardDeck;
    console.log("Deck fetched:", data);
    dispatch({ type: ACTIONS.SET_DECK, payload: data });
  }, []);

  // Initialize/reset game state on mount
  useEffect(() => {
    resetGameState();
  }, []);

  // Log current totals whenever cards change
  useEffect(() => {
    if (state.playerHand.length > 0 || state.dealerHand.length > 0) {
      const playerCount = countCards(state.playerHand);
      const dealerCount = countCards(state.dealerHand);
      console.log('Player total:', playerCount.display);
      console.log('Dealer total:', dealerCount.display);
      if(playerCount.optimal > 21) {
        endGame('dealerWins');
      }
      if(playerCount.optimal === 21){
        endGame('playerWins');
      }
    }
  }, [state.playerHand, state.dealerHand]);

  // Debug balance and bet changes
  useEffect(() => {
    console.log('Balance changed to: $' + state.playerBalance + ', Bet: $' + state.playerBet);
  }, [state.playerBalance, state.playerBet]);

  // Game functions
  const drawCardSync = useCallback((handKey) => {
    // Filter available cards based on used cards in state
    const available = cardDeck.filter(card => !state.usedCards.has(card.code));

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
    console.log(`Drew ${drawnCard.rank}${drawnCard.suit[0]} for ${handKey} (${52 - state.usedCards.size - 1} left)`);

    // Dispatch action to update state
    dispatch({ type: ACTIONS.DRAW_CARD, payload: { handKey, card: drawnCard } });

    return drawnCard;
  }, [state.usedCards]);

  const getCards = useCallback(async (numCards, handKey) => {
    // For backward compatibility - draw multiple cards with delays
    for (let i = 0; i < numCards; i++) {
      drawCardSync(handKey);
      // Small delay to ensure state updates between draws
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }, [drawCardSync]);

  const endGame = useCallback((winner) => {
    setTimeout(() => {
      dispatch({ type: ACTIONS.END_GAME, payload: { winner } });
    }, 1000);
  }, []);

  const dealerPlay = useCallback(async () => {
    if (state.gameOver) {
      return;
    }
    let hitCount = 0;
    const maxHits = 10;
    // Check dealer's total after drawing using state
    let dealerCount = countCards(state.dealerHand);
    let dealerTotal = dealerCount.optimal;
    // Dealer hits until they reach 17 or higher (or bust)
    while (hitCount < maxHits && !state.gameOver) {
      // Check current total BEFORE hitting using state
      const currentCount = countCards(state.dealerHand);
      const currentTotal = currentCount.optimal;

      // If dealer already has 17 or higher, stand (except soft 17)
      if (currentTotal >= 17) {
        const hasAce = isSoftHand(state.dealerHand);
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
      dealerCount = countCards(state.dealerHand);
      dealerTotal = dealerCount.optimal;
      console.log("Dealer total after hit:", dealerTotal);

      if (dealerTotal > 21) {
        console.log("Dealer busts!");
        endGame('playerWins');
        return;
      }

      // If dealer now has 17 or higher after hitting, check if they should stand
      if (dealerTotal >= 17) {
        const hasAce = isSoftHand(state.dealerHand);
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
    determineWinner(state.dealerHand);
  }, [state.gameOver, state.dealerHand, drawCardSync, endGame]);

  const determineWinner = useCallback((finalDealerCards = null) => {
    const playerCount = countCards(state.playerHand);
    const dealerCards = finalDealerCards || state.dealerHand;
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
  }, [state.playerHand, state.dealerHand, endGame]);

  const stand = useCallback(() => {
    dispatch({ type: ACTIONS.SHOW_DEALER_CARDS });
    dealerPlay();
  }, [dealerPlay]);

  const dealCards = useCallback(async () => {
    await getCards(2, "playerHand");
    await getCards(2, "dealerHand");
  }, [getCards]);

  const drawCards = useCallback(async () => {
    console.log('Player hits - drawing card...');
    const drawnCard = drawCardSync("playerHand");

    if (drawnCard) {
      // Wait for state update and let useEffect handle logging
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }, [drawCardSync]);

  const handlePokerChipClick = useCallback((e) => {
    const value = Number(e.target.parentNode.dataset.value);
    console.log('Adding chip worth $' + value + ', current bet: $' + state.playerBet);
    dispatch({ type: ACTIONS.PLACE_BET, payload: { amount: value } });
  }, [state.playerBet]);

  const handleChipRemoved = useCallback((chipValue) => {
    console.log('=== CHIP REMOVAL START ===');
    console.log('Removing chip worth $' + chipValue);
    console.log('Current state - Bet: $' + state.playerBet + ', Balance: $' + state.playerBalance);

    dispatch({ type: ACTIONS.REMOVE_BET, payload: { amount: chipValue } });
    console.log('=== CHIP REMOVAL END ===');
  }, [state.playerBet, state.playerBalance]);

  const resetGameState = useCallback(() => {
    dispatch({ type: ACTIONS.RESET_GAME });
  }, []);

  // Return the state and functions that the component needs
  return {
    // State
    deck: state.deck,
    playerHand: state.playerHand,
    dealerHand: state.dealerHand,
    playerBalance: state.playerBalance,
    playerBet: state.playerBet,
    playerWins: state.playerWins,
    gameOver: state.gameOver,
    showDealerCards: state.showDealerCards,

    // Functions
    dealCards,
    drawCards,
    stand,
    handlePokerChipClick,
    handleChipRemoved,
    resetGameState,
    countCards,
  };
}
