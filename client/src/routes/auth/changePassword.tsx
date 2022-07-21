import React, { useState, useContext } from 'react';

import { useNavigate } from 'react-router-dom';

import { useValidPassword } from '../../hooks/useAuthHooks';
import { Password } from '../../components/authComponents';

import { AuthContext } from '../../contexts/authContext';
import Text from '../../components/Text';
import { VerticalCenter } from '../../components/wrappers';
import { Button } from '../../components/Button';

export default function ChangePassword() {
  const [error, setError] = useState('');
  const [reset, setReset] = useState(false);

  const {
    password: oldPassword,
    setPassword: setOldPassword,
    passwordIsValid: oldPasswordIsValid,
  } = useValidPassword('');

  const {
    password: newPassword,
    setPassword: setNewPassword,
    passwordIsValid: newPasswordIsValid,
  } = useValidPassword('');

  const isValid =
    !oldPasswordIsValid ||
    oldPassword.length === 0 ||
    !newPasswordIsValid ||
    newPassword.length === 0;

  const navigate = useNavigate();

  const authContext = useContext(AuthContext);

  const changePassword = async () => {
    try {
      setReset(true);
      await authContext.changePassword(oldPassword, newPassword);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updatePassword = (
    <>
      <Text content='change password' size='large' tbMargin={20} />
      <div>
        <Password
          placeholder='old password'
          password={oldPassword}
          passwordIsValid={oldPasswordIsValid}
          setPassword={setOldPassword}
        />
      </div>
      <div>
        <Password
          placeholder='new password'
          password={newPassword}
          passwordIsValid={newPasswordIsValid}
          setPassword={setNewPassword}
        />
      </div>
      {/* Error */}
      <Text content={error} size={'xs'} />
      {/* Buttons */}
      <div>
        <Button
          disabled={isValid || reset}
          onClick={changePassword}
          label='submit'
          size='small'
        />
      </div>
    </>
  );

  const passwordReset = (
    <>
      <Text content='password changed.' size='large' tbMargin={20} />
      <div>
        <Button onClick={() => navigate('/home')} label={'done'} />
      </div>
    </>
  );

  return (
    <VerticalCenter>{!reset ? updatePassword : passwordReset}</VerticalCenter>
  );
}
