
const axios = require("axios");

async function fetchBaseFeeHistory(apiKey, apiKeySecret) {
    const Auth = Buffer.from(apiKey + ":" + apiKeySecret).toString("base64");
    const chainId = 1;  // The chain ID of the supported network
  
    try {
      const { data } = await axios.get(
        `https://gas.api.infura.io/networks/${chainId}/baseFeeHistory`,
        {
          headers: {
            Authorization: `Basic ${Auth}`,
          },
        },
      );
      return data;  // Возвращаем полученные данные
    } catch (error) {
      console.error("Server responded with:", error);
      return "Failed to fetch data. Please check the logs.";
    }
  }
  
  module.exports = { fetchBaseFeeHistory };