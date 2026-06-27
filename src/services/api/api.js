import axios from 'axios';
import { getDataMode } from '../dataConfig';
import { supabase, getAccessToken } from '../supabaseClient';

// API Configuration — only the Java Growatt service is a separate backend now.
// Auth, weather and notifications go through Supabase directly.
const getApiConfig = () => {
  const dataMode = getDataMode();

  let growattUrl = 'http://localhost:8080';
  if (dataMode === 'production') {
    growattUrl =
      process.env.EXPO_PUBLIC_JAVA_API || 'https://growattapi.onrender.com';
  } else if (dataMode === 'development') {
    growattUrl =
      process.env.EXPO_PUBLIC_GROWATT_API?.replace('/api', '') ||
      'http://localhost:8080';
  }

  return {
    GROWATT_API_URL: growattUrl,
    HEADERS: { 'Content-Type': 'application/json' },
  };
};

const handleApiError = (operation, error) => {
  console.error(
    `${operation} API error:`,
    error.response?.data || error.message
  );
  throw error;
};

/** Build the Redux `user` payload from a Supabase session + user. */
function toUser(session, user) {
  return {
    id: user.id,
    email: user.email,
    username:
      user.user_metadata?.username || (user.email ? user.email.split('@')[0] : ''),
    token: session?.access_token ?? null,
  };
}

// ---- Authentication (Supabase Auth) --------------------------------------

export const loginUser = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
  return toUser(data.session, data.user);
};

export const registerUser = async ({ email, username, password }) => {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { username: username?.trim() } },
  });
  if (error) throw error;

  // With email confirmation disabled, signUp returns a session immediately.
  // If it doesn't (confirmation enabled), try an immediate sign-in.
  let session = data.session;
  if (!session) {
    const signIn = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signIn.error) {
      throw new Error(
        'Account created. Please confirm your email, then sign in.'
      );
    }
    session = signIn.data.session;
  }
  return toUser(session, data.user);
};

// ---- Growatt (Java service, Supabase-JWT authed) -------------------------
// The server logs into Growatt itself (Vault creds); the client only sends its
// Supabase token and the requested date. Plant id is resolved server-side.

/** @deprecated Login is now performed server-side; kept as a no-op for call sites. */
// eslint-disable-next-line no-unused-vars
export const growattLogin = async (_credentials) => ({ result: 1 });

async function growattPost(path, request) {
  try {
    const { GROWATT_API_URL, HEADERS } = getApiConfig();
    const token = await getAccessToken();
    const response = await axios.post(
      `${GROWATT_API_URL}/api/growatt/${path}`,
      { date: request?.date },
      {
        headers: {
          ...HEADERS,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );
    return response.data;
  } catch (error) {
    handleApiError(`Growatt ${path}`, error);
  }
}

export const getGrowattTotalData = (request) => growattPost('totalData', request);
export const getGrowattDayChart = (request) => growattPost('dayChart', request);
export const getGrowattMonthChart = (request) =>
  growattPost('monthChart', request);
export const getGrowattYearChart = (request) =>
  growattPost('yearChart', request);

// ---- Weather (current observation via Edge Function) ---------------------

export const getWeatherData = async () => {
  const { data, error } = await supabase.functions.invoke('weather-current');
  if (error) throw error;
  return data;
};
