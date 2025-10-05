import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectNotifications,
  setNotifications,
} from '@/redux/slices/NotificationsSlice';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { callApi } from '@/api';

const Notifications = () => {
  const notifications = useSelector(selectNotifications);
  const dispatch = useDispatch();

  useEffect(() => {
    const onSuccess = (response) => {
      const sortedData = response.data.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      dispatch(setNotifications(sortedData));
    };

    const onError = () => {
      toast.error('An error occurred while fetching notifications', {
        description: 'Error',
      });
    };

    callApi('GET', '/notifications', null, onSuccess, onError);
  }, [dispatch]);

  const handleReadNotification = (id) => {
    const ifAlreadyRead = notifications?.find(
      (notification) => notification.id === id
    )?.read;
    if (ifAlreadyRead) return;

    const updatedNotifications = notifications.map((notification) =>
      notification.id === id ? { ...notification, read: true } : notification
    );
    dispatch(setNotifications(updatedNotifications));

    const onSuccess = () => {
      dispatch(setNotifications(updatedNotifications));
    };

    const onError = () => {
      dispatch(
        setNotifications(
          notifications.map((notification) =>
            notification.id === id
              ? { ...notification, read: false }
              : notification
          )
        )
      );
      toast.error('An error occurred while marking the notification as read', {
        description: 'Error',
      });
    };

    callApi(
      'PATCH',
      `/notifications/${id}/mark-as-read`,
      null,
      onSuccess,
      onError
    );
  };

  const handleRedirect = (url) => {
    if (url.includes('http')) {
      window.open(url, '_blank');
    } else {
      toast.error('Invalid URL', { description: 'Error' });
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">
          Notifications
        </h1>
        {notifications.length === 0 ? (
          <p className="text-center text-gray-500">No notifications found</p>
        ) : (
          <div className="space-y-4">
            {notifications.map((item) => (
              <Card
                key={item.id}
                className="w-full cursor-pointer"
                onClick={() => handleReadNotification(item.id)}
              >
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="flex-1">
                    <h2 className="text-base font-semibold text-gray-800 mb-1">
                      {item.title}
                    </h2>
                    <p className="text-sm text-gray-600">{item.body}</p>
                    {item?.url && (
                      <Button
                        variant="link"
                        className="p-0 h-auto text-sm text-blue-600 underline mt-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRedirect(item.url);
                        }}
                      >
                        {item.url.length > 30
                          ? item.url.substring(0, 30) + '...'
                          : item.url}
                      </Button>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {dayjs(item.createdAt).format('DD-MM-YYYY hh:mm A')}
                    </p>
                  </div>
                  {!item.read && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
