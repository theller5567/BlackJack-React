// Card deck data - compressed format for better performance
const suits = ['clubs', 'diamonds', 'hearts', 'spades'];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10];
const colors = { clubs: 'black', diamonds: 'red', hearts: 'red', spades: 'black' };

export const cardDeck = suits.flatMap((suit) =>
  ranks.map((rank, rankIndex) => ({
    rank,
    value: values[rankIndex],
    suit,
    color: colors[suit],
    code: `${rank === '10' ? '0' : rank}${suit[0].toUpperCase()}`,
    image: `https://deckofcardsapi.com/static/img/${rank === '10' ? '0' : rank}${suit[0].toUpperCase()}.png`
  }))
);