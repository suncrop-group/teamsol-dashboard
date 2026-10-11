import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectUser } from '@/redux/slices/AuthSlice';
import { selectLogo } from '@/redux/slices/ProjectSlice';
import type { AppDispatch } from '@/redux/store';
import { callApi } from '@/api';
import {
  Avatar,
  Badge,
  Button,
  Container,
  Divider,
  Group,
  Image,
  Modal,
  Paper,
  PasswordInput,
  SegmentedControl,
  Stack,
  Text,
  ThemeIcon,
  Title,
  UnstyledButton,
  useMantineColorScheme,
} from '@mantine/core';
import {
  Car,
  ChevronRight,
  Download,
  KeyRound,
  LogOut,
  Mail,
  Map as MapIcon,
  MapPin,
  UserRound,
  Warehouse,
} from 'lucide-react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { toast } from '@/lib/toast';
import fallbackLogo from '@/assets/images/suncrop.png';

const initialsOf = (name?: string) =>
  (name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || '?';

/** A small heading above a card, as in the mobile app. */
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <Text size="xs" fw={700} c="dimmed" tt="uppercase" lts={1} px={4}>
    {children}
  </Text>
);

/** One labelled fact with an icon on a soft tile. */
const InfoRow = ({
  icon,
  color,
  label,
  value,
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
  value?: React.ReactNode;
}) => (
  <Group gap="md" wrap="nowrap" py={10}>
    <ThemeIcon variant="light" color={color} size={42} radius="md">
      {icon}
    </ThemeIcon>
    <Stack gap={0} miw={0}>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text fw={600} truncate>
        {value || 'N/A'}
      </Text>
    </Stack>
  </Group>
);

/** Names as chips, or a muted line when there are none. */
const Chips = ({
  items,
  icon,
  empty,
}: {
  items: { id: number | string; name: string }[];
  icon: React.ReactNode;
  empty: string;
}) =>
  items.length === 0 ? (
    <Text size="sm" c="dimmed">
      {empty}
    </Text>
  ) : (
    <Group gap="xs">
      {items.map((item) => (
        <Badge
          key={item.id}
          variant="light"
          color="gray"
          size="lg"
          radius="xl"
          tt="none"
          fw={600}
          leftSection={icon}
        >
          {item.name}
        </Badge>
      ))}
    </Group>
  );

