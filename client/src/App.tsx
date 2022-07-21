import React from 'react';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';

import AuthProvider, {
  AuthIsSignedIn,
  AuthIsNotSignedIn,
} from './contexts/authContext';

import SignIn from './routes/auth/signIn';
import SignUp from './routes/auth/signUp';
import VerifyCode from './routes/auth/verify';
import RequestCode from './routes/auth/requestCode';
import ForgotPassword from './routes/auth/forgotPassword';
import ChangePassword from './routes/auth/changePassword';
import Landing from './routes/landing';
import Home from './routes/home';

import styled from 'styled-components';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SignInRoute: React.FunctionComponent = () => (
  <Router>
    <Routes>
      <Route path='*' element={<Landing />} />
      <Route path='/signin' element={<SignIn />} />
      <Route path='/signup' element={<SignUp />} />
      <Route path='/verify' element={<VerifyCode />} />
      <Route path='/requestcode' element={<RequestCode />} />
      <Route path='/forgotpassword' element={<ForgotPassword />} />
      <Route path='/landing' element={<Landing />} />
    </Routes>
  </Router>
);

const MainRoute: React.FunctionComponent = () => (
  <Router>
    <Routes>
      <Route path='*' element={<Home />} />
      <Route path='/changepassword' element={<ChangePassword />} />
      <Route path='/home' element={<Home />} />
    </Routes>
  </Router>
);

const PageWrapper = styled.div`
  height: 100vh;
  width: 100vw;
`;

const App: React.FunctionComponent = () => (
  <PageWrapper>
    <ToastContainer
      position='top-center'
      autoClose={2500}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      toastStyle={{
        backgroundColor: '#121212',
        fontFamily: `source-code-pro, Menlo, Monaco, Consolas, 'Courier New'`,
      }}
    />
    <AuthProvider>
      <AuthIsSignedIn>
        <MainRoute />
      </AuthIsSignedIn>
      <AuthIsNotSignedIn>
        <SignInRoute />
      </AuthIsNotSignedIn>
    </AuthProvider>
  </PageWrapper>
);

export default App;
