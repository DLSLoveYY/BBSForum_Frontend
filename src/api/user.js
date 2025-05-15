import axios from 'axios'

const base = 'http://localhost:8080'

export const loginApi = (data) => {
  return axios.post(`${base}/api/user/login`, data).then(res => res.data)
}

export const registerApi = (data) => {
  return axios.post(`${base}/api/user/register`, data).then(res => res.data)
}
