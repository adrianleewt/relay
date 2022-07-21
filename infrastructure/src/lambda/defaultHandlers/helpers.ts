import Game from '../../Game';
import { ApiGatewayManagementApi } from 'aws-sdk';

const apigwManagementAPI = new ApiGatewayManagementApi({
  endpoint: process.env.CONNECTION_URL,
});

export async function sendGame(connectionId: string, game: Game) {
  return await apigwManagementAPI
    .postToConnection({
      ConnectionId: connectionId,
      Data: JSON.stringify({
        message: `New gameData`,
        game: Game.toClient(game),
      }),
    })
    .promise();
}

export async function sendGameMultiple(connectionIds: string[], game: Game) {
  const data = Game.toClient(game);
  return await Promise.all(
    connectionIds.map(async (cid) => {
      await apigwManagementAPI
        .postToConnection({
          ConnectionId: cid,
          Data: JSON.stringify({
            message: `New gameData`,
            game: data,
          }),
        })
        .promise();
    })
  );
}
