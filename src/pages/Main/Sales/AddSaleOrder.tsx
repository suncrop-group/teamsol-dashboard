import { useEffect, useState } from 'react';
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
import { callApi, callServerAPI } from '@/api';
import { priceFormatter } from '@/utils';
import Loader from '@/components/Loader';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { toast } from 'sonner'; // Or your toast system
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import SelectBox from '@/components/Select';
import { Button } from '@/components/ui/button';
import { Trash2Icon } from 'lucide-react';

const AddOrders = () => {
  const [policyTypeFirst, setPolicyTypeFirst] = useState('');
  const [policyTypesData, setPolicyTypesData] = useState([]);
  const [territory, setTerritory] = useState('');
  const [customerFirst, setCustomerFirst] = useState('');
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
  const { company } = useSelector(selectUser);
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
        (policy) => policy.type === policyTypeFirst
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
      toast.error('No policies available for the selected customer');
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
              (policy) => policy.remaining_amount > 0
            ),
          };

          dispatch(setOrderInitialDetails(mergedData));
        },
        () => {
          dispatch(setOrderInitialDetails({}));
          setPoliciesData([]);
          toast.error('Error fetching reference policies. Please try again');
          setLoading(false);
        }
      );
    } else {
      dispatch(setOrderInitialDetails(data));
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
            }))
          );
          setCustomers(res.data);
          setWarehouseData(
            warehouses.map((warehouse) => ({
              label: warehouse.name,
              value: warehouse.id,
            }))
          );
          setWarehouseFirst(warehouses[0]?.id || '');
        },
        () => {
          setCustomersData([]);
          toast.error('Error fetching customers. Please try again');
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [territory]);

  useEffect(() => {
    if (customerFirst && customers.length > 0) {
      const selectedCustomer = customers.find((c) => c.id === customerFirst);
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
              value: selectedCustomer.name,
            })
        );
        setIsDeliveryAddressAvailable(true);
      }
      setPolicyTypesData(
        user?.policyTypes.map((policy) => ({
          label: policy.name,
          value: policy.type,
        }))
      );
    }
  }, [customerFirst, customers, user?.policyTypes]);

  useEffect(() => {
    if (customerFirst && policyTypeFirst) {
      setLoading(true);
      callServerAPI(
        'POST',
        `/get/advance/policy/balance`,
        {
          data: {
            partner_id: customerFirst,
            policy_type: policyTypeFirst,
          },
        },
        (res: { data: { expense: Record<string, unknown>[] } }) => {
          setPoliciesData(res?.data?.expense);
          setLoading(false);
        },
        () => {
          setLoading(false);
        }
      );
    }
  }, [customerFirst, policyTypeFirst]);

  useEffect(() => {
    if (deliveryAddressesData.length > 0) {
      setDeliveryAddress(
        deliveryAddressesData[deliveryAddressesData.length - 1].value
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
          'Please fill all the fields. All fields are required to add a new order.'
        );
        return;
      }
    } else {
      if (Object.values(order).some((value) => value === -1 || value === '')) {
        toast.error(
          'Please fill all the fields. All fields are required to add a new order.'
        );
        return;
      }
    }

    const remainingAmount =
      policyType.type !== 'is_secure_credit'
        ? policies.find(
            (policy: { policy_id: number; remaining_amount: number }) =>
              policy.policy_id === order?.policy
          ).remaining_amount
        : referencePolicies.find(
            (policy: { policy_id: number; remaining_amount: number }) =>
              policy.policy_id === order?.refPolicy
          ).remaining_amount;

    if (productTotal > remainingAmount) {
      toast.error(
        `Sorry, you can't add this product. The total amount exceeds the remaining amount of the policy ${remainingAmount}.`
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
              product.policy === order?.policy
          )
        : otherProducts.filter(
            (product: {
              refPolicy?: number;
              refPolicyName?: string;
              total: number;
            }) => product.refPolicy === order?.refPolicy
          );

    const total = samePolicyProducts.reduce(
      (
        acc: number,
        product: {
          total: number;
        }
      ) => acc + product.total,
      0
    );

    if (total + productTotal > remainingAmount) {
      toast.error(
        `Sorry, you can't add this product. The total amount exceeds the remaining amount of the policy ${remainingAmount}.`
      );
      return;
    }

    return true;
  };

  const handleNext = async () => {
    if (!validateOrder()) {
      return;
    }

    const data = {
      partner_id: Number(customer.id),
      territory_id: Number(customer.territory_id),
      policy_type: policyType.type,
      employee_id: Number(user.id),
      company_id: Number(company.id),
      warehouse_id: Number(warehouse.id),
      order_id: 0,
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
          })
        ),
      ],
    };

    const onSuccessDBOrder = () => {
      toast.success('Order added successfully');
      dispatch(resetProducts());
      navigation('/sales');
      setLoading(false);
    };

    const onErrorOrder = () => {
      setLoading(false);
      toast.error('Error adding order to the database');
    };

    const onOrderOdooSuccess = (response: {
      data: {
        message: {
          order_id: number;
          order_sequence: string;
        };
      };
    }) => {
      const { order_id, order_sequence } = response.data.message;
      if (!order_id || !order_sequence) {
        toast.error('Error adding order');
        return;
      }

      callApi(
        'POST',
        `/sales`,
        {
          ...data,
          order_id: order_id,
          status: 'sent',
          total:
            otherProducts.reduce(
              (
                acc: number,
                product: {
                  total: number;
                }
              ) => acc + product.total,
              0
            ) + productTotal,
          order_sequence: order_sequence,
        },
        onSuccessDBOrder,
        onErrorOrder
      );
    };

    const onError = () => {
      toast.error('Error adding order in Odoo');
      setLoading(false);
    };
    setLoading(true);
    callServerAPI(
      'POST',
      '/post/order',
      {
        data: data,
      },
      onOrderOdooSuccess,
      onError
    );
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
            product.id === order?.product
        )?.name,
        refPolicyName:
          referencePolicies?.find(
            (policy: { code: string; policy_id: number }) =>
              policy.policy_id === order?.refPolicy
          )?.code || '',
        policyName:
          policies.find(
            (policy: { code: string; policy_id: number }) =>
              policy.policy_id === order?.policy
          )?.code || '',
        id: Math.random().toString(36).substring(7) + Math.random() * 1000,
      })
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
          onError
        );
      }

      // Fetch the product when the policy type is secure credit and the ref policy is selected
      if (policyType?.type === 'is_secure_credit' && order?.refPolicy !== -1) {
        callApi(
          'GET',
          `/products/get?policy=${order?.policy}&policyType=${policyType?.type}`,
          null,
          onSuccess,
          onError
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
            data.includes(policy.code)
        );
        if (filteredReferencePolicies.length === 0) {
          setLoading(false);
          toast.error('No reference policies found');
          setReferencePoliciesData([]);
          return;
        }
        setReferencePoliciesData(filteredReferencePolicies);
      };

      const onError = () => {
        toast.error('Error fetching reference policies');
        setLoading(false);
      };

      setLoading(true);
      const refPoliciesCode = referencePolicies.map(
        (policy: { code: string; policy_id: number }) => policy.code
      );
      callApi(
        'GET',
        `/policy/reference-related?policy=${order.policy}&refpolicies=${refPoliciesCode}`,
        {},
        onSuccess,
        onError
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
          product.id === order?.product
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

        setOrder((prev) => ({
          ...prev,
          discount: discount,
          unit: qty,
          unitPrice: price_unit,
          noOfPacks: '1',
        }));
      };

      const onError = () => {
        toast.error('Error fetching discount details');
      };

      callServerAPI(
        'POST',
        '/policy/discount',
        {
          data: {
            partner_id: customer.id,
            policy_id: order?.policy,
            product_tmpl_id: order?.product,
          },
        },
        onSuccess,
        onError
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
        })
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
        }
      );
    }
  }, [order?.product]);

  // Set the default packing
  useEffect(() => {
    if (packingsData.length > 0) {
      handleChange('packing', packingsData[0].value.toString());
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

  const productsData =
    products?.map(
      (product: { id: number; name: string; standard_price: number }) => ({
        label: `${product.name}`,
        value: product.id,
      })
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
      })
    ) || [];
  const referencePoliciesDataRender =
    referencePoliciesData?.map((policy) => ({
      label: policy.code as string,
      value: policy.policy_id as number,
    })) || [];

  return (
    <>
      <Loader loading={loading} />
      <Card className="p-6 my-8 bg-white mx-auto w-full md:w-1/2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Add Sale Order
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
            {/* Territory */}
            <div className="w-full">
              <label className="block mb-1 font-medium">Territory</label>
              <Select value={territory} onValueChange={setTerritory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select the Territory" />
                </SelectTrigger>
                <SelectContent>
                  {territoriesData.map(({ label, value }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Customer */}
            <div>
              <label className="block mb-1 font-medium">Customer</label>
              <Select value={customerFirst} onValueChange={setCustomerFirst}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select the customer" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  {customersData.map(({ label, value }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Delivery Address */}
            <div>
              <label className="block mb-1 font-medium">Delivery Address</label>
              {isDeliveryAddressAvailable ? (
                <Select
                  value={deliveryAddress}
                  onValueChange={setDeliveryAddress}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select the Delivery Address" />
                  </SelectTrigger>
                  <SelectContent>
                    {deliveryAddressesData.map(({ label, value }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={deliveryAddress !== '-1' ? deliveryAddress : ''}
                  disabled
                />
              )}
            </div>

            {/* Warehouse */}
            <div>
              <label className="block mb-1 font-medium">Warehouse</label>
              <Select value={warehouseFirst} onValueChange={setWarehouseFirst}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select the Warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouseData.map(({ label, value }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Policy Type (full width) */}
            <div className="sm:col-span-2">
              <label className="block mb-1 font-medium">Policy Type</label>
              <Select
                value={policyTypeFirst}
                onValueChange={setPolicyTypeFirst}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select the policy type" />
                </SelectTrigger>
                <SelectContent>
                  {policyTypesData.map(({ label, value }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Policies Balance */}
            {policiesData.length > 0 && (
              <div className="border rounded-md p-4 mt-6 sm:col-span-2">
                <div className="grid grid-cols-2 font-semibold border-b pb-2 mb-2">
                  <div>Policy</div>
                  <div>Remaining Amount</div>
                </div>
                {policiesData.map((policy, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-2 py-1 border-b last:border-b-0"
                  >
                    <div>{policy.code}</div>
                    <div>{priceFormatter(policy.remaining_amount)} PKR</div>
                  </div>
                ))}
              </div>
            )}

            <SelectBox
              label="Policy"
              placeholder="Select the policy"
              selectedValue={order?.policy || ''}
              onValueChange={(value) => handleChange('policy', value)}
              data={policiesDataSecond}
            />

            {/* Ref. policy */}
            {policyType?.type === 'is_secure_credit' && (
              <SelectBox
                label="Ref. policy"
                placeholder="Select the Ref. policy"
                selectedValue={order?.refPolicy}
                onValueChange={(value) => handleChange('refPolicy', value)}
                data={referencePoliciesDataRender}
              />
            )}

            <SelectBox
              label="Product"
              placeholder="Select the product"
              selectedValue={order?.product}
              onValueChange={(value) => {
                handleChange('product', value);
              }}
              data={productsData}
            />

            {/* Packing */}
            <SelectBox
              label="Packing"
              placeholder="Select the packing"
              selectedValue={order?.packing}
              onValueChange={(value) => handleChange('packing', value)}
              data={packingsData}
            />

            <div>
              {/* No of Packs */}
              <label className="block mb-1 font-medium">No of Packs</label>
              <Input
                // label="No of Packs"
                placeholder="Number of packs"
                value={order?.noOfPacks}
                disabled={true}
              />
            </div>

            {/* Unit */}
            <div>
              <label className="block mb-1 font-medium">Unit</label>
              <Input placeholder="Unit" value={order?.unit} disabled={true} />
            </div>

            {/* Unit Price */}

            <div>
              <label className="block mb-1 font-medium">Unit Price</label>
              <Input
                placeholder="Unit price"
                value={order?.unitPrice.price_unit}
                disabled={true}
              />
            </div>

            {/* Discount */}
            <div>
              <label className="block mb-1 font-medium">Discount</label>
              <Input
                placeholder="Discount"
                value={order?.discount}
                disabled={true}
              />
            </div>

            {/* Total */}
            <div className="sm:col-span-2">
              <label className="block mb-1 font-medium">Total</label>
              <Input
                placeholder="Total"
                value={order?.total}
                disabled={true}
                className=" text-gray-700 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            {otherProducts.length >= 1 &&
              otherProducts.map((item, index) => (
                <div
                  key={index}
                  className="bg-white p-4 rounded-lg shadow-md flex flex-col"
                >
                  <div className="flex flex-wrap gap-4">
                    <div className="flex flex-col gap-2">
                      <span className="text-lg font-semibold">
                        {item.productName}
                      </span>
                      <span>Packs: {item.noOfPacks}</span>
                      <span>Policy: {item.policyName}</span>
                      {item.refPolicy && item.refPolicyName && (
                        <span>Ref Policy: {item.refPolicyName}</span>
                      )}
                      <span>Total: {item.total} PKR</span>
                    </div>
                    <div className="flex-grow flex items-center justify-center">
                      <Button
                        variant="outline"
                        className="text-red-500"
                        onClick={() => dispatch(removeProduct({ id: item.id }))}
                      >
                        <Trash2Icon size={20} color="red" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">Added</div>
                </div>
              ))}
          </div>
          <div className="flex mt-6  md:flex-row flex-col px-0 gap-2 w-full">
            <Button
              onClick={handleAddNewProduct}
              disabled={loading}
              variant="secondary"
              className="w-full md:w-1/2 "
            >
              {'Add New Product'}
            </Button>
            <Button
              onClick={handleNext}
              disabled={loading}
              className="w-full md:w-1/2 "
            >
              {'Create Sale Order'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default AddOrders;
