import axios from 'axios';

export const registerUser = async (user) => {
  const response = await axios.post(
    'https://hmi-backend.onrender.com/api/user/register',
    user,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
};
export const loginUser = async (user) => {
  const response = await axios.post(
    'https://hmi-backend.onrender.com/api/user/login',
    user,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
};
