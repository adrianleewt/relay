import React from 'react';

import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import Text from '../components/Text';
import { VerticalCenter } from '../components/wrappers';

const Landing: React.FunctionComponent = () => {
  const navigate = useNavigate();

  const signIn = () => {
    navigate('/signin');
  };

  return (
    <VerticalCenter>
      <div>
        <Text content='relay' size='xl' />
      </div>
      <div
        style={{ margin: '50px 0 10px 0', maxWidth: '500px', width: '100%' }}
      >
        <Text content='how to play:' size='medium' tbMargin={10} />
        <Text content='1. A word will appear on the screen.' size='small' />
        <Text
          content='2. Enter a new word using the last letter of the prompt as the first of a new word. Words cannot be reused at must be at least 6 letters long.'
          size='small'
        />
        <Text
          content='3. If it’s your turn and time runs out, you lose.'
          size='small'
        />
      </div>
      <div
        style={{
          marginTop: '50px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-around',
        }}
      >
        <div
          style={{ marginLeft: '5px', marginRight: '10px', marginTop: '10px' }}
        >
          <Button onClick={signIn} label='sign in' />
        </div>
        <div
          style={{ marginLeft: '5px', marginRight: '10px', marginTop: '10px' }}
        >
          <Button onClick={() => navigate('/signup')} label='sign up' />
        </div>
      </div>
    </VerticalCenter>
  );
};

export default Landing;
