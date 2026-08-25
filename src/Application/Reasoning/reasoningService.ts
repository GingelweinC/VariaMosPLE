import axios from "axios";
import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";
import compileCLIF from "./compileCLIF";
import { Property } from "../../Domain/ProductLineEngineering/Entities/Property";
import ProjectService from "../Project/ProjectService";

const SEMANTIC_TRANSLATOR_URL = "https://app.variamos.com/semantic_translator";

export class Result {
  modelName: string;
  timestamp: Date;
  satisfiable?: boolean;
  solutions?: Record<string, any>[];
  iterations?: any[]; // TODO: Handle iterations results

  constructor(
    modelName: string,
    result: {
      satisfiable?: boolean;
      solutions?: Record<string, any>[];
      iterations?: any[];
    },
  ) {
    this.modelName = modelName;
    this.timestamp = new Date();
    this.satisfiable = result.satisfiable;
    this.solutions = result.solutions;
    this.iterations = result.iterations;
  }
}

export class ReasoningService {
  savedQueries: string[] = [];
  results: Result[] = [];

  currentModelName?: string;
  currentModelCLIF?: string;
  solvers: any[] = [];

  syncCurrentModelCLIF(this: ReasoningService, projectService: ProjectService) {
    this.currentModelName = projectService.currentModel.name;
    this.currentModelCLIF = compileCLIF(
      projectService.currentModel,
      projectService.currentLanguage,
    );
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
      this.results.push(
        new Result(this.currentModelName, response.data.result),
      );
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
