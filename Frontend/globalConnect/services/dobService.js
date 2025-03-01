import axios from "axios";
import config from "../constants/config";

const ip = config.API_IP;


export const updateDOB = async (authToken, dob) => {
  try {
    const response = await axios.put(
      `http://${ip}:3000/api/profile/update-dob`,
      { dob },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    console.log("DOB updated successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error updating DOB:", error.response ? error.response.data : error.message);
    throw error;
  }
};


export const checkDOB = async (authToken) => {
  try {
    const response = await axios.get(
      `http://${ip}:3000/api/profile/check-dob`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    console.log("DOB check response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error checking DOB:", error.response ? error.response.data : error.message);
    throw error;
  }
};
