import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Car } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fleetTiles } from '@/data';
import { selectUser } from '@/redux/slices/AuthSlice';
import { cn } from '@/lib/utils';

const Fleet = () => {
  const navigate = useNavigate();
  const { vehicle } = useSelector(selectUser);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-center gap-2">
            <Car className="h-8 w-8 text-gray-900" />
            <h1 className="text-2xl font-semibold text-gray-900">
              {vehicle?.model?.name || 'No Vehicle'}
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            {vehicle?.license_plate || 'N/A'}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {fleetTiles.map((item, index) => (
            <Card
              key={index}
              className={cn(
                'cursor-pointer transition-shadow hover:shadow-md',
                !item.path && 'cursor-not-allowed opacity-50'
              )}
              onClick={() => item.path && navigate(`/${item.path}`)}
            >
              <CardHeader className="flex items-center justify-center p-4">
                <img
                  src={item.icon}
                  alt={item.title}
                  className="h-12 w-12 object-contain"
                />
              </CardHeader>
              <CardContent className="text-center">
                <CardTitle className="text-lg font-medium text-gray-900">
                  {item.title}
                </CardTitle>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Fleet;
