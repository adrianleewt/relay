import {
  DynamoDBDocumentClient,
  GetCommand,
  GetCommandOutput,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import DocClient from '../../DocClient';
import Game from '../../Game';
import { sendGame, sendGameMultiple } from './helpers';

export default async function sendWord(
  word: string,
  gameId: string,
  userId: string,
  username: string,
  connectionId: string,
  gameTableName: string,
  wordsTableName: string,
  DocClient: DynamoDBDocumentClient
) {
  let isWord: boolean = false;
  let gameGR: GetCommandOutput;

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
  const game = Game.fromDynamo(gameGR.Item);

  try {
    isWord = await checkWord(word, wordsTableName);
    if (!isWord) {
      // If not a word, send the original game data back to client and let client interpret.
      await sendGame(connectionId, game);
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: `Word check success. '${word}' is not a word.`,
        }),
      };
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `An error occured while checking the word ${word}.`,
      }),
    };
  }

  try {
    const addable = game.addWord(word, userId);

    if (!game.turn || !addable) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Failed to add word ${word}. Is it already played or is the game session still valid?`,
        }),
      };
    }

    await DocClient.send(
      new PutCommand({
        TableName: gameTableName,
        Item: Game.toDynamo(game),
        ExpressionAttributeValues: {
          ':bool': false,
          ':user': userId,
        },
        ConditionExpression:
          'attribute_exists(pk) AND isOver = :bool AND turn = :user',
      })
    );

    try {
      await sendGameMultiple(game.getConnectionIds(), game);
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: `Client ${username} successfully sent word ${word} @ game ${gameId}.`,
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
        message: `Unknown error occured when trying to add word ${word} at gameId ${gameId}.`,
      }),
    };
  }
}

async function checkWord(word: string, wordsTableName: string) {
  //TODO: Implement config based checks
  const stripped = word.trim().toLowerCase();
  const minChars = 6;

  if (!stripped || stripped.length < minChars || !/^[a-z]+$/.test(stripped)) {
    return false;
  }
  const resp = await DocClient.send(
    new GetCommand({
      TableName: wordsTableName,
      Key: { word: word },
    })
  );
  return resp.Item ? true : false;
}
