import axios from "axios";
import { FullLanguage } from "../../Domain/ProductLineEngineering/Entities/Language";
import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";
import compileCLIF from "./compileCLIF";

const SEMANTIC_TRANSLATOR_URL = "https://app.variamos.com/semantic_translator";

export class ReasoningService {
  currentModelCLIF: string = "";
  solvers: any[] = [];

  syncCurrentModelCLIF(
    this: ReasoningService,
    model: Model,
    language: FullLanguage,
  ) {
    this.currentModelCLIF = compileCLIF(model, language);
  }

  async syncSolvers(this: ReasoningService) {
    try {
      const response = await axios.get(SEMANTIC_TRANSLATOR_URL + "/solvers");
      this.solvers = response.data.solvers;
    } catch (error) {
      console.error(error);
    }
  }

  async execute(this: ReasoningService, query: string, solver?: string) {
    try {
      const response = await axios.post(SEMANTIC_TRANSLATOR_URL + "/solve", {
        model: this.currentModelCLIF,
        model_language: "clif",
        solver: solver,
        query: JSON.parse(query),
        options: {},
      });
      console.log(response);
    } catch (error) {
      console.error(error);
    }
  }
}

const reasoningService = new ReasoningService();

export default reasoningService;
