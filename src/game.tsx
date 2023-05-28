import {useEffect, useState} from "react";
import {
  Card,
  CardRank,
  CardDeck,
  CardSuit,
  GameState,
  Hand,
  GameResult,
} from "./types";

//UI Elements
const CardBackImage = () => (
    <img src={process.env.PUBLIC_URL + `/SVG-cards/png/1x/back.png`} />
);

const CardImage = ({ suit, rank }: Card) => {
  const card = rank === CardRank.Ace ? 1 : rank;
  return (
      <img
          src={
            process.env.PUBLIC_URL +
            `/SVG-cards/png/1x/${suit.slice(0, -1)}_${card}.png`
          }
      />
  );
};

//Setup
const newCardDeck = (): CardDeck =>
    Object.values(CardSuit)
        .map((suit) =>
            Object.values(CardRank).map((rank) => ({
              suit,
              rank,
            }))
        )
        .reduce((a, v) => [...a, ...v]);

var state_position = 0;

const shuffle = (deck: CardDeck): CardDeck => {
  return deck.sort(() => Math.random() - 0.5);
};

const takeCard = (deck: CardDeck): { card: Card; remaining: CardDeck } => {
  const card = deck[deck.length - 1];
  const remaining = deck.slice(0, deck.length - 1);
  return { card, remaining };
};

const setupGame = (): GameState => {
  const cardDeck = shuffle(newCardDeck());
  return {
    playerHand: cardDeck.slice(cardDeck.length - 2, cardDeck.length),
    dealerHand: cardDeck.slice(cardDeck.length - 4, cardDeck.length - 2),
    cardDeck: cardDeck.slice(0, cardDeck.length - 4), // remaining cards after player and dealer have been give theirs
    turn: "player_turn",
  };
};

//Scoring
const calculateHandScore = (hand: Hand): number => {
  let score = 0;
  let aces_counter = 0;
  hand.forEach(card => {
    if(card.rank === CardRank.Jack || card.rank === CardRank.Queen || card.rank === CardRank.King) score += 10
    else if(card.rank === CardRank.Ace) {
      aces_counter++;
      score +=11;
    }
    else score += parseInt(card.rank);
  })
  while(aces_counter > 0 && score > 21) {
    score -= 10;
    aces_counter--;
  }
  return score;
};

// Calculate Aces in the same hand one equal to 11 and the other(s) as 1
const calculateHandScore2 = (hand: Hand): number => {
  let score = 0
  hand.forEach(card => {
    if(card.rank === CardRank.Jack || card.rank === CardRank.Queen || card.rank === CardRank.King) score += 10
    else if(card.rank === CardRank.Ace) {
      // it really depends if you consider aces equal to 11 and 1 in the same hand
      if(score +11 > 21) score++
      else score +=11
    }
    else score += parseInt(card.rank)
  })
  return score
};

const determineGameResult = (state: GameState): GameResult => {

  let dealerScore = calculateHandScore(state.dealerHand)
  let playerScore = calculateHandScore(state.playerHand)

  //determine who wins
  if(dealerScore > 21 || playerScore > 21) return "no_result"
  else if(dealerScore === playerScore) {
    //determine blackJack
    if(dealerScore === 21 && state.playerHand.length === 2 && state.dealerHand.length !== 2) return "player_win"
    else if(dealerScore === 21 && state.dealerHand.length === 2 && state.playerHand.length !== 2) return "dealer_win"
    //no blackJack
    else return "draw"
  }
  else if(dealerScore < playerScore) return "player_win"
  else return "dealer_win"
};

const playerStands = (state: GameState): GameState => {
  const { card, remaining } = takeCard(state.cardDeck);
  let new_dealer_hand= [...state.dealerHand];
  while((calculateHandScore(new_dealer_hand) < 17)) {
    new_dealer_hand.push(card);
  }
  return {
    ...state,
    cardDeck: remaining,
    dealerHand: new_dealer_hand,
    turn: "dealer_turn",
  };
};
//Player Actions
const playerHits = (state: GameState): GameState => {
  const { card, remaining } = takeCard(state.cardDeck);
  return {
    ...state,
    cardDeck: remaining,
    playerHand: [...state.playerHand, card],
  };
};

//UI Component
const Game = (): JSX.Element => {
  const [state, setState] = useState(setupGame());
  const [playerScore, setPlayerScore] = useState(0);
  const [dealerScore, setDealerScore] = useState(0);

  state_position++
  useEffect(() => {
    setPlayerScore(calculateHandScore(state.playerHand));
    setDealerScore(calculateHandScore(state.dealerHand));
  }, [state_position]);

  return (
      <>
        <div className="container-full">
          <p>There are {state.cardDeck.length} cards left in deck</p>
          <div className="container-full">
            <button className="btn btn-primary me-2"
                disabled={state.turn === "dealer_turn" || playerScore> 21}
                onClick={(): void => setState(playerHits)}
            >
              Hit
            </button>
            <button className="btn btn-primary  me-2"
                disabled={state.turn === "dealer_turn" || playerScore > 21}
                onClick={(): void => setState(playerStands(state))}
            >
              Stand
            </button>
            <button className="btn btn-primary" onClick={(): void => setState(setupGame())}>Reset</button>
          </div>
        </div>
        <p>Player Cards</p>
        <div>
          {state.playerHand.map(CardImage)}
          <p>Player Score {playerScore}</p>
        </div>
        <p>Dealer Cards</p>
        {state.turn === "player_turn" && state.dealerHand.length > 0 && !(playerScore> 21) ? (
            <div>
              <CardBackImage />
              <CardImage {...state.dealerHand[1]} />
            </div>
        ) : (
            <div>
              {state.dealerHand.map(CardImage)}
              <p>Dealer Score {dealerScore}</p>
            </div>
        )}
        <div className="p-3 mb-2 bg-primary text-white">
          {((state.turn === "dealer_turn" &&
              determineGameResult(state) !== "no_result" ) || playerScore> 21)? (
              <p>{determineGameResult(state)}</p>
          ) : (
              <p>{state.turn}</p>
          )}
        </div>
        
      </>
  );
};

export {
  Game,
  playerHits,
  playerStands,
  determineGameResult,
  calculateHandScore,
  calculateHandScore2,
  setupGame,
};
