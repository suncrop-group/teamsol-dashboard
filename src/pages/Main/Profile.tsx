import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '@/redux/slices/AuthSlice';
import { selectLogo } from '@/redux/slices/ProjectSlice';
import { BASE_URL, callApi } from '@/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import fallbackLogo from '@/assets/images/logo.png'; // Place a default logo image here
import { Label } from '@/components/ui/label';

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
    [user?.territories]
  );
  const warehouses = useMemo(
    () =>
      user?.warehouses
        ?.map((w) => w.name)
        .join(', ')
        ?.trim() || 'N/A',
    [user?.warehouses]
  );
  // const territoriesCount = user?.territories?.length || 0;
  // const warehousesCount = user?.warehouses?.length || 0;
  // // const territoriesText = territoriesCount > 1 ? 'Territories' : 'Territory';
  // // const warehousesText = warehousesCount > 1 ? 'Warehouses' : 'Warehouse';

  const logoURL = logo ? `${BASE_URL}/uploads/projects/${logo}` : fallbackLogo;

  // Change password handler
  const handleChangePassword = (
    e:
      | React.MouseEvent<HTMLButtonElement, MouseEvent>
      | React.FormEvent<HTMLFormElement>
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
        error?.message || 'Failed to change password. Please try again.'
      );
    };

    toast.loading('Changing password...');
    callApi(
      'PATCH',
      '/employee/update-password',
      { password, current_password: currentPassword },
      onSuccess,
      onError
    );
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50 py-8 px-2">
      <Card className="w-full max-w-xl">
        <CardContent className="py-8 px-4 sm:px-8">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="flex justify-center mb-8">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="change-password">Change Password</TabsTrigger>
            </TabsList>
            {/* Profile Tab */}
            <TabsContent value="profile">
              <div className="flex flex-col items-center mb-6">
                <img
                  src={imageError ? fallbackLogo : logoURL}
                  onError={() => setImageError(true)}
                  alt="Company Logo"
                  className="w-24 h-24 object-contain shadow mb-4 border"
                />
              </div>
              <form className="grid gap-4">
                <div>
                  <Label className="mb-2">Name</Label>
                  <Input value={user?.name || ''} disabled />
                </div>
                {/* <Input value={user?.work_email || ''} disabled />
                <Input value={user?.manager?.name || ''} disabled />
                <Input value={user?.company?.name || ''} disabled />
                <Input value={territories} disabled />
                <Input value={warehouses} disabled />
                <Input value={user?.vehicle?.name || 'N/A'} disabled /> */}
                <div>
                  <Label className="mb-2">Work Email</Label>
                  <Input value={user?.work_email || ''} disabled />
                </div>
                <div>
                  <Label className="mb-2">Manager</Label>
                  <Input value={user?.manager?.name || ''} disabled />
                </div>
                <div>
                  <Label className="mb-2">Company</Label>
                  <Input value={user?.company?.name || ''} disabled />
                </div>
                <div>
                  <Label className="mb-2">Territories</Label>
                  <Input value={territories} disabled />
                </div>
                <div>
                  <Label className="mb-2">Warehouses</Label>
                  <Input value={warehouses} disabled />
                </div>
                <div>
                  <Label className="mb-2">Vehicle</Label>
                  <Input value={user?.vehicle?.name || 'N/A'} disabled />
                </div>
              </form>
            </TabsContent>
            {/* Change Password Tab */}
            <TabsContent value="change-password">
              <div className="flex flex-col items-center mb-6">
                <img
                  src={imageError ? fallbackLogo : logoURL}
                  onError={() => setImageError(true)}
                  alt="Company Logo"
                  className="w-20 h-20 object-contain shadow mb-4 border"
                />
              </div>
              <form className="grid gap-4" autoComplete="off">
                <Input
                  type="password"
                  placeholder="Enter your current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <Input
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <Button className="w-full mt-2" onClick={handleChangePassword}>
                  Change Password
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSettings;
