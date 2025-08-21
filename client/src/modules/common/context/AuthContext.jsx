import { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../lib/axios';
import { showToast } from '@/modules/common/toast/customToast';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log('Fetching user info from /users/user-info');
        const response = await axiosInstance.get(`/users/user-info`, {
          withCredentials: true,
        });
        console.log('User info response:', response.data);
        if (response.data.user) {
          setUser(response.data.user);
          console.log('User set:', response.data.user);
        } else {
          console.error('No user data in response:', response.data);
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        setUser(null);
        if (error.response?.status === 401) {
          showToast('error', error.response?.data?.message || 'Session expired');
        }
      } finally {
        console.log('Setting loading to false, user:', user);
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const login = async (credentials, isAdmin = false) => {
    const { email, password } = credentials;
    const errors = {};
    if (!email.trim()) errors.email = 'Email is required';
    if (!password.trim()) errors.password = 'Password is required';
    if (Object.keys(errors).length > 0) {
      Object.values(errors).forEach((msg) => showToast('error', msg));
      throw new Error('Validation failed');
    }

    try {
      console.log('Calling login API with:', { email, access: isAdmin ? 'admin' : 'user' });
      const response = await axiosInstance.post(
        `/users/login`,
        { email, password, access: isAdmin ? 'admin' : 'user' },
        { withCredentials: true }
      );
      console.log('Login response:', response.data);

      if (response.data?.success) {
        setUser(response.data.user);
        console.log('User set after login:', response.data.user);
        const role = response.data.user.role_id.role_id === 2 ? 'admin' : 'user';
        showToast('success', isAdmin ? 'Admin login successful' : 'Welcome back!');
        navigate(`/${role}-dashboard`, { replace: true });
      } else {
        showToast('error', response.data?.message || 'Invalid credentials');
        throw new Error(response.data?.message || 'Invalid credentials');
      }
    } catch (error) {
      const errMsg = error.response?.data?.message;
      console.error('Login failed:', error.response?.data || error.message);
      if (error.response?.status === 401 && errMsg?.includes('verify your email')) {
        showToast('info', errMsg);
        navigate('/verify-email', { state: { email: error.response?.data?.email } });
      } else {
        showToast('error', errMsg || 'Login failed');
      }
      throw error;
    }
  };

  const getUserInfo = async () => {
    try {
      console.log('Fetching user info via getUserInfo');
      const response = await axiosInstance.get(`/users/user-info`, {
        withCredentials: true,
      });
      setUser(response.data.user);
      console.log('Get user info:', response.data.user);
      return response.data.user;
    } catch (error) {
      console.error('Get user info failed:', error.response?.data || error.message);
      setUser(null);
      showToast('error', error.response?.data?.message || 'Failed to fetch user info');
      throw new Error(error.response?.data?.message || 'Failed to fetch user info');
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.post(`/users/logout`, {}, { withCredentials: true });
      setUser(null);
      showToast('success', 'Logged out successfully');
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      showToast('error', 'Logout failed');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, getUserInfo, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };