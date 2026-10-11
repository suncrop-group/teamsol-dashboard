import { useEffect, type ReactNode } from 'react';
import { ActionIcon, Group, Stack, Text, Title } from '@mantine/core';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { setPageTitle } from '@/layouts/pageTitle';

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

  // A screen with a back arrow is a nested one. On a phone the app's top bar
  // carries its arrow and title (see layouts/Sidebar), so they are hidden
  // here below the `sm` width; wider screens show them in the page as before.
  const nested = !!back;
  const plainTitle = typeof title === 'string' ? title : '';
  useEffect(() => {
    if (!nested) return;
    setPageTitle(plainTitle);
    return () => setPageTitle('');
  }, [nested, plainTitle]);

  return (
    <Group justify="space-between" align="center" wrap="wrap" gap="md" mb="lg">
      <Group
        gap="sm"
        wrap="nowrap"
        // Nothing left to show here on a phone when there is no description.
        visibleFrom={nested && plainTitle && !description ? 'sm' : undefined}
      >
        {back && (
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            aria-label="Go back"
            visibleFrom="sm"
            onClick={typeof back === 'function' ? back : () => navigate(-1)}
          >
            <ArrowLeft size={20} />
          </ActionIcon>
        )}
        <Stack gap={2}>
          <Title
            order={2}
            fz={{ base: 'h3', sm: 'h2' }}
            visibleFrom={nested && plainTitle ? 'sm' : undefined}
          >
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
