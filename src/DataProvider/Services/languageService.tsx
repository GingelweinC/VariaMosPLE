import { Language } from "../../Domain/ProductLineEngineering/Entities/Language";
import { LANGUAGES_CLIENT } from "../../Infraestructure/AxiosConfig";
import { LanguagesFilter } from "../../Domain/ProductLineEngineering/Entities/LanguagesFilter";

export default class LanguageService { 

  async getLanguageById(languageId: string): Promise<Language> {
    try {
      const res = await LANGUAGES_CLIENT.get("/" + languageId);
      const language: Language = res.data;
      return language;
    } catch (error) {
      console.log("Something wrong in getLanguageById Service:", error);
      throw error;
    }
  }

  async getElementsByLanguageId(languageId: string): Promise<any> {
    try {
      const res = await LANGUAGES_CLIENT.get("/" + languageId + "/element-types");
      const elements: any = res.data;
      return elements;
    } catch (error) {
      console.log("Something wrong in getElementsByLanguageId Service:", error);
      throw error;
    }
  }

  async getReificationsByLanguageId(languageId: string): Promise<any> {
    try {
      const res = await LANGUAGES_CLIENT.get("/" + languageId + "/reification-types");
      const reifications: any = res.data;
      await Promise.all(
        reifications.map(async (reification) => {
          const res = await LANGUAGES_CLIENT.get(
            "/" + languageId + "/reification-types/" + reification.uuid + "/endpoints"
          );

          reification.endpoints = res.data;
        })
      );
      return reifications;
    } catch (error) {
      console.log("Something wrong in getReificationsByLanguageId Service:", error);
      throw error;
    }
  }

  async getRelationsByLanguageId(languageId: string): Promise<any> {
    try {
      const res = await LANGUAGES_CLIENT.get("/" + languageId + "/relation-types");
      const relations: any = res.data;
      return relations;
    } catch (error) {
      console.log("Something wrong in getRelationsByLanguageId Service:", error);
      throw error;
    }
  }

  async getLanguagesByUser(): Promise<Language[]> {
    try {
      const filter= new LanguagesFilter();
      filter.status = ["draft", "pending", "published"];
      const res = await LANGUAGES_CLIENT.get("/", { params: filter });
      const languages: Language[] = res.data;

      return languages;
    } catch (error) {
      console.log("Something wrong in getLanguageDetail Service:", error);
      return [];
    }
  }

  getLanguages(callBack: any) {
    let languages: Language[] = [];
    try {
      LANGUAGES_CLIENT.get("/languages/detail").then((res) => {
        let responseAPISuccess: ResponseAPISuccess = new ResponseAPISuccess();
        responseAPISuccess = Object.assign(responseAPISuccess, res.data);

        if (responseAPISuccess.message?.includes("Error"))
          throw new Error(JSON.stringify(res.data));

        languages = Object.assign(languages, responseAPISuccess.data);
        callBack(languages);
      });
    } catch (error) {
      console.log("Something wrong in getLanguages service: " + error);
      callBack(languages);
    }
  }
}

export class ResponseAPISuccess {
  transactionId?: string;
  message?: string;
  data?: JSON;
  constructor(transactionId?: string, message?: string, data?: JSON) {
    this.transactionId = transactionId;
    this.message = message;
    this.data = data;
  }
}

export class ResponseAPIError {
  transactionId?: string;
  message?: string;
  errorCode?: string;
  data?: JSON;
  constructor(
    transactionId?: string,
    message?: string,
    errorCode?: string,
    data?: JSON
  ) {
    this.transactionId = transactionId;
    this.message = message;
    this.errorCode = errorCode;
    this.data = data;
  }
}
