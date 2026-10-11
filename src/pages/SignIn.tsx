import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setAuthenticated, setUser } from '@/redux/slices/AuthSlice';
import {
  selectLogo,
  selectProjectDetails,
  selectProjectName,
} from '@/redux/slices/ProjectSlice';
import {
  ActionIcon,
  Box,
  Button,
  Center,
  Flex,
  Group,
  Image,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core';
import {
  ArrowRight,
  BarChart3,
  Lock,
  Mail,
  Moon,
  RefreshCw,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { callApi } from '@/api';
import { validateInput } from '@/utils';
import logo from '@/assets/images/suncrop.png';
import { useNavigate } from 'react-router-dom';

// What the dashboard is for, on the brand side of the page.
const POINTS = [
  { icon: BarChart3, text: 'Sales, expenses, fleet and events in one place' },
  { icon: RefreshCw, text: 'Everything you enter is queued and sent to Odoo for you' },
  { icon: ShieldCheck, text: 'Your work stays safe, even when Odoo is slow' },
];

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });

  const projectDetails = useSelector(selectProjectDetails);
  const projectLogo = useSelector(selectLogo);
  const projectName = useSelector(selectProjectName);
  const { setColorScheme } = useMantineColorScheme();
  const dark = useComputedColorScheme('light') === 'dark';
  const [logoFailed, setLogoFailed] = useState(false);
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

  const shownLogo = projectLogo && !logoFailed ? projectLogo : logo;
  const heading = projectDetails?.title || 'Access Your Employer Portal';
  const tagline =
    projectDetails?.description ||
    'Sign in to manage projects and collaborate seamlessly.';

  return (
    <Flex mih="100vh">
      {/* Brand side: the project's colour, logo and words. Wide screens only. */}
      <Box
        visibleFrom="md"
        pos="relative"
        w="46%"
        maw={640}
        c="white"
        style={{
          overflow: 'hidden',
          background:
            'linear-gradient(150deg, var(--mantine-primary-color-6) 0%, var(--mantine-primary-color-9) 100%)',
        }}
      >
        {/* Soft shapes, for depth. */}
        <Box
          pos="absolute"
          top={-120}
          right={-120}
          w={360}
          h={360}
          style={{ borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }}
        />
        <Box
          pos="absolute"
          bottom={-160}
          left={-100}
          w={420}
          h={420}
          style={{ borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }}
        />

        <Stack pos="relative" h="100%" justify="space-between" p={56}>
          <Group gap="sm">
            <Center
              w={52}
              h={52}
              bg="white"
              style={{ borderRadius: 14, boxShadow: '0 6px 20px rgba(0,0,0,0.18)' }}
            >
              <Image
                src={shownLogo}
                alt=""
                w={38}
                h={38}
                fit="contain"
                onError={() => setLogoFailed(true)}
              />
            </Center>
            <Text fw={700} size="lg">
              {projectName || 'TeamSol'}
            </Text>
          </Group>

          <Stack gap="xl">
            <Stack gap="sm">
              <Title order={1} fz={38} lh={1.15} c="white">
                {heading}
              </Title>
              <Text size="lg" opacity={0.85}>
                {tagline}
              </Text>
            </Stack>
            <Stack gap="md">
              {POINTS.map(({ icon: Icon, text }) => (
                <Group key={text} gap="sm" wrap="nowrap">
                  <Center
                    w={36}
                    h={36}
                    style={{ borderRadius: 10, background: 'rgba(255,255,255,0.16)', flexShrink: 0 }}
                  >
                    <Icon size={18} />
                  </Center>
                  <Text fw={500}>{text}</Text>
                </Group>
              ))}
            </Stack>
          </Stack>

          <Text size="sm" opacity={0.7}>
            Powered by TeamSol
          </Text>
        </Stack>
      </Box>

      {/* Form side. */}
      <Flex flex={1} direction="column" pos="relative">
        <Group justify="flex-end" p="md">
          <Tooltip label={dark ? 'Light mode' : 'Dark mode'}>
            <ActionIcon
              variant="default"
              size="lg"
              aria-label="Toggle colour scheme"
              onClick={() => setColorScheme(dark ? 'light' : 'dark')}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </ActionIcon>
          </Tooltip>
        </Group>

        <Center flex={1} px="md" pb={64}>
          <Box w="100%" maw={400}>
            {/* On a phone the brand side is hidden, so the logo leads here. */}
            <Center hiddenFrom="md" mb="lg">
              <Image
                src={shownLogo}
                alt="Logo"
                w={84}
                h={84}
                fit="contain"
                onError={() => setLogoFailed(true)}
              />
            </Center>

            <Stack gap={6} mb="xl">
              <Text tt="uppercase" c="dimmed" fw={600} size="xs" lts={1.5}>
                Employee sign in
              </Text>
              <Title order={2}>Welcome back</Title>
              <Text c="dimmed" size="sm" hiddenFrom="md">
                {heading}
              </Text>
              <Text c="dimmed" size="sm" visibleFrom="md">
                Enter your work email and password to continue.
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
                  placeholder="you@company.com"
                  type="email"
                  size="md"
                  autoComplete="username"
                  leftSection={<Mail size={18} />}
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                  error={errors.email || undefined}
                />
                <PasswordInput
                  label="Password"
                  placeholder="Enter your password"
                  size="md"
                  autoComplete="current-password"
                  leftSection={<Lock size={18} />}
                  value={password}
                  onChange={(e) => setPassword(e.currentTarget.value)}
                  error={errors.password || undefined}
                />
                <Button
                  type="submit"
                  fullWidth
                  size="md"
                  mt="xs"
                  loading={loading}
                  rightSection={<ArrowRight size={18} />}
                >
                  Sign In
                </Button>
              </Stack>
            </form>

            <Text c="dimmed" size="xs" ta="center" mt="xl">
              Trouble signing in? Ask your administrator to reset your password.
            </Text>
          </Box>
        </Center>
      </Flex>
    </Flex>
  );
};

export default SignIn;
