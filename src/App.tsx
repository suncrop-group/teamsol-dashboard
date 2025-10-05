import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectUser } from './redux/slices/AuthSlice';
import SignIn from './pages/SignIn';
import Home from './pages/Main/Home';
import Layout from './layouts/Sidebar';
import ProfileSettings from './pages/Main/Profile';
import Sales from './pages/Main/Sales';
import AddSaleOrder from './pages/Main/Sales/AddSaleOrder';
import SalesDetails from './pages/Main/Sales/SalesDetails';
import Expenses from './pages/Main/Expense';
import AddExpenseReporting from './pages/Main/Expense/AddExpense';
import Fleet from './pages/Main/Fleet';
import Fuel from './pages/Main/Fleet/Fuel';
import AddFuel from './pages/Main/Fleet/Fuel/AddFuel';
import Maintenance from './pages/Main/Fleet/Maintenance';
import AddMaintenance from './pages/Main/Fleet/Maintenance/AddMaintenance';
import PersonalUse from './pages/Main/Fleet/PersonalUse';
import AddPersonalUse from './pages/Main/Fleet/PersonalUse/AddPersonalUser';
import Toll from './pages/Main/Fleet/Toll';
import AddToll from './pages/Main/Fleet/Toll/AddToll';
import CreditLimitApply from './pages/Main/CreditLimitApply';
import AddCreditLimitApply from './pages/Main/CreditLimitApply/AddCreditLimitApply';
import TemporaryCredit from './pages/Main/TemporaryCredit';
import AddTemporaryCredit from './pages/Main/TemporaryCredit/AddTemporaryCredit';
import CreditLimitExtention from './pages/Main/CreditLimitExtension';
import AddCreditLimitExtention from './pages/Main/CreditLimitExtension/AddCreditLimitExtention';
import TerritoryManagerEvents from './pages/Main/Events/TerritoryManagerEvents';
import AddEvent from './pages/Main/Events/TerritoryManagerEvents/AddEvent';
import TMCreatedEventDetails from './pages/Main/Events/TerritoryManagerEvents/EventDetails';
import RMEvents from './pages/Main/Events/RegionalManagerEvents';
import AreaEvents from './pages/Main/Events/RegionalManagerEvents/AreaEvents';
import EventDetailsArea from './pages/Main/Events/RegionalManagerEvents/AreaEvents/EventDetailsArea';
import EventsForRM from './pages/Main/Events/RegionalManagerEvents/EventsForRM';
import AddRMEvent from './pages/Main/Events/RegionalManagerEvents/EventsForRM/AddRMEvent';
import EventDetailsOfRegionalManagerEvent from './pages/Main/Events/RegionalManagerEvents/EventsForRM/EventDetailsOfRegionalManagerEvent';
import NotFound from './pages/NotFound';
import Notifications from './pages/Main/Notifications';
import Reports from './pages/Main/Reports';
import AccountingReports from './pages/Main/Reports/AccountReports';
import GenerateReport from './pages/Main/Reports/GenerateReport';
import CollectionReports from './pages/Main/Reports/CollectionReports';
import ExpenseReports from './pages/Main/Reports/ExpenseReports';
import ManageExpenseReports from './pages/Main/Reports/ManageExpenseReports';
import SalesReports from './pages/Main/Reports/SalesReports';
import DailyActivity from './pages/Main/DailyActivity';
import AddDailyActivity from './pages/Main/DailyActivity/AddDailyActivity';
import RMAreaActivities from './pages/Main/DailyActivity/RMAreaActivities';

const ProtectedRoute = ({ children }) => {
  const isAuth = useSelector(selectIsAuthenticated);
  return isAuth ? <Layout>{children}</Layout> : <Navigate to="/auth" replace />;
};

