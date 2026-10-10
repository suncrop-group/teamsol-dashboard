import { useMemo, useState } from 'react';
import {
  ActionIcon,
  AppShell,
  Avatar,
  Box,
  Burger,
  Divider,
  Group,
  Image,
  Indicator,
  Menu,
  NavLink,
  ScrollArea,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Reports } from '@/assets/icons';
import { Logo } from '@/assets/images';
import { logout, selectUser } from '@/redux/slices/AuthSlice';
import { selectLogo } from '@/redux/slices/ProjectSlice';
import {
  selectModules,
  selectNotificationCount,
} from '@/redux/slices/AppStateSlice';
import type { AppDispatch } from '@/redux/store';

const initials = (name?: string) =>
  (name || 'U')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export default function Layout({ children }: { children: React.ReactNode }) {
  const user = useSelector(selectUser);
  const logo = useSelector(selectLogo);
  const modules = useSelector(selectModules);
  const notificationCount = useSelector(selectNotificationCount);
  const { setColorScheme } = useMantineColorScheme();
  // The scheme actually on screen, with "auto" resolved to light or dark.
  const colorScheme = useComputedColorScheme('light');
  const isDark = colorScheme === 'dark';
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] =
    useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
  const [logoFailed, setLogoFailed] = useState(false);

  const links = useMemo(
    () => [
      ...(modules || [])
        .map((module) => ({
          title: module.title,
          path: `/${String(module.path || '').replace(/^\//, '')}`,
          icon: module.icon,
        }))
        // Reports is always listed last, whether or not it is a module.
        .filter((link) => link.path !== '/reports'),
      { title: 'Reports', path: '/reports', icon: Reports },
    ],
    [modules],
  );

  const activeTitle =
    links.find(
      (link) => pathname === link.path || pathname.startsWith(`${link.path}/`),
    )?.title ||
    user?.company?.name ||
    'Dashboard';

  return (
    <AppShell
      // "alt": the sidebar runs the full height on the left, and the header
      // sits to its right, above the content.
      layout="alt"
      header={{ height: 60 }}
      navbar={{
        width: 264,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" gap="sm">
          <Burger
            opened={mobileOpened}
            onClick={toggleMobile}
            hiddenFrom="sm"
            size="sm"
            aria-label="Toggle navigation"
          />
          <Burger
            opened={false}
            onClick={toggleDesktop}
            visibleFrom="sm"
            size="sm"
            aria-label="Toggle navigation"
          />
          <Text fw={500} size="sm" c="dimmed" truncate flex={1}>
            {activeTitle}
          </Text>

          <Tooltip label={isDark ? 'Light mode' : 'Dark mode'}>
            <ActionIcon
              variant="default"
              size="lg"
              aria-label="Toggle colour scheme"
              onClick={() => setColorScheme(isDark ? 'light' : 'dark')}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Notifications">
            <Indicator
              label={notificationCount}
              size={16}
              color="red"
              disabled={!notificationCount}
            >
              <ActionIcon
                variant="default"
                size="lg"
                aria-label="Notifications"
                onClick={() => navigate('/notifications')}
              >
                <Bell size={18} />
              </ActionIcon>
            </Indicator>
          </Tooltip>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar>
        <AppShell.Section p="sm" h={60}>
          <Group h="100%" gap="xs" wrap="nowrap">
            <Burger
              opened={mobileOpened}
              onClick={toggleMobile}
              hiddenFrom="sm"
              size="sm"
              aria-label="Close navigation"
            />
            <UnstyledButton
              flex={1}
              miw={0}
              onClick={() => {
                navigate('/');
                closeMobile();
              }}
            >
              <Group gap="sm" wrap="nowrap">
                <Image
                  src={logoFailed || !logo ? Logo : `${logo}`}
                  alt={user?.company?.name}
                  w={36}
                  h={36}
                  fit="contain"
                  radius="md"
                  onError={() => setLogoFailed(true)}
                />
                <Box miw={0}>
                  <Text fw={600} size="sm" truncate>
                    {user?.company?.name}
                  </Text>
                  <Text size="xs" c="dimmed" truncate>
                    {user?.name}
                  </Text>
                </Box>
              </Group>
            </UnstyledButton>
          </Group>
        </AppShell.Section>

        <Divider />

        <AppShell.Section grow component={ScrollArea} px="sm" py="xs">
          <Text size="xs" fw={500} c="dimmed" px="xs" py={6}>
            Modules
          </Text>
          <Stack gap={2}>
            {links.map((link) => (
              <NavLink
                key={link.title}
                component={Link}
                to={link.path}
                label={link.title}
                active={
                  pathname === link.path || pathname.startsWith(`${link.path}/`)
                }
                onClick={closeMobile}
                leftSection={
                  link.icon ? (
                    <Image src={link.icon} alt="" w={28} h={28} fit="contain" />
                  ) : undefined
                }
                style={{ borderRadius: 'var(--mantine-radius-md)' }}
              />
            ))}
          </Stack>
        </AppShell.Section>

        <Divider />

        <AppShell.Section p="sm">
          <Menu position="right-end" width={240} shadow="md" withinPortal>
            <Menu.Target>
              <UnstyledButton w="100%" p={6}>
                <Group gap="sm" wrap="nowrap">
                  <Avatar radius="md" color="initials" name={user?.name}>
                    {initials(user?.name)}
                  </Avatar>
                  <Box miw={0} flex={1}>
                    <Text size="sm" fw={500} truncate>
                      {user?.name}
                    </Text>
                    <Text size="xs" c="dimmed" truncate>
                      {user?.work_email}
                    </Text>
                  </Box>
                  <ChevronsUpDown size={16} />
                </Group>
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<BadgeCheck size={16} />}
                onClick={() => navigate('/profile')}
              >
                Account
              </Menu.Item>
              <Menu.Item
                leftSection={<Bell size={16} />}
                onClick={() => navigate('/notifications')}
              >
                Notifications
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={<LogOut size={16} />}
                onClick={() => dispatch(logout())}
              >
                Log out
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main bg="light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-8))">
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
