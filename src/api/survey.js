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
export async function AddRecontact(formData){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/survey/survey-recontact`;
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

export async function GetSurveys(){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/survey/survey-list`;
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
export async function GetPartnersSurvey(surveyId){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/survey/survey-partners-list/`+ surveyId;
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
export async function GetSurvey(surveyId){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/survey/view-survey/`+surveyId;
        console.log(URL);
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
export async function GetSurveyCSVList(surveyId){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/survey/survey-csvfile/`+surveyId;
        console.log(URL);
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
export async function UploadSurveyCSV(formData){
    try {   
        let URL = `${process.env.REACT_APP_API_URL}/survey/upload-survey-csv`;

        console.log(URL);
        debugger        
        let headers = {
            'Content-Type': 'multipart/form-data'
        };
        let result = await axiosCall(URL,'post', headers, formData, false);
        console.log(result);
        return result;
    }
    catch (err){
        console.log(err);
        return err;
    }
}

export async function GetSurveyByPartnerId(survey_partner_id){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/survey/get-survey-name/`+survey_partner_id;
        console.log(URL);
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
export async function GetPartners(surveyId){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/survey/view-survey/`+surveyId;
        console.log(URL);
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
export async function GetPartnerDetails(partnerId){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/client/`+partnerId;
        console.log(URL);
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
export async function UpdateSurveyStatus(id, data){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/survey/update-survey-status/`+id;
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

export async function CreateSurvey(data){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/survey/create-survey/`;
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
export async function CreateQuiz(data){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/survey/survey-prescreening/`;
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
export async function CloneSurvey(data){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/survey/clone-survey/`;
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
export async function UpdateSurvey(id, data){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/survey/update-survey/`+id;
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

export async function DeleteSurvey(id){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/survey/`+id;
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
export async function GetPartnersOptions(){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/survey/partners-list`;
        console.log(URL);
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
export async function AddPartnerToSurvey(data){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/survey/add-partner/`;
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
export async function UpdatePartnerToSurvey(data){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/survey/update-partner/`;
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
export async function DeletePartnerToSurvey(id){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/survey/survey-partner/`+id;
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
export async function DeletePartner(id){
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
export async function AddSurveyResponse(data){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/survey/add-surveyresponse/`;
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
export async function VerifySurveyResponse(data){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/survey/verify-surveyresponse/`;
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
export async function UpdateSurveyResponse(data){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/survey/complete-surveyresponse/`;
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
export async function GetSurveyReports(surveyId){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/survey/survey-report/?surveyid=`+surveyId;
        console.log(URL);
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
export async function GetSurveyById(surveyId){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/survey/edit-survey/`+surveyId;
        console.log(URL);
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
export async function GetSurveyPreScreening(surveyId){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/survey/survey-prescreening/?surveyid=`+surveyId;
        console.log(URL);
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
export async function GetSurveyPreScreeningQuest(surveyId){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/survey/survey-prescreening-questions/?id=`+surveyId;
        console.log(URL);
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

export async function GetIsSurveyPreScreening(surveyId){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/survey/survey-is-prescreening/?surveyid=`+surveyId;
        console.log(URL);
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

export async function SurveyQuestionsResponse(data){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/survey/validate-prescreener/`;
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
export async function SurveyResponseChangeStatus(data){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/survey/change-response-status/`;
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
export async function GetRatesById(type, id){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/rates/${type}/` + id;
        console.log(URL);
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
export async function AddRates(type, id, data){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/rates/${type}/` + id;
        console.log(URL);
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
export async function DeleteSurveyPreScreening(id){
    try {
        let URL = `${process.env.REACT_APP_API_URL}/survey/delete-prescreening-question/`+id;
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