import * as React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/modules/common/context/AuthContext';
import PrivateRoute from '@/modules/common/context/PrivateRoute';
// import LandingPage from '@/modules/common/pages/LandingPage';
import UserLogin from '@/modules/common/pages/UserLogin';
import AdminLogin from '@/modules/common/pages/AdminLogin';
import Register from '@/modules/common/pages/Register';
import VerifyEmail from '@/modules/common/pages/verify/VerifyEmail';
import ForgotPassword from '@/modules/common/pages/verify/ForgotPassword';
import ResetPassword from '@/modules/common/pages/verify/ResetPassword';
import { userRoutes } from '@/modules/common/routes/UserRoutes';
import { adminRoutes } from '@/modules/common/routes/AdminRoutes';
import Page from './modules/admin/page';
import ReferralRegister from './modules/common/pages/ReferralRegister';
import Mainsection from './modules/Homepage/Main/Mainsection';
import VerifyOtp from './modules/common/pages/verify/OtpInput';


function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        {/* <Route path="/" element={<PrivateRoute allowedRole="public"><LandingPage /></PrivateRoute>} /> */}
        <Route path="/" element={<PrivateRoute allowedRole="public"><Mainsection /></PrivateRoute>} />
        <Route path="/register" element={<PrivateRoute allowedRole="public"><Register /></PrivateRoute>} />
        <Route path="/verify-email" element={<PrivateRoute allowedRole="public"><VerifyEmail /></PrivateRoute>} />
        <Route path="/forgot-password" element={<PrivateRoute allowedRole="public"><ForgotPassword /></PrivateRoute>} />
        <Route path="/reset-password" element={<PrivateRoute allowedRole="public"><ResetPassword /></PrivateRoute>} />
        <Route path="/user-login" element={<PrivateRoute allowedRole="login"><UserLogin /></PrivateRoute>} />
        <Route path="/admin-login" element={<PrivateRoute allowedRole="login"><AdminLogin /></PrivateRoute>} />
        <Route path="/signup" element={<PrivateRoute allowedRole="public"><ReferralRegister /></PrivateRoute>} />
        <Route path="/verify-otp" element={<PrivateRoute allowedRole="public"><VerifyOtp /></PrivateRoute>} />


        {/* User and Admin Routes */}
        <Route element={<Page />}>
          {userRoutes?.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
          {adminRoutes?.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
