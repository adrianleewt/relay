export default interface User {
  userId: string;
  username: string;
  dateJoined: number;
  lastSeen: number;
  gamesPlayed: number;
}

export interface UserDynamoResult {
  pk: string; // u#uuid
  sk: string; // u#uuid
  username: string;
  dateJoined: number;
  lastSeen: number;
  gamesPlayed: number;
}

export function makeUserFromResult(result: UserDynamoResult): User {
  return {
    userId: result.pk.slice(2),
    username: result.username,
    dateJoined: result.dateJoined,
    lastSeen: result.lastSeen,
    gamesPlayed: result.gamesPlayed,
  };
}

export function makeResultFromUser(user: User): UserDynamoResult {
  return {
    pk: 'u#' + user.userId,
    sk: 'u#' + user.userId,
    username: user.username,
    dateJoined: user.dateJoined,
    lastSeen: user.lastSeen,
    gamesPlayed: user.gamesPlayed,
  };
}
