import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectUser } from '@/redux/slices/AuthSlice';
import { reportSectionTiles } from '@/data';
import { Card, CardContent } from '@/components/ui/card';
import { Sales } from '@/assets/icons'; // Placeholder: Replace with actual icon component or image

const Reports = () => {
  const { receive_reports_count } = useSelector(selectUser);
  const navigate = useNavigate();

  const data =
    receive_reports_count > 0
      ? [
          ...reportSectionTiles,
          {
            title: 'Manage Expense Reports',
            icon: Sales,
            path: '/manage-expense-reports',
          },
        ]
      : reportSectionTiles;

  return (
    <div className="min-h-screen p-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">Reports</h1>
        {data.length === 0 ? (
          <div className="flex justify-center items-center h-[calc(100vh-200px)]">
            <p className="text-xl font-medium text-gray-800 text-center">
              No modules found!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.map((item, index) => (
              <Card
                key={index}
                className={`flex flex-col items-center p-4 bg-white shadow-md hover:shadow-lg transition-shadow ${
                  item.path ? 'cursor-pointer' : 'cursor-not-allowed'
                }`}
                onClick={() => item.path && navigate(item.path)}
              >
                <CardContent className="flex flex-col items-center">
                  <img
                    src={item.icon}
                    alt={`${item.title} icon`}
                    className="w-16 h-16 mb-4"
                  />
                  <h2 className="text-base font-semibold text-gray-800 text-center">
                    {item.title}
                  </h2>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
