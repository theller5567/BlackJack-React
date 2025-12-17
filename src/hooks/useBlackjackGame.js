import { useReducer, useEffect, useCallback } from "react";
import { cardDeck } from "../constants/cardDeck";

// Game configuration constants
const INITIAL_BALANCE = 2500;
const GAME_END_DELAY = 300;

// Action types for the reducer
const ACTIONS = {
  SET_DECK: 'SET_DECK',
  DRAW_CARD: 'DRAW_CARD',
  PLACE_BET: 'PLACE_BET',
  REMOVE_BET: 'REMOVE_BET',
  END_GAME: 'END_GAME',
  RESET_GAME: 'RESET_GAME',
  NEW_HAND: 'NEW_HAND',
  SHOW_DEALER_CARDS: 'SHOW_DEALER_CARDS',
  SET_CARDS_DEALT: 'SET_CARDS_DEALT',
  SET_DEALING: 'SET_DEALING',
  SET_DRAWING_CARD: 'SET_DRAWING_CARD',
  SET_PRELOADING: 'SET_PRELOADING',
  UPDATE_PRELOAD_PROGRESS: 'UPDATE_PRELOAD_PROGRESS',
};

// Function to create fresh initial state to prevent shared mutable references
const createInitialState = () => ({
  deck: [],
  playerHand: [],
  dealerHand: [],
  playerBalance: INITIAL_BALANCE,
  playerBet: 0,
  playerWins: null, // true, false, or null (tie)
  gameOver: false,
  showDealerCards: false,
  cardsDealt: false, // Flag to indicate if initial cards have been dealt
  isDealing: false, // Loading state for card dealing
  isDrawingCard: false, // Loading state for drawing a single card
  isPreloading: true, // Loading state for preloading card images
  preloadProgress: 0, // Progress of image preloading (0-100)
  usedCards: new Set(), // Track used cards to prevent duplicates
});

