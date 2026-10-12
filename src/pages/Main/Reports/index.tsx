import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Container,
  Group,
  Image,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import { ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/app';
import { selectUser } from '@/redux/slices/AuthSlice';
import { Sales } from '@/assets/icons';
import { IconTile, MANAGE_SECTION, REPORT_SECTIONS } from './parts';

const Reports = () => {
  const { receive_reports_count } = useSelector(selectUser);
  const navigate = useNavigate();

  const sections =
    receive_reports_count > 0
      ? [...REPORT_SECTIONS, MANAGE_SECTION]
      : REPORT_SECTIONS;

  return (
    <Container size="md" px={0}>
      <PageHeader title="Reports" />

      {/* Phones: one row per section, as in the mobile app. */}
      <Stack gap="sm" hiddenFrom="sm">
        {sections.map((section) => (
          <Card
            key={section.path}
            withBorder
            shadow="sm"
            padding="md"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(section.path)}
          >
            <Group gap="md" wrap="nowrap">
              <IconTile icon={section.icon} tone={section.tone} />
              <Stack gap={2} flex={1} miw={0}>
                <Text fw={700}>{section.title}</Text>
                <Text size="sm" c="dimmed">
                  {section.description}
                </Text>
              </Stack>
              <ChevronRight size={20} color="var(--mantine-color-dimmed)" />
            </Group>
          </Card>
        ))}
      </Stack>

      <SimpleGrid cols={2} spacing="md" visibleFrom="sm">
        {sections.map((section) => (
          <Card
            key={section.path}
            withBorder
            shadow="sm"
            padding="lg"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(section.path)}
          >
            <Stack align="center" gap="md">
              <Image
                src={Sales}
                alt={`${section.title} icon`}
                w={64}
                h={64}
                fit="contain"
              />
              <Text fw={600} ta="center">
                {section.title}
              </Text>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  );
};

export default Reports;
