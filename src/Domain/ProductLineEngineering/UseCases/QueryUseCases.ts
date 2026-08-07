import axios from "axios";
import ProjectService from "../../../Application/Project/ProjectService";
import * as alertify from "alertifyjs";
import { Query } from "../Entities/Query";

export function runQuery(
  projectService: ProjectService,
  translatorEndpoint: string,
  query: Query,
) {
  return runQueryFromModel(
    projectService,
    translatorEndpoint,
    query,
    projectService.getTreeIdItemSelected(),
  );
}

export function runQueryFromModel(
  projectService: ProjectService,
  translatorEndpoint: string,
  query: Query,
  modelSelectedId: string,
) {
  // We must build the request body both from the query and the project
  // information.

  // First, get the project information.
  // get currently selected language
  const semantics = projectService.currentLanguage.semantics;
  const data = {
    rules: semantics,
    query: query,
    modelSelectedId: modelSelectedId,
    transactionId: projectService.generateId(),
    project: projectService.project,
    input: "vmos",
  };
  alertify.success("request sent ...");
  return axios
    .post(translatorEndpoint, { data })
    .then((response) => {
      alertify.success("request successful ...");
      return response.data.data.content;
    })
    .catch((error) => {
      alertify.error("something went wrong ...");
      console.error(error);
      return null;
    });
}

//// Used in TreeExplorer
export function getCurrentConstraints(projectService: ProjectService) {
  if (projectService.currentLanguage) {
    const modelSelectedId = projectService.getTreeIdItemSelected();
    const activeModel = projectService.findModelById(
      projectService.getProject(),
      modelSelectedId,
    );
    if (activeModel) {
      return activeModel.constraints;
    } else {
      console.warn("No model selected");
    }
  } else {
    console.warn("No currently active language");
  }
  return "";
}

//// Used in TreeExplorer
export function setModelConstraints(
  projectService: ProjectService,
  constraints: string,
) {
  if (projectService.currentLanguage) {
    const modelSelectedId = projectService.getTreeIdItemSelected();
    const activeModel = projectService.findModelById(
      projectService.getProject(),
      modelSelectedId,
    );
    if (activeModel) {
      activeModel.constraints = constraints;
    } else {
      console.warn("No model selected");
    }
  } else {
    console.warn("No currently active language");
  }
}
