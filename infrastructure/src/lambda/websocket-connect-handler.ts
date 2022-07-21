import * as aws from 'aws-sdk';
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

import DocClient from '../DocClient';

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import User, {
  UserDynamoResult,
  makeUserFromResult,
  makeResultFromUser,
} from '../User';
import quitGame from './defaultHandlers/quitGame';

const gameTableName = process.env.TABLE_NAME!;

export async function connectHandler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  console.log('event 👉', event);
  const route = event.requestContext.routeKey;
  const connectionId = event.requestContext.connectionId;
  let user: User;

  const userId = event.requestContext.authorizer!.userId;
  const username = event.requestContext.authorizer!.username;

  if (!connectionId) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Unknown connectionId.' }),
    };
  }

  if (!username) {
    console.log('Unknown user username.');
    return {
      body: JSON.stringify({ message: 'Unknown user username.' }),
      statusCode: 400,
    };
  }

  if (route === '$connect') {
    try {
      // Get user profile. If not there, create.
      const userReq = await DocClient.send(
        new GetCommand({
          TableName: gameTableName,
          Key: {
            pk: 'u#' + userId,
            sk: 'u#' + userId,
          },
        })
      );

      if (userReq.Item) {
        // Update user profile's lastSeen.
        user = makeUserFromResult(userReq.Item as UserDynamoResult);
        await DocClient.send(
          new UpdateCommand({
            TableName: gameTableName,
            Key: {
              pk: 'u#' + userId,
              sk: 'u#' + userId,
            },
            UpdateExpression: 'SET lastSeen = :time',
            ExpressionAttributeValues: {
              ':time': new Date().getTime(),
            },
          })
        );
      } else {
        // Setup user profile in DynamoDB.
        user = {
          userId: userId,
          username: username,
          lastSeen: new Date().getTime(),
          dateJoined: new Date().getTime(),
          gamesPlayed: 0,
        };
        try {
          await DocClient.send(
            new PutCommand({
              TableName: gameTableName,
              Item: makeResultFromUser(user),
            })
          );
        } catch (err: any) {
          console.log('Failed to update user item for userId ' + userId, err);
          return {
            body: JSON.stringify({
              message: 'Failed to update user item for userId ' + userId,
            }),
            statusCode: 500,
          };
        }
      }
    } catch (err) {
      console.log('Failed to get user profile for userId ' + userId, err);
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: 'Failed to get user profile for userId ' + userId,
        }),
      };
    }

    // Set DynamoDB connection item
    try {
      await DocClient.send(
        new PutCommand({
          TableName: gameTableName,
          Item: {
            pk: 'c#' + connectionId,
            sk: 'c#' + connectionId,
            userId: userId,
            gameId: null,
          },
        })
      );
      console.log('Connection success.');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Connection success.', user: user }),
      };
    } catch (err) {
      console.error('FAIL:', err);
      return { statusCode: 500, body: 'Connection failed.' };
    }
  } else if (route === '$disconnect') {
    // Get connection data
    try {
      const connectionGR = await DocClient.send(
        new GetCommand({
          TableName: gameTableName,
          Key: { pk: 'c#' + connectionId, sk: 'c#' + connectionId },
        })
      );
      if (!connectionGR.Item) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: `Could not find item c#${connectionId}.`,
          }),
        };
      }
      const gameIdToClean = connectionGR.Item.gameId;
      if (connectionGR.Item.gameId) {
        // Handle game quit cleanup in case of sudden disconnect
        try {
          await quitGame(
            gameIdToClean,
            userId,
            username,
            connectionId,
            gameTableName,
            DocClient,
            false
          );
        } catch (err) {
          return {
            statusCode: 500,
            body: JSON.stringify({
              message: `Failed to cleanup game ${gameIdToClean}.`,
            }),
          };
        }
      }
    } catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: `Unknown error occured when trying to read connection ${connectionId}.`,
        }),
      };
    }

    // Cleanup DynamoDB connection item
    try {
      await DocClient.send(
        new DeleteCommand({
          TableName: gameTableName,
          Key: {
            pk: 'c#' + connectionId,
            sk: 'c#' + connectionId,
          },
        })
      );
      return {
        body: JSON.stringify({ message: 'Clean disconnect.' }),
        statusCode: 200,
      };
    } catch (err) {
      console.log('Failed to disconnect cleanup', err);
      return {
        body: JSON.stringify({
          message: 'Disconnect cleanup failed for connectionId ' + connectionId,
        }),
        statusCode: 500,
      };
    }
  } else {
    return {
      body: JSON.stringify({ message: 'Unrecognized route: ' + route }),
      statusCode: 500,
    };
  }
}
