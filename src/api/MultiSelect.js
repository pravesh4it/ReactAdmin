import { axiosCall } from "../Services/APIAXIOS";
export async function listMultiSelects(selectionType) {
   try {
        let URL = `${process.env.REACT_APP_API_URL}/multiselect?selectionType=${encodeURIComponent(selectionType)}`;
        console.log("Calling:", URL);
        let headers = {};
        let result = await axiosCall(URL, 'get', headers, {}, false);
        console.log("Overview result:", result);
        return result;
    } catch (err) {
        console.error("Error in GetDashboardOverview:", err);
        return err;
    }
}

export async function createMultiSelect(payload) {
 try {
        let URL = `${process.env.REACT_APP_API_URL}/multiselect/`;
        console.log(URL);
        debugger
        let headers = {};
        let result = await axiosCall(URL,'post', headers, payload, false);
        console.log(result);
        return result;
    }
    catch (err){
        console.log(err);
        return err;
    }
}


export async function updateMultiSelect(id, payload) {
   try {
        let URL = `${process.env.REACT_APP_API_URL}/multiselect/${encodeURIComponent(id)}`;
        console.log(URL);
        debugger
        let headers = {};
        let result = await axiosCall(URL,'put', headers, payload, false);
        console.log(result);
        return result;
    }
    catch (err){
        console.log(err);
        return err;
    }
}

export async function deleteMultiSelect(id) {
 try {
        let URL = `${process.env.REACT_APP_API_URL}/multiselect/`+id;
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
