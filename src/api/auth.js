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
