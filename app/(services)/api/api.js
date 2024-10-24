import axios from 'axios';

const loginUser = async (email, password) => {
  const response = await axios.post('http://localhost:5000/api/user/login', {
    email,
    password,
  });

  return response.data;
};

const registerUser = async (email, password) => {
  const response = await axios.post('http://localhost:5000/api/user/register', {
    email,
    password,
  });

  return response.data;
};

export { loginUser, registerUser };
