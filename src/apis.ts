/*
  Consolidated consortium of API calls. All the APIs being in one
  place makes it easier to manage and maintain.
*/

import axios from "axios";

export const createWorkOrder = async (
  user_id: string,
  machine_id: string,
  task_name: string,
  task_desc: string,
) =>
  await axios.post("/api/createWorkOrder", {
    user_id,
    machine_id,
    task_name,
    task_desc,
  });

export const deleteWorkOrder = async (orderId: string) =>
  await axios.delete("/api/deleteWorkOrder", {
    data: { orderId },
  });

export const deleteMachine = async (machineId: string) =>
  await axios.delete("/api/deleteMachine", {
    data: { machineId },
  });

export const createMachine = async (manufacturer: string, model: string) =>
  await axios.post("/api/createMachine", {
    manufacturer,
    model,
  });

export const confirmValidation = async (
  validation_index_name: string,
  production_index_name: string,
) =>
  await axios.post("/api/confirmValidation", {
    validation_index_name,
    production_index_name,
  });

export const fetchIndexContent = async (searchIndex: string) =>
  await axios.get(`/api/indexContent?searchIndex=${searchIndex}`);

export const processingIndex = async (searchIndex: string) =>
  await axios.get(`/api/processingStatus?searchIndex=${searchIndex}`, {
    headers: {
      // disable cache for this one
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      Expires: "0",
    },
  });

export const fetchMachines = async () => await axios.get("/api/getMachines");

export const fetchWorkOrders = async () =>
  await axios.get("/api/getWorkOrders");
