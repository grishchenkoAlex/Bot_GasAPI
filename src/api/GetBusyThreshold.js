const axios = require("axios");

async function fetchBusyThreshold(apiKey, apiKeySecret) {
    const Auth = Buffer.from(apiKey + ":" + apiKeySecret).toString("base64");
    const chainId = 1;

    try {
        const response = await axios.get(
            `https://gas.api.infura.io/networks/${chainId}/busyThreshold`,
            { headers: { Authorization: `Basic ${Auth}` } }
        );
        return response.data.busyThreshold;  // Получение только значения busyThreshold
    } catch (error) {
        console.error("Error fetching busy threshold:", error);
        return null;  // Возврат null в случае ошибки
    }
}

module.exports = { fetchBusyThreshold };
