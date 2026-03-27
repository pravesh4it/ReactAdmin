import { axiosCall } from "../Services/APIAXIOS";

export async function Login(data){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/auth/login/`;
        console.log(URL);
        debugger
        let headers = {};
        let result = await axiosCall(URL,'post', headers, data, false);
        console.log(result);
        return result;
    }
    catch (err){
        console.log(err);
        return err;
    }
}
export async function GetEmailbyCode(code){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/auth/get-email-by-code-admin/${code}`;
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
export async function ForgotPassword(data){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/auth/forgot-password/`;
        console.log(URL);
        debugger
        let headers = {};
        let result = await axiosCall(URL,'post', headers, data, false);
        console.log(result);
        return result;
    }
    catch (err){
        console.log(err);
        return err;
    }
}
export async function ResetPasswordAdmin(data){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/auth/reset-password-admin/`;
        console.log(URL);
        debugger
        let headers = {};
        let result = await axiosCall(URL,'post', headers, data, false);
        console.log(result);
        return result;
    }
    catch (err){
        console.log(err);
        return err;
    }
}
