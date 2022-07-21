import React, { useState, useContext } from 'react';

import { useNavigate } from 'react-router-dom';

import {
  useValidCode,
  useValidPassword,
  useValidUsername,
} from '../../hooks/useAuthHooks';
import { Code, Password, Username } from '../../components/authComponents';

import { AuthContext } from '../../contexts/authContext';
import { VerticalCenter } from '../../components/wrappers';
import Text from '../../components/Text';
import { Button } from '../../components/Button';

export default function ForgotPassword() {
  const { code, setCode, codeIsValid } = useValidCode('');
  const { password, setPassword, passwordIsValid } = useValidPassword('');
  const { username, setUsername, usernameIsValid } = useValidUsername('');
  const [error, setError] = useState('');
  const [reset, setReset] = useState(false);

  const {
    password: passwordConfirm,
    setPassword: setPasswordConfirm,
    passwordIsValid: passwordConfirmIsValid,
  } = useValidPassword('');

  const isValid =
    !codeIsValid ||
    code.length === 0 ||
    !usernameIsValid ||
    username.length === 0 ||
    !passwordIsValid ||
    password.length === 0 ||
    !passwordConfirmIsValid ||
    passwordConfirm.length === 0;

  const navigate = useNavigate();

  const authContext = useContext(AuthContext);

  const resetPassword = async () => {
    try {
      await authContext.forgotPassword(username, code, password);
      setReset(true);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  const updatePassword = (
    <>
      <Text content='password reset' size='large' tbMargin={20} />
      <div style={{ marginTop: '10px' }}>
        <Code code={code} codeIsValid={codeIsValid} setCode={setCode} />
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
          placeholder={'confirm password'}
          passwordIsValid={passwordConfirmIsValid}
          setPassword={setPasswordConfirm}
        />
      </div>

      {/* Error */}
      <Text content={error} size={'xs'} />

      {/* buttons */}
      <div style={{ marginTop: '10px' }}>
        <Button
          label={'change password'}
          disabled={isValid}
          onClick={resetPassword}
        />
      </div>
    </>
  );

  const passwordReset = (
    <>
      <Text content='password reset complete.' size='medium' tbMargin={20} />

      <div>
        <Button label={'sign in'} onClick={() => navigate('/signin')} />
      </div>
    </>
  );

  return (
    <VerticalCenter>{!reset ? updatePassword : passwordReset}</VerticalCenter>
  );
}
