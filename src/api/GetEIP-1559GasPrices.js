const axios = require("axios");

async function fetchSuggestedGasFees(apiKey, apiKeySecret) {
  const Auth = Buffer.from(apiKey + ":" + apiKeySecret).toString("base64");
  const chainId = 1;

  try {
    const response = await axios.get(
      `https://gas.api.infura.io/networks/${chainId}/suggestedGasFees`,
      {
        headers: {
          Authorization: `Basic ${Auth}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching suggested gas fees:", error);
    return null;
  }
}

module.exports = { fetchSuggestedGasFees };
