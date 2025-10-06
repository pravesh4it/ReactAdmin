import { axiosCall } from "../Services/APIAXIOS";

export async function GetPartners(){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/partner/`;
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

export async function UpdatePartner(id, data){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/partner/`+id;
        console.log(URL);
        debugger
        let headers = {};
        let result = await axiosCall(URL,'put', headers, data, false);
        console.log(result);
        return result;
    }
    catch (err){
        console.log(err);
        return err;
    }
}
export async function AddPartner(data){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/partner/`;
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
export async function DeletePartner(id){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/partner/`+id;
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