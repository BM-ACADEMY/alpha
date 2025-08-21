import { Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './AuthContext';

const PrivateRoute = ({ allowedRole, children }) => {
  const { user, loading } = useContext(AuthContext);
  console.log('PrivateRoute - User:', user, 'Loading:', loading, 'AllowedRole:', allowedRole);

  if (loading) {
    console.log('PrivateRoute - Rendering loading state');
    return <div>Loading...</div>;
  }

  const isAuthenticated = !!user;
  const userRole = user?.role_id?.role_id === 2 ? 'admin' : 'user';
  console.log('PrivateRoute - isAuthenticated:', isAuthenticated, 'userRole:', userRole);

  if (isAuthenticated && (allowedRole === 'login' || allowedRole === 'public')) {
    console.log('PrivateRoute - Redirecting to:', `/${userRole}-dashboard`);
    return <Navigate to={`/${userRole}-dashboard`} replace />;
  }

  if (!isAuthenticated && (allowedRole === 'login' || allowedRole === 'public')) {
    console.log('PrivateRoute - Rendering children for public/login route');
    return children;
  }

  if (isAuthenticated && allowedRole !== userRole) {
    console.log('PrivateRoute - Redirecting to:', `/${userRole}-dashboard`);
    return <Navigate to={`/${userRole}-dashboard`} replace />;
  }

  if (isAuthenticated && allowedRole === userRole) {
    console.log('PrivateRoute - Rendering children for protected route');
    return children;
  }

  console.log('PrivateRoute - Redirecting to:', allowedRole === 'admin' ? '/admin-login' : '/user-login');
  return <Navigate to={allowedRole === 'admin' ? '/admin-login' : '/user-login'} replace />;
};

export default PrivateRoute;