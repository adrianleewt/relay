export interface ClientGame {
  gameId: string;
  turn: string | null;
  winner: string | null;
  clients: {
    [userId: string]: {
      username: string;
      connectionId: string;
      connected: boolean;
    };
  };
  words: string[];
  dateCreated: number; //epoch time
  numPlayers: number;
  isOver: boolean;
}

export default class Game {
  public gameId: string;
  public turn: string | null = null; // userId
  public winner: string | null = null; // userId
  public clients: {
    [userId: string]: {
      username: string;
      connectionId: string;
      connected: boolean;
    };
  } = {};
  public words: string[];
  public dateCreated: number; // epoch time
  public numPlayers: number = 0;
  public isOver: boolean = false;
  private _wordsSet: Set<string>;

  /**
   * Converts a Game to a plain object to be sent to the client
   * @param g
   */
  static toClient(g: Game): ClientGame {
    return {
      gameId: g.gameId,
      turn: g.turn,
      winner: g.winner,
      clients: g.clients,
      words: g.words,
      dateCreated: g.dateCreated,
      numPlayers: g.numPlayers,
      isOver: g.isOver,
    };
  }

  /**
   * Converts a DynamoDB Item to a Game.
   * @param obj
   */
  static fromDynamo(obj: any) {
    const g = new Game(obj.pk.slice(2));
    g.turn = obj.turn;
    g.winner = obj.winner;
    g.clients = obj.clients;
    g.words = obj.words;
    g._wordsSet = new Set(obj.words);
    g.dateCreated = obj.dateCreated;
    g.numPlayers = obj.numPlayers;
    g.isOver = obj.isOver;
    return g;
  }

  /**
   * Returns an object in the pk/sk form needed for DynamoDB.
   * @param g
   * @returns
   */
  static toDynamo(g: Game) {
    return {
      pk: 'g#' + g.gameId,
      sk: 'g#' + g.gameId,
      turn: g.turn,
      winner: g.winner,
      clients: g.clients,
      words: g.words,
      dateCreated: g.dateCreated,
      numPlayers: g.numPlayers,
      isOver: g.isOver,
    };
  }

  constructor(gameId: string) {
    this.gameId = gameId;
    this.dateCreated = new Date().getTime();
    this.words = [];
  }

  private _getOther(userId: string) {
    const userIds = Object.keys(this.clients);
    return userIds[0] === userId ? userIds[1] : userIds[0];
  }

  /**
   * Returns true if the connection id cid is in the game.
   * @param cid
   * @returns
   */
  isConnected(cid: string) {
    return this.getConnectionIds().includes(cid);
  }

  /**
   * Returns a list of *active* connectionIds (strings), which can be a list of <=2 length.
   */
  getConnectionIds(): string[] {
    const vals = Object.values(this.clients);
    const res: string[] = [];
    vals.forEach((o) => {
      if (o.connected) {
        res.push(o.connectionId);
      }
    });
    return res;
  }

  /**
   * Adds a user to the game. If the game is ready to play, returns true.
   * Otherwise returns false.
   * @param userId
   * @param username
   * @param connectionId
   */
  join(userId: string, username: string, connectionId: string): boolean {
    if (this.clients[userId]) {
      console.warn(
        'Client tried to join game twice. ' +
          `\ngameId: ${this.gameId}\nuserId: ${userId}`
      );
      return false;
    }
    this.clients[userId] = {
      username: username,
      connectionId: connectionId,
      connected: true,
    };
    this.numPlayers++;
    if (Object.keys(this.clients).length > 1) {
      this.turn = this._getOther(userId);
      return true;
    }
    return false;
  }

  /**
   * Adds a word to the word list and flips the turn. Returns true if successful,
   * false otherwise.
   *
   * Precondition:
   * word is a real word.
   * @param word
   */
  addWord(word: string, userId: string): boolean {
    // checks
    if (
      this.winner ||
      this._wordsSet.has(word) ||
      this.turn === null ||
      userId !== this.turn
    ) {
      return false;
    }

    // first and last letter words checks
    const numWords = this.words.length;
    if (numWords > 0) {
      const lastWord = this.words[numWords - 1];
      const lett = lastWord.charAt(lastWord.length - 1);
      if (word.charAt(0) !== lett) {
        return false;
      }
    }

    this.words.push(word);
    this._wordsSet.add(word);
    this.turn = this._getOther(this.turn);
    return true;
  }

  /**
   * Quits a user from the game and selects a winner. Returns true if updated winner,
   * false otherwise.
   *
   * Precondition:
   * userId is a valid id in this.clients
   */
  quit(userId: string): boolean {
    this.clients[userId].connected = false;
    if (this.winner) {
      return false;
    }
    this.winner = this._getOther(userId);
    this.isOver = true;
    return true;
  }
}
