import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './modules/common/context/AuthContext';
import PrivateRoute from './modules/common/context/PrivateRoute';
import LandingPage from './modules/common/pages/LandingPage';
import UserLogin from './modules/common/pages/UserLogin';
import AdminLogin from './modules/common/pages/AdminLogin';
import Register from './modules/common/pages/Register';
import VerifyEmail from './modules/common/pages/verify/VerifyEmail';
import ForgotPassword from './modules/common/pages/verify/ForgotPassword';
import ResetPassword from './modules/common/pages/verify/ResetPassword';
import UserDashboard from './modules/admin/page';
import AdminDashboard from './modules/admin/page';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<PrivateRoute allowedRole="public"><LandingPage /></PrivateRoute>} />
        <Route path="/register" element={<PrivateRoute allowedRole="public"><Register /></PrivateRoute>} />
        <Route path="/verify-email" element={<PrivateRoute allowedRole="public"><VerifyEmail /></PrivateRoute>} />
        <Route path="/forgot-password" element={<PrivateRoute allowedRole="public"><ForgotPassword /></PrivateRoute>} />
        <Route path="/reset-password" element={<PrivateRoute allowedRole="public"><ResetPassword /></PrivateRoute>} />
        <Route path="/user-login" element={<PrivateRoute allowedRole="login"><UserLogin /></PrivateRoute>} />
        <Route path="/admin-login" element={<PrivateRoute allowedRole="login"><AdminLogin /></PrivateRoute>} />
        <Route path="/user-dashboard/*" element={<PrivateRoute allowedRole="user"><UserDashboard /></PrivateRoute>} />
        <Route path="/admin-dashboard/*" element={<PrivateRoute allowedRole="admin"><AdminDashboard /></PrivateRoute>} />
      </Routes>
    </AuthProvider>
  );
}

export default App;