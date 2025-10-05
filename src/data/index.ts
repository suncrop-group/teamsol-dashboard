import {
  Sales,
  Expenses,
  Events,
  Fleet,
  Attendance,
  TimeOff,
  Discuss,
  CreditLimit,
  TemoraryCredit,
  CreditLimitExtension,
  Fuel,
  Maintenance,
  PersonalUse,
  Toll,
  Reports,
  TerritoryEvents,
  RegionalEvents,
} from '@/assets/icons';

export const homeTiles: HomeTiles = [
  { title: 'Sales', icon: Sales, path: '/sales', code: 'sales' },
  { title: 'Expenses', icon: Expenses, path: '/expenses', code: 'expenses' },
  { title: 'Events', icon: Events, code: 'events', path: '/events' },
  { title: 'Fleet', icon: Fleet, path: '/fleet', code: 'fleet' },
  {
    title: 'Daily Activity',
    icon: Attendance,
    path: '/daily-activities',
    code: 'daily_activity',
  },
  { title: 'Attendance', icon: Attendance },
  { title: 'Time Off', icon: TimeOff },
  { title: 'Discuss', icon: Discuss },
  {
    title: 'Credit Limit - Apply',
    icon: CreditLimit,
    path: '/credit-limit-apply',
    code: 'credit_limit_apply',
  },
  {
    title: 'Temporary Credit',
    icon: TemoraryCredit,
    path: '/temporary-credit',
    code: 'temporary_credit',
  },
  {
    title: 'Credit Limit- Extension',
    icon: CreditLimitExtension,
    path: '/credit-limit-extension',
    code: 'credit_limit_extension',
  },
  { title: 'Reports', icon: Reports, path: '/reports', code: 'reports' },
];

export const reportTiles: HomeTiles = [
  { title: 'Team', code: 'team_reports', path: 'team_reports', icon: Reports },
  {
    title: 'Division Collection Summary',
    code: 'division_collection_summary_report',
    path: 'DivisionCollectionSummaryReport',
    icon: Reports,
  },
  {
    title: 'Region Collection Summary',
    code: 'region_collection_summary_report',
    path: 'RegionCollectionSummaryReport',
    icon: Reports,
  },
  {
    title: 'Division Collection Detail',
    code: 'division_collection_detail_report',
    path: 'DivisionCollectionDetailReport',
    icon: Reports,
  },
  {
    title: 'Region Collection Detail',
    code: 'region_collection_detail_report',
    path: 'RegionCollectionDetailReport',
    icon: Reports,
  },
  {
    title: 'Division Product Sale',
    code: 'division_product_sale_report',
    path: 'DivisionProductSaleReport',
    icon: Reports,
  },
  {
    title: 'Region Product Sale',
    code: 'region_product_sale_report',
    path: 'RegionProductSaleReport',
    icon: Reports,
  },
  {
    title: 'Division Policy Wise Product Sale',
    code: 'division_policy_wise_product_sale_report',
    path: 'DivisionPolicyWiseProductSaleReport',
    icon: Reports,
  },
  {
    title: 'Region Policy Wise Product Sale',
    code: 'region_policy_wise_product_sale_report',
    path: 'RegionPolicyWiseProductSaleReport',
    icon: Reports,
  },
  {
    title: 'Division Product Ledger',
    code: 'division_product_ledger_report',
    path: 'DivisionProductLedgerReport',
    icon: Reports,
  },
  {
    title: 'Region Product Ledger',
    code: 'region_product_ledger_report',
    path: 'RegionProductLedgerReport',
    icon: Reports,
  },
  {
    title: 'Territory Policy Ledger',
    code: 'territory_policy_ledger_report',
    path: 'TerritoryPolicyLedgerReport',
    icon: Reports,
  },
  {
    title: 'Territory Policy Status',
    code: 'territory_policy_status_report',
    path: 'TerritoryPolicyStatusReport',
    icon: Reports,
  },
  {
    title: 'Territory Policy Status',
    code: 'territory_policy_status_report',
    path: 'TerritoryPolicyStatusReport',
    icon: Reports,
  },
  {
    title: 'Territory Policy Status',
    code: 'territory_policy_status_report',
    path: 'TerritoryPolicyStatusReport',
    icon: Reports,
  },
];

