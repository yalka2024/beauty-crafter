import { useState, useEffect } from 'react'
import Head from 'next/head'

export default function TestPage() {
  const [apiStatus, setApiStatus] = useState('loading')
  const [healthData, setHealthData] = useState(null)
  const [statusData, setStatusData] = useState(null)

  useEffect(() => {
    testAPIs()
  }, [])

  const testAPIs = async () => {
    try {
      // Test health API
      const healthResponse = await fetch('/api/health')
      if (healthResponse.ok) {
        const healthJson = await healthResponse.json()
        setHealthData(healthJson)
      }

      // Test status API
      const statusResponse = await fetch('/api/status')
      if (statusResponse.ok) {
        const statusJson = await statusResponse.json()
        setStatusData(statusJson)
      }

      setApiStatus('working')
    } catch (error) {
      console.error('API test failed:', error)
      setApiStatus('error')
    }
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <Head>
        <title>Beauty Crafter - Platform Test</title>
      </Head>

      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#2563eb', marginBottom: '10px' }}>🌟 Beauty Crafter Platform</h1>
        <p style={{ color: '#6b7280', fontSize: '18px' }}>Platform Testing Dashboard</p>
      </header>

      <div style={{ display: 'grid', gap: '20px' }}>
        {/* Platform Status */}
        <div style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px', 
          padding: '20px',
          backgroundColor: '#f9fafb'
        }}>
          <h2 style={{ color: '#1f2937', marginBottom: '15px' }}>🚀 Platform Status</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ 
              padding: '4px 12px', 
              borderRadius: '20px', 
              backgroundColor: apiStatus === 'working' ? '#dcfce7' : apiStatus === 'error' ? '#fee2e2' : '#fef3c7',
              color: apiStatus === 'working' ? '#166534' : apiStatus === 'error' ? '#dc2626' : '#92400e',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              {apiStatus === 'working' ? '✅ Working' : apiStatus === 'error' ? '❌ Error' : '⏳ Loading'}
            </span>
            <span style={{ color: '#6b7280' }}>
              {apiStatus === 'working' ? 'All systems operational' : 
               apiStatus === 'error' ? 'Some issues detected' : 'Testing in progress...'}
            </span>
          </div>
        </div>

        {/* Health API Test */}
        <div style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px', 
          padding: '20px',
          backgroundColor: '#ffffff'
        }}>
          <h3 style={{ color: '#1f2937', marginBottom: '15px' }}>🔧 Health API Test</h3>
          {healthData ? (
            <div style={{ fontSize: '14px', color: '#374151' }}>
              <p><strong>Status:</strong> <span style={{ color: '#059669' }}>{healthData.status}</span></p>
              <p><strong>Uptime:</strong> {Math.round(healthData.uptime)} seconds</p>
              <p><strong>Memory:</strong> {healthData.memory.used}MB / {healthData.memory.total}MB</p>
              <p><strong>Response Time:</strong> {healthData.responseTime}ms</p>
              <p><strong>Environment:</strong> {healthData.environment}</p>
            </div>
          ) : (
            <p style={{ color: '#6b7280' }}>Testing health API...</p>
          )}
        </div>

        {/* Status API Test */}
        <div style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px', 
          padding: '20px',
          backgroundColor: '#ffffff'
        }}>
          <h3 style={{ color: '#1f2937', marginBottom: '15px' }}>📊 Status API Test</h3>
          {statusData ? (
            <div style={{ fontSize: '14px', color: '#374151' }}>
              <p><strong>Status:</strong> <span style={{ color: '#059669' }}>{statusData.status}</span></p>
              <p><strong>Message:</strong> {statusData.message}</p>
              <p><strong>Version:</strong> {statusData.version}</p>
              <p><strong>Response Time:</strong> {statusData.responseTime}ms</p>
              {statusData.features && (
                <div style={{ marginTop: '10px' }}>
                  <strong>Features:</strong>
                  <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                    {Object.entries(statusData.features).map(([key, value]) => (
                      <li key={key}>
                        {key}: <span style={{ color: value === 'working' || value === 'active' || value === 'enabled' || value === 'connected' ? '#059669' : '#dc2626' }}>
                          {value}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: '#6b7280' }}>Testing status API...</p>
          )}
        </div>

        {/* Manual Testing Guide */}
        <div style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px', 
          padding: '20px',
          backgroundColor: '#f0f9ff'
        }}>
          <h3 style={{ color: '#1f2937', marginBottom: '15px' }}>🧪 Manual Testing Guide</h3>
          <div style={{ fontSize: '14px', color: '#374151' }}>
            <p style={{ marginBottom: '10px' }}><strong>Test these URLs:</strong></p>
            <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
              <li><a href="/" style={{ color: '#2563eb' }}>🏠 Home Page</a></li>
              <li><a href="/api/health" style={{ color: '#2563eb' }}>🔧 Health API</a></li>
              <li><a href="/api/status" style={{ color: '#2563eb' }}>📊 Status API</a></li>
              <li><a href="/test" style={{ color: '#2563eb' }}>🧪 This Test Page</a></li>
            </ul>
            
            <p style={{ marginTop: '15px', marginBottom: '10px' }}><strong>What to check:</strong></p>
            <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
              <li>✅ Pages load without errors</li>
              <li>✅ APIs return JSON responses</li>
              <li>✅ No console errors (F12)</li>
              <li>✅ Reasonable response times</li>
            </ul>
          </div>
        </div>

        {/* Next Steps */}
        <div style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px', 
          padding: '20px',
          backgroundColor: '#f0fdf4'
        }}>
          <h3 style={{ color: '#1f2937', marginBottom: '15px' }}>🚀 Next Steps</h3>
          <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
            <p><strong>If everything works above:</strong></p>
            <ol style={{ paddingLeft: '20px', marginTop: '10px' }}>
              <li>Platform is ready for Vercel deployment</li>
              <li>Run: <code style={{ backgroundColor: '#e5e7eb', padding: '2px 6px', borderRadius: '4px' }}>npm run deploy:vercel</code></li>
              <li>Your app will be live worldwide in minutes!</li>
            </ol>
            
            <p style={{ marginTop: '15px' }}><strong>If issues found:</strong></p>
            <ol style={{ paddingLeft: '20px', marginTop: '10px' }}>
              <li>Check browser console (F12) for errors</li>
              <li>Try refreshing the page</li>
              <li>Report specific error messages</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
