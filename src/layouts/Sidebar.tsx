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
  ArrowLeft,
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  Download,
  FileText,
  Home as HomeIcon,
  LogOut,
  Moon,
  Sun,
  UserRound,
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
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { toast } from '@/lib/toast';
import { usePageTitle } from './pageTitle';

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

  // Top-level screens: Home, each module, Reports, and the two reached from
  // the bottom tabs. Every other screen was opened from one of them, so it
  // gets a back arrow in the header, like a screen in a phone app.
  const isRoot =
    pathname === '/' ||
    pathname === '/notifications' ||
    pathname === '/profile' ||
    links.some((link) => link.path === pathname);

  const activeTitle =
    links.find(
      (link) => pathname === link.path || pathname.startsWith(`${link.path}/`),
    )?.title ||
    (pathname === '/'
      ? user?.company?.name
      : // "/add-fuel" → "Add Fuel", "/event-details/12" → "Event Details"
        pathname
          .split('/')[1]
          ?.replace(/-/g, ' ')
          .replace(/\b\w/g, (letter) => letter.toUpperCase())) ||
    'Dashboard';

  // Back to where the user came from; a screen opened directly (a shared
  // link, an installed app's first screen) has nowhere to go back to.
  const goBack = () => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate('/');
  };

  // What the page itself calls this screen, when it says ("Edit Toll").
  const pageTitle = usePageTitle();

  const { canInstall, iosHint, install } = useInstallPrompt();

  // Bottom tabs on a phone: the same three as the mobile app. The menu of
  // modules opens from the top bar, and the bell sits there too.
  const tabs = [
    { label: 'Home', icon: HomeIcon, path: '/' },
    { label: 'Reports', icon: FileText, path: '/reports' },
    { label: 'Account', icon: UserRound, path: '/profile' },
  ];

  return (
    <AppShell
      // "alt": the sidebar runs the full height on the left, and the header
      // sits to its right, above the content.
      layout="alt"
      header={{ height: 60 }}
      // Phones only (see AppShell.Footer below). The extra height keeps the
      // tabs clear of the home indicator when installed as an app.
      footer={{
        height: { base: 'calc(60px + env(safe-area-inset-bottom))', sm: 0 },
      }}
      navbar={{
        width: 264,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" gap="sm">
          {/* On a phone the top-left corner is the menu on a top-level
              screen and the back arrow on a nested one. */}
          {isRoot && (
            <Burger
              opened={mobileOpened}
              onClick={toggleMobile}
              hiddenFrom="sm"
              size="sm"
              aria-label="Open menu"
            />
          )}
          <Burger
            opened={false}
            onClick={toggleDesktop}
            visibleFrom="sm"
            size="sm"
            aria-label="Toggle navigation"
          />
          {/* Phones only: wider screens have the page's own back arrow. */}
          {!isRoot && (
            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              aria-label="Go back"
              hiddenFrom="sm"
              onClick={goBack}
            >
              <ArrowLeft size={20} />
            </ActionIcon>
          )}
          {/* Wider screens: the section name, as before. */}
          <Text fw={500} size="sm" c="dimmed" truncate flex={1} visibleFrom="sm">
            {activeTitle}
          </Text>
          {/* Phones: a nested screen's own title beside the back arrow. */}
          <Text
            fw={isRoot ? 500 : 600}
            size={isRoot ? 'sm' : 'md'}
            c={isRoot ? 'dimmed' : undefined}
            truncate
            flex={1}
            hiddenFrom="sm"
          >
            {isRoot ? activeTitle : pageTitle || activeTitle}
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
              {(canInstall || iosHint) && (
                <Menu.Item
                  leftSection={<Download size={16} />}
                  onClick={() => {
                    if (canInstall) install();
                    else
                      toast.info(
                        'In Safari, tap Share, then "Add to Home Screen".',
                      );
                  }}
                >
                  Install app
                </Menu.Item>
              )}
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

      {/* Phone navigation: the same three tabs as the mobile app. */}
      <AppShell.Footer hiddenFrom="sm" pb="env(safe-area-inset-bottom)">
        <Group h={60} gap={0} grow wrap="nowrap">
          {tabs.map((tab) => {
            const active =
              tab.path === '/' ? pathname === '/' : pathname.startsWith(tab.path);
            return (
              <UnstyledButton
                key={tab.path}
                h="100%"
                aria-label={tab.label}
                aria-current={active ? 'page' : undefined}
                onClick={() => {
                  closeMobile();
                  navigate(tab.path);
                }}
              >
                <Stack align="center" gap={2}>
                  <tab.icon
                    size={22}
                    color={
                      active
                        ? 'var(--mantine-primary-color-filled)'
                        : 'var(--mantine-color-dimmed)'
                    }
                  />
                  <Text
                    size="xs"
                    fw={active ? 600 : 500}
                    c={active ? 'var(--mantine-primary-color-filled)' : 'dimmed'}
                  >
                    {tab.label}
                  </Text>
                </Stack>
              </UnstyledButton>
            );
          })}
        </Group>
      </AppShell.Footer>
    </AppShell>
  );
}
