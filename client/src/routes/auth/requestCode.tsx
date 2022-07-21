import React, { useState, useContext } from 'react';

import { useNavigate } from 'react-router-dom';

import { useValidUsername } from '../../hooks/useAuthHooks';
import { Username } from '../../components/authComponents';

import { AuthContext } from '../../contexts/authContext';
import { VerticalCenter } from '../../components/wrappers';
import Text from '../../components/Text';
import { Button } from '../../components/Button';

export default function RequestCode() {
  const { username, setUsername, usernameIsValid } = useValidUsername('');
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const isValid = !usernameIsValid || username.length === 0;

  const navigate = useNavigate();

  const authContext = useContext(AuthContext);

  const sendCodeClicked = async () => {
    try {
      setResetSent(true);
      await authContext.sendCode(username);
      navigate('/forgotpassword');
    } catch (err) {
      setError('Unknown user');
    }
  };

  const sendCode = (
    <>
      <div>
        <Username
          username={username}
          usernameIsValid={usernameIsValid}
          setUsername={setUsername}
        />
      </div>
      <div>
        <p>{error}</p>
      </div>

      <Button
        label={'send code'}
        disabled={isValid || resetSent}
        onClick={sendCodeClicked}
      />
    </>
  );

  return (
    <VerticalCenter>
      <Text content='reset password' size='large' tbMargin={20} />
      {sendCode}
    </VerticalCenter>
  );
}
