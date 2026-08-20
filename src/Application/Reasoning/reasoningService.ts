import axios from "axios";
import { FullLanguage } from "../../Domain/ProductLineEngineering/Entities/Language";
import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";
import compileCLIF from "./compileCLIF";
import { Property } from "../../Domain/ProductLineEngineering/Entities/Property";

const SEMANTIC_TRANSLATOR_URL = "https://app.variamos.com/semantic_translator";

export class ReasoningService {
  savedQueries: string[] = [];
  results: any[] = [];

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
      this.results.push(response.data.result);
    } catch (error) {
      console.error(error);
    }
  }

  applySolution(solution: Record<string, any>, model: Model) {
    Object.entries(solution).forEach(([propertyFullName, value]) => {
      const [id, propertyName] = propertyFullName.split(".", 2);

      let properties: Property[] = [];
      const element = model.elements.find((element) => element.id === id);
      if (element) properties = element.properties;
      else {
        const relation = model.relationships.find(
          (relation) => relation.id === id,
        );
        if (relation) properties = relation.properties;
        else {
          const reification = model.reifications.find(
            (reification) => reification.id === id,
          );
          if (reification) properties = reification.properties;
          else {
            console.warn(
              `Solution item of id ${id} couldn't be linked back to the model`,
            );
            return;
          }
        }
      }

      const property = properties.find(
        (property) => property.name === propertyName,
      );
      property.value = value;
    });
  }
}

const reasoningService = new ReasoningService();

export default reasoningService;
