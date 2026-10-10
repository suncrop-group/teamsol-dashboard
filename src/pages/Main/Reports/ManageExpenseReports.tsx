import { useEffect, useState } from 'react';
import {
  ActionIcon,
  Box,
  Button,
  Card,
  Container,
  Group,
  Loader,
  Modal,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
} from '@mantine/core';
import { callApi } from '@/api';
import { toast } from '@/lib/toast';
import dayjs from 'dayjs';
import { months } from '@/data';
import {
  ConfirmModal,
  EmptyState,
  PageHeader,
  StatusBadge,
} from '@/components/app';
import { Eye, FileText } from 'lucide-react';

const ManageExpenseReportCard = ({ item, onPress }) => {
  return (
    <Card
      withBorder
      shadow="sm"
      padding="md"
      opacity={item.status === 'pending' ? 1 : 0.7}
      style={{ cursor: item.status === 'pending' ? 'pointer' : 'not-allowed' }}
      onClick={() => item.status === 'pending' && onPress(item)}
    >
      <Stack gap="md">
        <Group justify="space-between" align="center" wrap="nowrap">
          <Box>
            <Text size="sm" fw={600}>
              Submitted By: {item?.sender_details.name}
            </Text>
            <Text size="sm">({item?.sender_details.work_email})</Text>
          </Box>
          <Text size="sm" ta="right">
            {item.territory_details.map((t) => t.name).join(', ')}
          </Text>
        </Group>
        <Group justify="space-between" align="center" wrap="nowrap">
          <Stack gap="xs" align="flex-start">
            <Text size="sm">
              #{item?._id} - {dayjs(item?.createdAt).format('DD/MM/YYYY HH:mm')}{' '}
              🕒
            </Text>
            <Text size="sm">
              Report of{' '}
              {months.find((m) => m.value === item?.selectedMonth)?.label}{' '}
              {item?.selectedYear}
            </Text>
            {item?.reportURL && (
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(item.reportURL, '_blank');
                }}
                aria-label="View report"
              >
                <Eye size={20} />
              </ActionIcon>
            )}
          </Stack>
          <StatusBadge status={item?.status} />
        </Group>
      </Stack>
    </Card>
  );
};

const ManageExpenseReports = () => {
  const [loading, setLoading] = useState(true);
  const [fuelData, setFuelData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [note, setNote] = useState('');
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);

  useEffect(() => {
    const fetchFuelData = async () => {
      callApi(
        'GET',
        `/expense/receiver-reports`,
        null,
        (response) => {
          response.data.sort(
            (a, b) =>
              dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
          );
          setFuelData(response.data);
          setLoading(false);
        },
        () => {
          setLoading(false);
          toast.error('Failed to fetch expense reports', {
            description: 'Error',
          });
        }
      );
    };
    fetchFuelData();
  }, []);

  const handleCardPress = (item) => {
    setActiveItem(item);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setActiveItem(null);
    setNote('');
  };

  const handleReject = () => {
    if (!activeItem) return;

    if (!note) {
      toast.error('Please mention the reason for rejection', {
        description: 'Error',
      });
      return;
    }

    setRejectConfirmOpen(true);
  };

  const confirmReject = () => {
    setLoading(true);
    callApi(
      'PATCH',
      `/expense/cancel-or-accept-report`,
      {
        id: activeItem?._id,
        status: 'cancelled',
        remarks: note,
      },
      () => {
        toast.success('Report rejected successfully', {
          description: 'Success',
        });
        handleCloseModal();
        setRejectConfirmOpen(false);
        const fetchFuelData = async () => {
          callApi(
            'GET',
            `/expense/receiver-reports`,
            null,
            (response) => {
              response.data.sort(
                (a, b) =>
                  dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
              );
              setFuelData(response.data);
              setLoading(false);
            },
            () => {
              setLoading(false);
              toast.error('Failed to fetch expense reports', {
                description: 'Error',
              });
            }
          );
        };
        fetchFuelData();
      },
      () => {
        setLoading(false);
        setRejectConfirmOpen(false);
        toast.error('Failed to reject the report', { description: 'Error' });
        handleCloseModal();
      }
    );
  };

  const handleApprove = () => {
    if (!activeItem) return;

    setLoading(true);
    callApi(
      'PATCH',
      `/expense/cancel-or-accept-report`,
      {
        id: activeItem?._id,
        status: 'approved',
        remarks: note,
      },
      () => {
        toast.success('Report approved successfully', {
          description: 'Success',
        });
        handleCloseModal();
        const fetchFuelData = async () => {
          callApi(
            'GET',
            `/expense/receiver-reports`,
            null,
            (response) => {
              response.data.sort(
                (a, b) =>
                  dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
              );
              setFuelData(response.data);
              setLoading(false);
            },
            () => {
              setLoading(false);
              toast.error('Failed to fetch expense reports', {
                description: 'Error',
              });
            }
          );
        };
        fetchFuelData();
      },
      () => {
        setLoading(false);
        toast.error('Failed to approve the report', { description: 'Error' });
        handleCloseModal();
      }
    );
  };

  return (
    <Container size="md" px={0}>
      <PageHeader title="Manage Expense Reports" />
      {loading ? (
        <Group justify="center" h={256}>
          <Loader />
        </Group>
      ) : fuelData.length === 0 ? (
        <EmptyState
          icon={<FileText size={32} />}
          title="No expense reports found."
        />
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          {fuelData.map((item) => (
            <ManageExpenseReportCard
              key={item._id}
              item={item}
              onPress={handleCardPress}
            />
          ))}
        </SimpleGrid>
      )}

      <Modal
        opened={modalVisible}
        onClose={() => setModalVisible(false)}
        title={<Text fw={600}>Expense Report</Text>}
      >
        {activeItem && (
          <Stack gap="sm">
            <Text size="sm">ID: {activeItem._id}</Text>
            <Text size="sm">Name: {activeItem.sender_details.name}</Text>
            <Text size="sm">Email: {activeItem.sender_details.work_email}</Text>
            <Textarea
              placeholder="Add a note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
            <Group justify="flex-end" gap="xs" mt="xs">
              <Button onClick={handleApprove}>Approve</Button>
              <Button color="red" onClick={handleReject}>
                Cancel
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      <ConfirmModal
        opened={rejectConfirmOpen}
        onClose={() => setRejectConfirmOpen(false)}
        onConfirm={() => {
          // The old confirm button closed the dialog as soon as it was pressed.
          setRejectConfirmOpen(false);
          confirmReject();
        }}
        title="Are you sure?"
        confirmLabel="Yes"
        cancelLabel="No"
      >
        Do you want to reject this report?
      </ConfirmModal>
    </Container>
  );
};

export default ManageExpenseReports;
