import ExternalFuntionService from "../../../DataProvider/Services/externalFunctionService";
import LanguageService from "../../../DataProvider/Services/languageService";
import { ExternalFuntion } from "../Entities/ExternalFuntion";
import { FullLanguage, Language } from "../Entities/Language";

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

  async getLanguagesByUser(): Promise<Language[]> {
    return await this.languageService.getLanguagesByUser();
  }

  async getLanguageById(languageId: string): Promise<Language> {
    return await this.languageService.getLanguageById(languageId);
  }

  async getFullLanguageById(languageId: string): Promise<FullLanguage> {
    console.log("getFullLanguageById languageId:", languageId);
    const [
        language,
        elements,
        reifications,
        relations,
    ] = await Promise.all([
        this.languageService.getLanguageById(languageId),
        this.languageService.getElementsByLanguageId(languageId),
        this.languageService.getReificationsByLanguageId(languageId),
        this.languageService.getRelationsByLanguageId(languageId),
    ]);

    return {
        ...language,
        Elements: elements,
        Reifications: reifications,
        Relationships: relations,
    };
}

  callExternalFuntion(callback: any, externalFunction: ExternalFuntion): any[] {
    return this.externalFunctionService.callExternalFuntion(
      callback,
      externalFunction
    );
  }

  getExternalFunctions(callback: any, languageId: string) {
    return this.externalFunctionService.getExternalFunctions(
      callback,
      languageId
    );
  }
}
