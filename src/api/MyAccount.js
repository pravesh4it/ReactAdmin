import { axiosCall } from "../Services/APIAXIOS";

/** =========================
 *  My Account Endpoints
 *  =========================
 *  GET    /account/me
 *  PUT    /account/me
 *  POST   /account/change-password
 *  POST   /account/avatar        (multipart)
 *  DELETE /account/avatar        (optional)
 *  PUT    /account/preferences   (optional split)
 */

// ✅ Get my profile
export async function GetMyProfile() {
  try {
    const URL = `${process.env.REACT_APP_API_URL}/account/me`;
    console.log("Calling:", URL);
    const headers = {};
    const result = await axiosCall(URL, "get", headers, {}, false);
    console.log("GetMyProfile result:", result);
    return result;
  } catch (err) {
    console.error("Error in GetMyProfile:", err);
    return err;
  }
}

// ✅ Update my profile (name, email, phone, company, etc.)
export async function UpdateMyProfile(data) {
  try {
    const URL = `${process.env.REACT_APP_API_URL}/account/me`;
    console.log("Calling:", URL);
    const headers = {};
    const result = await axiosCall(URL, "put", headers, data, false);
    console.log("UpdateMyProfile result:", result);
    return result;
  } catch (err) {
    console.error("Error in UpdateMyProfile:", err);
    return err;
  }
}

// ✅ Change password
export async function ChangeMyPassword({ currentPassword, newPassword }) {
  try {
    const URL = `${process.env.REACT_APP_API_URL}/account/change-password`;
    console.log("Calling:", URL);
    const headers = {};
    const payload = { currentPassword, newPassword };
    const result = await axiosCall(URL, "post", headers, payload, false);
    console.log("ChangeMyPassword result:", result);
    return result;
  } catch (err) {
    console.error("Error in ChangeMyPassword:", err);
    return err;
  }
}

// ✅ Upload avatar (multipart/form-data)
export async function UploadMyAvatar(file) {
  try {
    const URL = `${process.env.REACT_APP_API_URL}/account/avatar`;
    console.log("Calling:", URL);
    const formData = new FormData();
    formData.append("file", file);
    // Let axios set the boundary automatically if your axiosCall supports FormData.
    // If needed, set Content-Type explicitly:
    const headers = { "Content-Type": "multipart/form-data" };
    const result = await axiosCall(URL, "post", headers, formData, false);
    console.log("UploadMyAvatar result:", result);
    return result;
  } catch (err) {
    console.error("Error in UploadMyAvatar:", err);
    return err;
  }
}

// 🔁 Optional: Delete avatar
export async function DeleteMyAvatar() {
  try {
    const URL = `${process.env.REACT_APP_API_URL}/account/avatar`;
    console.log("Calling:", URL);
    const headers = {};
    const result = await axiosCall(URL, "delete", headers, {}, false);
    console.log("DeleteMyAvatar result:", result);
    return result;
  } catch (err) {
    console.error("Error in DeleteMyAvatar:", err);
    return err;
  }
}

// 🔁 Optional: Update preferences separately (timezone, language, theme)
export async function UpdateMyPreferences(data) {
  try {
    const URL = `${process.env.REACT_APP_API_URL}/account/preferences`;
    console.log("Calling:", URL);
    const headers = {};
    const result = await axiosCall(URL, "put", headers, data, false);
    console.log("UpdateMyPreferences result:", result);
    return result;
  } catch (err) {
    console.error("Error in UpdateMyPreferences:", err);
    return err;
  }
}
