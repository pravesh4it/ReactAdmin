import axios from "axios";
import { axiosCall } from "../Services/APIAXIOS";

export async function GetOptionsSurvey(){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/survey/get-options-data`;
        console.log(URL);
        debugger
        let headers = {};
        let result = await axiosCall(URL,'get', headers, {}, false);
        console.log(result);
        return result;
    }
    catch (err){
        console.log(err);
        return err;
    }
}
export async function CreateInvoice(formData){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/Invoice`;
        console.log(URL);
        debugger
        let headers = {};
        let result = await axiosCall(URL,'post', headers, formData, false, false);
        console.log(result);
        return result;
    }
    catch (err){
        console.log(err);
        return err;
    }
}
// Get invoices list for a survey (returns { result: { status, data: [...] } } shape or adapt)
export const getInvoicesBySurvey = async (surveyId) => {
    try {
        let URL = `${process.env.REACT_APP_API_URL}/invoice/by-survey/${surveyId}`;
        console.log(URL);
        debugger
        let headers = {};
        let result = await axiosCall(URL,'get', headers, {}, false);
        console.log(result);
        return result;
    }
    catch (err){
        console.log(err);
        return err;
    }
};

// Download PDF (returns blob)
export const downloadInvoicePdf = async (invoiceId) => {
  try {
        let URL = `${process.env.REACT_APP_API_URL}/invoice/${invoiceId}/pdf`;
        console.log(URL);
        return axios.get(URL, {
            responseType: "blob",
        });
    }
    catch (err){
        console.log(err);
        return err;
    }
};
export function sendInvoiceWithPdfAttachment(id, file, { toEmail, subject, body }) {
    let URL = `${process.env.REACT_APP_API_URL}/invoice/${id}/send-with-attachment`;
    const form = new FormData();
    form.append("pdf", file); // IFormFile 'Pdf' नाम से मैप होगा (नीचे C सेक्शन)
    if (toEmail) form.append("toEmail", toEmail);
    if (subject) form.append("subject", subject);
    if (body) form.append("body", body);

    return axios.post(URL, form, {
        headers: { "Content-Type": "multipart/form-data" },
    });
}

// Send invoice (email) - server should handle sending; adapt HTTP method/route to your API
export const sendInvoiceById = async (invoiceId) => {
    try {
        let URL = `${process.env.REACT_APP_API_URL}/invoice/${invoiceId}/send`;
        console.log(URL);
        debugger
        let headers = {};
        let result = await axiosCall(URL,'post', headers, '', false, false);
        console.log(result);
        return result;
    }
    catch (err){
        console.log(err);
        return err;
    }
};