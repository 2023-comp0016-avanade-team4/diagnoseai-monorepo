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
