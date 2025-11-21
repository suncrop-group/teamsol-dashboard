import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  logout,
  setAuthenticated,
  setOdooAdmin,
  updateUserData,
} from '@/redux/slices/AuthSlice';
import {
  setColorScheme,
  setLogo,
  setOdooCred,
  setProjectDetails,
} from '@/redux/slices/ProjectSlice';
import {
  setAppState,
  setNotificationCount,
  setModules,
} from '@/redux/slices/AppStateSlice';
import { selectUser } from '@/redux/slices/AuthSlice';
import { useNavigate } from 'react-router-dom';
import { callApi } from '@/api';
import { toast } from 'sonner';
import { homeTiles } from '@/data';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ArrowRight, Grid3x3 } from 'lucide-react';

const Home = () => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [filteredModules, setFilteredModules] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const onSuccess = (response) => {
        setLoading(false);
        dispatch(updateUserData(response.data));
        dispatch(setColorScheme(response.data.project.color_scheme));
        dispatch(
          setProjectDetails({
            title: response.data.project.heading,
            description: response.data.project.sub_heading,
          })
        );
        dispatch(setOdooCred(response.data.project.odoo_configuration));
        dispatch(setOdooAdmin(response.data.odooAdmin));
        dispatch(setLogo(response.data.project.logo));
        dispatch(setAuthenticated(true));
      };
      const onError = () => {
        setLoading(false);
        toast.error('Failed to fetch user data.');
        dispatch(logout());
      };
      setLoading(true);
      callApi('GET', '/employee/' + user.id, null, onSuccess, onError);
      callApi(
        'GET',
        '/notifications/unread-count',
        null,
        (response) => {
          dispatch(setNotificationCount(response.data));
        },
        () => toast.error('Failed to fetch notification count.')
      );
    };
    fetchUser();
    dispatch(setAppState(true));
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const filterModules = () => {
      // Filtered home tiles based on permissions
      const filteredData =
        user?.permissions
          ?.filter((item) => item.permissions.includes('view'))
          ?.map((item) =>
            homeTiles.find(
              (tile) =>
                tile?.code?.toLowerCase() === item?.module?.code?.toLowerCase()
            )
          )
          .filter(Boolean) || [];

      setFilteredModules(filteredData);
      dispatch(setModules(filteredData));
    };
    filterModules();
    // eslint-disable-next-line
  }, [user?.permissions]);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-7xl">
        {/* Welcome Header */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-black mb-3 tracking-tight">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-gray-500 text-lg font-light">
            Welcome back to your dashboard
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-black mx-auto mb-4" />
              <p className="text-gray-500 font-light">Loading modules...</p>
            </div>
          </div>
        ) : filteredModules.length === 0 ? (
          /* Empty State */
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Grid3x3 className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-black mb-2">
                No Modules Available
              </h3>
              <p className="text-gray-500 text-center max-w-md font-light">
                You don't have access to any modules yet. Contact your
                administrator to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          /* Modules Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredModules.map((item, idx) => (
              <Card
                key={idx}
                className="group relative overflow-hidden bg-white border-0 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                onClick={() => item.path && navigate(item.path)}
              >
                <CardContent className="relative p-8 flex flex-col items-center text-center min-h-[180px] justify-center">
                  {/* Icon Container */}
                  <div className="w-16 h-16 mb-5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <img
                      src={item.icon}
                      alt={item.title}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-medium text-black">
                    {item.title}
                  </h3>

                  {/* Arrow Icon */}
                  <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                    <ArrowRight className="h-5 w-5 text-black" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stats Footer */}
        {!loading && filteredModules.length > 0 && (
          <div className="mt-12 pt-8">
            <p className="text-sm text-gray-400 font-light text-center">
              {filteredModules.length}{' '}
              {filteredModules.length === 1 ? 'module' : 'modules'} available
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
