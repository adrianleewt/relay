import React from 'react';
import Text from './Text';
import { TextInput } from './TextInput';

export const InputLabel: React.FunctionComponent<{
  show: boolean;
  content: string;
}> = ({ show, content }) => {
  return (
    <div style={{ minHeight: '20px' }}>
      {show && <Text content={content} size={'xs'} />}
    </div>
  );
};

export const Email: React.FunctionComponent<{
  email: string;
  emailIsValid: boolean;
  setEmail: (_: string) => void;
}> = ({ email, emailIsValid, setEmail }) => {
  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(evt.target.value);
  };

  return (
    <div>
      <TextInput
        onChange={(e) => handleChange(e)}
        placeholder='yourname@example.com'
      />
      <InputLabel
        show={!emailIsValid && email.length > 0}
        content={'Invalid email'}
      />
    </div>
  );
};

export const Password: React.FunctionComponent<{
  password: string;
  placeholder?: string;
  passwordIsValid: boolean;
  setPassword: (_: string) => void;
}> = ({ password, placeholder = 'password', passwordIsValid, setPassword }) => {
  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(evt.target.value);
  };
  return (
    <div>
      <TextInput placeholder={placeholder} onChange={(e) => handleChange(e)} />
      <InputLabel
        show={!passwordIsValid && password.length > 0}
        content='Minimum 6 characters'
      />
    </div>
  );
};

export const Username: React.FunctionComponent<{
  username: string;
  usernameIsValid: boolean;
  setUsername: (_: string) => void;
}> = ({ username, usernameIsValid, setUsername }) => {
  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(evt.target.value);
  };
  return (
    <div>
      <TextInput
        value={username}
        onChange={(e) => handleChange(e)}
        placeholder='username'
      />
      <InputLabel
        show={!usernameIsValid && username.length > 0}
        content='Invalid Username'
      />
    </div>
  );
};

export const Code: React.FunctionComponent<{
  code: string;
  codeIsValid: boolean;
  setCode: (_: string) => void;
}> = ({ code, codeIsValid, setCode }) => {
  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setCode(evt.target.value);
  };
  return (
    <div>
      <TextInput
        placeholder='verification code'
        onChange={(e) => handleChange(e)}
      />
      <InputLabel
        show={!codeIsValid && code.length > 0}
        content='Invalid Code'
      />
    </div>
  );
};
