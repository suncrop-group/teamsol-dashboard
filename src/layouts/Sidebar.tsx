import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActionIcon,
  AppShell,
  Avatar,
  Badge,
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
import { useDisclosure, useLocalStorage } from '@mantine/hooks';
import {
  ArrowLeft,
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  Download,
  FileText,
  Home as HomeIcon,
  LogOut,
  type LucideIcon,
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

// A menu entry's icon is a module's picture (an address) or a drawn icon.
type NavEntry = {
  title: string;
  path: string;
  icon?: string | LucideIcon;
  count?: number;
};

const NAV_WIDTH = 264;
const RAIL_WIDTH = 68;

// Every screen mounts its own Layout, so how far the menu is scrolled is
// kept here to outlive a change of screen.
let menuScroll = 0;

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
  // On a wide screen the menu narrows to a strip of icons; the choice is kept.
  const [rail, setRail] = useLocalStorage({
    key: 'team-menu-rail',
    defaultValue: false,
    getInitialValueInEffect: false,
  });
  // The strip is for wide screens; a phone's drawer is always full.
  const railed = rail && !mobileOpened;
  const menuViewport = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    menuViewport.current?.scrollTo({ top: menuScroll });
  }, []);
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

  const isActive = (path: string) =>
    path === '/'
      ? pathname === '/'
      : pathname === path || pathname.startsWith(`${path}/`);

  const sections: { label?: string; items: NavEntry[] }[] = [
    { items: [{ title: 'Home', path: '/', icon: HomeIcon }] },
    { label: 'Modules', items: links.filter((link) => link.path !== '/reports') },
    {
      label: 'More',
      items: [
        { title: 'Reports', path: '/reports', icon: Reports },
        {
          title: 'Notifications',
          path: '/notifications',
          icon: Bell,
          count: notificationCount,
        },
      ],
    },
  ].filter((section) => section.items.length > 0);

  const entryIcon = (entry: NavEntry, size: number) => {
    // A module with no picture still needs something to show in the strip.
    if (!entry.icon) {
      return (
        <Text fw={600} size="sm" w={size} ta="center">
          {entry.title.charAt(0).toUpperCase()}
        </Text>
      );
    }
    if (typeof entry.icon === 'string') {
      return <Image src={entry.icon} alt="" w={size} h={size} fit="contain" />;
    }
    // Drawn icons sit in the same box as the pictures, so labels line up.
    return (
      <Box w={size} h={size} style={{ display: 'grid', placeItems: 'center' }}>
        <entry.icon size={size - 6} />
      </Box>
    );
  };

  // One entry of the full-width menu.
  const wideItem = (entry: NavEntry) => (
    <NavLink
      key={entry.path}
      component={Link}
      to={entry.path}
      label={entry.title}
      active={isActive(entry.path)}
      onClick={closeMobile}
      leftSection={entryIcon(entry, 26)}
      rightSection={
        entry.count ? (
          <Badge size="sm" color="red" variant="filled" circle>
            {entry.count > 99 ? '99+' : entry.count}
          </Badge>
        ) : undefined
      }
      style={{ borderRadius: 'var(--mantine-radius-md)' }}
    />
  );

  // The same entry as an icon, with its name on hover.
  const railItem = (entry: NavEntry) => {
    const active = isActive(entry.path);
    return (
      <Tooltip key={entry.path} label={entry.title} position="right">
        <Indicator
          label={entry.count}
          size={16}
          color="red"
          offset={6}
          disabled={!entry.count}
        >
          <ActionIcon
            component={Link}
            to={entry.path}
            variant={active ? 'light' : 'subtle'}
            color={active ? undefined : 'gray'}
            size={44}
            aria-label={entry.title}
          >
            {entryIcon(entry, 26)}
          </ActionIcon>
        </Indicator>
      </Tooltip>
    );
  };

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
        width: { base: NAV_WIDTH, sm: rail ? RAIL_WIDTH : NAV_WIDTH },
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened },
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
            onClick={() => setRail((current) => !current)}
            visibleFrom="sm"
            size="sm"
            aria-label={rail ? 'Widen the menu' : 'Narrow the menu'}
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
        <AppShell.Section px="sm" h={60}>
          <Group
            h="100%"
            gap="xs"
            wrap="nowrap"
            justify={railed ? 'center' : 'flex-start'}
          >
            <Burger
              opened={mobileOpened}
              onClick={toggleMobile}
              hiddenFrom="sm"
              size="sm"
              aria-label="Close navigation"
            />
            <UnstyledButton
              flex={railed ? undefined : 1}
              miw={0}
              aria-label="Home"
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
                {!railed && (
                  <Box miw={0}>
                    <Text fw={600} size="sm" truncate lh={1.25}>
                      {user?.company?.name}
                    </Text>
                    <Text size="xs" c="dimmed" truncate lh={1.25}>
                      Team dashboard
                    </Text>
                  </Box>
                )}
              </Group>
            </UnstyledButton>
          </Group>
        </AppShell.Section>

        <Divider />

        <AppShell.Section
          grow
          component={ScrollArea}
          viewportRef={menuViewport}
          onScrollPositionChange={({ y }: { y: number }) => {
            menuScroll = y;
          }}
          px="sm"
          py="sm"
          type="scroll"
        >
          <Stack gap="md">
            {sections.map((section, index) => (
              <Stack
                key={section.label || index}
                gap={railed ? 4 : 2}
                align={railed ? 'center' : 'stretch'}
              >
                {section.label &&
                  (railed ? (
                    <Divider mb={6} w="100%" />
                  ) : (
                    <Text
                      size="xs"
                      fw={600}
                      c="dimmed"
                      tt="uppercase"
                      px="sm"
                      mb={4}
                      style={{ letterSpacing: '0.04em' }}
                    >
                      {section.label}
                    </Text>
                  ))}
                {section.items.map((entry) =>
                  railed ? railItem(entry) : wideItem(entry),
                )}
              </Stack>
            ))}
          </Stack>
        </AppShell.Section>

        <Divider />

        <AppShell.Section p="sm">
          <Menu position="right-end" width={240} shadow="md" withinPortal>
            <Menu.Target>
              <UnstyledButton
                w="100%"
                p={railed ? 0 : 6}
                aria-label="Account menu"
                style={{ borderRadius: 'var(--mantine-radius-md)' }}
              >
                <Group
                  gap="sm"
                  wrap="nowrap"
                  justify={railed ? 'center' : 'flex-start'}
                >
                  <Avatar radius="md" color="initials" name={user?.name}>
                    {initials(user?.name)}
                  </Avatar>
                  {!railed && (
                    <>
                      <Box miw={0} flex={1}>
                        <Text size="sm" fw={500} truncate>
                          {user?.name}
                        </Text>
                        <Text size="xs" c="dimmed" truncate>
                          {user?.work_email}
                        </Text>
                      </Box>
                      <ChevronsUpDown
                        size={16}
                        color="var(--mantine-color-dimmed)"
                      />
                    </>
                  )}
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
              tab.path === '/'
                ? pathname === '/'
                : tab.path === '/reports'
                  ? // The report screens sit under their own addresses.
                    /^\/(reports|generate-report|[a-z-]+-reports)(\/|$)/.test(pathname)
                  : pathname.startsWith(tab.path);
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
