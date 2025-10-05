import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EventRMTiles } from '@/data';
import { useSelector } from 'react-redux';
import { selectUser } from '@/redux/slices/AuthSlice';
import { Attendance } from '@/assets/icons';

const RMEvents = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  const hasDailyActivityModule =
    user?.daily_activities_count > 0
      ? [
          ...EventRMTiles,

          {
            title: 'Area Activities',
            icon: Attendance,
            path: '/rm-area-activities',
            code: 'area_activities',
          },
        ]
      : EventRMTiles;

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <h1 className="text-2xl font-bold mb-4 col-span-full">
          Regional Manager Events
        </h1>
        {hasDailyActivityModule?.map((item, index) => (
          <Card
            key={index}
            className={`w-full ${
              item.path ? 'cursor-pointer hover:shadow-md' : 'opacity-50'
            }`}
            onClick={item.path ? () => navigate(item.path) : null}
          >
            <CardHeader className="flex flex-col items-center">
              <img
                src={item.icon}
                alt={item.title}
                className="h-24 w-24 mb-2"
              />
              <CardTitle className="text-lg text-center">
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent />
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RMEvents;
