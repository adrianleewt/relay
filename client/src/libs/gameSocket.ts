import { WebSocketURL } from './constants';

export interface WSRequestBody {
  method: 'create-game' | 'join-game' | 'send-word' | 'quit-game';
}

export interface CreateRequestBody extends WSRequestBody {
  method: 'create-game';
  config?: {
    minChars: number; //minimum characters per word
    countdown: number; //countdown timer in seconds
    wordGroup: 'noun' | 'adjective' | 'verb';
  };
}

export interface JoinRequestBody extends WSRequestBody {
  method: 'join-game';
  gameId: string;
}

export interface SendWordRequestBody extends WSRequestBody {
  method: 'send-word';
  gameId: string;
  word: string;
}

export interface QuitGameRequestBody extends WSRequestBody {
  method: 'quit-game';
  gameId: string;
}

export interface Game {
  gameId: string;
  turn: string | null; // userId
  winner: string | null; // userId
  clients: {
    [userId: string]: {
      username: string;
      connectionId: string;
      connected: boolean;
    };
  };
  words: string[];
  dateCreated: number;
  numPlayers: number;
  isOver: boolean;
}

/**
 * Returns the other userId client in the game.
 * @param userId
 * @param clients
 * @returns
 */
export function getOtherUser(userId: string, game: Game) {
  const userIds = Object.keys(game.clients);
  return userIds[0] === userId ? userIds[1] : userIds[0];
}

export function buildWebsocketURL(jwtToken: string | undefined | null) {
  if (!jwtToken) {
    throw new Error('Invalid jwtToken: ' + jwtToken);
  }
  return `${WebSocketURL}?idToken=${jwtToken}`;
}

/**
 * Sends a 'create-game' request to the WebSocket server with an optional config.
 * @param ws
 * @param config
 */
export function createGame(
  ws: WebSocket,
  config?: CreateRequestBody['config']
) {
  const data: CreateRequestBody = {
    method: 'create-game',
    config: config,
  };
  ws.send(JSON.stringify(data));
}

/**
 * Sends a 'join-game' request to the WebSocket server.
 * Precondition: gameId cannot be empty or falsy.
 * @param ws
 * @param gameId
 */
export function joinGame(ws: WebSocket, gameId: string) {
  if (!gameId) throw new Error('gameId cannot be null or undefined.');
  const data: JoinRequestBody = {
    method: 'join-game',
    gameId: gameId,
  };
  ws.send(JSON.stringify(data));
}

/**
 * Sends a 'send-word' request to the WebSocket server.
 * Precondition: word cannot be empty or falsy.
 * Precondition: gameId cannot be empty or falsy.
 * @param ws
 * @param word
 */
export function sendWord(ws: WebSocket, gameId: string, word: string) {
  if (!word || !gameId)
    throw new Error('word or gameId cannot be null or undefined.');
  const data: SendWordRequestBody = {
    method: 'send-word',
    word: word,
    gameId: gameId,
  };
  ws.send(JSON.stringify(data));
}

/**
 * Sends a 'quit-game' request to the WebSocket server.
 * Precondition: gameId cannot be empty or falsy.
 * @param ws
 * @param gameId
 */
export function quitGame(ws: WebSocket, gameId: string) {
  if (!gameId) throw new Error('gameId cannot be null or undefined.');
  const data: QuitGameRequestBody = {
    method: 'quit-game',
    gameId: gameId,
  };
  ws.send(JSON.stringify(data));
}
