import React from 'react';

interface TimerBarProps {
  max: number;
  val: number;
  timerOn: boolean;
}

const TimerBar = (props: TimerBarProps) => {
  const { max, val, timerOn } = props;
  return (
    <div
      style={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}
    >
      <div
        style={{
          height: '5px',
          width: `${Math.floor((val / max) * 100)}%`,
          backgroundColor: timerOn ? '#e74c3c' : 'transparent',
        }}
      />
    </div>
  );
};

export default TimerBar;
