// The Reports screens as the mobile app shows them, used below the `sm`
// width: coloured icon tiles, the section rows and the two-column report
// grid. Wider screens keep the dashboard's own cards.
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Container,
  Image,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import {
  BookOpen,
  ChartColumn,
  ChartPie,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  FileText,
  HandCoins,
  Landmark,
  MapPin,
  Package,
  Percent,
  Receipt,
  Target,
  type LucideIcon,
} from 'lucide-react';
import { EmptyState, PageHeader } from '@/components/app';
import { selectUser } from '@/redux/slices/AuthSlice';

export type Tone = 'blue' | 'green' | 'yellow' | 'red' | 'gray';

// The app's tile colours: [light, dark] for the icon and for its tile.
const TONES: Record<Tone, { fg: string; bg: string }> = {
  green: { fg: 'light-dark(#15803d, #4ade80)', bg: 'light-dark(#dcfce7, #14532d)' },
  yellow: { fg: 'light-dark(#a16207, #facc15)', bg: 'light-dark(#fef9c3, #713f12)' },
  red: { fg: 'light-dark(#b91c1c, #f87171)', bg: 'light-dark(#fee2e2, #7f1d1d)' },
  blue: { fg: 'light-dark(#1d4ed8, #60a5fa)', bg: 'light-dark(#dbeafe, #1e3a8a)' },
  gray: { fg: 'light-dark(#4b5563, #9ca3af)', bg: 'light-dark(#f3f4f6, #374151)' },
};

/** The reports tab's sections: where each goes, its icon and its colour. */
export const REPORT_SECTIONS: {
  title: string;
  description: string;
  path: string;
  icon: LucideIcon;
  tone: Tone;
}[] = [
  {
    title: 'Accounting Reports',
    description: 'Ledgers, account status and credit limits',
    path: '/accounting-reports',
    icon: Landmark,
    tone: 'blue',
  },
  {
    title: 'Collection Reports',
    description: 'Collections and commission',
    path: '/collection-reports',
    icon: HandCoins,
    tone: 'green',
  },
  {
    title: 'Expense Reports',
    description: 'Create and send your monthly report',
    path: '/expense-reports',
    icon: Receipt,
    tone: 'yellow',
  },
  {
    title: 'Sale Reports',
    description: 'Product sales and analysis',
    path: '/sale-reports',
    icon: ChartColumn,
    tone: 'red',
  },
];

// Only an employee who receives other people's expense reports manages them.
export const MANAGE_SECTION: (typeof REPORT_SECTIONS)[number] = {
  title: 'Manage Expense Reports',
  description: 'Approve or reject reports sent to you',
  path: '/manage-expense-reports',
  icon: ClipboardCheck,
  tone: 'gray',
};

// First match wins, so the more specific words come first.
const BY_WORD: [RegExp, LucideIcon][] = [
  [/target/i, Target],
  [/commission/i, Percent],
  [/collection/i, HandCoins],
  [/credit|tcl/i, CreditCard],
  [/ledger/i, BookOpen],
  [/account status/i, ClipboardList],
  [/analysis|category/i, ChartPie],
  [/territory/i, MapPin],
  [/product/i, Package],
  [/sale/i, ChartColumn],
];

/** An icon that says what a report is about, picked from its title. */
export const reportIcon = (title: string): LucideIcon =>
  BY_WORD.find(([word]) => word.test(title))?.[1] ?? FileText;

/** An icon on a soft tile of its tone's colour; reads in light and dark. */
export const IconTile = ({
  icon: Icon,
  tone,
  size = 52,
}: {
  icon: LucideIcon;
  tone: Tone;
  size?: number;
}) => (
  <Box
    w={size}
    h={size}
    bg={TONES[tone].bg}
    style={{
      borderRadius: 16,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}
  >
    <Icon size={Math.round(size * 0.46)} color={TONES[tone].fg} />
  </Box>
);

interface Tile {
  title: string;
  code?: string;
  path?: string;
  icon?: string;
  fields?: string[];
  api_url?: string;
  optionalFields?: string[];
  regionOrTerritory?: boolean;
}

/** One reports section: the reports in it that the employee may view. */
export const ReportList = ({
  title,
  tiles,
  tone,
}: {
  title: string;
  tiles: Tile[];
  tone: Tone;
}) => {
  const user = useSelector(selectUser);
  const navigate = useNavigate();

  const shown: Tile[] =
    user?.permissions
      ?.filter((item) => item.permissions.includes('view'))
      ?.map((item) =>
        tiles.find(
          (tile) =>
            tile?.code?.toLowerCase() === item?.module?.code.toLowerCase(),
        ),
      )
      .filter(Boolean) || [];

  const open = (item: Tile) => {
    if (!item.path) return;
    navigate('/generate-report', {
      state: {
        title: item.title,
        code: item.code,
        fields: item.fields,
        api_url: item.api_url,
        optionalFields: item.optionalFields,
        regionOrTerritory: item.regionOrTerritory,
      },
    });
  };

  return (
    <Container size="md" px={0}>
      <PageHeader title={title} back />
      {shown.length === 0 ? (
        <Card withBorder shadow="sm">
          <EmptyState
            title="No modules found!"
            description="You do not have permission to view any report in this section."
          />
        </Card>
      ) : (
        <>
          {/* Phones: the app's two-column grid of icon tiles. */}
          <SimpleGrid cols={2} spacing="sm" hiddenFrom="sm">
            {shown.map((item) => (
              <Card
                key={item.code}
                withBorder
                shadow="sm"
                padding="md"
                py="lg"
                style={{ cursor: 'pointer' }}
                onClick={() => open(item)}
              >
                <Stack align="center" gap="sm">
                  <IconTile icon={reportIcon(item.title)} tone={tone} size={60} />
                  <Text size="xs" fw={700} ta="center" tt="uppercase" lts={1}>
                    {item.title}
                  </Text>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>

          <SimpleGrid cols={2} spacing="md" visibleFrom="sm">
            {shown.map((item) => (
              <Card
                key={item.code}
                withBorder
                shadow="sm"
                padding="lg"
                style={{ cursor: item.path ? 'pointer' : 'not-allowed' }}
                onClick={() => open(item)}
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
        </>
      )}
    </Container>
  );
};
