import axiosInstance from "./axiosInstance";

export const getContextConnections = () => axiosInstance.get("/context");
