import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import DocClient from '../DocClient';

import createGame from './defaultHandlers/createGame';
import joinGame from './defaultHandlers/joinGame';
import quitGame from './defaultHandlers/quitGame';
import sendWord from './defaultHandlers/sendWord';

const gameTableName = process.env.TABLE_NAME!;
const wordsTableName = process.env.WORDS_TABLE_NAME!;

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

export async function defaultHandler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  console.log('event 👉', event);

  if (!event.body) {
    return {
      body: JSON.stringify({ message: 'No request body.' }),
      statusCode: 400,
    };
  }

  const body = JSON.parse(event.body) as WSRequestBody;
  const method = body.method;
  const connectionId = event.requestContext.connectionId;
  const userId = event.requestContext.authorizer!.userId;
  const username = event.requestContext.authorizer!.username;

  if (!userId || !connectionId || !username)
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: `Invalid authorization supplied in request:
        userId: ${userId}
        username: ${username}
        connectionId: ${connectionId}
        `,
      }),
    };

  switch (method) {
    case 'create-game': {
      const cgBody = body as CreateRequestBody;
      return await createGame(
        cgBody.config,
        userId,
        username,
        connectionId,
        gameTableName,
        DocClient
      );
    }
    case 'join-game': {
      const jgBody = body as JoinRequestBody;
      return await joinGame(
        jgBody.gameId,
        userId,
        username,
        connectionId,
        gameTableName,
        DocClient
      );
    }
    case 'send-word': {
      const swBody = body as SendWordRequestBody;
      return await sendWord(
        swBody.word,
        swBody.gameId,
        userId,
        username,
        connectionId,
        gameTableName,
        wordsTableName,
        DocClient
      );
    }
    case 'quit-game': {
      const qgBody = body as QuitGameRequestBody;
      return await quitGame(
        qgBody.gameId,
        userId,
        username,
        connectionId,
        gameTableName,
        DocClient,
        true
      );
    }
  }
}
