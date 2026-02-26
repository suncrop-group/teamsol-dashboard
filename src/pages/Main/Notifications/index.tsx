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
import { Bell, ExternalLink, CheckCircle2 } from 'lucide-react';

const Notifications = () => {
  const notifications = useSelector(selectNotifications);
  const dispatch = useDispatch();

  useEffect(() => {
    const onSuccess = (response) => {
      const sortedData = response.data.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
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
      (notification) => notification.id === id,
    )?.read;
    if (ifAlreadyRead) return;

    const updatedNotifications = notifications.map((notification) =>
      notification.id === id ? { ...notification, read: true } : notification,
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
              : notification,
          ),
        ),
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
      onError,
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600 shadow-sm">
            <Bell className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 leading-tight">
            Notifications
          </h1>
        </div>
        {notifications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <Bell className="h-16 w-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">
              No notifications yet
            </p>
            <p className="text-gray-400 text-sm mt-1">
              When you receive notifications, they'll show up here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((item) => (
              <Card
                key={item.id}
                className={`w-full transition-all duration-200 cursor-pointer overflow-hidden border-0 border-l-4 ${
                  item.read
                    ? 'bg-white border-l-gray-300 shadow-sm hover:shadow-md'
                    : 'bg-blue-50/40 border-l-blue-500 shadow-md hover:shadow-lg'
                }`}
                onClick={() => handleReadNotification(item.id)}
              >
                <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row gap-5 items-start">
                  <div className="flex-shrink-0 mt-1">
                    {item.read ? (
                      <div className="bg-gray-100 p-2 rounded-full">
                        <CheckCircle2 className="h-5 w-5 text-gray-400" />
                      </div>
                    ) : (
                      <div className="bg-blue-100 p-2 rounded-full relative">
                        <Bell className="h-5 w-5 text-blue-600" />
                        <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white ring-2 ring-blue-100"></span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4 mb-2">
                      <h2
                        className={`text-base sm:text-lg font-semibold truncate ${item.read ? 'text-gray-600' : 'text-gray-900'}`}
                      >
                        {item.title}
                      </h2>
                      <span className="text-xs text-gray-500 font-medium whitespace-nowrap flex-shrink-0 bg-white/60 px-2 py-1 rounded-md border border-gray-100 shadow-sm">
                        {dayjs(item.createdAt).format('MMM D, YYYY • h:mm A')}
                      </span>
                    </div>

                    <p
                      className={`text-sm leading-relaxed ${item.read ? 'text-gray-500' : 'text-gray-700'}`}
                    >
                      {item.body}
                    </p>

                    {item?.url && (
                      <div className="mt-4 flex">
                        <Button
                          variant={item.read ? 'outline' : 'default'}
                          size="sm"
                          className={
                            item.read
                              ? 'h-8 text-xs font-medium text-gray-600 bg-white hover:bg-gray-50 border-gray-200'
                              : 'h-8 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-sm'
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRedirect(item.url);
                          }}
                        >
                          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                          View Details
                        </Button>
                      </div>
                    )}
                  </div>
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
