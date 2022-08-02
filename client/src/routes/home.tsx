import React, { useContext, useEffect, useRef, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import GameView from '../components/GameView';
import Text from '../components/Text';
import { TextInput } from '../components/TextInput';
import { VerticalCenter } from '../components/wrappers';

import { AuthContext } from '../contexts/authContext';

import {
  Game,
  buildWebsocketURL,
  createGame,
  joinGame,
  quitGame,
  sendWord,
  getOtherUser,
} from '../libs/gameSocket';
import { alertError } from '../libs/toaster';

export default function Home() {
  const [game, setGame] = useState<Game | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [code, setCode] = useState<string>('');

  // Waiting / loading states
  const [waiting, setWaiting] = useState<boolean>(false);
  const waitingRef = useRef(waiting);

  const navigate = useNavigate();

  const auth = useContext(AuthContext);

  if (!auth.sessionInfo) {
    console.warn('No session info found.');
    navigate('/landing');
  }

  const jwtToken = auth.sessionInfo?.accessToken;

  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket(buildWebsocketURL(jwtToken));
    socket.onopen = (e) => {
      console.log('Opened Websocket', e);
      setConnected(true);
    };
    socket.onclose = (e) => {
      if (connected) {
        // Handle unexpected loss of connection
        alertError('connection lost, refresh', true);
      }
      setGame(null);
      setConnected(false);
    };
    socket.onmessage = (e) => {
      // console.log('WebSocket Message Received:', e);
      const newGame = JSON.parse(e.data as string).game;
      setWaiting(false);
      setGame(newGame);
    };
    socket.onerror = (e) => {
      console.error(e);
      setConnected(false);
      setGame(null);
    };
    ws.current = socket;
    return () => {
      if (connected) {
        socket.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function create() {
    if (!ws.current) return;
    setCode('');
    setWaiting(true);
    createGame(ws.current);
    waitForServer();
    return;
  }

  function join(gameId: string) {
    if (!ws.current) return;
    setCode('');
    setWaiting(true);
    joinGame(ws.current, gameId);
    waitForServer();
    return;
  }

  function quit() {
    // null checks
    if (!ws.current) {
      setGame(null);
      return;
    }
    if (!game) {
      return;
    }
    if (!auth.sessionInfo?.sub) {
      alertError('unknown error occured');
      return;
    }
    // first to quit does not receive new game data, so dont clear game yet
    if (!game.isOver) {
      quitGame(ws.current, game.gameId);
      game.isOver = true;
      game.winner = getOtherUser(auth.sessionInfo.sub, game);
      setGame(JSON.parse(JSON.stringify(game)));
    } else if (game.winner === auth.sessionInfo?.sub) {
      // winner of the game needs to send quit request in addition to setState
      quitGame(ws.current, game.gameId);
      setGame(null);
    } else {
      // loser of the game only needs to set state
      setGame(null);
    }
    return;
  }

  function send(word: string): { result: boolean; message: string } {
    if (!ws.current || !game) {
      return { result: false, message: 'unknown error' };
    }
    if (game.words.includes(word)) {
      return { result: false, message: 'word already played' };
    }
    if (word.length < 6) {
      return { result: false, message: 'word must be six letters long' };
    }
    // first and last letter words checks
    const numWords = game.words.length;
    if (numWords > 0) {
      const lastWord = game.words[numWords - 1];
      const lett = lastWord.charAt(lastWord.length - 1);
      if (word.charAt(0) !== lett) {
        return {
          result: false,
          message: `word must start with "${lett}"`,
        };
      }
    }
    setWaiting(true);
    sendWord(ws.current, game.gameId, word);
    waitForServer();
    return {
      result: true,
      message: 'word sent',
    };
  }

  function signOutClicked() {
    setGame(null);
    setConnected(false);
    if (ws.current && connected) {
      ws.current.close();
    }
    auth.signOut();
    navigate('/landing');
  }

  function changePasswordClicked() {
    if (ws.current && connected) {
      ws.current.close();
    }
    setGame(null);
    setConnected(false);
    navigate('/changepassword');
  }

  function waitForServer() {
    setTimeout(() => {
      if (waitingRef.current) {
        setWaiting(false);
        alertError('no server response', true);
      }
    }, 5000);
  }

  if (game) {
    return (
      <GameView
        game={game}
        send={send}
        quit={quit}
        userId={auth.sessionInfo?.sub!}
      />
    );
  }

  return (
    <VerticalCenter>
      <div>
        <Text content='relay' size='xl' />
      </div>
      <div style={{ margin: '50px 0 10px 0', maxWidth: '500px' }}>
        <Text content='how to play:' size='medium' tbMargin={10} />
        <Text content='1. A word will appear on the screen.' size='small' />
        <Text
          content='2. Enter a new word using the last letter of the prompt as the first of a new word. Words cannot be reused.'
          size='small'
        />
        <Text
          content='3. If it’s your turn and time runs out, you lose.'
          size='small'
        />
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: '15px',
          flexWrap: 'wrap',
        }}
      >
        <TextInput
          value={code}
          placeholder={'code'}
          onChange={(e) => setCode(e.currentTarget.value.trim().toUpperCase())}
        />
        <div style={{ marginTop: '20px' }}>
          <Button
            onClick={() => join(code)}
            label={'join game'}
            size='medium'
            disabled={
              code.length === 0 || code.length > 6 || !connected || waiting
            }
          />
        </div>

        <Text tbMargin={20} size='xs' content='or'></Text>

        <Button
          onClick={create}
          label={'create game'}
          size='medium'
          disabled={!connected || waiting}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          justifyContent: 'center',
          bottom: '30px',
          width: '300px',
        }}
      >
        <div style={{ marginRight: '10px' }}>
          <Button onClick={signOutClicked} label='sign out' size='small' />
        </div>
        <div style={{ marginLeft: '10px' }}>
          <Button
            onClick={changePasswordClicked}
            label='change password'
            size='small'
          />
        </div>
      </div>
    </VerticalCenter>
  );
}
