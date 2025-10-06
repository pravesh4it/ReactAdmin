// src/api/Country.js
import axios from "axios";

const API = process.env.REACT_APP_API_URL?.replace(/\/+$/, "") ?? "";

export async function listCountries() {
  const res = await axios.get(`${API}/Country`);
  // adapt to your API shape (result.data or direct array)
  return res.data?.result?.data ?? res.data ?? [];
}

export async function getCountryById(id) {
  const res = await axios.get(`${API}/Country/${id}`);
  return res.data;
}

export async function createCountry(payload) {
  const res = await axios.post(`${API}/Country`, payload);
  return res.data;
}

export async function updateCountry(id, payload) {
  const res = await axios.put(`${API}/Country/${id}`, payload);
  return res.data;
}

export async function deleteCountry(id) {
  const res = await axios.delete(`${API}/Country/${id}`);
  return res.status === 204 || res.status === 200;
}
