type InputProps = {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  type?: string;
  keyboardType?: KeyboardTypeOptions;
  placeholder?: string;
  error?: string;
  editable?: boolean;
  multiline?: boolean;
  required?: boolean;
  inputType?: string;
};

type ButtonProps = {
  label: string;
  onPress: () => void;
  onPressIn?: () => void;
  loading?: boolean;
  disabled?: boolean;
  type?: 'primary' | 'danger';
  style?: ViewStyle;
  icon?: ReactNode;
  labelStyle?: TextStyle;
};

type HomeTile = {
  title: string;
  icon: ReactNode;
  path?: string;
  code?: string;
};

type FleetTile = {
  title: string;
  icon: ReactNode;
  path?: string;
};

type HomeTiles = HomeTile[];

type AccountTile = {
  title: string;
  icon: ReactNode;
  path: string;
  code?: string;
  fields?: string[];
  api_url?: string;
  optionalFields?: string[];
};

type AccountTiles = AccountTile[];

type FleetTiles = FleetTile[];

type NavigationProps = {
  setOptions(arg0: { title: string }): unknown;
  navigation: NavigationProps<ParamListBase>;
};

type NavigationTypeHook = NavigationProps<ParamListBase>;

type SelectProps = {
  data: { label: string; value: string | number | boolean | object }[];
  selectedValue: string | string[] | SelectData[];
  onValueChange?: (value: string | string[] | SelectData[]) => void;
  placeholder?: string;
  label: string;
  disabled?: boolean;
  defaultValue?: string;
  order?: boolean;
  required?: boolean;
  isMultiple?: boolean;
};

type SelectData = {
  label: string;
  value: string | number | boolean | object;
};

type OrderType = {
  id?: number;
  policy: number;
  refPolicy?: number;
  product: number;
  packing: number;
  noOfPacks: string;
  unit: string;
  unitPrice: { price_unit: string };
  discount: string;
  productName?: string;
  total: number;
  policyName?: string;
  refPolicyName?: string;
  productName?: string;
};

interface FuelItem {
  remarks?: string;
  selectedMonth?: string;
  selectedYear?: string | number;
  territory_details?: {
    id: string;
    name: string;
  };
  _id?: string;
  receiver_details?: {
    id: string;
    name: string;
  };
  reportURL?: string;
  url: string;
  cost: ReactNode;
  liters: ReactNode;
  createdAt: string | number | Date | Dayjs | null | undefined;
  status: string;
  id: string;
  FuelType: string;
  Quantity: string;
  Amount: string;
  Date: string;
  orderStatus: 'Sent' | 'Pending' | 'Canceled' | 'Quotation' | 'Approved';
  odooStatus: 'Sent' | 'Pending' | 'Canceled' | 'Quotation' | 'Approved';
}

interface CreditLimitApplyItem {
  sequence: string;
  name: ReactNode;
  allowed_limit?: string;
  createdAt: string | number | Date;
  company: {
    id: string;
    name: string;
  };
  amount: ReactNode;
  policy: {
    id: string;
    name: string;
  };
  customer: {
    id: string;
    name: string;
  };
  status: {
    id: string;
    name: string;
  };
  Policy: string;
  CreditAmount: number;
  Territory: string;
  id: string;
  Date: string;
  Customer: string;
  orderStatus:
    | 'Sent'
    | 'Pending'
    | 'Canceled'
    | 'Quotation'
    | 'Approved'
    | 'Draft'
    | 'Confirmed';
  odooStatus:
    | 'Sent'
    | 'Pending'
    | 'Canceled'
    | 'Quotation'
    | 'Approved'
    | 'Draft'
    | 'Confirmed';
}

interface CreditLimitExtentionItem {
  Policy: string;
  CreditAmount: number;
  Territory: string;
  id: string;
  Date: string;
  Customer: string;
  orderStatus:
    | 'Sent'
    | 'Pending'
    | 'Canceled'
    | 'Quotation'
    | 'Approved'
    | 'Draft'
    | 'Confirmed';
  odooStatus:
    | 'Sent'
    | 'Pending'
    | 'Canceled'
    | 'Quotation'
    | 'Approved'
    | 'Draft'
    | 'Confirmed';
}

// types/navigation.ts

type RootStackParamList = {
  // Home
  Home: undefined;

  // Sales
  Sales: undefined;
  SalesFilters: undefined;
  SalesDetails: undefined;
  SearchAcrossSales: undefined;
  AddOrders: undefined;
  OrdersSecond: undefined;

  // Expenses
  Expenses: undefined;
  AddExpenseReporting: {
    event_id?: string;
    event_name?: string;
    event_type?: string;
  };

  // Fleet
  Fleet: undefined;
  Fuel: undefined;
  AddFuel: undefined;
  Maintenance: undefined;
  AddMaintenance: undefined;
  Report: undefined;
  PersonalUse: undefined;
  AddPersonalUse: undefined;
  Toll: undefined;
  AddToll: undefined;

  // Credit Limit
  CreditLimitApply: undefined;
  AddCreditLimitApply: undefined;
  CreditLimitExtention: undefined;
  AddCreditLimitExtention: undefined;

  // Temporary Credit
  TemporaryCredit: undefined;
  AddTemporaryCredit: undefined;
  Notifications: undefined;
  Reports: undefined;
  AccountingReports: undefined;
  CollectionReports: undefined;
  GenerateReport: {
    fields: string[];
    title: string;
    code: string;
  };
  GenerateExpenseReport: undefined;
  ExpenseReports: undefined;
  ManageExpenseReports: undefined;
  Advertisement: undefined;
  Profile: undefined;
  UpdatePassword: undefined;
  Events: undefined;
  AddEvent: undefined;
  EventDetails: undefined;
  EventDetailsRM: undefined;
  AreaEvents: undefined;
  RMEvents: undefined;
  AddRMEvent: undefined;
  EventDetailsOfRegionalManagerEvent: undefined;
};
