import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setAuthenticated, setUser } from '@/redux/slices/AuthSlice';
import { selectProjectDetails } from '@/redux/slices/ProjectSlice';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner'; // or shadcn/ui's toast if preferred
import { callApi } from '@/api';
import { validateInput } from '@/utils';
import logo from '@/assets/images/logo.png'; // Update with your logo path
import { useNavigate } from 'react-router-dom';
// import { useNavigate } from 'react-router-dom'; // For routing

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });

  const projectDetails = useSelector(selectProjectDetails);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSignIn = async () => {
    if (email === '')
      setErrors((prev) => ({ ...prev, email: 'Email is required' }));
    if (password === '')
      setErrors((prev) => ({ ...prev, password: 'Password is required' }));
    if (!validateInput({ email, password })) return;

    setLoading(true);
    const onSuccess = (res) => {
      setLoading(false);
      dispatch(setAuthenticated(true));
      dispatch(setUser(res.employee));
      toast.success('Login successful!');
      navigate('/');
    };
    const onError = (error) => {
      setLoading(false);
      toast.error(error?.error || 'Something went wrong. Please try again.');
    };

    callApi(
      'POST',
      '/employee/login',
      { email: email.toLowerCase().trim(), password },
      onSuccess,
      onError
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img
            src={logo}
            alt="Logo"
            className="w-24 h-24 object-contain mb-4"
          />
          <span className="uppercase text-muted-foreground font-medium">
            Employee
          </span>
          <h2 className="text-2xl font-bold mt-2 mb-1">
            {projectDetails?.title || 'Access Your Employer Portal'}
          </h2>
          <p className="text-gray-500 mb-2 text-center text-sm">
            {projectDetails?.description ||
              'Sign in to manage projects and collaborate seamlessly.'}
          </p>
        </div>
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            handleSignIn();
          }}
        >
          <div>
            <Input
              placeholder="Enter your email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={errors.email ? 'border-red-500' : ''}
              required
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>
          <div>
            <Input
              placeholder="Enter your password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={errors.password ? 'border-red-500' : ''}
              required
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </div>
          {/* <div className="flex justify-end">
            <Button
              type="button"
              variant="link"
              className="text-xs px-0"
              onClick={() => navigate('/forgot-password')}
              disabled
            >
              Forgot Password?
            </Button>
          </div> */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SignIn;
