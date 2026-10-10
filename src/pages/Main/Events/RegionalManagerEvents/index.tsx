import { useNavigate } from 'react-router-dom';
import { Card, Container, Image, SimpleGrid, Stack, Text } from '@mantine/core';
import { EventRMTiles } from '@/data';
import { useSelector } from 'react-redux';
import { selectUser } from '@/redux/slices/AuthSlice';
import { Attendance } from '@/assets/icons';
import { PageHeader } from '@/components/app';

const RMEvents = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  const hasDailyActivityModule =
    user?.daily_activities_count > 0
      ? [
          ...EventRMTiles,

          {
            title: 'Area Activities',
            icon: Attendance,
            path: '/rm-area-activities',
            code: 'area_activities',
          },
        ]
      : EventRMTiles;

  return (
    <Container size="xl" px={0}>
      <PageHeader title="Regional Manager Events" />
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        {hasDailyActivityModule?.map((item, index) => (
          <Card
            key={index}
            withBorder
            shadow="sm"
            padding="lg"
            opacity={item.path ? 1 : 0.5}
            style={{ cursor: item.path ? 'pointer' : 'default' }}
            onClick={item.path ? () => navigate(item.path) : undefined}
          >
            <Stack align="center" gap="sm" py="sm">
              <Image
                src={item.icon}
                alt={item.title}
                w={96}
                h={96}
                fit="contain"
              />
              <Text fw={600} size="lg" ta="center">
                {item.title}
              </Text>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  );
};

export default RMEvents;
