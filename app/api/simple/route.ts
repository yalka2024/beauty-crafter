// Simple API route that should work
export async function GET() {
  return Response.json({
    status: 'ok',
    message: 'Simple API is working',
    timestamp: new Date().toISOString()
  })
}
