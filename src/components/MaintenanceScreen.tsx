import React, { useState, useEffect } from 'react';
import {
  Center,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { Wrench } from 'lucide-react';

interface MaintenanceScreenProps {
  message?: string;
  until?: string | null;
}

const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({
  message,
  until,
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    if (!until) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(until).getTime() - now;

      if (distance < 0) {
        setTimeLeft(null);
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        ),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [until]);

  return (
    <Center mih="100vh" p="md">
      <Paper withBorder shadow="xl" p="xl" radius="xl" maw={440} w="100%">
        <Stack align="center" gap="md">
          <ThemeIcon size={80} radius="xl" variant="light">
            <Wrench size={40} />
          </ThemeIcon>

          <Title order={1} ta="center">
            Under Maintenance
          </Title>

          <Text c="dimmed" size="lg" ta="center">
            {message ||
              "We're currently making improvements to serve you better. We'll be back shortly!"}
          </Text>

          {timeLeft && (
            <Paper withBorder radius="lg" w="100%" p="md">
              <Text size="xs" fw={600} tt="uppercase" ta="center" c="dimmed" mb="sm">
                System Restoration In
              </Text>
              <SimpleGrid cols={4} spacing="xs">
                {[
                  { label: 'Days', value: timeLeft.days },
                  { label: 'Hours', value: timeLeft.hours },
                  { label: 'Mins', value: timeLeft.minutes },
                  { label: 'Secs', value: timeLeft.seconds },
                ].map((item) => (
                  <Stack key={item.label} gap={2} align="center">
                    <Text fz={24} fw={700} ff="monospace">
                      {String(item.value).padStart(2, '0')}
                    </Text>
                    <Text fz={10} c="dimmed" fw={500} tt="uppercase">
                      {item.label}
                    </Text>
                  </Stack>
                ))}
              </SimpleGrid>
            </Paper>
          )}

          <Group gap="xs">
            <Loader size="xs" type="dots" />
            <Text size="sm" c="dimmed">
              Working on updates...
            </Text>
          </Group>
        </Stack>
      </Paper>
    </Center>
  );
};

export default MaintenanceScreen;
