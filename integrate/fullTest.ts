import { clientId, user1, user2, UserDetails, userPoolId } from './constants';
import {
  buildWebsocketURL,
  createGame,
  joinGame,
  quitGame,
  sendWord,
} from '../client/src/libs/gameSocket';

import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
} from 'amazon-cognito-identity-js';
import { assert } from 'console';

const poolData = {
  UserPoolId: `${userPoolId}`,
  ClientId: `${clientId}`,
};
const userPool: CognitoUserPool = new CognitoUserPool(poolData);

main();

async function main() {
  lb();

  console.log('Running Integration Test...');
  console.log(`userpool id=${userPoolId}`);
  console.log(`client id=${clientId}`);

  lb();
  console.log('Users:');
  console.log(`${user1.username}|${user1.password}`);
  if (!user1.username || !user1.password || !user1.userId) {
    console.log('Terminating test: undefined credentials for user1.');
    process.exit();
  }
  console.log(`${user2.username}|${user2.password}`);
  if (!user2.username || !user2.password || !user2.userId) {
    console.log('Terminating test: undefined credentials for user2.');
    process.exit();
  }
  lb();

  const wait = 5000;

  // Setup Cognito
  const [cu1, ad1] = makeUser(user1);
  const [cu2, ad2] = makeUser(user2);
  const session1 = await asyncCognitoAuthentication(cu1, ad1);
  const session2 = await asyncCognitoAuthentication(cu2, ad2);
  const jwtAccess1: string = session1.getAccessToken().getJwtToken();
  const jwtAccess2: string = session2.getAccessToken().getJwtToken();
  console.log('Cognito operations complete. JWT Access Tokens:');
  console.log(
    jwtAccess1.slice(0, 5) +
      '...' +
      jwtAccess1.slice(jwtAccess1.length - 5, jwtAccess1.length) +
      '|' +
      jwtAccess2.slice(0, 5) +
      '...' +
      jwtAccess2.slice(jwtAccess2.length - 5, jwtAccess2.length)
  );
  lb();

  // Setup WebSockets
  console.log('Initializing Websockets...');
  let s1Data: any;
  let s2Data: any;
  function setData1(data: any) {
    s1Data = data;
  }
  function setData2(data: any) {
    s2Data = data;
  }
  function assertWithCleanup(condition: any, message: string) {
    try {
      assert(condition, message);
    } catch (err) {
      s1.close();
      s2.close();
      cu1.signOut();
      cu2.signOut();
      process.exit();
    }
  }

  const s1Name = `${user1.username}.socket`;
  const s2Name = `${user2.username}.socket`;
  const s1 = makeSocket(s1Name, jwtAccess1, setData1);
  const s2 = makeSocket(s2Name, jwtAccess2, setData2);

  await timeout(wait);

  assertWithCleanup(
    s1.readyState === s1.OPEN,
    `${s1Name} failed to open past ${wait}ms timeout.`
  );
  assertWithCleanup(
    s2.readyState === s2.OPEN,
    `${s2Name} failed to open past ${wait}ms timeout.`
  );
  lb();

  // Game creation
  console.log(`${user1.username} creating game w/ base config...`);
  createGame(s1);
  await timeout(wait);
  assertWithCleanup(s1Data, `${user1.username} did not receive game data.`);
  assertWithCleanup(
    Object.keys(s1Data.clients).length === 1,
    `${user1.username} received game data with not one attached clients.`
  );
  assertWithCleanup(
    s1Data.clients[user1.userId] &&
      s1Data.clients[user1.userId].username === user1.username &&
      s1Data.clients[user1.userId].connected,
    `${user1.username} received game data with incorrect self-user data.`
  );
  lb();

  // Joining game
  const gameId = s1Data.gameId;
  console.log(`${user2.username} joining game ${gameId}.`);
  joinGame(s2, gameId);
  await timeout(wait);
  assertWithCleanup(s2Data, `${user2.username} did not receive game data.`);
  assertWithCleanup(
    s2Data.clients[user2.userId] &&
      s2Data.clients[user2.userId].username === user2.username &&
      s2Data.clients[user2.userId].connected,
    `${user2.username} received game data with incorrect self-user data.`
  );
  assertWithCleanup(
    s1Data.clients[user2.userId] &&
      s1Data.clients[user2.userId].username === user2.username &&
      s1Data.clients[user2.userId].connected,
    `${user1.username} received game data with incorrect other-user data.`
  );
  assertWithCleanup(
    Object.keys(s1Data.clients).length === 2,
    `${user1.username} received game data with incorrect clients count (not 2).`
  );
  assertWithCleanup(
    s1Data.turn === user1.userId,
    `${user1.username} received game data with incorrect turn value (not first user).`
  );
  assertWithCleanup(
    s1Data.turn === s2Data.turn,
    `${user1.username} does not have the same turn value as ${user2.username}.`
  );
  lb();

  // Sending word
  console.log('Sending valid word "worldly".');
  const word1 = 'worldly';
  sendWord(s1, gameId, word1);
  await timeout(wait);
  assertWithCleanup(
    s1Data.words.length === 1 && s1Data.words[0] === word1,
    `${user1.username} did not receive correct updated word.`
  );
  assertWithCleanup(
    s1Data.turn === user2.userId,
    `${user1.username} did not receive correct updated turn.`
  );
  assertWithCleanup(
    s2Data.words.length === 1 && s2Data.words[0] === word1,
    `${user2.username} did not receive correct updated word.`
  );
  assertWithCleanup(
    s2Data.turn === user2.userId,
    `${user2.username} did not receive correct updated turn.`
  );
  lb();

  // Sending incorrect word
  console.log('Sending INVALID (bad length) word "hello".');
  const word2 = 'hello';
  sendWord(s2, gameId, word2);
  await timeout(wait);
  assertWithCleanup(
    s1Data.words.length === 1 && s2Data.words.length === 1,
    `Received incorrect words.`
  );
  assertWithCleanup(
    s1Data.turn === user2.userId,
    `${user1.username} incorrectly received changed turn.`
  );

  lb();

  // Sending incorrect word again
  console.log('Sending INVALID (bad starting letter) word "validation".');
  console.log(
    '// This is not a valid request and should yield 400. However, we test this to make sure it doesnt go through.'
  );
  const word3 = 'validation';
  sendWord(s2, gameId, word3);
  await timeout(wait);
  assertWithCleanup(s1Data.words.length === 1, `Received incorrect words.`);
  assertWithCleanup(
    s1Data.turn === user2.userId,
    `${user1.username} incorrectly received changed turn.`
  );

  lb();

  // Sending correct word now
  console.log('Sending valid word "yellow".');
  const word4 = 'yellow';
  sendWord(s2, gameId, word4);
  await timeout(wait);
  assertWithCleanup(
    s1Data.words.length === 2 && s1Data.words[1] === word4,
    `${user1.username} did not receive correct updated word.`
  );
  assertWithCleanup(
    s1Data.turn === user1.userId,
    `${user1.username} did not receive correct updated turn.`
  );
  assertWithCleanup(
    s2Data.words.length === 2 && s2Data.words[1] === word4,
    `${user2.username} did not receive correct updated word.`
  );
  assertWithCleanup(
    s2Data.turn === user1.userId,
    `${user2.username} did not receive correct updated turn.`
  );
  lb();

  // Quitting game
  console.log(
    `Current turn user quits game (${user1.username}), so ${user2.username} is the winner.`
  );
  quitGame(s1, gameId);
  await timeout(wait);
  assertWithCleanup(
    s2Data.winner === user2.userId && s2Data.isOver === true,
    `${user2.username} received bad end game data.`
  );

  lb();
  console.log('Test complete, cleaning up...');
  s1.close();
  s2.close();

  cu1.signOut();
  cu2.signOut();
  lb();
}

