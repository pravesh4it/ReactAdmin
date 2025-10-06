// src/api/CountryLanguage.js
import axios from "axios";

const API = process.env.REACT_APP_API_URL?.replace(/\/+$/, "") ?? "";

/**
 * GET languages for a country
 * returns array of { id, countryId, languageId, languageName, languageDisplayName, isPrimary }
 */
export async function listCountryLanguages(countryId) {
  const res = await axios.get(`${API}/ManageCountryLanguage/${countryId}`);
  return res.data?.result?.data ?? res.data ?? [];
}

/**
 * Add (append) languages for a country
 * payload: { countryId: Guid, languageIds: Guid[], primaryLanguageId?: Guid }
 */
export async function addCountryLanguages(payload) {
  const res = await axios.post(`${API}/ManageCountryLanguage`, payload);
  return res.data;
}

/**
 * Update (replace) languages for a country
 * PUT /ManageCountryLanguage/{countryId}
 * payload: { countryId: Guid, languageIds: Guid[], primaryLanguageId?: Guid }
 */
export async function updateCountryLanguages(countryId, payload) {
  const res = await axios.put(`${API}/ManageCountryLanguage/${countryId}`, payload);
  return res.data;
}
export async function listCountries() {
  const res = await axios.get(`${API}/ManageCountryLanguage/countries`);
  return res.data?.result?.data ?? res.data ?? [];
}
