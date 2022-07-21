import {
  DynamoDBDocumentClient,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import Game from '../../Game';
import { CreateRequestBody } from '../websocket-default-handler';
import { sendGame } from './helpers';

export default async function createGame(
  config: CreateRequestBody['config'],
  userId: string,
  username: string,
  connectionId: string,
  gameTableName: string,
  DocClient: DynamoDBDocumentClient
) {
  // const createBody = body as CreateRequestBody;
  // const config = createBody.config;  // TODO: Implement this.

  // First find a unique gameId.
  const maxCollisions = 10;
  let gameId: string = 'AAAAAA';
  let collisions = 0;
  let unique = false;
  const game = new Game(gameId);

  while (collisions < maxCollisions && !unique) {
    game.gameId = makeId(6);
    game.join(userId, username, connectionId);
    try {
      await DocClient.send(
        new TransactWriteCommand({
          TransactItems: [
            {
              // Leverage DynamoDB ConditionExpressions to check for uniqueness.
              Put: {
                TableName: gameTableName,
                Item: Game.toDynamo(game),
                ConditionExpression: 'attribute_not_exists(pk)',
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
      unique = true;
      try {
        console.log('sending...');
        await sendGame(connectionId, game);
        return {
          statusCode: 200,
          body: JSON.stringify({
            message: `Client ${username} successfully created game ${gameId}.`,
          }),
        };
      } catch (err) {
        console.log('Error @ message send...', gameId, err);
        // TODO: Remove stale connection from DynamoDB
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: `Client ${username} connection was stale at connectionId ${connectionId}.`,
          }),
        };
      }
    } catch (err: any) {
      console.log('Error @ message send...', gameId, err);
      if (
        err.statusCode === 400 &&
        err.code === 'ConditionalCheckFailedException'
      ) {
        collisions++;
      } else if (err.code === 'TransactionConflictException') {
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: `Transaction conflict occured when trying to create game at gameId ${gameId}.`,
          }),
        };
      } else {
        return {
          statusCode: 500,
          body: JSON.stringify({
            message: `Unknown error occured when trying to create game at gameId ${gameId}.`,
          }),
        };
      }
    }
  }

  if (collisions >= maxCollisions) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message:
          'gameId generation collision maximum exceeded: ' +
          `${collisions} collisions found.`,
      }),
    };
  }

  console.log(gameId, collisions, game);
  return {
    statusCode: 500,
    body: JSON.stringify({
      message: 'Unknown error occured.',
    }),
  };
}

function makeId(n: number) {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const charactersLength = characters.length;
  for (let i = 0; i < n; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