const RenderEvents = () => {
  const user = useSelector(selectUser);
  if (!user?.is_region_manager) {
    return (
      <>
        <Route
          path="/events"
          element={
            <ProtectedRoute>
              <TerritoryManagerEvents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-event"
          element={
            <ProtectedRoute>
              <AddEvent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/event-details/:eventId"
          element={
            <ProtectedRoute>
              <TMCreatedEventDetails />
            </ProtectedRoute>
          }
        />
      </>
    );
  } else {
    return (
      <>
        <Route
          path="/events"
          element={
            <ProtectedRoute>
              <RMEvents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/area-events"
          element={
            <ProtectedRoute>
              <AreaEvents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/event-details-area/:eventId"
          element={
            <ProtectedRoute>
              <EventDetailsArea />
            </ProtectedRoute>
          }
        />
        <Route
          path="/regional-events"
          element={
            <ProtectedRoute>
              <EventsForRM />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-rm-event"
          element={
            <ProtectedRoute>
              <AddRMEvent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/event-details-rm/:eventId"
          element={
            <ProtectedRoute>
              <EventDetailsOfRegionalManagerEvent />
            </ProtectedRoute>
          }
        />
      </>
    );
  }
};

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfileSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales"
        element={
          <ProtectedRoute>
            <Sales />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales/add"
        element={
          <ProtectedRoute>
            <AddSaleOrder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sale/:order"
        element={
          <ProtectedRoute>
            <SalesDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/expenses"
        element={
          <ProtectedRoute>
            <Expenses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/expenses/add"
        element={
          <ProtectedRoute>
            <AddExpenseReporting />
          </ProtectedRoute>
        }
      />
      <Route
        path="/expenses/:event_id/:event_title/:event_description"
        element={
          <ProtectedRoute>
            <AddExpenseReporting />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fleet"
        element={
          <ProtectedRoute>
            <Fleet />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fuel"
        element={
          <ProtectedRoute>
            <Fuel />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-fuel"
        element={
          <ProtectedRoute>
            <AddFuel />
          </ProtectedRoute>
        }
      />
      <Route
        path="/maintenance"
        element={
          <ProtectedRoute>
            <Maintenance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-maintenance"
        element={
          <ProtectedRoute>
            <AddMaintenance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/personal-use"
        element={
          <ProtectedRoute>
            <PersonalUse />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-personal-use"
        element={
          <ProtectedRoute>
            <AddPersonalUse />
          </ProtectedRoute>
        }
      />
      <Route
        path="/toll"
        element={
          <ProtectedRoute>
            <Toll />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-toll"
        element={
          <ProtectedRoute>
            <AddToll />
          </ProtectedRoute>
        }
      />
      <Route
        path="/credit-limit-apply"
        element={
          <ProtectedRoute>
            <CreditLimitApply />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-credit-limit-apply"
        element={
          <ProtectedRoute>
            <AddCreditLimitApply />
          </ProtectedRoute>
        }
      />
      <Route
        path="/temporary-credit"
        element={
          <ProtectedRoute>
            <TemporaryCredit />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-temporary-credit"
        element={
          <ProtectedRoute>
            <AddTemporaryCredit />
          </ProtectedRoute>
        }
      />
      <Route
        path="/credit-limit-extension"
        element={
          <ProtectedRoute>
            <CreditLimitExtention />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-credit-limit-extension"
        element={
          <ProtectedRoute>
            <AddCreditLimitExtention />
          </ProtectedRoute>
        }
      />
      <Route
        path="/daily-activities"
        element={
          <ProtectedRoute>
            <DailyActivity />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-daily-activity"
        element={
          <ProtectedRoute>
            <AddDailyActivity />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rm-area-activities"
        element={
          <ProtectedRoute>
            <RMAreaActivities />
          </ProtectedRoute>
        }
      />
      {RenderEvents()}

      <Route path="/auth" element={<SignIn />} />
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <NotFound />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/accounting-reports"
        element={
          <ProtectedRoute>
            <AccountingReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/generate-report"
        element={
          <ProtectedRoute>
            <GenerateReport />
          </ProtectedRoute>
        }
      />
      <Route
        path="/collection-reports"
        element={
          <ProtectedRoute>
            <CollectionReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/expense-reports"
        element={
          <ProtectedRoute>
            <ExpenseReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sale-reports"
        element={
          <ProtectedRoute>
            <SalesReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manage-expense-reports"
        element={
          <ProtectedRoute>
            <ManageExpenseReports />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
