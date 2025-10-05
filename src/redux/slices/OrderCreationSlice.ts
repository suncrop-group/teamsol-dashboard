import { createSlice } from '@reduxjs/toolkit';
import type { RootState } from '../store';

export interface OrderCreationProps {
  territories: any;
  customer: any;
  deliveryAddress: any;
  policyType: any;
  policies: any;
  referencePolicies?: any;
  warehouse?: any;
}

const orderCreation = createSlice({
  name: 'orderCreation',
  initialState: {
    orderInitalDetails: {
      territories: null,
      customer: null,
      deliveryAddress: [],
      policyType: null,
      policies: [],
      referencePolicies: [],
      warehouse: null,
    } as OrderCreationProps,

    newProducts: [] as OrderType[],
  },
  reducers: {
    setOrderInitialDetails: (state, action) => {
      state.orderInitalDetails = action.payload;
    },

    setNewProducts: (state, action) => {
      state.newProducts = [...state.newProducts, action.payload];
    },

    removeProduct: (state, action) => {
      const { id } = action.payload;
      state.newProducts = state.newProducts.filter((i) => i.id !== id);
    },

    resetProducts: (state) => {
      state.newProducts = [];
    },
  },
});

export const {
  setOrderInitialDetails,
  setNewProducts,
  removeProduct,
  resetProducts,
} = orderCreation.actions;

export const selectOrderInitialDetails = (state: RootState) =>
  state.orderCreation.orderInitalDetails;
export const getAddedProducts = (state: RootState) =>
  state.orderCreation.newProducts;
export default orderCreation.reducer;
