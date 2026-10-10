import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card, Container, Image, SimpleGrid, Stack, Text } from '@mantine/core';
import { EmptyState, PageHeader } from '@/components/app';
import { selectUser } from '@/redux/slices/AuthSlice';
import { reportSectionTiles } from '@/data';
import { Sales } from '@/assets/icons'; // Placeholder: Replace with actual icon component or image

const Reports = () => {
  const { receive_reports_count } = useSelector(selectUser);
  const navigate = useNavigate();

  const data =
    receive_reports_count > 0
      ? [
          ...reportSectionTiles,
          {
            title: 'Manage Expense Reports',
            icon: Sales,
            path: '/manage-expense-reports',
          },
        ]
      : reportSectionTiles;

  return (
    <Container size="md" px={0}>
      <PageHeader title="Reports" />
      {data.length === 0 ? (
        <EmptyState title="No modules found!" />
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          {data.map((item, index) => (
            <Card
              key={index}
              withBorder
              shadow="sm"
              padding="lg"
              style={{ cursor: item.path ? 'pointer' : 'not-allowed' }}
              onClick={() => item.path && navigate(item.path)}
            >
              <Stack align="center" gap="md">
                <Image
                  src={item.icon}
                  alt={`${item.title} icon`}
                  w={64}
                  h={64}
                  fit="contain"
                />
                <Text fw={600} ta="center">
                  {item.title}
                </Text>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Container>
  );
};

export default Reports;
