import { axiosCall } from "../Services/APIAXIOS";

export async function GetClents(){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/client/`;
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

export async function UpdateClient(id, data){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/client/`+id;
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
export async function AddClient(data){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/client/`;
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
export async function DeleteClient(id){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/client/`+id;
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