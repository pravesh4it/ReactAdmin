import axios from "axios";
//Error codes for error messages in the form

export async function axiosCall(Url, Type, Headers = {}, Data, isLoading = false) {
    const loadingElement = document.getElementById('loading-indicator');

    if (isLoading && loadingElement) {
        loadingElement.style.display = 'block';
    }

    let Response_Result = '';
    let errors = null;
    debugger;
    try {
        if (localStorage.getItem("loginState")) {
            const token = localStorage.getItem("token");
            Headers.Authorization = "Bearer " + token;
        }

        const res = await axios({
            method: Type,
            url: Url,
            headers: Headers,
            data: Data
        });

        Response_Result = res;

    } catch (err) {
debugger;
        if (err.response) {
            const status = err.response.status;

            if (status === 401) {
                localStorage.clear();
                window.location.href = "/";
            }

            if (status === 403) {
                //errors
                debugger;
                //alert("You do not have permission to perform this action.");
                err.message = "You do not have permission to perform this action.";
                //err.response.data = { message: "You do not have permission to perform this action." };
                //response.errors.message
            }

        } else if (err.code === "ERR_NETWORK") {
            alert("Network error. Server might be unreachable.");
        }

        errors = err;
    }

    if (isLoading && loadingElement) {
        loadingElement.style.display = 'none';
    }

    return {
        errors,
        result: Response_Result
    };
}

export async function downloadFile(Url, hooks, isLoading = false) {
    const loadingElement = document.getElementById('loading-indicator');
    if (isLoading) {
        loadingElement.style.display = 'block';
    }
    let Response_Result = '';
    let errors = null;
    try {
        if (localStorage.loginState) {
            const t = JSON.parse(localStorage.loginState);
            Headers.Authorization = "Token " + t.auth.token;
        }
        const response = await axios({
            url: Url, // replace with your API endpoint
            method: 'get',
            responseType: 'blob', // important for handling file downloads
        });
        const parsedUrl = new URL(Url);

        // Extract the filename from the query parameters
        const filename = parsedUrl.searchParams.get('fileName');
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();

        // Clean up
        link.parentNode.removeChild(link);

        Response_Result = response;
    }
    catch (err) {
        console.log('downloadFile', err);

        if (err?.code === "ERR_NETWORK") {
            setTimeout(() => { window.location.href = '/login'; }, 100);
        }
        //else if (err.response?.status == 401 && err.response?.statusText == "Unauthorized") {
        //  //  setTimeout(() => { window.location.href = '/login'; }, 100);
        //}
        console.error('Error downloading the file:', err);
        errors = err;
    }
    if (isLoading) {
        loadingElement.style.display = 'none';
    }
    return {
        errors: errors,
        result: Response_Result
    };
}
