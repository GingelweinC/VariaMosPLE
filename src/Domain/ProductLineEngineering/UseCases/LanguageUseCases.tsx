import ExternalFuntionService from "../../../DataProvider/Services/externalFunctionService";
import LanguageService from "../../../DataProvider/Services/languageService";
import { ExternalFuntion } from "../Entities/ExternalFuntion";
import { Language } from "../Entities/Language";

export default class LanguageUseCases {
  private languageService: LanguageService = new LanguageService();
  private externalFunctionService: ExternalFuntionService =
    new ExternalFuntionService();

  getLanguageByName(languageName: string, languages: Language[]): Language {
    const languagesFilter: Language = languages.filter(
      (language) => language.name === languageName
    )[0];
    return languagesFilter;
  }

  async getLanguagesByUser(user: string): Promise<Language[]> {
    return await this.languageService.getLanguagesByUser(user);
  }

  getLanguagesDetail(): Language[] {
    return this.languageService.getLanguagesDetail();
  }

  getLanguagesDetailCll(callBack: any) {
    return this.languageService.getLanguages(callBack);
  }

  callExternalFuntion(callback: any, externalFunction: ExternalFuntion): any[] {
    return this.externalFunctionService.callExternalFuntion(
      callback,
      externalFunction
    );
  }

  getExternalFunctions(callback: any, languageId: number) {
    return this.externalFunctionService.getExternalFunctions(
      callback,
      languageId
    );
  }
}
