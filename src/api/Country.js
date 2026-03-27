// src/api/Country.js
import axios from "axios";
import { axiosCall } from "../Services/APIAXIOS";

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
 try {
        let URL = `${process.env.REACT_APP_API_URL}/country/`+id;
        console.log(URL);
        debugger
        let headers = {};
        let result = await axiosCall(URL,'delete', headers, {}, false);
        console.log(result);
        return result;
    }
    catch (err){
        console.log(err);
        return err;
    }
}

