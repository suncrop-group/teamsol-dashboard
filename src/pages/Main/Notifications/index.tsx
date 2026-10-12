import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectNotifications,
  setNotifications,
} from '@/redux/slices/NotificationsSlice';
import {
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Group,
  Paper,
  SegmentedControl,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { callApi } from '@/api';
import { Bell, BellOff, ExternalLink, TriangleAlert, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { selectUser } from '@/redux/slices/AuthSlice';
import { hasTarget, openNotificationTarget } from '@/api/notificationTarget';
import { toast } from '@/lib/toast';
import { EmptyState } from '@/components/app';

dayjs.extend(relativeTime);

// "Today", "Yesterday", or the date, for the heading over a day's notifications.
const dayLabel = (at: string) => {
  const day = dayjs(at).startOf('day');
  const today = dayjs().startOf('day');
  if (day.isSame(today)) return 'Today';
  if (day.isSame(today.subtract(1, 'day'))) return 'Yesterday';
  return day.format(day.year() === today.year() ? 'D MMMM' : 'D MMMM YYYY');
};

const Notifications = () => {
  const notifications = useSelector(selectNotifications);
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [show, setShow] = useState('all');
  // Only the very first load has nothing to show meanwhile.
  const [loading, setLoading] = useState(notifications.length === 0);

  useEffect(() => {
    const onSuccess = (response) => {
      setLoading(false);
      const sortedData = response.data.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      dispatch(setNotifications(sortedData));
    };

    const onError = () => {
      setLoading(false);
      toast.error('An error occurred while fetching notifications', {
        description: 'Error',
      });
    };

    callApi('GET', '/notifications', null, onSuccess, onError);
  }, [dispatch]);

  const handleReadNotification = (id) => {
    const ifAlreadyRead = notifications?.find(
      (notification) => notification.id === id,
    )?.read;
    if (ifAlreadyRead) return;

    const updatedNotifications = notifications.map((notification) =>
      notification.id === id ? { ...notification, read: true } : notification,
    );
    dispatch(setNotifications(updatedNotifications));

    const onSuccess = () => {
      dispatch(setNotifications(updatedNotifications));
    };

    const onError = () => {
      dispatch(
        setNotifications(
          notifications.map((notification) =>
            notification.id === id
              ? { ...notification, read: false }
              : notification,
          ),
        ),
      );
      toast.error('An error occurred while marking the notification as read', {
        description: 'Error',
      });
    };

    callApi(
      'PATCH',
      `/notifications/${id}/mark-as-read`,
      null,
      onSuccess,
      onError,
    );
  };

  const handleRedirect = (url) => {
    if (url.includes('http')) {
      window.open(url, '_blank');
    } else {
      toast.error('Invalid URL', { description: 'Error' });
    }
  };


  const unread = notifications.filter((item) => !item.read).length;
  const shown = useMemo(
    () =>
      show === 'unread'
        ? notifications.filter((item) => !item.read)
        : notifications,
    [notifications, show],
  );

  // Newest first already; split into days for the headings.
  const days = useMemo(() => {
    const groups: { label: string; items: typeof shown }[] = [];
    for (const item of shown) {
      const label = dayLabel(item.createdAt);
      const last = groups[groups.length - 1];
      if (last?.label === label) last.items.push(item);
      else groups.push({ label, items: [item] });
    }
    return groups;
  }, [shown]);

  return (
    <Container size="sm" px={0}>
      <Group justify="space-between" align="center" mb="lg" gap="sm">
        <Group gap="sm" wrap="nowrap">
          <Title order={2} fz={{ base: 'h3', sm: 'h2' }}>
            Notifications
          </Title>
          {unread > 0 && (
            <Badge variant="light" size="lg">
              {unread} new
            </Badge>
          )}
        </Group>
        {notifications.length > 0 && (
          <SegmentedControl
            size="xs"
            value={show}
            onChange={setShow}
            data={[
              { value: 'all', label: 'All' },
              { value: 'unread', label: 'Unread' },
            ]}
          />
        )}
      </Group>

      {loading ? (
        <Paper withBorder shadow="sm" p="md">
          <Stack gap="lg">
            {[0, 1, 2, 3].map((row) => (
              <Group key={row} gap="md" wrap="nowrap" align="flex-start">
                <Skeleton h={36} w={36} circle />
                <Stack gap={8} flex={1}>
                  <Skeleton h={12} w="40%" />
                  <Skeleton h={10} w="85%" />
                </Stack>
              </Group>
            ))}
          </Stack>
        </Paper>
      ) : shown.length === 0 ? (
        <Paper withBorder shadow="sm" p="lg">
          <EmptyState
            icon={
              show === 'unread' ? <BellOff size={32} /> : <Bell size={32} />
            }
            title={
              show === 'unread' ? 'Nothing unread' : 'No notifications yet'
            }
            description={
              show === 'unread'
                ? 'You have read everything.'
                : "When you receive notifications, they'll show up here."
            }
          />
        </Paper>
      ) : (
        <Stack gap="lg">
          {days.map((day) => (
            <Box key={day.label}>
              <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb="xs" px={4}>
                {day.label}
              </Text>
              <Paper withBorder shadow="sm" style={{ overflow: 'hidden' }}>
                {day.items.map((item, index) => {
                  const fixable = hasTarget(item);
                  return (
                    <Box key={item.id}>
                      {index > 0 && <Divider />}
                      <UnstyledButton
                        component="div"
                        role="button"
                        tabIndex={0}
                        w="100%"
                        p="md"
                        bg={
                          item.read
                            ? undefined
                            : 'var(--mantine-primary-color-light)'
                        }
                        onClick={() => {
                          handleReadNotification(item.id);
                          // A failed-job notification opens the record it is about.
                          if (fixable) openNotificationTarget(item, navigate, user);
                        }}
                        onKeyDown={(event) => {
                          if (event.key !== 'Enter') return;
                          handleReadNotification(item.id);
                          if (fixable) openNotificationTarget(item, navigate, user);
                        }}
                      >
                        <Group align="flex-start" gap="md" wrap="nowrap">
                          <ThemeIcon
                            variant="light"
                            color={fixable ? 'red' : item.read ? 'gray' : undefined}
                            size={36}
                            radius="xl"
                          >
                            {fixable ? (
                              <TriangleAlert size={18} />
                            ) : (
                              <Bell size={18} />
                            )}
                          </ThemeIcon>

                          <Box flex={1} miw={0}>
                            <Group
                              justify="space-between"
                              align="flex-start"
                              gap="sm"
                              wrap="nowrap"
                            >
                              <Text
                                size="sm"
                                fw={item.read ? 500 : 700}
                                style={{ wordBreak: 'break-word' }}
                              >
                                {item.title}
                              </Text>
                              <Group gap={6} wrap="nowrap" style={{ flexShrink: 0 }}>
                                <Tooltip
                                  label={dayjs(item.createdAt).format(
                                    'D MMM YYYY, h:mm A',
                                  )}
                                >
                                  <Text size="xs" c="dimmed">
                                    {dayjs(item.createdAt).fromNow()}
                                  </Text>
                                </Tooltip>
                                {!item.read && (
                                  <Box
                                    w={8}
                                    h={8}
                                    bg="var(--mantine-primary-color-filled)"
                                    style={{ borderRadius: '50%' }}
                                    aria-label="Unread"
                                  />
                                )}
                              </Group>
                            </Group>

                            <Text
                              size="sm"
                              lh={1.5}
                              mt={2}
                              c={item.read ? 'dimmed' : undefined}
                              style={{ wordBreak: 'break-word' }}
                            >
                              {item.body}
                            </Text>

                            {(fixable || item?.url) && (
                              <Group gap="xs" mt="sm">
                                {fixable && (
                                  <Button
                                    size="compact-sm"
                                    variant="light"
                                    color="red"
                                    leftSection={<Wrench size={14} />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReadNotification(item.id);
                                      openNotificationTarget(item, navigate, user);
                                    }}
                                  >
                                    Open & fix
                                  </Button>
                                )}
                                {item?.url && (
                                  <Button
                                    size="compact-sm"
                                    variant="light"
                                    leftSection={<ExternalLink size={14} />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRedirect(item.url);
                                    }}
                                  >
                                    View Details
                                  </Button>
                                )}
                              </Group>
                            )}
                          </Box>
                        </Group>
                      </UnstyledButton>
                    </Box>
                  );
                })}
              </Paper>
            </Box>
          ))}
        </Stack>
      )}
    </Container>
  );
};

export default Notifications;
