import { useNavigate } from 'react-router-dom';
import { Button, Center, Paper, Stack, Text, Title } from '@mantine/core';
import { selectIsAuthenticated } from '@/redux/slices/AuthSlice';
import { useSelector } from 'react-redux';

const NotFound = () => {
  const navigate = useNavigate();
  const isAuth = useSelector(selectIsAuthenticated);

  return (
    <Center mih="100vh" p="md">
      <Paper withBorder shadow="sm" p="xl" w="100%" maw={440}>
        <Stack align="center" gap="sm">
          <Title order={1} fz={40}>
            404
          </Title>
          <Title order={3}>Page Not Found</Title>
          <Text c="dimmed" ta="center">
            Sorry, the page you're looking for doesn't exist or has been moved.
          </Text>
          <Button
            mt="sm"
            onClick={() => navigate(`${isAuth ? '/' : '/auth'}`)}
          >
            {isAuth ? 'Go to Dashboard' : 'Sign In'}
          </Button>
        </Stack>
      </Paper>
    </Center>
  );
};

export default NotFound;
