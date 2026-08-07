//@ts-nocheck
import LanguageUseCases from "./LanguageUseCases";
import {mockReturnedValue} from "../../../mockReturnedValue";
import LanguageService from "../../../DataProvider/Services/languageService";
import {Language} from "../Entities/Language";
import externalFunctionService from "../../../DataProvider/Services/externalFunctionService";
import {ExternalFuntion} from "../Entities/ExternalFuntion";

afterEach(() => {
  jest.clearAllMocks();
});

describe('all methods should work', ()=>{
  test("should call LanguageService.getLanguageById with the correct id", () => {
    const spy = jest
        .spyOn(LanguageService.prototype, "getLanguageById")
        .mockReturnValue(mockReturnedValue);

    const useCases = new LanguageUseCases();

    const result = useCases.getLanguageById("103");

    expect(spy).toHaveBeenCalledWith("103");
    expect(result).toBe(mockReturnedValue);
  });

  test('Using callExternalFuntion should use externalFunctionService method and return the right values', ()=>{
    //Arrange
    let callExternalFuntionMock = jest.spyOn(externalFunctionService.prototype, 'callExternalFuntion').mockImplementation((callback: any, externalFunction: ExternalFuntion) => callback(externalFunction));
    // @ts-ignore
    let languageUseCases = new LanguageUseCases();
    let externalFunction = new ExternalFuntion(1,"test_name", "test_label", "test_url",{},{},"test_resulting_action",121)

    //Act
    let result: any = languageUseCases.callExternalFuntion(()=>"callback return value", externalFunction);

    //Assert
    expect(callExternalFuntionMock).toHaveBeenCalledTimes(1)
    expect(result).toBe("callback return value")
  });

  test('Using getExternalFuntion should use externalFunctionService method and return the right values', ()=>{
    //Arrange
    let getExternalFuntionMock = jest.spyOn(externalFunctionService.prototype, 'getExternalFunctions').mockImplementation((callback: any, languageId: number) => callback(languageId));
    // @ts-ignore
    let languageUseCases = new LanguageUseCases();
    let languageId = 121;
    //Act
    let result: any = languageUseCases.getExternalFunctions(()=>"callback return value", languageId);

    //Assert
    expect(getExternalFuntionMock).toHaveBeenCalledTimes(1)
    expect(result).toBe("callback return value")
  });


})
