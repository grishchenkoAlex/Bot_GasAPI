const {
  bot,
  fetchAndSendBaseFeeHistory,
  fetchAndSendBaseFeePercentile,
  fetchAndSendBusyThreshold,
  fetchAndSendGasPrices,
} = require('../core/bot')
const { fetchBaseFeeHistory } = require('../api/GetBaseFeeHistory')
jest.mock('../api/GetBaseFeeHistory')

jest.mock('dotenv', () => ({
  config: jest.fn().mockImplementation(() => {
    process.env.TELEGRAM_TOKEN = '111'
  }),
}))

describe('fetchAndSendBaseFeeHistory', () => {
  const chatId = 12345 // Пример chatId
  const mockSendPhoto = jest.fn()
  const mockSendMessage = jest.fn()

  // Мокаем функции бота
  bot.sendPhoto = mockSendPhoto
  bot.sendMessage = mockSendMessage

  beforeEach(() => {
    jest.clearAllMocks() // Очистка моков перед каждым тестом
  })

  it('should send a chart photo when data is received', async () => {
    const mockData = Array(100)
      .fill(0)
      .map((_, i) => `Data ${i}`)
    fetchBaseFeeHistory.mockResolvedValue(mockData)

    await fetchAndSendBaseFeeHistory(chatId)

    expect(fetchBaseFeeHistory).toHaveBeenCalled()
    expect(mockSendPhoto).toHaveBeenCalledWith(chatId, expect.anything()) // Проверяем, что отправлено фото
    expect(mockSendMessage).toHaveBeenCalledWith(
      chatId,
      expect.stringContaining('Last base fee value:'),
    ) // Проверяем текстовое сообщение
  })

  it('should send an error message when data is empty', async () => {
    fetchBaseFeeHistory.mockResolvedValue([])

    await fetchAndSendBaseFeeHistory(chatId)

    expect(fetchBaseFeeHistory).toHaveBeenCalled()
    expect(mockSendMessage).toHaveBeenCalledWith(
      chatId,
      'Failed to generate or send chart.',
    )
  })

  it('should handle errors gracefully', async () => {
    fetchBaseFeeHistory.mockRejectedValue(new Error('API Error'))

    await fetchAndSendBaseFeeHistory(chatId)

    expect(fetchBaseFeeHistory).toHaveBeenCalled()
    expect(mockSendMessage).toHaveBeenCalledWith(
      chatId,
      'Failed to generate or send chart.',
    )
  })
})
