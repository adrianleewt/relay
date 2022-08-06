import React, { useState, useContext } from 'react';

import { useNavigate } from 'react-router-dom';

import {
  useValidEmail,
  useValidPassword,
  useValidUsername,
} from '../../hooks/useAuthHooks';
import { Email, Password, Username } from '../../components/authComponents';

import { AuthContext } from '../../contexts/authContext';
import { VerticalCenter } from '../../components/wrappers';
import Text from '../../components/Text';
import { Button } from '../../components/Button';

const SignUp: React.FunctionComponent<{}> = () => {
  const { email, setEmail, emailIsValid } = useValidEmail('');
  const { password, setPassword, passwordIsValid } = useValidPassword('');
  const { username, setUsername, usernameIsValid } = useValidUsername('');
  const [error, setError] = useState('');
  const [created, setCreated] = useState(false);
  const navigate = useNavigate();

  const {
    password: passwordConfirm,
    setPassword: setPasswordConfirm,
    passwordIsValid: passwordConfirmIsValid,
  } = useValidPassword('');

  const isValid =
    !emailIsValid ||
    email.length === 0 ||
    !usernameIsValid ||
    username.length === 0 ||
    !passwordIsValid ||
    password.length === 0 ||
    !passwordConfirmIsValid ||
    passwordConfirm.length === 0;

  const authContext = useContext(AuthContext);

  const signInClicked = async () => {
    try {
      await authContext.signUpWithEmail(username, email, password);
      setCreated(true);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  const signUp = (
    <>
      <div>
        <Email email={email} emailIsValid={emailIsValid} setEmail={setEmail} />
      </div>
      <div>
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
      <div>
        <Password
          password={passwordConfirm}
          placeholder='confirm password'
          passwordIsValid={passwordConfirmIsValid}
          setPassword={setPasswordConfirm}
        />
      </div>
      <p>{error}</p>

      <div>
        <Button label='go' disabled={isValid} onClick={signInClicked}></Button>
      </div>
    </>
  );

  const accountCreated = (
    <div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <Text
        content={`verification code sent to ${email}`}
        size='small'
        tbMargin={20}
      />
      <Button
        label='next'
        onClick={() =>
          navigate({
            pathname: '/verify',
            search: `?username=${username}`,
          })
        }
      ></Button>
    </div>
  );

  return (
    <VerticalCenter>
      <Text content='sign up' size='xl' />
      <div
        style={{
          margin: '20px 0 10px 0',
          maxWidth: '500px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {!created ? signUp : accountCreated}
      </div>
    </VerticalCenter>
  );
};

export default SignUp;
