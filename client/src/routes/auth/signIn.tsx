import React, { useState, useContext } from 'react';

import { useNavigate } from 'react-router-dom';

import { useValidPassword, useValidUsername } from '../../hooks/useAuthHooks';
import { Password, Username } from '../../components/authComponents';

import { AuthContext } from '../../contexts/authContext';
import { VerticalCenter } from '../../components/wrappers';
import Text from '../../components/Text';
import { Button } from '../../components/Button';

const SignIn: React.FunctionComponent<{}> = () => {
  const { username, setUsername, usernameIsValid } = useValidUsername('');
  const { password, setPassword, passwordIsValid } = useValidPassword('');
  const [error, setError] = useState('');

  const isValid =
    !usernameIsValid ||
    username.length === 0 ||
    !passwordIsValid ||
    password.length === 0;

  const navigate = useNavigate();

  const authContext = useContext(AuthContext);

  const signInClicked = async () => {
    try {
      await authContext.signInWithEmail(username, password);
      navigate('/home');
    } catch (err: any) {
      if (err.code === 'UserNotConfirmedException') {
        navigate('/verify');
      } else {
        setError(err.message);
      }
    }
  };

  const passwordResetClicked = async () => {
    navigate('/requestcode');
  };

  return (
    <VerticalCenter>
      {/* Sign In Form */}
      <Text content='sign in' size='xl' />

      <div style={{ margin: '20px 0 10px 0', maxWidth: '500px' }}>
        {/* <Email emailIsValid={emailIsValid} setEmail={setEmail} /> */}
        <Username
          username={username}
          usernameIsValid={usernameIsValid}
          setUsername={setUsername}
        />
      </div>
      <div>
        <Password
          password={password}
          passwordIsValid={passwordIsValid}
          setPassword={setPassword}
        />
      </div>

      {/* Error */}
      <div style={{ marginTop: '10px' }}>
        <Text content={error} tbMargin={10} size='xs' />
      </div>

      {/* Buttons */}

      <div style={{ marginTop: '10px', marginBottom: '20px' }}>
        <Button disabled={isValid} onClick={signInClicked} label='go' />
      </div>
      <Button
        size='small'
        onClick={passwordResetClicked}
        label='forgot password?'
      />
    </VerticalCenter>
  );
};

export default SignIn;
