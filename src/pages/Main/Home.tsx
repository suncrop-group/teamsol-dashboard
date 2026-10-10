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
  Badge,
  Center,
  Container,
  Flex,
  Group,
  Image,
  Loader,
  Paper,
  RingProgress,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
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

// Ring gauge of the achieved percentage
const ArcGauge = ({ pct }: { pct: number }) => {
  return (
    <RingProgress
      size={220}
      thickness={18}
      roundCaps
      transitionDuration={600}
      sections={[{ value: Math.min(pct, 100), color: gaugeColor(pct) }]}
      label={
        <Stack gap={0} align="center">
          <Text fz={28} fw={800} lh={1.1}>
            {pct.toFixed(1)}%
          </Text>
          <Text size="xs" fw={700} c="dimmed" tt="uppercase" lts={1}>
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
      <Paper withBorder shadow="sm" radius="lg">
        <Center h={320}>
          <Loader />
        </Center>
      </Paper>
    );

  const target = view === 'monthly' ? data.m_target : data.y_target;
  const achievement =
    view === 'monthly' ? data.m_achievement : data.y_achievement;

  const pct = target > 0 ? (achievement / target) * 100 : 0;
  const color = gaugeColor(pct);

  return (
    <Paper withBorder shadow="sm" radius="lg" p={{ base: 'md', sm: 'xl' }}>
      <Flex
        direction={{ base: 'column', lg: 'row' }}
        align="center"
        justify="space-between"
        gap="xl"
      >
        <Stack gap="lg" flex={1} w="100%">
          <Group justify="space-between" align="center" gap="md">
            <Title order={2} fz={{ base: 'h3', sm: 'h2' }}>
              Target vs Achievement
            </Title>

            <SegmentedControl
              value={view}
              onChange={(value) => setView(value as 'monthly' | 'yearly')}
              data={[
                { label: 'Monthly', value: 'monthly' },
                { label: 'Yearly', value: 'yearly' },
              ]}
            />
          </Group>

          <Text c="dimmed" fw={500}>
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

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <Paper withBorder radius="md" p="lg">
              <Group gap="sm">
                <ThemeIcon variant="light" color="gray" size={40} radius="xl">
                  <Target size={20} />
                </ThemeIcon>
                <Text size="sm" fw={700} c="dimmed" tt="uppercase">
                  Target
                </Text>
              </Group>
              <Text fz={24} fw={800} mt="md">
                {fmt(target)}
              </Text>
            </Paper>

            <Paper withBorder radius="md" p="lg">
              <Group gap="sm">
                <ThemeIcon variant="light" color={color} size={40} radius="xl">
                  <Award size={20} />
                </ThemeIcon>
                <Text size="sm" fw={700} c="dimmed" tt="uppercase">
                  Achieved
                </Text>
              </Group>
              <Text fz={24} fw={800} mt="md" c={color}>
                {fmt(achievement)}
              </Text>
            </Paper>
          </SimpleGrid>
        </Stack>

        <Center w={{ base: '100%', lg: 320 }} style={{ flexShrink: 0 }}>
          <ArcGauge pct={pct} />
        </Center>
      </Flex>
    </Paper>
  );
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
  const [targetData, setTargetData] = useState<{
    m_target: number;
    m_achievement: number;
    y_target: number;
    y_achievement: number;
  }>({
    m_target: 0,
    m_achievement: 0,
    y_target: 0,
    y_achievement: 0,
  });
  const [targetLoading, setTargetLoading] = useState(false);

  // console.log({ user });

  useEffect(() => {
    if (!user) return;
    setTargetLoading(true);

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
            setTargetData({
              m_target: r.data.m_target,
              m_achievement: r.data.m_achievement,
              y_target: r.data.y_target,
              y_achievement: r.data.y_achievement,
            });
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
  }, [user]);

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

  console.log({ user });

  return (
    <Container size="xl" px={0}>
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between" align="center" gap="md">
          <Title order={1} fz={{ base: 'h2', sm: 'h1' }}>
            Welcome,{' '}
            <Text span inherit c="dimmed">
              {user?.name?.split(' ')[0] || 'User'}
            </Text>
          </Title>
          <Badge variant="dot" color="green" size="lg">
            System Active
          </Badge>
        </Group>

        {/* Big Widget */}
        <TargetWidgetV4
          data={targetData}
          loading={targetLoading}
          user={user}
        />

        {/* Modules */}
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Title order={3}>Applications</Title>
            <Badge variant="light" color="gray" size="lg" tt="none">
              {modList.length} Connected
            </Badge>
          </Group>

          {loading ? (
            <Paper withBorder shadow="sm" radius="lg">
              <Center h={256}>
                <Loader />
              </Center>
            </Paper>
          ) : modList.length === 0 ? (
            <Paper withBorder shadow="sm" radius="lg">
              <EmptyState
                icon={<Grid3x3 size={32} />}
                title="No Applications Configured"
              />
            </Paper>
          ) : (
            <SimpleGrid cols={{ base: 2, md: 3, lg: 4 }} spacing="lg">
              {modList.map((item, idx) => (
                <UnstyledButton
                  key={idx}
                  onClick={() => item.path && navigate(item.path)}
                >
                  <Paper
                    withBorder
                    shadow="sm"
                    radius="lg"
                    p={{ base: 'md', sm: 'xl' }}
                    h="100%"
                  >
                    <Stack align="center" gap="md">
                      <ThemeIcon
                        variant="light"
                        color="gray"
                        size={80}
                        radius="lg"
                      >
                        <Image
                          src={item.icon}
                          alt={item.title}
                          w={40}
                          h={40}
                          fit="contain"
                        />
                      </ThemeIcon>
                      <Text
                        fw={700}
                        ta="center"
                        tt="uppercase"
                        fz={{ base: 'sm', sm: 'md' }}
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
