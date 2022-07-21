import React, { Component } from 'react';
import { Game, getOtherUser } from '../libs/gameSocket';
import { alertError, alertSuccess } from '../libs/toaster';
import { Button } from './Button';
import Text from './Text';
import { TextInput } from './TextInput';
import TimerBar from './TimerBar';
import { VerticalCenter } from './wrappers';

// game, send, quit, userId

interface GameViewProps {
  game: Game;
  send: (word: string) => {
    result: boolean;
    message: string;
  };
  quit: () => void;
  userId: string;
}

interface InProgressProps {
  send: (word: string) => {
    result: boolean;
    message: string;
  };
  game: Game;
  userId: string;
  quit: () => void;
}

interface InProgressState {
  word: string;
  waiting: boolean;
  msLeft: number;
  timerOn: boolean;
}

class InProgress extends Component<InProgressProps, InProgressState> {
  timer: NodeJS.Timer | null;
  msMax: number;
  constructor(props: InProgressProps) {
    super(props);
    this.timer = null;
    this.msMax = 10000;
    this.state = {
      word: '',
      waiting: false,
      msLeft: this.msMax,
      timerOn: false,
    };

    this.setWord = this.setWord.bind(this);
    this.setWaiting = this.setWaiting.bind(this);
    this.resetTimer = this.resetTimer.bind(this);
    this.startTimer = this.startTimer.bind(this);
    this.countDown = this.countDown.bind(this);
    this.submit = this.submit.bind(this);
  }

  setWord(s: string) {
    this.setState({ word: s.trim().toLowerCase() });
  }

  setWaiting(b: boolean) {
    this.setState({ waiting: b });
  }

  resetTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.setState({
      msLeft: 10000,
      timerOn: false,
    });
  }

  startTimer() {
    this.timer = setInterval(this.countDown, 100);
    this.setState({ timerOn: true });
  }

  countDown() {
    // Remove one second, set state so a re-render happens.
    let newMsLeft = this.state.msLeft - 100 < 0 ? 0 : this.state.msLeft - 100;
    this.setState({
      msLeft: newMsLeft,
    });

    // Check if we're at zero.
    if (newMsLeft === 0 && this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      this.props.quit();
      this.setState({
        timerOn: false,
      });
    }
  }

  submit() {
    const isSent = this.props.send(this.state.word);
    if (isSent.result) {
      this.setWaiting(true);
    } else {
      alertError(isSent.message);
    }
    this.setWord('');
  }

  componentDidMount() {
    document.addEventListener(
      'keydown',
      (e) => {
        if (
          e.code === 'Enter' &&
          !(
            !this.props.game.turn ||
            this.props.game.isOver ||
            this.props.game.turn !== this.props.userId ||
            this.state.waiting ||
            this.state.word.length < 6
          )
        ) {
          this.submit();
          return;
        }
      },
      false
    );
  }

  componentDidUpdate(prevProps: InProgressProps) {
    if (this.props.game !== prevProps.game) {
      // only update on new game obj
      if (this.state.waiting) {
        this.setState({ waiting: false });
      }

      // Timer management
      if (
        this.props.game.turn === this.props.userId &&
        prevProps.game.turn !== this.props.userId &&
        !this.props.game.isOver
      ) {
        this.startTimer();
      } else if (
        this.props.game.turn !== this.props.userId &&
        prevProps.game.turn === this.props.userId
      ) {
        this.resetTimer();
      }

      // Checking for real word alerts
      if (
        prevProps.game &&
        prevProps.game.numPlayers === 2 &&
        !this.props.game.isOver &&
        prevProps.game.turn === this.props.game.turn
      ) {
        alertError('not a real word');
      }
    }
  }

  render() {
    const { userId, game } = this.props;
    const { waiting, word, msLeft, timerOn } = this.state;
    const words = game.words;
    const wordsLength = game.words.length;

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          flexGrow: 1,
          maxWidth: '500px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'flex-end',
            height: '50%',
            width: '100%',
            paddingBottom: '20px',
            overflow: 'hidden',
          }}
        >
          {game.words.map((w) => {
            return <Text key={w} content={w} size='small' tbMargin={5} />;
          })}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            height: '50%',
            width: '100%',
          }}
        >
          <TextInput
            style={{ width: '100%' }}
            value={word}
            onChange={(e) => this.setWord(e.currentTarget.value)}
            placeholder={
              waiting
                ? ''
                : game.turn === userId
                ? wordsLength === 0
                  ? 'a word with more than six letters'
                  : `a word that starts with "${words[wordsLength - 1].charAt(
                      words[wordsLength - 1].length - 1
                    )}"`
                : ''
            }
          />
          <TimerBar timerOn={timerOn} max={this.msMax} val={msLeft} />

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '20px',
              width: '100%',
            }}
          >
            <Button
              disabled={game.turn !== userId || waiting || word.length < 6}
              label={
                waiting
                  ? '...'
                  : game.turn === userId && word.length === 0
                  ? 'your turn!'
                  : game.turn !== userId
                  ? 'not your turn'
                  : 'send'
              }
              onClick={() => {
                this.submit();
              }}
            />
          </div>
        </div>
      </div>
    );
  }
}

const NotStarted = (props: { gameId: string }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        flexGrow: 1,
        maxWidth: '500px',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text content={props.gameId} size='xl' tbMargin={0} />
      <Text
        content='waiting for another player...'
        size='small'
        tbMargin={10}
      />

      <div style={{ marginTop: '25px' }}>
        <Button
          size='small'
          label='copy code'
          onClick={() => {
            try {
              navigator.clipboard.writeText(props.gameId);
              alertSuccess('copied game code to clipboard.');
            } catch (err) {
              alertError('failed to copy. probably a browser thing');
            }
          }}
        />
      </div>
    </div>
  );
};

const IsOver = (props: {
  didWin: boolean;
  numWords: number;
  quit: () => any;
}) => {
  const getRand = (arr: string[]) =>
    arr[Math.floor(Math.random() * arr.length)];
  const winPhrases = [
    'we get it, nerd',
    "you must think you're so smart",
    'big words =/= big brain',
    "guess you're alright at this",
    'less thesaurus time, more outside time',
    "there's more to life than big words",
  ];
  const losePhrases = [
    'really? try harder',
    "i'm sure you can do better",
    'go read a book',
    'lol get good nerd',
    'its okay, you can always blame the lag',
    'be better',
  ];
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        flexGrow: 1,
        maxWidth: '500px',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text
        content={props.didWin ? 'you win' : 'you lose'}
        size='large'
        tbMargin={5}
      />
      <Text
        content={props.didWin ? getRand(winPhrases) : getRand(losePhrases)}
        size='xs'
      />
      <Text content={`${props.numWords} words`} size='small' tbMargin={15} />
    </div>
  );
};

const GameView = (props: GameViewProps) => {
  const { game, send, quit, userId } = props;
  return (
    <VerticalCenter>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: '500px',
          alignItems: 'center',
        }}
      >
        <Button size='small' label={'quit'} onClick={quit} />
        <Text
          content={
            game.numPlayers === 2
              ? `vs: ${game.clients[getOtherUser(userId, game)].username}`
              : ''
          }
          size='small'
        />
      </div>
      {game.numPlayers < 2 ? (
        <NotStarted gameId={game.gameId} />
      ) : game.isOver ? (
        <IsOver
          didWin={game.winner === userId}
          numWords={game.words.length}
          quit={quit}
        />
      ) : (
        <InProgress send={send} game={game} userId={userId} quit={quit} />
      )}
    </VerticalCenter>
  );
};

export default GameView;
