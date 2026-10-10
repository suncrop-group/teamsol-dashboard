import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card, Container, Image, SimpleGrid, Stack, Text } from '@mantine/core';
import { EmptyState, PageHeader } from '@/components/app';
import { selectUser } from '@/redux/slices/AuthSlice';
import { collectionTiles } from '@/data';

const CollectionReports = () => {
  const user = useSelector(selectUser);
  const navigate = useNavigate();

  const filteredData =
    user?.permissions
      ?.filter((item) => item.permissions.includes('view'))
      ?.map((item) =>
        collectionTiles.find(
          (tile) =>
            tile?.code?.toLowerCase() === item?.module?.code.toLowerCase(),
        ),
      )
      .filter(Boolean) || [];

  return (
    <Container size="md" px={0}>
      <PageHeader title="Collection Reports" />
      {filteredData.length === 0 ? (
        <EmptyState title="No modules found!" />
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          {filteredData.map((item, index) => (
            <Card
              key={index}
              withBorder
              shadow="sm"
              padding="lg"
              style={{ cursor: item.path ? 'pointer' : 'not-allowed' }}
              onClick={() => {
                if (item.path) {
                  navigate('/generate-report', {
                    state: {
                      title: item.title,
                      code: item.code,
                      fields: item.fields,
                      api_url: item.api_url,
                      optionalFields: item.optionalFields,
                    },
                  });
                }
              }}
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

export default CollectionReports;
