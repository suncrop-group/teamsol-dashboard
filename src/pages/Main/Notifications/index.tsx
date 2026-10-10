import { useEffect } from 'react';
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
  Flex,
  Group,
  Indicator,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import dayjs from 'dayjs';
import { callApi } from '@/api';
import { Bell, ExternalLink, CheckCircle2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import { EmptyState } from '@/components/app';

const Notifications = () => {
  const notifications = useSelector(selectNotifications);
  const dispatch = useDispatch();

  useEffect(() => {
    const onSuccess = (response) => {
      const sortedData = response.data.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      dispatch(setNotifications(sortedData));
    };

    const onError = () => {
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


  return (
    <Container size="sm" px={0}>
      <Group gap="sm" mb="lg" wrap="nowrap">
        <ThemeIcon variant="light" color="blue" size={44} radius="md">
          <Bell size={24} />
        </ThemeIcon>
        <Title order={2} fz={{ base: 'h3', sm: 'h2' }}>
          Notifications
        </Title>
      </Group>
      {notifications.length === 0 ? (
        <Paper withBorder shadow="sm" p="lg">
          <EmptyState
            icon={<Bell size={32} />}
            title="No notifications yet"
            description="When you receive notifications, they'll show up here."
          />
        </Paper>
      ) : (
        <Stack gap="md">
          {notifications.map((item) => (
            <Paper
              key={item.id}
              withBorder
              shadow={item.read ? 'xs' : 'sm'}
              p={{ base: 'md', sm: 'lg' }}
              bg={item.read ? undefined : 'var(--mantine-color-blue-light)'}
              onClick={() => handleReadNotification(item.id)}
              style={{
                cursor: 'pointer',
                borderLeft: `4px solid var(--mantine-color-${
                  item.read ? 'gray-4' : 'blue-6'
                })`,
              }}
            >
              <Group align="flex-start" gap="md" wrap="nowrap">
                {item.read ? (
                  <ThemeIcon variant="transparent" color="gray" size={36}>
                    <CheckCircle2 size={20} />
                  </ThemeIcon>
                ) : (
                  <Indicator color="red" size={10} offset={5} withBorder>
                    <ThemeIcon variant="light" color="blue" size={36} radius="xl">
                      <Bell size={20} />
                    </ThemeIcon>
                  </Indicator>
                )}

                <Box flex={1} miw={0}>
                  <Flex
                    direction={{ base: 'column', sm: 'row' }}
                    justify="space-between"
                    align="flex-start"
                    gap="xs"
                    mb={6}
                  >
                    <Text
                      fw={600}
                      fz={{ base: 'md', sm: 'lg' }}
                      c={item.read ? 'dimmed' : undefined}
                      truncate
                      miw={0}
                      maw="100%"
                    >
                      {item.title}
                    </Text>
                    <Badge
                      variant="default"
                      radius="sm"
                      tt="none"
                      fw={500}
                      style={{ flexShrink: 0 }}
                    >
                      {dayjs(item.createdAt).format('MMM D, YYYY • h:mm A')}
                    </Badge>
                  </Flex>

                  <Text size="sm" lh={1.6} c={item.read ? 'dimmed' : undefined}>
                    {item.body}
                  </Text>

                  {item?.url && (
                    <Button
                      mt="md"
                      size="xs"
                      variant={item.read ? 'default' : 'filled'}
                      color={item.read ? undefined : 'blue'}
                      leftSection={<ExternalLink size={14} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRedirect(item.url);
                      }}
                    >
                      View Details
                    </Button>
                  )}
                </Box>
              </Group>
            </Paper>
          ))}
        </Stack>
      )}
    </Container>
  );
};

export default Notifications;
