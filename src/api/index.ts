/* eslint-disable @typescript-eslint/ban-ts-comment */
import { logout, setOdooAccessToken } from '../redux/slices/AuthSlice';
import { store } from '../redux/store';
export const AUTHORIZE = 'AUTHORIZE';
export const NETWORK_ERROR = 'NETWORK ERROR';
export const BASE_URL = 'https://teamsol-api-staging.suncropgroup.com.pk';
// export const BASE_URL = 'http://localhost:3001';
import { toast } from 'sonner';

export const Method = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
};

export const Status = {
  SUCCESS: 200,
  ERROR: 400,
  AUTHENTICATION_FAIL: 401,
  NOT_FOUND: 400,
};

const defaultHeaders: {
  Accept: string;
  'Content-Type': string;
  Cookie?: string;
  Authorization?: string;
} = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

export const callApi = async (
  method: string,
  endPoint: string,
  bodyParams: Record<string, unknown> | null = null,
  // @ts-ignore eslint-disable-next-line
  onSuccess: (response: Record<string>) => void,
  // @ts-ignore eslint-disable-next-line
  onError: (error: Record<string>) => void,
  multipart: boolean = false
) => {
  if (!navigator.onLine) {
    toast.error('No internet connection');
    return;
  }

  try {
    const url = BASE_URL + endPoint;
    const token = store.getState().auth.user?.token;

    if (multipart) {
      defaultHeaders['Content-Type'] = 'multipart/form-data';
    } else {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const fetchObject = {
      method: method,
      headers: defaultHeaders,
      body:
        method == 'GET'
          ? null
          : method == 'DELETE'
          ? null
          : multipart
          ? bodyParams
          : JSON.stringify(bodyParams),
      credentials: 'include' as RequestCredentials, // Include cookies in the request
    };
    if (bodyParams == null) {
      delete fetchObject.body;
    }

    // @ts-expect-error
    const response = await fetch(url, fetchObject);
    const responseJson = await response.json();

    if (response?.status < 400) {
      onSuccess(responseJson);
    } else {
      if (responseJson.message === 'Invalid token') {
        store.dispatch(logout());
      } else {
        onError(responseJson);
      }
    }
  } catch (error) {
    onError(error);
  }
};

const getServerToken = async () => {
  const { odooAccessToken, tokenExpiry } = store.getState().auth;

  // Check if token exists and has not expired
  if (odooAccessToken && tokenExpiry && new Date().getTime() < tokenExpiry) {
    return {
      success: true,
      data: odooAccessToken,
    };
  }

  // Clear the old token if expired or missing
  store.dispatch(
    setOdooAccessToken({
      access_token: '',
      expires_in: 0,
    })
  );

  try {
    const response = await fetch(
      `${BASE_URL}/web/authenticate-odoo-server?id=${
        store.getState().project.setOdooCred.id
      }`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const responseJson = await response.json();

    if (!responseJson.data.cookie) {
      return {
        success: false,
        data: null,
      };
    }

    // if responnse have cookie then set the cookie in browser
    // document.cookie = `session_id=${responseJson.data.cookie}; path=/; max-age=${responseJson.data.expires}; secure; SameSite=Lax`;

    store.dispatch(
      setOdooAccessToken({
        access_token: responseJson.data.cookie,
        expires_in: responseJson.data.expires,
      })
    );

    // set the cookie if needed

    return {
      success: true,
      data: responseJson.data.cookie,
    };
  } catch (error) {
    return {
      success: false,
      data: error,
    };
  }
};

export const callServerAPI = async (
  method: string,
  endPoint: string,
  bodyParams: Record<string, unknown>,
  onSuccess: (response: Record<string, unknown>) => void,
  onError: (error: unknown) => void,
  multipart: boolean = false,
  excludeApi: boolean = false
) => {
  try {
    const isConnected = navigator.onLine;
    const odooAdmin = store.getState().auth.odooAdmin;

    if (!isConnected) return;

    const ODOO_URL = `${store.getState().project.setOdooCred.url}/${
      excludeApi ? '' : 'api'
    }`;

    const odooAuth = await getServerToken();

    if (!odooAuth.success || !odooAuth.data) {
      toast.error(
        'Unable to communicate with Server. Please contact your administrator.'
      );
      onError(
        'Unable to communicate with server. Please contact your administrator ASAP!'
      );
      return;
    }

    const url = ODOO_URL + endPoint;

    const defaultHeaders: Record<string, string> = {};
    if (multipart) {
      defaultHeaders['Content-Type'] = 'multipart/form-data';
    } else {
      defaultHeaders['Content-Type'] = 'application/json';
    }
    defaultHeaders['Cookie'] = `session_id=${odooAuth.data}`;

    if (bodyParams?.data) {
      (bodyParams.data as Record<string, unknown>).user_id = odooAdmin?.id;
    } else {
      bodyParams.user_id = odooAdmin?.id;
    }

    const requestPayload = {
      method,
      url,
      headers: defaultHeaders,
      bodyParams: bodyParams,
    };

    const fetchObject: RequestInit = {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify(requestPayload),
    };

    const response = await fetch(`${BASE_URL}/web/call-odoo-api`, fetchObject);

    const contentType = response.headers.get('Content-Type');
    let responseJson = {};
    if (contentType && contentType.includes('application/json')) {
      responseJson = await response.json();
    } else {
      // If the response is not JSON, throw an error with the response text
      const errorText = await response.text();
      throw new Error(`Expected JSON, but got: ${errorText}`);
    }

    if (response?.status < 400) {
      onSuccess(responseJson);
    } else {
      onError(responseJson);
    }
  } catch (error) {
    onError(error);
  }
};

// Helper function to convert object to FormData
export const convertToFormData = (data: Record<string, unknown>): FormData => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value as string | Blob);
  });
  return formData;
};

export const uploadToCloudinary = async (
  file: { uri: string; type: string; name: string },
  folderName: string
) => {
  const data = new FormData();
  data.append('file', {
    uri: file.uri,
    type: file.type,
    name: file.name,
  } as unknown as Blob);
  data.append('upload_preset', 'suncrop');
  data.append('folder', folderName);

  const res = await fetch(
    'https://api.cloudinary.com/v1_1/dmetfxrjv/image/upload',
    {
      method: 'POST',
      body: data,
    }
  );
  const json = await res.json();
  if (json.error) {
    throw json.error;
  }
  return json.url;
};
