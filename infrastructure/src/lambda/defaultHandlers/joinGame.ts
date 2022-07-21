import {
  DynamoDBDocumentClient,
  GetCommand,
  GetCommandOutput,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import Game from '../../Game';
import { sendGameMultiple } from './helpers';

export default async function joinGame(
  gameId: string,
  userId: string,
  username: string,
  connectionId: string,
  gameTableName: string,
  DocClient: DynamoDBDocumentClient
) {
  let gameGR: GetCommandOutput;
  try {
    gameGR = await DocClient.send(
      new GetCommand({
        TableName: gameTableName,
        Key: { pk: 'g#' + gameId, sk: 'g#' + gameId },
      })
    );
    console.log('Got game');
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `Unknown error occured when trying to read game at gameId ${gameId}.`,
      }),
    };
  }

  try {
    const game = Game.fromDynamo(gameGR.Item);
    const ssJoin = game.join(userId, username, connectionId);

    if (!ssJoin) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Failed to join game ${gameId}. Is the client ${userId} already in the game?`,
        }),
      };
    }

    await DocClient.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: gameTableName,
              Item: Game.toDynamo(game),
              ExpressionAttributeValues: {
                ':bool': false,
                ':maxPlayer': 2,
              },
              ConditionExpression:
                'attribute_exists(pk) AND isOver = :bool AND numPlayers < :maxPlayer',
            },
          },
          {
            Update: {
              TableName: gameTableName,
              Key: { pk: 'c#' + connectionId, sk: 'c#' + connectionId },
              UpdateExpression: 'SET gameId = :id',
              ExpressionAttributeValues: {
                ':id': gameId,
              },
            },
          },
        ],
      })
    );
    console.log('Updated game data');

    try {
      await sendGameMultiple(game.getConnectionIds(), game);
      console.log(`Sent to ${game.getConnectionIds().length} players.`);
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: `Client ${username} successfully joined game ${gameId}.`,
        }),
      };
    } catch (err) {
      // TODO: Remove stale connection from DynamoDB
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Stale connection at gameId ${gameId}.`,
        }),
      };
    }
  } catch (err: any) {
    if (
      err.code === 'ConditionalCheckFailedException' ||
      err.code === 'TransactionConflictException'
    ) {
      console.log(`Join Error: ${err.code}`, err);
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Transaction failed when trying to join game at gameId ${gameId}.`,
        }),
      };
    } else {
      console.log(`Unknown Error: ${err.code}`, err);
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: `Unknown error occured when trying to join game at gameId ${gameId}.`,
        }),
      };
    }
  }
}
