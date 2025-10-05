import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { selectIsAuthenticated } from '@/redux/slices/AuthSlice';
import { useSelector } from 'react-redux';

const NotFound = () => {
  const navigate = useNavigate();
  const isAuth = useSelector(selectIsAuthenticated);

  return (
    <div className="min-h-screen flex items-center justify-centerbg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-4xl font-bold text-center text-gray-800">
            404
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">
            Page Not Found
          </h2>
          <p className="text-gray-500">
            Sorry, the page you're looking for doesn't exist or has been moved.
          </p>
          <Button
            onClick={() => navigate(`${isAuth ? '/' : '/auth'}`)}
            className="mt-4"
          >
            {isAuth ? 'Go to Dashboard' : 'Sign In'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
