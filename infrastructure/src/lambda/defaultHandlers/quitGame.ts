import {
  DynamoDBDocumentClient,
  GetCommand,
  GetCommandOutput,
  PutCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import Game from '../../Game';
import { sendGameMultiple } from './helpers';

export default async function quitGame(
  gameId: string,
  userId: string,
  username: string,
  connectionId: string,
  gameTableName: string,
  DocClient: DynamoDBDocumentClient,
  updateConnectionItem: boolean
) {
  let gameGR: GetCommandOutput;

  // Get game data
  try {
    gameGR = await DocClient.send(
      new GetCommand({
        TableName: gameTableName,
        Key: { pk: 'g#' + gameId, sk: 'g#' + gameId },
      })
    );
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `Unknown error occured when trying to read game at gameId ${gameId}.`,
      }),
    };
  }

  // Update game state with conditional checks
  try {
    const game = Game.fromDynamo(gameGR.Item);
    if (!game.isConnected(connectionId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Connection ${connectionId} is already marked as disconnected.`,
        }),
      };
    }
    const madeWinner = game.quit(userId);

    try {
      await DocClient.send(
        new PutCommand({
          TableName: gameTableName,
          Item: Game.toDynamo(game),
          ExpressionAttributeValues: {
            ':bool': madeWinner ? false : true,
          },
          ConditionExpression: 'attribute_exists(pk) AND isOver = :bool',
        })
      );
    } catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: `Unknown error occured when trying to set winner in game data.`,
        }),
      };
    }

    // Update connectionId item
    if (updateConnectionItem) {
      try {
        await DocClient.send(
          new UpdateCommand({
            TableName: gameTableName,
            Key: { pk: 'c#' + connectionId, sk: 'c#' + connectionId },
            UpdateExpression: 'SET connectionId = :newId',
            ExpressionAttributeValues: {
              ':newId': null,
            },
          })
        );
      } catch (err) {
        return {
          statusCode: 500,
          body: JSON.stringify({
            message: `Unknown error occured when trying to set clear connectionId.`,
          }),
        };
      }
    }

    // Send updated game state to active player remaining
    try {
      await sendGameMultiple(game.getConnectionIds(), game);
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: `Client successfully quit game ${gameId}.`,
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
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `Unknown error occured when trying to quit game ${gameId}.`,
      }),
    };
  }
}
