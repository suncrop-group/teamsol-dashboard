import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setAuthenticated, setUser } from '@/redux/slices/AuthSlice';
import { selectProjectDetails } from '@/redux/slices/ProjectSlice';
import {
  Button,
  Center,
  Image,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { toast } from '@/lib/toast';
import { callApi } from '@/api';
import { validateInput } from '@/utils';
import logo from '@/assets/images/logo.png';
import { useNavigate } from 'react-router-dom';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });

  const projectDetails = useSelector(selectProjectDetails);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSignIn = async () => {
    setErrors({
      email: email === '' ? 'Email is required' : '',
      password: password === '' ? 'Password is required' : '',
    });
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
      onError,
    );
  };

  return (
    <Center mih="100vh" p="md">
      <Paper shadow="xl" p="xl" radius="xl" w="100%" maw={440} withBorder>
        <Stack align="center" gap={4} mb="xl">
          <Image src={logo} alt="Logo" w={96} h={96} fit="contain" mb="sm" />
          <Text tt="uppercase" c="dimmed" fw={500} size="sm">
            Employee
          </Text>
          <Title order={2} ta="center">
            {projectDetails?.title || 'Access Your Employer Portal'}
          </Title>
          <Text c="dimmed" size="sm" ta="center">
            {projectDetails?.description ||
              'Sign in to manage projects and collaborate seamlessly.'}
          </Text>
        </Stack>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSignIn();
          }}
        >
          <Stack gap="md">
            <TextInput
              label="Email"
              placeholder="Enter your email"
              type="email"
              size="md"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              error={errors.email || undefined}
            />
            <PasswordInput
              label="Password"
              placeholder="Enter your password"
              size="md"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              error={errors.password || undefined}
            />
            <Button type="submit" fullWidth size="md" loading={loading}>
              Sign In
            </Button>
          </Stack>
        </form>
      </Paper>
    </Center>
  );
};

export default SignIn;
