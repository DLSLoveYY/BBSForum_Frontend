// src/api/post.js
import axios from 'axios'

const base = 'http://localhost:8080'

export const fetchPostPage = (page = 1, size = 10) => {
  return axios.get(`${base}/api/post/page?page=${page}&size=${size}`)
    .then(res => res.data)
}

export const addPostApi = (data, token) => {
  return axios.post(
    'http://localhost:8080/api/post/add',
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  ).then(res => res.data)
}
