import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Shield, ArrowRight } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import logo from '@/assets/images/file.png';
import bg from '@/assets/images/bg.jpg';

function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!credentials.email.trim()) newErrors.email = 'Email is required';
    if (!credentials.password.trim()) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await login(credentials, true); // isAdmin = true
    } catch (error) {
      console.log(error);
      
    }
  };

  const isFormValid = credentials.email.trim() && credentials.password.trim();

  return (
    <div className="relative min-h-screen bg-[#F4F6F8] overflow-hidden flex items-center justify-center">
      <div
        className="absolute top-0 left-0 w-full h-[300px] z-0"
        style={{
          background: 'linear-gradient(120deg, #0F1C3F, #7BA6CC)',
          clipPath: 'ellipse(80% 100% at 50% 0%)',
        }}
      />
      <div className="absolute top-5 left-8 z-10">
        <img src={logo} alt="Alpha R Logo" className="h-16" />
      </div>
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-center w-full px-6">
        <div className="hidden md:block flex-1">
          <img src={bg} alt="Login Illustration" className="mx-auto w-[70%] object-contain" />
        </div>
        <Card className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full flex-1">
          <form onSubmit={handleSubmit}>
            <CardHeader className="space-y-2">
              <CardTitle className="text-center text-[#0F1C3F]">Admin Access</CardTitle>
              <CardDescription className="text-center">
                Enter your credentials to access the admin dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="Enter your email"
                  value={credentials.email}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCredentials({ ...credentials, email: value });
                    if (value.trim()) setErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={credentials.password}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCredentials({ ...credentials, password: value });
                    if (value.trim()) setErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
              </div>
              <Button
                type="submit"
                disabled={!isFormValid}
                className="w-full flex items-center gap-2 bg-[#0F1C3F] text-white hover:bg-[#0066CC] disabled:opacity-50"
              >
                <Shield className="w-5 h-5" />
                Login
              </Button>
              <div className="flex justify-end pt-2">
                <p
                  className="text-sm text-[#0F1C3F] font-medium hover:underline cursor-pointer"
                  onClick={() => navigate('/forgot-password')}
                >
                  Forgot Password?
                </p>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default AdminLogin;