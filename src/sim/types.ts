import { GameStore } from "../store/types";
import { Card } from "../types/game";
import { EventChoice, MapNode, NodeType } from "../types/map";

export type RunOutcome = "victory" | "defeat" | "stuck";

/** What a bot does at a rest site. */
export type RestAction = { type: "heal" } | { type: "upgrade"; cardId: string };

/** What a bot does in a shop; `null` leaves the shop. */
export type ShopAction =
  | { type: "buyCard"; index: number }
  | { type: "buyRelic"; index: number }
  | { type: "removeCard"; cardId: string }
  | null;

/**
 * The decisions a bot makes. Every method only reads the state; the
 * simulator applies the decision through the store.
 */
export interface Policy {
  name: string;
  chooseNode(state: GameStore, nodes: MapNode[]): MapNode;
  /** The card to play next and its target, or `null` to end the turn. */
  chooseCard(state: GameStore): { card: Card; targetId?: string } | null;
  /** The reward card to take, or `null` to skip. */
  chooseReward(state: GameStore, cards: Card[]): Card | null;
  /** One of the choices the player can pay for. */
  chooseEventChoice(state: GameStore, choices: EventChoice[]): EventChoice;
  chooseRestAction(state: GameStore): RestAction;
  chooseShopAction(state: GameStore): ShopAction;
}

/** One combat of a run. */
export interface FightRecord {
  /** 1-based floor. */
  floor: number;
  nodeType: NodeType;
  /** Names of the enemies, sorted and joined: the kind of encounter. */
  encounter: string;
  turns: number;
  /** Health at the start of the node minus health when the fight ended. */
  healthLost: number;
  won: boolean;
}

export interface RunResult {
  seed: number;
  policy: string;
  outcome: RunOutcome;
  /** 1-based floor the run ended on. */
  floor: number;
  combatsWon: number;
  /** Player turns taken over the whole run. */
  turns: number;
  health: number;
  maxHealth: number;
  gold: number;
  deckSize: number;
  /** Base ids of the cards taken as rewards. */
  cardsPicked: string[];
  /** Base ids of the cards bought in shops. */
  cardsBought: string[];
  /** Base ids of the cards that were offered as rewards. */
  cardsOffered: string[];
  /** How often each card (by base id) was played. */
  cardsPlayed: Record<string, number>;
  /** Ids of the relics held when the run ended. */
  relics: string[];
  fights: FightRecord[];
  /** Nodes entered, by type. */
  nodesVisited: Partial<Record<NodeType, number>>;
  /** Type of the node the run ended in. */
  lastNodeType?: NodeType;
  /** Broken invariants, as `step <n> (<phase>): <what>`. */
  violations: string[];
}
