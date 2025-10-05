import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectUser } from '@/redux/slices/AuthSlice';
import { accountTiles } from '@/data';
import { Card, CardContent } from '@/components/ui/card';

const AccountingReports = () => {
  const user = useSelector(selectUser);
  const navigate = useNavigate();

  const filteredData =
    user?.permissions
      ?.filter((item) => item.permissions.includes('view'))
      ?.map((item) =>
        accountTiles.find(
          (tile) =>
            tile?.code?.toLowerCase() === item?.module?.code.toLowerCase()
        )
      )
      .filter(Boolean) || [];

  return (
    <div className="min-h-screen p-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">
          Accounting Reports
        </h1>
        {filteredData.length === 0 ? (
          <div className="flex justify-center items-center h-[calc(100vh-200px)]">
            <p className="text-xl font-medium text-gray-800 text-center">
              No modules found!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredData.map((item, index) => (
              <Card
                key={index}
                className={`flex flex-col items-center p-4 bg-white shadow-sm hover:shadow-md transition-shadow ${
                  item.path ? 'cursor-pointer' : 'cursor-not-allowed'
                }`}
                onClick={() => {
                  if (item.path) {
                    navigate('/generate-report', {
                      state: {
                        title: item.title,
                        code: item.code,
                        fields: item.fields,
                        api_url: item.api_url,
                        optionalFields: item.optionalFields,
                      },
                    });
                  }
                }}
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

export default AccountingReports;
