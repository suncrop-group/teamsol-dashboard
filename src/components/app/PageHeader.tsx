import type { ReactNode } from 'react';
import { ActionIcon, Group, Stack, Text, Title } from '@mantine/core';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** Buttons shown on the right. */
  actions?: ReactNode;
  /** Show a back arrow; pass a function to override history back. */
  back?: boolean | (() => void);
}

const PageHeader = ({ title, description, actions, back }: PageHeaderProps) => {
  const navigate = useNavigate();

  return (
    <Group justify="space-between" align="center" wrap="wrap" gap="md" mb="lg">
      <Group gap="sm" wrap="nowrap">
        {back && (
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            aria-label="Go back"
            onClick={typeof back === 'function' ? back : () => navigate(-1)}
          >
            <ArrowLeft size={20} />
          </ActionIcon>
        )}
        <Stack gap={2}>
          <Title order={2} fz={{ base: 'h3', sm: 'h2' }}>
            {title}
          </Title>
          {description && (
            <Text c="dimmed" size="sm">
              {description}
            </Text>
          )}
        </Stack>
      </Group>
      {actions && <Group gap="sm">{actions}</Group>}
    </Group>
  );
};

export default PageHeader;
