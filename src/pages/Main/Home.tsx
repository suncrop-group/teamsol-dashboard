import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  logout,
  setAuthenticated,
  updateUserData,
} from '@/redux/slices/AuthSlice';
import {
  setColorScheme,
  setLogo,
  setProjectDetails,
  setProjectName,
} from '@/redux/slices/ProjectSlice';
import {
  setAppState,
  setNotificationCount,
  setModules,
} from '@/redux/slices/AppStateSlice';
import { selectUser } from '@/redux/slices/AuthSlice';
import { useNavigate } from 'react-router-dom';
import { callApi } from '@/api';
import {
  Box,
  Center,
  Container,
  Flex,
  Group,
  Image,
  Loader,
  Paper,
  SegmentedControl,
  SemiCircleProgress,
  SimpleGrid,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { toast } from '@/lib/toast';
import { homeTiles } from '@/data';
import { Target, Award, Grid3x3 } from 'lucide-react';
import { EmptyState } from '@/components/app';

const fmt = (v: number) => {
  if (v >= 1_000_000) {
    return `PKR ${(v / 1_000_000).toFixed(2)}M`;
  }
  if (v >= 1_000) {
    return `PKR ${(v / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(v);
};

// 80% and above is green, 50% and above yellow, otherwise red.
const gaugeColor = (pct: number) =>
  pct >= 80 ? 'green' : pct >= 50 ? 'yellow' : 'red';

// The home page's look: large rounded surfaces that sit softly above the
// page, with a wide diffuse shadow and no border. Each value adapts to the
// colour scheme.
const SURFACE = 'var(--app-surface)';
const SHADOW_LG =
  '0 30px 60px -20px var(--app-shadow-lg)';
const SHADOW_MD =
  '0 16px 32px -14px var(--app-shadow-md)';
const SHADOW_SM =
  '0 8px 18px -8px var(--app-shadow-sm)';
// A recessed panel, for the gauge.
const INSET =
  'inset 0 2px 10px var(--app-shadow-inset)';

const raised = (shadow: string, radius: number) => ({
  background: SURFACE,
  boxShadow: shadow,
  borderRadius: radius,
});

// Small all-caps caption, as used on tiles, pills and stat labels.
const CAPTION = {
  fw: 700,
  tt: 'uppercase' as const,
  lts: 1.5,
};

// Half-circle gauge of the achieved percentage
const ArcGauge = ({ pct }: { pct: number }) => {
  return (
    <SemiCircleProgress
      size={230}
      thickness={16}
      value={Math.min(Math.max(pct, 0), 100)}
      filledSegmentColor={gaugeColor(pct)}
      emptySegmentColor="var(--app-track)"
      transitionDuration={600}
      labelPosition="bottom"
      label={
        <Stack gap={2} align="center">
          <Text fz={30} fw={800} lh={1}>
            {pct.toFixed(1)}%
          </Text>
          <Text size="xs" c="dimmed" {...CAPTION}>
            Achieved
          </Text>
        </Stack>
      }
    />
  );
};

const TargetWidgetV4 = ({
  data,
  loading,
  user,
}: {
  data: {
    m_target: number;
    m_achievement: number;
    y_target: number;
    y_achievement: number;
  };
  loading: boolean;
  user: {
    is_territory_manager: boolean;
    territory_ids: number[];
    territories: {
      id: number;
      name: string;
    }[];
    region: {
      name: string;
    };
  };
}) => {
  const [view, setView] = useState<'monthly' | 'yearly'>('yearly');

  if (loading)
    return (
      <Box style={raised(SHADOW_LG, 40)}>
        <Center h={360}>
          <Loader />
        </Center>
      </Box>
    );

  const target = view === 'monthly' ? data.m_target : data.y_target;
  const achievement =
    view === 'monthly' ? data.m_achievement : data.y_achievement;

  const pct = target > 0 ? (achievement / target) * 100 : 0;
  const color = gaugeColor(pct);

  const stat = (
    icon: React.ReactNode,
    label: string,
    value: string,
    valueColor?: string,
  ) => (
    <Box p={{ base: 'sm', sm: 'lg' }} style={raised(SHADOW_MD, 28)}>
      <Group gap="sm" wrap="nowrap">
        <Center
          w={{ base: 32, sm: 44 }}
          h={{ base: 32, sm: 44 }}
          c={valueColor || 'dimmed'}
          style={raised(SHADOW_SM, 22)}
        >
          {icon}
        </Center>
        <Text size="sm" c="dimmed" {...CAPTION}>
          {label}
        </Text>
      </Group>
      <Text fz={{ base: 18, sm: 26 }} fw={800} mt={{ base: 'xs', sm: 'md' }} c={valueColor}>
        {value}
      </Text>
    </Box>
  );

  return (
    <Box p={{ base: 'lg', sm: 40 }} style={raised(SHADOW_LG, 40)}>
      <Flex
        direction={{ base: 'column', lg: 'row' }}
        align="center"
        justify="space-between"
        gap={{ base: 16, lg: 40 }}
      >
        <Stack gap="lg" flex={1} w="100%">
          <Group justify="space-between" align="center" gap="md" wrap="nowrap">
            <Title order={2} fz={{ base: 20, sm: 30 }} fw={800} lts={-0.5} flex={1}>
              Target vs Achievement
            </Title>

            <SegmentedControl
              radius="xl"
              size="sm"
              // Keeps its full width beside a title that wraps on a phone.
              style={{ flexShrink: 0 }}
              value={view}
              onChange={(value) => setView(value as 'monthly' | 'yearly')}
              data={[
                { label: 'Monthly', value: 'monthly' },
                { label: 'Yearly', value: 'yearly' },
              ]}
              styles={{
                label: {
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 1.5,
                  fontSize: 11,
                  padding: '8px clamp(10px, 3vw, 22px)',
                },
              }}
            />
          </Group>

          <Text c="dimmed" fw={500} fz={{ base: 'sm', sm: 'md' }}>
            Your {user?.is_territory_manager ? 'territory' : 'region'}{' '}
            {user?.is_territory_manager
              ? `${
                  user?.territories?.find(
                    (t: { id: number; name: string }) =>
                      t.id === user.territory_ids[0],
                  )?.name
                } `
              : `${user?.region?.name} `}
            is currently at{' '}
            <Text span inherit fw={700} c={color}>
              {pct.toFixed(1)}%
            </Text>{' '}
            of its {view} goal.
          </Text>

          {/* Beside the gauge on a wide screen; under it on a phone (below). */}
          <SimpleGrid cols={2} spacing="lg" mt="xs" visibleFrom="lg">
            {stat(<Target size={20} />, 'Target', fmt(target))}
            {stat(<Award size={20} />, 'Achieved', fmt(achievement), color)}
          </SimpleGrid>
        </Stack>

        {/* The gauge sits in a recessed panel */}
        <Center
          w={{ base: '100%', lg: 340 }}
          h={{ base: 200, lg: 260 }}
          style={{
            flexShrink: 0,
            borderRadius: 36,
            boxShadow: INSET,
            background:
              'var(--app-panel)',
          }}
        >
          <ArcGauge pct={pct} />
        </Center>

        {/* Phone and tablet: the two figures side by side under the gauge,
            as in the mobile app. */}
        <SimpleGrid cols={2} spacing="sm" w="100%" hiddenFrom="lg">
          {stat(<Target size={18} />, 'Target', fmt(target))}
          {stat(<Award size={18} />, 'Achieved', fmt(achievement), color)}
        </SimpleGrid>
      </Flex>
    </Box>
  );
};

type TargetFigures = {
  m_target: number;
  m_achievement: number;
  y_target: number;
  y_achievement: number;
};

// The last Target vs Achievement figures are kept on the device, so the
// home screen shows them at once and refreshes them in the background.
const targetCacheKey = (user) =>
  `target-vs-achievement:${user?.company?.id ?? user?.company_id ?? ''}:${user?.id ?? ''}`;

const readTargetCache = (user): TargetFigures | null => {
  try {
    const saved = JSON.parse(localStorage.getItem(targetCacheKey(user)) || 'null');
    return saved && typeof saved.m_target === 'number' ? saved : null;
  } catch {
    return null;
  }
};

const writeTargetCache = (user, figures: TargetFigures) => {
  try {
    localStorage.setItem(targetCacheKey(user), JSON.stringify(figures));
  } catch {
    // Storage full or blocked: the figures are simply fetched next time.
  }
};

const Home = () => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [modList, setModList] = useState<
    {
      code: string;
      name: string;
      icon: string;
      path: string;
      is_region_manager: boolean;
      title: string;
      is_territory_manager: boolean;
    }[]
  >([]);
  const navigate = useNavigate();
  const [targetData, setTargetData] = useState<TargetFigures>(
    () =>
      readTargetCache(user) || {
        m_target: 0,
        m_achievement: 0,
        y_target: 0,
        y_achievement: 0,
      },
  );
  const [targetLoading, setTargetLoading] = useState(false);

  // console.log({ user });

  useEffect(() => {
    if (!user) return;
    // With saved figures on screen there is nothing to wait for.
    const cached = readTargetCache(user);
    if (cached) setTargetData(cached);
    setTargetLoading(!cached);

    // First fetch the current target configuration (month and year)
    callApi(
      'GET',
      '/others/target-months-and-years',
      null,
      (configResp) => {
        const { year_id, month_ids } = configResp.data || configResp;

        // The company is set by the server.
        const data: {
          region_id?: number;
          territory_id?: number;
          year_id: number;
          month_ids: number[];
        } = {
          region_id: user.region_id,
          territory_id: user.territory_ids[0],
          year_id: year_id,
          month_ids: month_ids,
        };

        if (user.is_region_manager) {
          delete data.territory_id;
        }
        if (user.is_territory_manager) {
          delete data.region_id;
        }

        console.log({ data });

        // Then fetch the actual target vs achievement report
        callApi(
          'POST',
          '/v2/dashboard/target-vs-achievement',
          data,
          (r: {
            data: {
              m_target: number;
              m_achievement: number;
              y_target: number;
              y_achievement: number;
            };
          }) => {
            setTargetLoading(false);
            const figures = {
              m_target: r.data.m_target,
              m_achievement: r.data.m_achievement,
              y_target: r.data.y_target,
              y_achievement: r.data.y_achievement,
            };
            setTargetData(figures);
            writeTargetCache(user, figures);
          },
          (e) => {
            setTargetLoading(false);
            console.log({ e });
          },
        );
      },
      (err) => {
        setTargetLoading(false);
        console.log('Failed to fetch target config:', err);
      },
      false,
    );
    // Once per person and area, not each time the profile object is replaced.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    user?.id,
    user?.company?.id,
    user?.region_id,
    user?.territory_ids?.[0],
    user?.is_region_manager,
    user?.is_territory_manager,
  ]);

  useEffect(() => {
    const onSuccess = (r) => {
      setLoading(false);
      dispatch(updateUserData(r.data));
      dispatch(setColorScheme(r.data.project.color_scheme));
      dispatch(
        setProjectDetails({
          title: r.data.project.heading,
          description: r.data.project.sub_heading,
        }),
      );
      dispatch(setLogo(r.data.project.logo));
      dispatch(setProjectName(r.data.project.name));
      dispatch(setAuthenticated(true));
    };
    const onError = () => {
      setLoading(false);
      toast.error('Failed to fetch user data.');
      dispatch(logout());
    };
    setLoading(true);
    callApi('GET', '/v2/me', null, onSuccess, onError);
    callApi(
      'GET',
      '/notifications/unread-count',
      null,
      (r) => dispatch(setNotificationCount(r.data)),
      () => {},
    );
    dispatch(setAppState(true));
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const d =
      user?.permissions
        ?.filter((i) => i.permissions.includes('view'))
        ?.map((i) =>
          homeTiles.find(
            (t) => t?.code?.toLowerCase() === i?.module?.code?.toLowerCase(),
          ),
        )
        .filter(Boolean) || [];
    setModList(d);
    dispatch(setModules(d));
    // eslint-disable-next-line
  }, [user?.permissions]);

  return (
    <Container size="xl" px={0} py="md">
      {/* Tighter on a phone, where it is laid out like the mobile app's home. */}
      <Stack gap="clamp(20px, 5vw, 48px)">
        {/* Header */}
        <Group justify="space-between" align="center" gap="md">
          <Title order={1} fz={{ base: 28, sm: 38 }} fw={800} lts={-1}>
            Welcome,{' '}
            <Text span inherit c="dimmed">
              {user?.name?.split(' ')[0] || 'User'}
            </Text>
          </Title>
          <Group
            gap="xs"
            px="lg"
            py={10}
            style={raised(SHADOW_SM, 999)}
            visibleFrom="sm"
          >
            <Box
              w={10}
              h={10}
              bg="green"
              style={{ borderRadius: '50%' }}
              aria-hidden
            />
            <Text size="xs" {...CAPTION}>
              System Active
            </Text>
          </Group>
        </Group>

        {/* Big Widget */}
        <TargetWidgetV4
          data={targetData}
          loading={targetLoading}
          user={user}
        />

        {/* Modules */}
        <Stack gap="lg">
          <Group justify="space-between" align="center">
            <Title order={3} fw={800} lts={-0.3}>
              Applications
            </Title>
            <Text
              size="sm"
              fw={700}
              c="dimmed"
              px="md"
              py={6}
              style={raised(SHADOW_SM, 999)}
            >
              {modList.length} Connected
            </Text>
          </Group>

          {loading ? (
            <Box style={raised(SHADOW_MD, 32)}>
              <Center h={256}>
                <Loader />
              </Center>
            </Box>
          ) : modList.length === 0 ? (
            <Box style={raised(SHADOW_MD, 32)}>
              <EmptyState
                icon={<Grid3x3 size={32} />}
                title="No Applications Configured"
              />
            </Box>
          ) : (
            <SimpleGrid cols={{ base: 2, md: 3, lg: 4 }} spacing={{ base: 'md', sm: 'xl' }}>
              {modList.map((item, idx) => (
                <UnstyledButton
                  key={idx}
                  onClick={() => item.path && navigate(item.path)}
                  h="100%"
                >
                  <Paper
                    px={{ base: 'md', sm: 'xl' }}
                    py={{ base: 'lg', sm: 36 }}
                    h="100%"
                    style={raised(SHADOW_MD, 32)}
                  >
                    <Stack align="center" gap="clamp(10px, 2.5vw, 20px)">
                      <Center
                        w={{ base: 64, sm: 84 }}
                        h={{ base: 64, sm: 84 }}
                        style={raised(SHADOW_SM, 26)}
                      >
                        <Image
                          src={item.icon}
                          alt={item.title}
                          w={36}
                          h={36}
                          fit="contain"
                        />
                      </Center>
                      <Text
                        ta="center"
                        fz={{ base: 'xs', sm: 'sm' }}
                        {...CAPTION}
                      >
                        {item.title}
                      </Text>
                    </Stack>
                  </Paper>
                </UnstyledButton>
              ))}
            </SimpleGrid>
          )}
        </Stack>
      </Stack>
    </Container>
  );
};

export default Home;
