import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Card,
  Container,
  Group,
  Image,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { Car } from 'lucide-react';
import { fleetTiles } from '@/data';
import { selectUser } from '@/redux/slices/AuthSlice';

const Fleet = () => {
  const navigate = useNavigate();
  const { vehicle } = useSelector(selectUser);

  return (
    <Container size="xl" px={0}>
      <Group gap="md" mb="lg" align="center">
        <Group gap="xs" wrap="nowrap">
          <Car size={32} />
          <Title order={2} fz={{ base: 'h3', sm: 'h2' }}>
            {vehicle?.model?.name || 'No Vehicle'}
          </Title>
        </Group>
        <Text size="lg" c="dimmed">
          {vehicle?.license_plate || 'N/A'}
        </Text>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        {fleetTiles.map((item, index) => (
          <Card
            key={index}
            withBorder
            shadow="sm"
            padding="lg"
            opacity={item.path ? 1 : 0.5}
            style={{ cursor: item.path ? 'pointer' : 'not-allowed' }}
            onClick={() => item.path && navigate(`/${item.path}`)}
          >
            <Stack align="center" gap="md">
              <Image
                src={item.icon}
                alt={item.title}
                w={48}
                h={48}
                fit="contain"
              />
              <Text size="lg" fw={500} ta="center">
                {item.title}
              </Text>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  );
};

export default Fleet;