// Create initial state instance for useReducer
const initialState = createInitialState();

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
        // Don't deduct from balance until end of hand
      };
    }

    case ACTIONS.REMOVE_BET: {
      const { amount } = action.payload;
      return {
        ...state,
        playerBet: Math.max(0, state.playerBet - amount),
        // Don't modify balance - chips just become available for betting again
      };
    }

    case ACTIONS.END_GAME: {
      const { winner } = action.payload;
      let newBalance = state.playerBalance;

      if (winner === 'playerWins') {
        // Player gets their bet back plus winnings equal to their bet
        newBalance = state.playerBalance + (state.playerBet * 2);
      } else if (winner === 'dealerWins') {
        // Player loses their bet
        newBalance = state.playerBalance - state.playerBet;
      } else {
        // tie - player gets their bet back
        newBalance = state.playerBalance;
      }

      return {
        ...state,
        playerWins: winner === 'playerWins' ? true : winner === 'dealerWins' ? false : null,
        gameOver: true,
        playerBalance: newBalance,
      };
    }

    case ACTIONS.RESET_GAME:
      return createInitialState();  

        case ACTIONS.NEW_HAND:
          return {
            ...state,
            playerHand: [],
            dealerHand: [],
            playerBet: 0,
            playerWins: null,
            gameOver: false,
            showDealerCards: false,
            cardsDealt: false, // Reset cards dealt flag for new hand
            usedCards: new Set(), // Reset used cards for new hand
          };

        case ACTIONS.SHOW_DEALER_CARDS:
          return {
            ...state,
            showDealerCards: true,
          };

        case ACTIONS.SET_CARDS_DEALT:
          return {
            ...state,
            cardsDealt: action.payload,
          };

        case ACTIONS.SET_DEALING:
          return {
            ...state,
            isDealing: action.payload,
          };

        case ACTIONS.SET_DRAWING_CARD:
          return {
            ...state,
            isDrawingCard: action.payload,
          };

        case ACTIONS.SET_PRELOADING:
          return {
            ...state,
            isPreloading: action.payload,
          };

        case ACTIONS.UPDATE_PRELOAD_PROGRESS:
          return {
            ...state,
            preloadProgress: action.payload,
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

// Preload all card images to improve performance
const preloadCardImages = async (onProgress) => {
  return new Promise((resolve, reject) => {
    const images = cardDeck.map(card => card.image);
    let loadedCount = 0;
    let failedCount = 0;
    const totalImages = images.length;

    if (totalImages === 0) {
      resolve();
      return;
    }

    const updateProgress = () => {
      const progress = Math.round(((loadedCount + failedCount) / totalImages) * 100);
      onProgress(progress);

      if (loadedCount + failedCount === totalImages) {
        // Allow some failed images but resolve anyway (fallback images will show)
        resolve();
      }
    };

    images.forEach(imageUrl => {
      const img = new Image();

      img.onload = () => {
        loadedCount++;
        updateProgress();
      };

      img.onerror = () => {
        failedCount++;
        console.warn(`Failed to load card image: ${imageUrl}`);
        updateProgress();
      };

      // Add timestamp to prevent caching issues during development
      const separator = imageUrl.includes('?') ? '&' : '?';
      img.src = `${imageUrl}${separator}t=${Date.now()}`;
    });

    // Timeout after 30 seconds to prevent hanging
    setTimeout(() => {
      reject(new Error('Image preloading timed out'));
    }, 30000);
  });
};

// Custom hook for Blackjack game logic
export function useBlackjackGame() {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Initialize deck and preload images on mount
  useEffect(() => {
    const initializeGame = async () => {
      try {
        // Start preloading images
        const preloadPromise = preloadCardImages((progress) => {
          dispatch({ type: ACTIONS.UPDATE_PRELOAD_PROGRESS, payload: progress });
        });

        // Set deck data immediately
        const data = cardDeck;
        dispatch({ type: ACTIONS.SET_DECK, payload: data });

        // Wait for images to preload
        await preloadPromise;

        // Mark preloading as complete
        dispatch({ type: ACTIONS.SET_PRELOADING, payload: false });
      } catch (error) {
        console.error('Failed to preload card images:', error);
        // Still allow game to continue with fallback images
        dispatch({ type: ACTIONS.SET_PRELOADING, payload: false });
      }
    };

    initializeGame();
  }, []);

  // Initialize/reset game state on mount
  useEffect(() => {
    dispatch({ type: ACTIONS.RESET_GAME });
  }, []);

  // Check for bust and 21 whenever cards change
  useEffect(() => {
    if (state.playerHand.length > 0 || state.dealerHand.length > 0) {
      const playerCount = countCards(state.playerHand);
      // Check for player reaching 21 (any number of cards)
      if (playerCount.optimal === 21) {
        endGame('playerWins');
        return; // Don't check for bust if player has 21
      }
      // Check for bust
      if(playerCount.optimal > 21) {
        endGame('dealerWins');
      }
    }
  }, [state.playerHand, state.dealerHand]);


  // Game functions
  const drawCardSync = useCallback((handKey) => {
    // Filter available cards based on used cards in state
    const available = cardDeck.filter(card => !state.usedCards.has(card.code));

    if (available.length < 1) {
      return null;
    }

    // Shuffle
    const shuffled = [...available];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const drawnCard = shuffled[0];

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
      // Prevent state updates if component is unmounted
      if (!state.gameOver) {
        dispatch({ type: ACTIONS.END_GAME, payload: { winner } });
      }
    }, GAME_END_DELAY);
  }, [state.gameOver]); // Add dependency to prevent stale closures

  const dealerPlay = useCallback(async () => {
    if (state.gameOver) {
      return;
    }
    let hitCount = 0;
    const maxHits = 10;

    // Use a local copy of the dealer hand to avoid stale state issues
    let currentDealerHand = [...state.dealerHand];
    let dealerCount = countCards(currentDealerHand);
    let dealerTotal = dealerCount.optimal;

    // Dealer hits until they reach 17 or higher (or bust)
    while (hitCount < maxHits && !state.gameOver) {
      // Check current total BEFORE hitting
      const currentCount = countCards(currentDealerHand);
      const currentTotal = currentCount.optimal;

      // If dealer already has 17 or higher, stand (except soft 17)
      if (currentTotal >= 17) {
        const hasAce = isSoftHand(currentDealerHand);
        if (!(currentTotal === 17 && hasAce)) {
          break; // Dealer stands without hitting
        }
      }

      hitCount++;

      // Draw one card for dealer
      const drawnCard = drawCardSync("dealerHand");

      if (!drawnCard) {
        break;
      }

      // Update local dealer hand copy immediately
      currentDealerHand = [...currentDealerHand, drawnCard];

      // Update dealer total after drawing
      dealerCount = countCards(currentDealerHand);
      dealerTotal = dealerCount.optimal;

      if (dealerTotal > 21) {
        endGame('playerWins');
        return;
      }

      // If dealer now has 17 or higher after hitting, check if they should stand
      if (dealerTotal >= 17) {
        const hasAce = isSoftHand(currentDealerHand);
        if (!(dealerTotal === 17 && hasAce)) {
          break; // Dealer stands
        }
        // If soft 17 after hitting, continue the loop to hit again
      }

      // Small delay for visual effect
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Dealer finished playing - determine winner using the final hand
    determineWinner(currentDealerHand);
  }, [state.gameOver, state.dealerHand, drawCardSync, endGame]);

  const determineWinner = useCallback((finalDealerCards = null) => {
    const playerCount = countCards(state.playerHand);
    const dealerCards = finalDealerCards || state.dealerHand;
    const dealerCount = countCards(dealerCards);
    const playerTotal = playerCount.optimal;
    const dealerTotal = dealerCount.optimal;
    // Check for busts first
    if (playerTotal > 21) {
      endGame('dealerWins');
    } else if (dealerTotal > 21) {
      endGame('playerWins');
    } else if(playerTotal === 21 && dealerTotal === 21) {
      endGame('tie');
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
    dispatch({ type: ACTIONS.SET_DEALING, payload: true });
    try {
      await getCards(2, "playerHand");
      await getCards(2, "dealerHand");
      dispatch({ type: ACTIONS.SET_CARDS_DEALT, payload: true });
    } catch (error) {
      console.error('Failed to deal cards:', error);
      // Reset game state on failure to prevent inconsistent state
      dispatch({ type: ACTIONS.RESET_GAME });
    } finally {
      dispatch({ type: ACTIONS.SET_DEALING, payload: false });
    }
  }, [getCards]);

  const drawCards = useCallback(async () => {
    dispatch({ type: ACTIONS.SET_DRAWING_CARD, payload: true });
    try {
      const drawnCard = drawCardSync("playerHand");

      if (drawnCard) {
        // Wait for state update
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } finally {
      dispatch({ type: ACTIONS.SET_DRAWING_CARD, payload: false });
    }
  }, [drawCardSync]);

  const handlePokerChipClick = useCallback((e) => {
    const value = Number(e.target.parentNode.dataset.value);
    // Prevent betting more than available balance
    if (value <= (state.playerBalance - state.playerBet)) {
      dispatch({ type: ACTIONS.PLACE_BET, payload: { amount: value } });
    }
  }, [dispatch, state.playerBalance, state.playerBet]);

  const handleChipRemoved = useCallback((chipValue) => {
    dispatch({ type: ACTIONS.REMOVE_BET, payload: { amount: chipValue } });
  }, [dispatch]); // Add dispatch dependency to prevent stale closures

  const resetGameState = useCallback(() => {
    dispatch({ type: ACTIONS.RESET_GAME });
  }, []);

  const startNewHand = useCallback(() => {
    dispatch({ type: ACTIONS.NEW_HAND });
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
    cardsDealt: state.cardsDealt,
    isDealing: state.isDealing,
    isDrawingCard: state.isDrawingCard,
    isPreloading: state.isPreloading,
    preloadProgress: state.preloadProgress,

    // Functions
    dealCards,
    drawCards,
    stand,
    handlePokerChipClick,
    handleChipRemoved,
    resetGameState,
    startNewHand,
    countCards,
  };
}