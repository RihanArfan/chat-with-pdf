export const useExampleSessions = () => ([
  {
    id: '848b44cf-ff12-4964-abd3-bd5b0ed9cf0b',
    name: 'Cloudflare-Inc-NET-US-Q2-2024-Earnings-Call-1-August-2024-5_00-PM-ET.pdf',
    size: 0.311,
    chunks: 226,
    questions: [
      'What was the revenue growth rate in Q2?',
      'What are the example questions that the document answers?',
      'What were the key performance indicators for the quarter?',
      'What are the key outcomes from this call?',
    ],
  },
])

export const useIsExampleSession = () => {
  const exampleSessionIds = useExampleSessions()
  const sessionId = useSessionId()
  return computed(() => exampleSessionIds.some(({ id }) => id === sessionId.value))
}