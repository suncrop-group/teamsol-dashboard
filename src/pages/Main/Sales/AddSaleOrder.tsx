import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectUser } from '@/redux/slices/AuthSlice';
import {
  getAddedProducts,
  removeProduct,
  resetProducts,
  selectOrderInitialDetails,
  setNewProducts,
  setOrderInitialDetails,
} from '@/redux/slices/OrderCreationSlice';
import { callApi } from '@/api';
import { errorMessage, newRequestId } from '@/api/v2';
import { priceFormatter } from '@/utils';
import Loader from '@/components/Loader';
import {
  ActionIcon,
  Alert,
  Button,
  Card,
  Container,
  Grid,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { toast } from '@/lib/toast';
import { useLocation, useNavigate } from 'react-router-dom';
import SelectBox from '@/components/Select';
import { PageHeader } from '@/components/app';
import { Trash2Icon } from 'lucide-react';

// Mantine selects work with string values, while this form keeps the original
// ids (numbers) in state and compares them strictly, so the original value of
// the chosen option is handed back.
const IdSelect = ({ data, value, onChange, ...props }) => {
  const options: { value: string; label: string }[] = [];
  (data || []).forEach((item) => {
    const optionValue = String(item.value);
    if (!options.some((option) => option.value === optionValue)) {
      options.push({ value: optionValue, label: String(item.label ?? '') });
    }
  });

  return (
    <Select
      data={options}
      value={
        value === undefined || value === null || value === ''
          ? null
          : String(value)
      }
      onChange={(selected) => {
        const found = (data || []).find(
          (item) => String(item.value) === selected,
        );
        if (found) onChange(found.value);
      }}
      allowDeselect={false}
      searchable
      nothingFoundMessage="No items to display"
      {...props}
    />
  );
};

const RESOURCE = '/v2/sales';

// Form fields the server can blame by name; anything else goes in the alert.
const HEADER_FIELDS = [
  'territory_id',
  'partner_id',
  'delivery_id',
  'warehouse_id',
  'policy_type',
];

// A read that answers null instead of failing.
const read = (endPoint: string) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new Promise<any>((resolve) =>
    callApi('GET', endPoint, null, resolve, () => resolve(null)),
  );

// A line of a saved order, as the server returns it.
interface SaleLine {
  product_template_id: number;
  policy_id: number;
  ref_policy_id?: number | null;
  product_packaging_id: number;
  product_packaging_qty: number;
  qty: number;
  price_unit: number;
  discount: number;
}

const AddOrders = () => {
  // A failed order opened from the list to be fixed and sent again.
  const record = useLocation().state?.record;

  const [policyTypeFirst, setPolicyTypeFirst] = useState(
    record?.policy_type || '',
  );
  const [policyTypesData, setPolicyTypesData] = useState([]);
  const [territory, setTerritory] = useState(record?.territory_id || '');
  const [customerFirst, setCustomerFirst] = useState(record?.partner_id || '');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customersData, setCustomersData] = useState([]);
  const [deliveryAddressesData, setDeliveryAddressesData] = useState([]);
  const [policiesData, setPoliciesData] = useState([]);
  const [warehouseFirst, setWarehouseFirst] = useState('');
  const [warehouseData, setWarehouseData] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDeliveryAddressAvailable, setIsDeliveryAddressAvailable] =
    useState(false);
  const { policyType, policies, customer, referencePolicies, warehouse } =
    useSelector(selectOrderInitialDetails);
  const otherProducts = useSelector(getAddedProducts);
  const [packingsData, setPackingsData] = useState<
    { label: string; value: number }[]
  >([]);
  const [productTotal, setProductTotal] = useState(0);
  const [referencePoliciesData, setReferencePoliciesData] = useState([]);
  const [packagings, setPackagings] = useState([]);
  const [order, setOrder] = useState<OrderType>({
    policy: -1,
    refPolicy: -1,
    product: -1,
    packing: -1,
    noOfPacks: '',
    unit: '',
    unitPrice: { price_unit: '' },
    discount: '',
    total: 0,
  });
  const [products, setProducts] = useState<
    { id: number; name: string; standard_price: number }[]
  >([]);

  const navigation = useNavigate();
  const user = useSelector(selectUser);
  const dispatch = useDispatch();

  // Field the server (or Odoo) blamed, and its message.
  const [fieldError, setFieldError] = useState<{
    field?: string;
    message: string;
  } | null>(
    record?.syncError
      ? { field: record.syncErrorField, message: record.syncError }
      : null,
  );
  // One key per form, so a double submit cannot create two orders.
  const requestId = useRef(newRequestId());

  // Edit mode: values of the record still to be put into the form. Each is
  // applied once, when the list it belongs to has loaded, in place of the
  // default the form would pick.
  const prefill = useRef({
    delivery: record?.delivery_id ?? null,
    // All the record's lines, until the policies are known.
    lines: (record?.lines as SaleLine[]) || null,
    // The first line goes back into the line editor, a step at a time.
    line: null as SaleLine | null,
    packs: null as number | null,
    packing: null as number | null,
  });

  // The user took over the line editor: stop filling it from the record.
  const stopLinePrefill = () => {
    prefill.current.line = null;
    prefill.current.packs = null;
    prefill.current.packing = null;
  };

  useEffect(() => {
    if (record) dispatch(resetProducts());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Put the record's lines back into the form once the policies are known:
   * the first into the line editor (through the same lookups as a line
   * picked by hand, so its price and discount are current), the others into
   * the added products.
   */
  const applyRecordLines = async (details: {
    policies: { policy_id: number; code: string }[];
    referencePolicies?: { policy_id: number; code: string }[];
    policyType?: { type: string };
  }) => {
    const lines = prefill.current.lines;
    if (!lines?.length) return;
    prefill.current.lines = null;

    const [first, ...others] = lines;

    if (
      details.policies.some((policy) => policy.policy_id === first.policy_id)
    ) {
      prefill.current.line = first;
      setOrder((prev) => ({ ...prev, policy: first.policy_id }));
    }

    if (!others.length) return;

    const policyIds = [...new Set(others.map((line) => line.policy_id))];
    const productLists = await Promise.all(
      policyIds.map((id) =>
        read(
          `/products/get?policy=${id}&policyType=${details.policyType?.type}`,
        ),
      ),
    );
    const names: { id: number; name: string }[] = productLists.flatMap(
      (res) => res?.products || [],
    );
    const codeOf = (list: { policy_id: number; code: string }[], id: number) =>
      list?.find((policy) => policy.policy_id === id)?.code || '';

    others.forEach((line) => {
      const packs = Number(line.product_packaging_qty) || 1;
      dispatch(
        setNewProducts({
          policy: line.policy_id,
          refPolicy: line.ref_policy_id || undefined,
          product: line.product_template_id,
          packing: line.product_packaging_id,
          noOfPacks: String(line.product_packaging_qty),
          unit: String(Number(line.qty) / packs),
          unitPrice: { price_unit: String(line.price_unit) },
          discount: `${line.discount}%`,
          total:
            Number(line.qty) *
            Number(line.price_unit) *
            (1 - Number(line.discount) / 100),
          productName:
            names.find((product) => product.id === line.product_template_id)
              ?.name || `Product #${line.product_template_id}`,
          refPolicyName: line.ref_policy_id
            ? codeOf(details.referencePolicies, Number(line.ref_policy_id))
            : '',
          policyName: codeOf(details.policies, line.policy_id),
          id: Math.random().toString(36).substring(7) + Math.random() * 1000,
        }),
      );
    });
  };

  const territoriesData =
    user?.territories?.map((t) => ({
      label: t.name,
      value: t.id,
    })) || [];

  const warehouses = user?.warehouses || [];

  useEffect(() => {
    if (!policyTypeFirst) {
      return;
    }
    if (!territory) {
      return;
    }
    if (!customerFirst) {
      return;
    }
    if (!warehouseFirst) {
      return;
    }
    if (!deliveryAddress) {
      return;
    }

    const data = {
      policyType: user?.policyTypes.find(
        (policy) => policy.type === policyTypeFirst,
      ),
      territories: user.territories.find((t) => t.id === territory),
      customer: customers.find((c) => c.id === customerFirst),
      deliveryAddress:
        customers
          .find((c) => c.id === customerFirst)
          ?.delivery_address?.find((d) => d.id === deliveryAddress) || null,
      policies: policiesData.filter((policy) => policy.remaining_amount > 0),
      warehouse: warehouses.find((w) => w.id === warehouseFirst),
    };

    if (!data.policies.length) {
      // toast.error('No policies available for the selected customer');
      return;
    }

    if (data.policies.every((policy) => policy.remaining_amount <= 0)) {
      toast.error('Balance exhausted for all policies.');
      return;
    }

    if (policyTypeFirst === 'is_secure_credit') {
      setLoading(true);
      callApi(
        'GET',
        '/policy/reference/',
        {},
        (res) => {
          setLoading(false);
          const mergedData = {
            ...data,
            policies: res.data.filter((policy) => policy.sale_active),
            referencePolicies: policiesData.filter(
              (policy) => policy.remaining_amount > 0,
            ),
          };

          dispatch(setOrderInitialDetails(mergedData));
          applyRecordLines(mergedData);
        },
        () => {
          dispatch(setOrderInitialDetails({}));
          setPoliciesData([]);
          toast.error('Error fetching reference policies. Please try again');
          setLoading(false);
        },
      );
    } else {
      dispatch(setOrderInitialDetails(data));
      applyRecordLines(data);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    policyTypeFirst,
    territory,
    customerFirst,
    deliveryAddress,
    warehouseFirst,
    policiesData,
    customers,
    warehouses,
  ]);

  useEffect(() => {
    if (territory) {
      callApi(
        'GET',
        `/customers/territory?territory_id=${territory}`,
        {},
        (res) => {
          setCustomersData(
            res.data.map((customer) => ({
              label: customer.name,
              value: customer.id,
            })),
          );
          setCustomers(res.data);
          setWarehouseData(
            warehouses.map((warehouse) => ({
              label: warehouse.name,
              value: warehouse.id,
            })),
          );
          // Edit mode: the record's warehouse while on its own territory.
          const recordWarehouse =
            record && territory === record.territory_id
              ? warehouses.find(
                  (warehouse) => warehouse.id === record.warehouse_id,
                )
              : null;
          setWarehouseFirst(recordWarehouse?.id || warehouses[0]?.id || '');
        },
        () => {
          setCustomersData([]);
          toast.error('Error fetching customers. Please try again');
        },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [territory]);

  useEffect(() => {
    if (customerFirst && customers.length > 0) {
      const selectedCustomer = customers.find((c) => c.id === customerFirst);
      if (!selectedCustomer) return;
      if (!selectedCustomer?.delivery_address?.length) {
        setIsDeliveryAddressAvailable(false);
        setDeliveryAddress(selectedCustomer.name);
      } else {
        setDeliveryAddressesData(
          selectedCustomer.delivery_address
            .map((address) => ({
              label: address.name,
              value: address.id,
            }))
            .concat({
              label: selectedCustomer.name,
              value: selectedCustomer.id,
            }),
        );
        setIsDeliveryAddressAvailable(true);
      }
      setPolicyTypesData(
        user?.policyTypes.map((policy) => ({
          label: policy.name,
          value: policy.type,
        })),
      );
    }
  }, [customerFirst, customers, user?.policyTypes]);

  useEffect(() => {
    if (customerFirst && policyTypeFirst) {
      setLoading(true);
      callApi(
        'GET',
        `/v2/lookups/policy-balance?partner_id=${customerFirst}&policy_type=${policyTypeFirst}`,
        null,
        (res: { data: { expense: Record<string, unknown>[] } }) => {
          setPoliciesData(res?.data?.expense || []);
          setLoading(false);
        },
        () => {
          setLoading(false);
        },
      );
    }
  }, [customerFirst, policyTypeFirst]);

  useEffect(() => {
    if (deliveryAddressesData.length > 0) {
      const recordAddress = deliveryAddressesData.find(
        (address) => address.value === prefill.current.delivery,
      );
      prefill.current.delivery = null;
      setDeliveryAddress(
        recordAddress
          ? recordAddress.value
          : deliveryAddressesData[deliveryAddressesData.length - 1].value,
      );
    }
  }, [deliveryAddressesData]);

  // The App Second Screen

  const handleChange = (fieldName: string, value: string) => {
    setOrder((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const validateOrder = () => {
    if (policyType?.type !== 'is_secure_credit') {
      delete order?.refPolicy;
      if (Object.values(order).some((value) => value === -1 || value === '')) {
        toast.error(
          'Please fill all the fields. All fields are required to add a new order.',
        );
        return;
      }
    } else {
      if (Object.values(order).some((value) => value === -1 || value === '')) {
        toast.error(
          'Please fill all the fields. All fields are required to add a new order.',
        );
        return;
      }
    }

    const remainingAmount =
      policyType.type !== 'is_secure_credit'
        ? policies.find(
            (policy: { policy_id: number; remaining_amount: number }) =>
              policy.policy_id === order?.policy,
          ).remaining_amount
        : referencePolicies.find(
            (policy: { policy_id: number; remaining_amount: number }) =>
              policy.policy_id === order?.refPolicy,
          ).remaining_amount;

    if (productTotal > remainingAmount) {
      toast.error(
        `Sorry, you can't add this product. The total amount exceeds the remaining amount of the policy ${remainingAmount}.`,
      );
      return;
    }

    if (otherProducts.length === 0) {
      return true;
    }

    const samePolicyProducts =
      policyType.type !== 'is_secure_credit'
        ? otherProducts.filter(
            (product: { policy: number; refPolicy?: number; total: number }) =>
              product.policy === order?.policy,
          )
        : otherProducts.filter(
            (product: {
              refPolicy?: number;
              refPolicyName?: string;
              total: number;
            }) => product.refPolicy === order?.refPolicy,
          );

    const total = samePolicyProducts.reduce(
      (
        acc: number,
        product: {
          total: number;
        },
      ) => acc + product.total,
      0,
    );

    if (total + productTotal > remainingAmount) {
      toast.error(
        `Sorry, you can't add this product. The total amount exceeds the remaining amount of the policy ${remainingAmount}.`,
      );
      return;
    }

    return true;
  };

  const handleNext = async () => {
    if (!validateOrder()) {
      return;
    }

    const body = {
      partner_id: Number(customer.id),
      territory_id: Number(customer.territory_id),
      policy_type: policyType.type,
      warehouse_id: Number(warehouse.id),
      delivery_id:
        !isNaN(Number(deliveryAddress)) && Number(deliveryAddress) !== 0
          ? Number(deliveryAddress)
          : Number(customer.id),
      lines: [
        {
          product_template_id: Number(order.product),
          policy_id: Number(order.policy),
          ref_policy_id: Number(order.refPolicy) || '',
          product_packaging_id: Number(order.packing),
          product_packaging_qty: Number(order.noOfPacks),
          qty: Number(order.unit) * Number(order.noOfPacks),
          price_unit: Number(order.unitPrice.price_unit),
          discount: Number(order.discount.replace('%', '')),
        },
        ...otherProducts.map(
          (product: {
            product: number;
            policy: number;
            refPolicy?: number;
            packing: number;
            noOfPacks: string;
            unit: string;
            unitPrice: { price_unit: string };
            discount: string;
          }) => ({
            product_template_id: Number(product.product),
            policy_id: Number(product.policy),
            ref_policy_id: Number(product.refPolicy) || '',
            product_packaging_id: Number(product.packing),
            product_packaging_qty: Number(product.noOfPacks),
            qty: Number(product.unit) * Number(product.noOfPacks),
            price_unit: Number(product.unitPrice.price_unit),
            discount: Number(product.discount.replace('%', '')),
          }),
        ),
      ],
      total:
        otherProducts.reduce(
          (
            acc: number,
            product: {
              total: number;
            },
          ) => acc + product.total,
          0,
        ) + productTotal,
    };

    const onSuccess = () => {
      toast.success(
        record ? 'Order updated and queued' : 'Order saved and queued',
      );
      dispatch(resetProducts());
      navigation('/sales');
      setLoading(false);
    };

    const onError = (error) => {
      setLoading(false);
      const message = errorMessage(error, 'Error adding order');
      setFieldError({ field: error?.field, message });
      toast.error(message);
    };

    setLoading(true);
    setFieldError(null);
    // The server saves the order and queues it for Odoo.
    if (record) {
      callApi('PUT', `${RESOURCE}/${record._id}`, body, onSuccess, onError);
    } else {
      callApi(
        'POST',
        RESOURCE,
        { ...body, clientRequestId: requestId.current },
        onSuccess,
        onError,
      );
    }
  };

  const handleAddNewProduct = () => {
    if (!validateOrder()) {
      return;
    }

    dispatch(
      setNewProducts({
        ...order,
        productName: products.find(
          (product: { id: number; name: string }) =>
            product.id === order?.product,
        )?.name,
        refPolicyName:
          referencePolicies?.find(
            (policy: { code: string; policy_id: number }) =>
              policy.policy_id === order?.refPolicy,
          )?.code || '',
        policyName:
          policies.find(
            (policy: { code: string; policy_id: number }) =>
              policy.policy_id === order?.policy,
          )?.code || '',
        id: Math.random().toString(36).substring(7) + Math.random() * 1000,
      }),
    );

    setOrder({
      policy: -1,
      refPolicy: -1,
      product: -1,
      packing: -1,
      noOfPacks: '',
      unit: '',
      unitPrice: { price_unit: '' },
      discount: '',
      total: 0,
    });

    setProductTotal(0);
    setPackingsData([]);
  };

  // Get Products After selecting the policy
  useEffect(() => {
    if (order?.policy !== -1) {
      const onSuccess = (policy: {
        products: { id: number; name: string; standard_price: number }[];
      }) => {
        setLoading(false);
        setProducts(policy.products);
        setOrder((prev) => ({
          ...prev,
          packing: -1,
          noOfPacks: '',
          unit: '',
          unitPrice: { price_unit: '' },
          discount: '',
          total: 0,
          product: -1,
        }));

        // Edit mode: carry on with the record's first line.
        const line = prefill.current.line;
        if (line) {
          prefill.current.line = null;
          if (
            policy.products?.some(
              (product) => product.id === line.product_template_id,
            )
          ) {
            prefill.current.packs = Number(line.product_packaging_qty) || null;
            prefill.current.packing = line.product_packaging_id;
            setOrder((prev) => ({
              ...prev,
              product: line.product_template_id,
            }));
          }
        }
      };

      const onError = () => {
        setLoading(false);
        toast.error('Error fetching policy details');

        setProducts([]);
        setPackingsData([]);
      };
      setLoading(true);
      if (policyType?.type !== 'is_secure_credit') {
        callApi(
          'GET',
          `/products/get?policy=${order?.policy}&policyType=${policyType?.type}`,
          null,
          onSuccess,
          onError,
        );
      }

      // Fetch the product when the policy type is secure credit and the ref policy is selected
      if (policyType?.type === 'is_secure_credit' && order?.refPolicy !== -1) {
        callApi(
          'GET',
          `/products/get?policy=${order?.policy}&policyType=${policyType?.type}`,
          null,
          onSuccess,
          onError,
        );
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.policy, order?.refPolicy]);

  // if type is secure credit, fetch the reference policies
  useEffect(() => {
    if (policyType?.type === 'is_secure_credit' && order?.policy !== -1) {
      const onSuccess = (res: { data: string[] }) => {
        setLoading(false);
        const data = res.data;

        const filteredReferencePolicies = referencePolicies.filter(
          (policy: { code: string; policy_id: number }) =>
            data.includes(policy.code),
        );
        if (filteredReferencePolicies.length === 0) {
          setLoading(false);
          toast.error('No reference policies found');
          setReferencePoliciesData([]);
          return;
        }
        setReferencePoliciesData(filteredReferencePolicies);

        // Edit mode: the record's first line carries on with its ref. policy.
        const line = prefill.current.line;
        if (line) {
          const refPolicy = filteredReferencePolicies.find(
            (policy: { policy_id: number }) =>
              policy.policy_id === Number(line.ref_policy_id),
          );
          if (refPolicy) {
            setOrder((prev) => ({ ...prev, refPolicy: refPolicy.policy_id }));
          } else {
            prefill.current.line = null;
          }
        }
      };

      const onError = () => {
        toast.error('Error fetching reference policies');
        setLoading(false);
      };

      setLoading(true);
      const refPoliciesCode = referencePolicies.map(
        (policy: { code: string; policy_id: number }) => policy.code,
      );
      callApi(
        'GET',
        `/policy/reference-related?policy=${order.policy}&refpolicies=${refPoliciesCode}`,
        {},
        onSuccess,
        onError,
      );
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.policy]);

  // Get Discount\Total After selecting the product
  useEffect(() => {
    if (order?.product !== -1) {
      setOrder((prev) => ({
        ...prev,
        packing: -1,
        noOfPacks: '',
        unit: '',
        unitPrice: { price_unit: '' },
        discount: '',
        total: 0,
      }));

      const getProductPrice = products?.find(
        (product: { id: number; name: string; standard_price: number }) =>
          product.id === order?.product,
      );

      if (getProductPrice && getProductPrice.standard_price) {
        handleChange('total', getProductPrice.standard_price.toString());
      }

      const onSuccess = ({
        data,
      }: {
        data: {
          expense: {
            discount: number;
            packing_units: { qty: string }[];
            price_unit: string;
          }[];
        };
      }) => {
        const discount = `${data.expense[0].discount}%`;
        const price_unit = data.expense[0];
        const qty = data.expense[0].packing_units[0].qty;

        // Edit mode: the record's number of packs instead of the default 1.
        const packs = prefill.current.packs;
        prefill.current.packs = null;

        setOrder((prev) => ({
          ...prev,
          discount: discount,
          unit: qty,
          unitPrice: price_unit,
          noOfPacks: packs ? String(packs) : '1',
        }));
      };

      const onError = () => {
        toast.error('Error fetching discount details');
      };

      callApi(
        'GET',
        `/v2/lookups/policy-discount?partner_id=${customer.id}&policy_id=${order?.policy}&product_tmpl_id=${order?.product}`,
        null,
        onSuccess,
        onError,
      );
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.product]);

  useEffect(() => {
    if (order?.product !== -1 && packagings.length) {
      const productPackagings = packagings.map(
        (packaging: { id: number; name: string }) => ({
          label: packaging.name,
          value: packaging.id,
        }),
      );

      setPackingsData(productPackagings);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packagings]);

  useEffect(() => {
    if (order?.product !== -1) {
      setLoading(true);
      callApi(
        'GET',
        `/products/packagings/${order?.product}`,
        null,
        (data: { data: { id: number; name: string }[] }) => {
          setPackagings(data?.data || []);
          setLoading(false);
        },
        () => {
          setLoading(false);
          toast.error('Error fetching packagings');
        },
      );
    }
  }, [order?.product]);

  // Set the default packing
  useEffect(() => {
    if (packingsData.length > 0) {
      // Edit mode: the record's packing instead of the first one.
      const recordPacking = packingsData.find(
        (packing) => packing.value === prefill.current.packing,
      );
      prefill.current.packing = null;
      handleChange(
        'packing',
        (recordPacking || packingsData[0]).value.toString(),
      );
      setLoading(false);
    }
  }, [packingsData]);

  useEffect(() => {
    if (order?.noOfPacks !== '') {
      const totalUnits = Number(order?.unit) * Number(order?.noOfPacks);
      const productPrice = Number(order?.unitPrice.price_unit);
      const total =
        totalUnits *
        productPrice *
        (1 - Number(order?.discount.replace('%', '')) / 100);

      setProductTotal(total);
      setOrder((prev) => ({
        ...prev,
        total: total,
      }));
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.noOfPacks]);

  const errorFor = (field: string) =>
    fieldError?.field === field ? fieldError.message : undefined;

  const productsData =
    products?.map(
      (product: { id: number; name: string; standard_price: number }) => ({
        label: `${product.name}`,
        value: product.id,
      }),
    ) || [];
  const policiesDataSecond =
    policies.map(
      (policy: {
        code: string;
        policy_id: number;
        remaining_amount: number;
      }) => ({
        label: policy.code,
        value: policy.policy_id,
      }),
    ) || [];
  const referencePoliciesDataRender =
    referencePoliciesData?.map((policy) => ({
      label: policy.code as string,
      value: policy.policy_id as number,
    })) || [];

  return (
    <Container size="md" px={0} pos="relative">
      <Loader loading={loading} />
      <PageHeader title={record ? 'Edit Sale Order' : 'Add Sale Order'} />
      <Paper withBorder shadow="sm" p={{ base: 'md', sm: 'lg' }}>
        {fieldError && !HEADER_FIELDS.includes(fieldError.field) && (
          <Alert color="red" variant="light" mb="md">
            {fieldError.message}
          </Alert>
        )}
        <Grid gutter="md">
          {/* Territory */}
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <IdSelect
              label="Territory"
              placeholder="Select the Territory"
              data={territoriesData}
              value={territory}
              onChange={setTerritory}
              error={errorFor('territory_id')}
            />
          </Grid.Col>

          {/* Customer */}
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <IdSelect
              label="Customer"
              placeholder="Select the customer"
              data={customersData}
              value={customerFirst}
              onChange={setCustomerFirst}
              error={errorFor('partner_id')}
            />
          </Grid.Col>

          {/* Delivery Address */}
          <Grid.Col span={{ base: 12, sm: 6 }}>
            {isDeliveryAddressAvailable ? (
              <IdSelect
                label="Delivery Address"
                placeholder="Select the Delivery Address"
                data={deliveryAddressesData}
                value={deliveryAddress}
                onChange={setDeliveryAddress}
              error={errorFor('delivery_id')}
              />
            ) : (
              <TextInput
                label="Delivery Address"
                value={deliveryAddress !== '-1' ? deliveryAddress : ''}
                readOnly
                disabled
              />
            )}
          </Grid.Col>

          {/* Warehouse */}
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <IdSelect
              label="Warehouse"
              placeholder="Select the Warehouse"
              data={warehouseData}
              value={warehouseFirst}
              onChange={setWarehouseFirst}
              error={errorFor('warehouse_id')}
            />
          </Grid.Col>

          {/* Policy Type (full width) */}
          <Grid.Col span={12}>
            <IdSelect
              label="Policy Type"
              placeholder="Select the policy type"
              data={policyTypesData}
              value={policyTypeFirst}
              onChange={setPolicyTypeFirst}
              error={errorFor('policy_type')}
            />
          </Grid.Col>

          {/* Policies Balance */}
          {policiesData.length > 0 && (
            <Grid.Col span={12}>
              <Paper withBorder p="sm">
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Policy</Table.Th>
                      <Table.Th>Remaining Amount</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {policiesData.map((policy, idx) => (
                      <Table.Tr key={idx}>
                        <Table.Td>{policy.code}</Table.Td>
                        <Table.Td>
                          {priceFormatter(policy.remaining_amount)} PKR
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            </Grid.Col>
          )}

          <Grid.Col span={{ base: 12, sm: 6 }}>
            <SelectBox
              label="Policy"
              placeholder="Select the policy"
              selectedValue={order?.policy || ''}
              onValueChange={(value) => {
                stopLinePrefill();
                handleChange('policy', value);
              }}
              data={policiesDataSecond}
            />
          </Grid.Col>

          {/* Ref. policy */}
          {policyType?.type === 'is_secure_credit' && (
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <SelectBox
                label="Ref. policy"
                placeholder="Select the Ref. policy"
                selectedValue={order?.refPolicy}
                onValueChange={(value) => {
                  stopLinePrefill();
                  handleChange('refPolicy', value);
                }}
                data={referencePoliciesDataRender}
              />
            </Grid.Col>
          )}

          <Grid.Col span={{ base: 12, sm: 6 }}>
            <SelectBox
              label="Product"
              placeholder="Select the product"
              selectedValue={order?.product}
              onValueChange={(value) => {
                stopLinePrefill();
                handleChange('product', value);
              }}
              data={productsData}
            />
          </Grid.Col>

          {/* Packing */}
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <SelectBox
              label="Packing"
              placeholder="Select the packing"
              selectedValue={order?.packing}
              onValueChange={(value) => handleChange('packing', value)}
              data={packingsData}
            />
          </Grid.Col>

          {/* No of Packs */}
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label="No of Packs"
              placeholder="Number of packs"
              value={order?.noOfPacks}
              onChange={(e) => handleChange('noOfPacks', e.target.value)}
              disabled={packingsData.length === 0}
            />
          </Grid.Col>

          {/* Unit */}
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label="Unit"
              placeholder="Unit"
              value={order?.unit}
              readOnly
              disabled
            />
          </Grid.Col>

          {/* Unit Price */}
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label="Unit Price"
              placeholder="Unit price"
              value={order?.unitPrice.price_unit}
              readOnly
              disabled
            />
          </Grid.Col>

          {/* Discount */}
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label="Discount"
              placeholder="Discount"
              value={order?.discount}
              readOnly
              disabled
            />
          </Grid.Col>

          {/* Total */}
          <Grid.Col span={12}>
            <TextInput
              label="Total"
              placeholder="Total"
              value={order?.total}
              readOnly
              disabled
              styles={{ input: { fontWeight: 600 } }}
            />
          </Grid.Col>
        </Grid>

        {otherProducts.length >= 1 && (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mt="lg">
            {otherProducts.map((item, index) => (
              <Card key={index} withBorder padding="md">
                <Group
                  justify="space-between"
                  align="center"
                  wrap="nowrap"
                  gap="md"
                >
                  <Stack gap={4}>
                    <Text fw={600} size="lg">
                      {item.productName}
                    </Text>
                    <Text size="sm">Packs: {item.noOfPacks}</Text>
                    <Text size="sm">Policy: {item.policyName}</Text>
                    {item.refPolicy && item.refPolicyName && (
                      <Text size="sm">Ref Policy: {item.refPolicyName}</Text>
                    )}
                    <Text size="sm">Total: {item.total} PKR</Text>
                  </Stack>
                  <ActionIcon
                    variant="light"
                    color="red"
                    size="lg"
                    aria-label="Remove product"
                    onClick={() => dispatch(removeProduct({ id: item.id }))}
                  >
                    <Trash2Icon size={18} />
                  </ActionIcon>
                </Group>
                <Text size="xs" c="dimmed" mt="xs">
                  Added
                </Text>
              </Card>
            ))}
          </SimpleGrid>
        )}

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm" mt="lg">
          <Button
            onClick={handleAddNewProduct}
            disabled={loading}
            variant="default"
          >
            {'Add New Product'}
          </Button>
          <Button onClick={handleNext} disabled={loading}>
            {record ? 'Save & Resend' : 'Create Sale Order'}
          </Button>
        </SimpleGrid>
      </Paper>
    </Container>
  );
};

export default AddOrders;
