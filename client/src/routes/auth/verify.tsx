import React, { useState, useContext } from 'react';

import { useNavigate, useSearchParams } from 'react-router-dom';

import { useValidCode, useValidUsername } from '../../hooks/useAuthHooks';
import { Code, Username } from '../../components/authComponents';

import { AuthContext } from '../../contexts/authContext';
import { VerticalCenter } from '../../components/wrappers';
import Text from '../../components/Text';
import { Button } from '../../components/Button';

const VerifyCode: React.FunctionComponent<{}> = () => {
  const [params] = useSearchParams();
  const { username, setUsername, usernameIsValid } = useValidUsername(
    params.get('username') ?? ''
  );

  const { code, setCode, codeIsValid } = useValidCode('');
  const [error, setError] = useState('');

  const isValid =
    !usernameIsValid ||
    username.length === 0 ||
    !codeIsValid ||
    code.length === 0;

  const navigate = useNavigate();
  const authContext = useContext(AuthContext);

  const sendClicked = async () => {
    try {
      await authContext.verifyCode(username, code);
      navigate('/signin');
    } catch (err) {
      setError('Invalid Code');
    }
  };

  return (
    <VerticalCenter>
      {/* Title */}
      <Text content='enter code' size='large' tbMargin={10} />

      {/* Sign In Form */}
      <div>
        {/* <Email emailIsValid={emailIsValid} setEmail={setEmail} /> */}
        <Username
          username={username}
          usernameIsValid={usernameIsValid}
          setUsername={setUsername}
        />
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Code code={code} codeIsValid={codeIsValid} setCode={setCode} />
        <Text content={error} size='xs' />

        {/* <div onClick={passwordResetClicked}>
          <Text content='resend code' size='small' />
        </div> */}
      </div>

      {/* Buttons */}
      <div style={{ marginTop: '20px' }}>
        <Button
          label='go'
          disabled={isValid}
          onClick={sendClicked}
          size='small'
        ></Button>
      </div>
    </VerticalCenter>
  );
};

export default VerifyCode;
