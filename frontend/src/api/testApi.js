import axiosClient from "./axiosClient";

export const getTestApi = async () => {
  const response = await axiosClient.get("/test");
  return response.data;
};
