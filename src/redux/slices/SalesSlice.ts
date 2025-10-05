import { createSlice } from '@reduxjs/toolkit';
import type { RootState } from '../store';

export interface SalesState {
  data: any[];
  searchedData: any[];
  searchByFilter: {
    groupByCustomers: boolean;
    filterForToday: boolean;
    filterByDateRange: {
      startDate: string;
      endDate: string;
    };
  };
}

const salesSlice = createSlice({
  name: 'sales',
  initialState: {
    data: [],
    searchedData: [],
    searchByFilter: {
      groupByCustomers: false,
      filterForToday: false,
      filterByDateRange: {
        startDate: '',
        endDate: '',
      },
    },
  } as SalesState,
  reducers: {
    addSales: (state, action) => {
      state.data = action.payload;
    },
    setSeachedSalesOrders: (state, action) => {
      state.searchedData = action.payload;
    },
    setSearchByFilter: (state, action) => {
      state.searchByFilter = { ...state.searchByFilter, ...action.payload };
    },
  },
});

export const { addSales, setSearchByFilter } = salesSlice.actions;

export const selectSalesOrders = (state: RootState) => state.sales.data;
export const selectSearchedSalesOrders = (state: RootState) =>
  state.sales.searchedData;
export const selectSearchByFilter = (state: RootState) =>
  state.sales.searchByFilter;

export default salesSlice.reducer;