function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function makeSocket(wsName: string, jwt: string, setData: (data: any) => void) {
  let socket: WebSocket;
  try {
    socket = new WebSocket(buildWebsocketURL(jwt));
  } catch (err) {
    console.log(`Failed to open websocket for ${wsName}. Terminating...`);
    console.error(err);
    process.exit();
  }
  socket.onopen = (e) => {
    console.log(`Opened websocket ${wsName}.`);
  };
  socket.onclose = (e) => {};
  socket.onmessage = (e) => {
    console.log(`${wsName} received message.`);
    setData(JSON.parse(e.data as string).game);
  };
  socket.onerror = (e) => {
    console.error(e);
  };
  return socket;
}

function makeUser(user: UserDetails): [CognitoUser, AuthenticationDetails] {
  if (!user.username || !user.password) {
    console.log('Impossible...');
    throw new Error('Oops');
  }
  const authDetails = new AuthenticationDetails({
    Username: user.username,
    Password: user.password,
  });
  const cognitoUser = new CognitoUser({
    Username: user.username,
    Pool: userPool,
  });
  return [cognitoUser, authDetails];
}

function asyncCognitoAuthentication(
  cu: CognitoUser,
  ad: AuthenticationDetails
): any {
  return new Promise(function (resolve, reject) {
    cu.authenticateUser(ad, {
      onSuccess: resolve,
      onFailure: reject,
      newPasswordRequired: resolve,
    });
  });
}

function lb() {
  console.log('='.repeat(8));
}
