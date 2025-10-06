import { axiosCall } from "../Services/APIAXIOS";

export async function GetUsers(){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/users/`;
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

export async function UpdateUser(id, data){
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
export async function AddUser(data){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/auth/register/`;
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
export async function DeleteUser(id){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/auth/deleteuser/`+id;
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
export async function GetOptions(){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/users/options`;
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
export async function GetUser(id){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/users/user-profile/${id}`;
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
export async function GetAdminProfile(id){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/users/admin-profile/${id}`;
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
export async function ChangePassword(data){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/auth/change-password`;
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