const ProfileSettings = () => {
  const user = useSelector(selectUser);
  const logo = useSelector(selectLogo);
  const dispatch: AppDispatch = useDispatch();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const { canInstall, iosHint, install } = useInstallPrompt();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  // For change password tab
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const territories = user?.territories || [];
  const warehouses = user?.warehouses || [];

  const logoURL = logo ? `${logo}` : fallbackLogo;

  // Change password handler
  const handleChangePassword = (
    e:
      | React.MouseEvent<HTMLButtonElement, MouseEvent>
      | React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    if (currentPassword === '') {
      toast.error('Current Password is required');
      return;
    }

    if (password === '') {
      toast.error('Password is required');
      return;
    }
    if (confirmPassword === '') {
      toast.error('Confirm Password is required');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (currentPassword === password) {
      toast.error('New password cannot be the same as current password');
      return;
    }

    const onSuccess = () => {
      toast.dismiss(); // Dismiss loading toast
      toast.success('Password changed successfully!');
      // Optionally, you can reset the password fields
      setPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
      setPasswordOpen(false);
    };

    const onError = (error) => {
      toast.dismiss(); // Dismiss loading toast
      toast.error(
        error?.message || 'Failed to change password. Please try again.',
      );
    };

    toast.loading('Changing password...');
    callApi(
      'PATCH',
      '/employee/update-password',
      { password, current_password: currentPassword },
      onSuccess,
      onError,
    );
  };


  return (
    <Container size="xs" px={0}>
      <Stack gap="lg">
        {/* Who is signed in */}
        <Paper withBorder shadow="sm" p="xl">
          <Stack align="center" gap="xs">
            <Avatar size={92} radius={92} color="var(--mantine-primary-color-filled)" variant="filled">
              <Text fz={32} fw={700} c="white">
                {initialsOf(user?.name)}
              </Text>
            </Avatar>
            <Title order={2} ta="center" mt="xs">
              {user?.name}
            </Title>
            <Text c="dimmed" fw={500}>
              {user?.is_region_manager ? 'Regional manager' : 'Territory manager'}
            </Text>
            <Badge
              variant="light"
              color="gray"
              size="lg"
              radius="xl"
              tt="none"
              fw={500}
              leftSection={<Mail size={14} />}
            >
              {user?.work_email}
            </Badge>
          </Stack>
        </Paper>

        <Stack gap="xs">
          <SectionLabel>Organisation</SectionLabel>
          <Paper withBorder shadow="sm" px="lg" py="xs">
            <InfoRow
              icon={<UserRound size={20} />}
              color="blue"
              label="Manager"
              value={user?.manager?.name}
            />
            <Divider />
            <Group gap="md" wrap="nowrap" py={10}>
              <Image
                src={imageError ? fallbackLogo : logoURL}
                onError={() => setImageError(true)}
                alt=""
                w={42}
                h={42}
                fit="contain"
                radius="md"
              />
              <Stack gap={0} miw={0}>
                <Text size="xs" c="dimmed">
                  Company
                </Text>
                <Text fw={600} truncate>
                  {user?.company?.name || 'N/A'}
                </Text>
              </Stack>
            </Group>
            <Divider />
            <InfoRow
              icon={<MapIcon size={20} />}
              color="yellow"
              label="Region"
              value={user?.region?.name}
            />
            <Divider />
            <InfoRow
              icon={<Car size={20} />}
              color="grape"
              label="Vehicle"
              value={user?.vehicle?.name}
            />
          </Paper>
        </Stack>

        <Stack gap="xs">
          <SectionLabel>{`Territories (${territories.length})`}</SectionLabel>
          <Paper withBorder shadow="sm" p="lg">
            <Chips
              items={territories}
              icon={<MapPin size={14} />}
              empty="No territory assigned"
            />
          </Paper>
        </Stack>

        <Stack gap="xs">
          <SectionLabel>{`Warehouses (${warehouses.length})`}</SectionLabel>
          <Paper withBorder shadow="sm" p="lg">
            <Chips
              items={warehouses}
              icon={<Warehouse size={14} />}
              empty="No warehouse assigned"
            />
          </Paper>
        </Stack>

        <Stack gap="xs">
          <SectionLabel>Appearance</SectionLabel>
          <Paper withBorder shadow="sm" p="md">
            <SegmentedControl
              fullWidth
              radius="md"
              value={colorScheme}
              onChange={(value) => setColorScheme(value as 'auto' | 'light' | 'dark')}
              data={[
                { label: 'System', value: 'auto' },
                { label: 'Light', value: 'light' },
                { label: 'Dark', value: 'dark' },
              ]}
            />
          </Paper>
        </Stack>

        <Stack gap="xs">
          <SectionLabel>Account</SectionLabel>
          <Paper withBorder shadow="sm" px="lg" py="xs">
            <UnstyledButton w="100%" onClick={() => setPasswordOpen(true)}>
              <Group gap="md" wrap="nowrap" py={10}>
                <ThemeIcon variant="light" color="orange" size={42} radius="md">
                  <KeyRound size={20} />
                </ThemeIcon>
                <Text fw={600} flex={1}>
                  Update password
                </Text>
                <ChevronRight size={18} color="var(--mantine-color-dimmed)" />
              </Group>
            </UnstyledButton>
            {(canInstall || iosHint) && (
              <>
                <Divider />
                <UnstyledButton
                  w="100%"
                  onClick={() => {
                    if (canInstall) install();
                    else toast.info('In Safari, tap Share, then "Add to Home Screen".');
                  }}
                >
                  <Group gap="md" wrap="nowrap" py={10}>
                    <ThemeIcon variant="light" color="teal" size={42} radius="md">
                      <Download size={20} />
                    </ThemeIcon>
                    <Text fw={600} flex={1}>
                      Install app
                    </Text>
                    <ChevronRight size={18} color="var(--mantine-color-dimmed)" />
                  </Group>
                </UnstyledButton>
              </>
            )}
          </Paper>
        </Stack>

        <Button
          color="red"
          size="md"
          leftSection={<LogOut size={18} />}
          onClick={() => dispatch(logout())}
        >
          Sign out
        </Button>
      </Stack>

      <Modal
        opened={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        title="Update password"
      >
        <form autoComplete="off" onSubmit={handleChangePassword}>
          <Stack gap="md">
            <PasswordInput
              label="Current password"
              placeholder="Enter your current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.currentTarget.value)}
            />
            <PasswordInput
              label="New password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
            />
            <PasswordInput
              label="Confirm password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.currentTarget.value)}
            />
            <Button type="submit" fullWidth>
              Change Password
            </Button>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
};

export default ProfileSettings;
