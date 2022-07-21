import React, { useState, useEffect, useContext } from 'react';

import * as cognito from '../libs/cognito';

export enum AuthStatus {
  Loading,
  SignedIn,
  SignedInButWaitingForSession,
  SignedOut,
}

export interface IAuth {
  sessionInfo?: {
    username?: string;
    email?: string;
    sub?: string;
    accessToken?: string;
    refreshToken?: string;
  };

  authStatus?: AuthStatus;
  signInWithEmail?: any;
  signUpWithEmail?: any;
  signOut?: any;
  verifyCode?: any;
  getSession?: any;
  sendCode?: any;
  forgotPassword?: any;
  changePassword?: any;
}

interface Props {
  children: React.ReactNode;
}

const defaultState: IAuth = {
  sessionInfo: {},
  authStatus: AuthStatus.Loading,
};

export const AuthContext = React.createContext(defaultState);

export const AuthIsSignedIn: React.FunctionComponent<Props> = ({
  children,
}) => {
  const { authStatus }: IAuth = useContext(AuthContext);
  return <>{authStatus === AuthStatus.SignedIn ? children : null}</>;
};

export const AuthIsNotSignedIn: React.FunctionComponent<Props> = ({
  children,
}) => {
  const { authStatus }: IAuth = useContext(AuthContext);
  return <>{authStatus === AuthStatus.SignedOut ? children : null}</>;
};

const AuthProvider: React.FunctionComponent<Props> = ({ children }) => {
  const [authStatus, setAuthStatus] = useState(AuthStatus.Loading);
  const [sessionInfo, setSessionInfo] = useState({});

  useEffect(() => {
    async function getSessionInfo() {
      try {
        const session: any = await getSession();
        const toSet: IAuth['sessionInfo'] = {
          accessToken: session.accessToken.jwtToken,
          refreshToken: session.refreshToken.token,
          email: session.idToken.payload.email,
          username: session.idToken.payload['cognito:username'],
          sub: session.idToken.payload.sub,
        };
        setSessionInfo(toSet);
        Object.entries(toSet).map((pair) =>
          window.localStorage.setItem(pair[0], pair[1])
        );
        setAuthStatus(AuthStatus.SignedIn);
      } catch (err) {
        setAuthStatus(AuthStatus.SignedOut);
      }
    }
    getSessionInfo();
  }, [setAuthStatus, authStatus]);

  if (authStatus === AuthStatus.Loading) {
    return null;
  }

  async function signInWithEmail(username: string, password: string) {
    try {
      await cognito.signInWithEmail(username, password);
      setAuthStatus(AuthStatus.SignedInButWaitingForSession);
    } catch (err) {
      setAuthStatus(AuthStatus.SignedOut);
      throw err;
    }
  }

  async function signUpWithEmail(
    username: string,
    email: string,
    password: string
  ) {
    try {
      await cognito.signUpUserWithEmail(username, email, password);
    } catch (err) {
      throw err;
    }
  }

  function signOut() {
    cognito.signOut();
    setAuthStatus(AuthStatus.SignedOut);
  }

  async function verifyCode(username: string, code: string) {
    try {
      await cognito.verifyCode(username, code);
    } catch (err) {
      throw err;
    }
  }

  async function getSession() {
    try {
      const session = await cognito.getSession();
      return session;
    } catch (err) {
      throw err;
    }
  }

  async function sendCode(username: string) {
    try {
      await cognito.sendCode(username);
    } catch (err) {
      throw err;
    }
  }

  async function forgotPassword(
    username: string,
    code: string,
    password: string
  ) {
    try {
      await cognito.forgotPassword(username, code, password);
    } catch (err) {
      throw err;
    }
  }

  async function changePassword(oldPassword: string, newPassword: string) {
    try {
      await cognito.changePassword(oldPassword, newPassword);
    } catch (err) {
      throw err;
    }
  }

  const state: IAuth = {
    authStatus,
    sessionInfo,
    signUpWithEmail,
    signInWithEmail,
    signOut,
    verifyCode,
    getSession,
    sendCode,
    forgotPassword,
    changePassword,
  };

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
