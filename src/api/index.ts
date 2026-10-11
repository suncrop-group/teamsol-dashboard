/* eslint-disable @typescript-eslint/ban-ts-comment */
import { logout } from '../redux/slices/AuthSlice';
import { setMaintenanceMode } from '../redux/slices/SystemSlice';
import { store } from '../redux/store';
export const AUTHORIZE = 'AUTHORIZE';
export const NETWORK_ERROR = 'NETWORK ERROR';
// VITE_API_URL points a local build at another backend; production builds
// leave it unset.
export const BASE_URL =
  import.meta.env.VITE_API_URL ||
  'https://teamsol-api-serverless.suncropgroup.com.pk';
import { toast } from '@/lib/toast';

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
  Authorization?: string;
  'X-Client': string;
  'X-Client-Platform': string;
  'X-Client-Version': string;
} = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  // Tells the backend this request comes from the web dashboard (and which
  // build), so the admin panel can show who uses the web and who the app.
  'X-Client': 'web',
  'X-Client-Platform': 'web',
  'X-Client-Version': __APP_VERSION__,
};

export const callApi = async (
  method: string,
  endPoint: string,
  bodyParams: Record<string, unknown> | null = null,
  // @ts-ignore eslint-disable-next-line
  onSuccess: (response: Record<string>) => void,
  // @ts-ignore eslint-disable-next-line
  onError: (error: Record<string>) => void,
  multipart: boolean = false,
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
    } else if (response?.status === 503 && responseJson.maintenance) {
      // System is under maintenance
      store.dispatch(
        setMaintenanceMode({
          isUnderMaintenance: true,
          message: responseJson.message,
          maintenanceUntil: responseJson.maintenanceUntil,
        }),
      );
      onError(responseJson);
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

export const convertToFormData = (data: Record<string, unknown>): FormData => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value as string | Blob);
  });
  return formData;
};

export const uploadToCloudinary = async (
  file: { uri: string; type: string; name: string },
  folderName: string,
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
    },
  );
  const json = await res.json();
  if (json.error) {
    throw json.error;
  }
  return json.url;
};
