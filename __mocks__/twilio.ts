const mockTwilio = jest.fn(() => ({
  messages: {
    create: jest.fn().mockResolvedValue({ sid: 'mock_message_sid' })
  }
}))

export default mockTwilio
