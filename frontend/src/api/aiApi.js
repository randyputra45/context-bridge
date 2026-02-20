import axiosInstance from "./axiosInstance";

export const queryApi = (data) => axiosInstance.post("/query", data);
