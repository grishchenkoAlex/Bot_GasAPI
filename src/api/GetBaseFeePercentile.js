const axios = require('axios')

// Функция для получения процентиля базовой комиссии
async function fetchBaseFeePercentile(apiKey, apiKeySecret) {
  const Auth = Buffer.from(apiKey + ':' + apiKeySecret).toString('base64')
  const chainId = 1

  try {
    const { data } = await axios.get(
      `https://gas.api.infura.io/networks/${chainId}/baseFeePercentile`,
      {
        headers: {
          Authorization: `Basic ${Auth}`,
        },
      },
    )
    return data // Возвращаем полученные данные
  } catch (error) {
    console.error('Server responded with:', error)
    return null
  }
}

module.exports = { fetchBaseFeePercentile }
