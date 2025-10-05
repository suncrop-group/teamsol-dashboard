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
  // selectAppState,
  setNotificationCount,
  setModules,
} from '@/redux/slices/AppStateSlice';
import { selectUser } from '@/redux/slices/AuthSlice';
import { useNavigate } from 'react-router-dom';
import { callApi } from '@/api';
// import Loader from "@/components/Loader";
import { toast } from 'sonner';
import { homeTiles } from '@/data';
import Loader from '@/components/Loader';

const Home = () => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  // const appState = useSelector(selectAppState);
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

  return (
    <>
      <Loader loading={loading} />
      {/* Tiles Grid */}
      <div className="flex-1 flex flex-col">
        {filteredModules.length === 0 && !loading ? (
          <div className="flex flex-1 items-center justify-center min-h-[200px]">
            <span className="text-lg text-gray-400">No modules found!</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4 pb-8 w-full">
            {filteredModules.map((item, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-100 rounded-xl shadow-md flex flex-col items-center py-8 px-4 hover:shadow-lg transition cursor-pointer"
                onClick={() => item.path && navigate(item.path)}
                style={{ minHeight: 180 }}
              >
                <img
                  src={item.icon}
                  alt={item.title}
                  className="w-16 h-16 mb-4"
                />
                <h3 className="text-lg font-semibold text-center text-gray-800">
                  {item.title}
                </h3>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Home;
