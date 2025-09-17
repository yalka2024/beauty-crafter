const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = 3006

// Simple HTML page
const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Beauty Crafter - Working!</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }
        .container {
            background: rgba(255,255,255,0.1);
            padding: 30px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
        }
        h1 { color: #fff; text-align: center; margin-bottom: 30px; }
        .status { background: #22c55e; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .test-section { background: rgba(255,255,255,0.1); padding: 20px; margin: 15px 0; border-radius: 8px; }
        .api-test { margin: 10px 0; }
        button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 5px;
        }
        button:hover { background: #2563eb; }
        .result { margin: 10px 0; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 5px; }
        a { color: #60a5fa; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌟 Beauty Crafter Platform</h1>
        
        <div class="status">
            <h2>✅ SUCCESS! Platform is Working!</h2>
            <p>Your Beauty Crafter platform is now running correctly.</p>
        </div>

        <div class="test-section">
            <h3>🧪 API Testing</h3>
            <div class="api-test">
                <button onclick="testAPI('/api/health')">Test Health API</button>
                <button onclick="testAPI('/api/status')">Test Status API</button>
                <button onclick="testAPI('/api/test')">Test Simple API</button>
            </div>
            <div id="api-results" class="result"></div>
        </div>

        <div class="test-section">
            <h3>🔗 Quick Links</h3>
            <ul>
                <li><a href="/api/health">Health Check API</a></li>
                <li><a href="/api/status">Status API</a></li>
                <li><a href="/api/test">Test API</a></li>
            </ul>
        </div>

        <div class="test-section">
            <h3>🚀 Next Steps</h3>
            <ol>
                <li><strong>✅ Platform Working:</strong> This confirms your setup is correct</li>
                <li><strong>🧪 Test APIs:</strong> Click the buttons above to test API endpoints</li>
                <li><strong>🌍 Deploy to Vercel:</strong> Ready for global deployment!</li>
            </ol>
        </div>

        <div class="test-section">
            <h3>📊 Server Info</h3>
            <p><strong>Port:</strong> ${PORT}</p>
            <p><strong>Status:</strong> <span style="color: #22c55e;">Running</span></p>
            <p><strong>Time:</strong> <span id="current-time"></span></p>
        </div>
    </div>

    <script>
        function testAPI(endpoint) {
            const resultDiv = document.getElementById('api-results');
            resultDiv.innerHTML = '<p>Testing ' + endpoint + '...</p>';
            
            fetch(endpoint)
                .then(response => response.json())
                .then(data => {
                    resultDiv.innerHTML = '<h4>✅ ' + endpoint + ' Success:</h4><pre>' + JSON.stringify(data, null, 2) + '</pre>';
                })
                .catch(error => {
                    resultDiv.innerHTML = '<h4>❌ ' + endpoint + ' Error:</h4><p>' + error.message + '</p>';
                });
        }

        function updateTime() {
            document.getElementById('current-time').textContent = new Date().toLocaleString();
        }
        
        updateTime();
        setInterval(updateTime, 1000);
    </script>
</body>
</html>
`

// Create server
const server = http.createServer((req, res) => {
    const url = req.url
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200)
        res.end()
        return
    }
    
    // Routes
    if (url === '/' || url === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(htmlContent)
    } 
    else if (url === '/api/health') {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
            },
            version: '1.0.0'
        }
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(health, null, 2))
    }
    else if (url === '/api/status') {
        const status = {
            status: 'ok',
            message: 'Beauty Crafter API is working perfectly!',
            timestamp: new Date().toISOString(),
            platform: 'Beauty Crafter',
            version: '1.0.0',
            features: ['Working Server', 'API Endpoints', 'Ready for Vercel']
        }
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(status, null, 2))
    }
    else if (url === '/api/test') {
        const test = {
            status: 'success',
            message: 'Test API working!',
            timestamp: new Date().toISOString(),
            data: { test: true, working: true }
        }
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(test, null, 2))
    }
    else {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Not found', url: url }))
    }
})

server.listen(PORT, () => {
    console.log(`🚀 Beauty Crafter Server Running!`)
    console.log(`📱 Open: http://localhost:${PORT}`)
    console.log(`🧪 Test: http://localhost:${PORT}/api/health`)
    console.log(`✅ Ready for testing!`)
})

server.on('error', (error) => {
    console.error('Server error:', error)
})