export const accountTiles: AccountTiles = [
  {
    title: 'Partner Ledger',
    icon: Reports,
    path: 'GenerateReport',
    fields: ['date_to', 'date_from', 'territory_id', 'partner_id'],
    code: 'partner_ledger',
    api_url: 'partner/ledger/report/api',
  },
  {
    title: 'Account Status Region Report',
    icon: Reports,
    path: 'GenerateReport',
    fields: ['date_to', 'date_from', 'region_id'],
    api_url: '/account/status/region/report',
    code: 'account_status_region_report',
    optionalFields: ['region_id'],
  },
  {
    title: 'Account Status Report Territory',
    icon: Reports,
    api_url: '/account/status/territory/report',
    fields: ['date_to', 'date_from', 'territory_id'],
    path: 'GenerateReport',
    code: 'account_status_territory_report',
  },
  {
    title: 'Account Status Area Report',
    icon: Reports,
    api_url: '/accountstatus/areawise/report',
    fields: ['date_to', 'date_from', 'region_id', 'sort_column'],
    optionalFields: ['region_id'],
    path: 'GenerateReport',
    code: 'account_status_area_report',
  },
  {
    title: 'Account Status Policy Report',
    icon: Reports,
    api_url: '/accountstatus/policywise/report',
    fields: ['date_to', 'date_from', 'region_id', 'sort_column', 'policy_id'],
    optionalFields: ['region_id'],
    path: 'GenerateReport',
    code: 'account_status_policy_report',
  },
];

export const collectionTiles: AccountTiles = [
  {
    title: 'Collection Region Report',
    icon: Reports,
    path: 'GenerateReport',
    fields: ['date_to', 'date_from', 'policy_id'],
    optionalFields: ['policy_id'],
    code: 'collection_region_report',
    api_url: 'cl/region/report',
  },
  {
    title: 'Collection Territory Report',
    icon: Reports,
    path: 'GenerateReport',
    fields: ['date_to', 'date_from', 'policy_id', 'territory_id'],
    optionalFields: ['policy_id'],
    code: 'collection_territory_report',
    api_url: 'cl/territory/report',
  },
  {
    title: 'Collection Detail Region Report',
    icon: Reports,
    path: 'GenerateReport',
    fields: ['date_to', 'date_from', 'policy_id', 'region_id'],
    optionalFields: ['policy_id', 'region_id'],
    code: 'collection_detail_region_report',
    api_url: 'cl/detail/region/report',
  },
  {
    title: 'Collection Detail Territory Report',
    icon: Reports,
    path: 'GenerateReport',
    fields: ['date_to', 'date_from', 'policy_id', 'region_id', 'territory_id'],
    optionalFields: ['policy_id', 'region_id'],
    code: 'collection_detail_territory_report',
    api_url: 'cl/detail/territory/report',
  },
];

export const saleReports: AccountTiles = [
  {
    title: 'Product Sale Summary Report',
    icon: Reports,
    path: 'GenerateReport',
    fields: ['date_to', 'date_from', 'width_category', 'top_bottom'],
    optionalFields: ['policy_id'],
    code: 'product_sale_summary_report',
    api_url: 'product/sale/summary',
  },
  {
    title: 'Product Ledger Report',
    icon: Reports,
    path: 'GenerateReport',
    fields: ['date_to', 'date_from', 'policy_id', 'product_id'],
    code: 'product_ledger_report',
    api_url: 'product/ledger/report',
  },
  {
    title: 'FPL Sale Report',
    icon: Reports,
    path: 'GenerateReport',
    fields: ['date_to', 'date_from'],
    code: 'fpl_sale_report',
    api_url: 'fpl/sales/report',
  },
  {
    title: 'Category Wise Sale Analysis Report',
    icon: Reports,
    path: 'GenerateReport',
    fields: ['date_to', 'date_from', 'policy_id', 'region_id'],
    code: 'category_wise_sale_analysis_report',
    api_url: 'category/sale/analysis',
  },
];

export const reportSectionTiles = [
  { title: 'Accounting Reports', icon: Sales, path: '/accounting-reports' },
  { title: 'Collection Reports', icon: Sales, path: '/collection-reports' },
  { title: 'Expense Reports', icon: Sales, path: '/expense-reports' },
  { title: 'Sale Reports', icon: Sales, path: '/sale-reports' },
];

export const fleetTiles: FleetTiles = [
  { title: 'Fuel', icon: Fuel, path: 'fuel' },
  { title: 'Maintenance', icon: Maintenance, path: 'maintenance' },
  { title: 'Personal Use', icon: PersonalUse, path: 'personal-use' },
  { title: 'Toll', icon: Toll, path: 'toll' },

  // {title: 'Report', icon: Reports, path: 'Report'},
];

export const EventRMTiles: FleetTiles = [
  { title: 'Territory Events', icon: TerritoryEvents, path: '/area-events' },
  { title: 'Regional Events', icon: RegionalEvents, path: '/regional-events' },
];

export const months = [
  { label: 'January', value: '01' },
  { label: 'February', value: '02' },
  { label: 'March', value: '03' },
  { label: 'April', value: '04' },
  { label: 'May', value: '05' },
  { label: 'June', value: '06' },
  { label: 'July', value: '07' },
  { label: 'August', value: '08' },
  { label: 'September', value: '09' },
  { label: 'October', value: '10' },
  { label: 'November', value: '11' },
  { label: 'December', value: '12' },
];
