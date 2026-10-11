import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '@/redux/slices/AuthSlice';
import { selectLogo } from '@/redux/slices/ProjectSlice';
import { callApi } from '@/api';
import {
  Button,
  Center,
  Container,
  Image,
  Paper,
  PasswordInput,
  Stack,
  Tabs,
  TextInput,
} from '@mantine/core';
import { toast } from '@/lib/toast';
import fallbackLogo from '@/assets/images/suncrop.png'; // Place a default logo image here

const ProfileSettings = () => {
  const user = useSelector(selectUser);
  const logo = useSelector(selectLogo);
  const [activeTab, setActiveTab] = useState('profile');
  const [imageError, setImageError] = useState(false);

  // For change password tab
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // User info formatting
  const territories = useMemo(
    () =>
      user?.territories
        ?.map((t) => t.name)
        .join(', ')
        ?.trim() || 'N/A',
    [user?.territories],
  );
  const warehouses = useMemo(
    () =>
      user?.warehouses
        ?.map((w) => w.name)
        .join(', ')
        ?.trim() || 'N/A',
    [user?.warehouses],
  );
  // const territoriesCount = user?.territories?.length || 0;
  // const warehousesCount = user?.warehouses?.length || 0;
  // // const territoriesText = territoriesCount > 1 ? 'Territories' : 'Territory';
  // // const warehousesText = warehousesCount > 1 ? 'Warehouses' : 'Warehouse';

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
      setActiveTab('profile'); // Switch back to profile tab
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
      <Paper withBorder shadow="sm" p={{ base: 'md', sm: 'xl' }}>
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List justify="center" mb="xl">
            <Tabs.Tab value="profile">Profile</Tabs.Tab>
            <Tabs.Tab value="change-password">Change Password</Tabs.Tab>
          </Tabs.List>
          {/* Profile Tab */}
          <Tabs.Panel value="profile">
            <Center mb="lg">
              <Paper withBorder shadow="xs" p={4} radius="md">
                <Image
                  src={imageError ? fallbackLogo : logoURL}
                  onError={() => setImageError(true)}
                  alt="Company Logo"
                  w={96}
                  h={96}
                  fit="contain"
                />
              </Paper>
            </Center>
            <form>
              <Stack gap="md">
                <TextInput label="Name" value={user?.name || ''} disabled />
                <TextInput
                  label="Work Email"
                  value={user?.work_email || ''}
                  disabled
                />
                <TextInput
                  label="Manager"
                  value={user?.manager?.name || ''}
                  disabled
                />
                <TextInput
                  label="Company"
                  value={user?.company?.name || ''}
                  disabled
                />
                <TextInput label="Territories" value={territories} disabled />
                <TextInput label="Warehouses" value={warehouses} disabled />
                <TextInput
                  label="Vehicle"
                  value={user?.vehicle?.name || 'N/A'}
                  disabled
                />
              </Stack>
            </form>
          </Tabs.Panel>
          {/* Change Password Tab */}
          <Tabs.Panel value="change-password">
            <Center mb="lg">
              <Paper withBorder shadow="xs" p={4} radius="md">
                <Image
                  src={imageError ? fallbackLogo : logoURL}
                  onError={() => setImageError(true)}
                  alt="Company Logo"
                  w={80}
                  h={80}
                  fit="contain"
                />
              </Paper>
            </Center>
            <form autoComplete="off">
              <Stack gap="md">
                <PasswordInput
                  aria-label="Current password"
                  placeholder="Enter your current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.currentTarget.value)}
                />
                <PasswordInput
                  aria-label="New password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.currentTarget.value)}
                />
                <PasswordInput
                  aria-label="Confirm password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.currentTarget.value)}
                />
                <Button type="submit" fullWidth onClick={handleChangePassword}>
                  Change Password
                </Button>
              </Stack>
            </form>
          </Tabs.Panel>
        </Tabs>
      </Paper>
    </Container>
  );
};

export default ProfileSettings;
