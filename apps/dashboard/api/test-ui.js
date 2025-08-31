// Simple test UI for the minimal endpoint
module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>OpenAI Test Interface</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            button { background: #0066cc; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
            button:hover { background: #0052a3; }
            .result { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; white-space: pre-wrap; }
            .error { background: #ffe6e6; color: #cc0000; }
            .success { background: #e6ffe6; color: #006600; }
        </style>
    </head>
    <body>
        <h1>OpenAI Backend Test Interface</h1>
        
        <div>
            <h3>Test Minimal OpenAI Endpoint</h3>
            <button onclick="testMinimal()">Test Minimal Endpoint</button>
            <div id="minimal-result" class="result" style="display: none;"></div>
        </div>
        
        <div>
            <h3>Test Health Check</h3>
            <button onclick="testHealth()">Test Health Check</button>
            <div id="health-result" class="result" style="display: none;"></div>
        </div>

        <script>
        async function testMinimal() {
            const resultDiv = document.getElementById('minimal-result');
            resultDiv.style.display = 'block';
            resultDiv.className = 'result';
            resultDiv.textContent = 'Testing minimal endpoint...';
            
            try {
                const response = await fetch('/api/test-minimal', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer test-token'
                    },
                    body: JSON.stringify({ query: 'Hello, test query' })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    resultDiv.className = 'result success';
                    resultDiv.textContent = 'SUCCESS:\\n' + JSON.stringify(data, null, 2);
                } else {
                    resultDiv.className = 'result error';
                    resultDiv.textContent = 'ERROR (' + response.status + '):\\n' + JSON.stringify(data, null, 2);
                }
            } catch (error) {
                resultDiv.className = 'result error';
                resultDiv.textContent = 'FETCH ERROR:\\n' + error.message;
            }
        }
        
        async function testHealth() {
            const resultDiv = document.getElementById('health-result');
            resultDiv.style.display = 'block';
            resultDiv.className = 'result';
            resultDiv.textContent = 'Testing health check...';
            
            try {
                const response = await fetch('/api/health-check');
                const data = await response.json();
                
                if (response.ok) {
                    resultDiv.className = 'result success';
                    resultDiv.textContent = 'HEALTH CHECK:\\n' + JSON.stringify(data, null, 2);
                } else {
                    resultDiv.className = 'result error';
                    resultDiv.textContent = 'ERROR (' + response.status + '):\\n' + JSON.stringify(data, null, 2);
                }
            } catch (error) {
                resultDiv.className = 'result error';
                resultDiv.textContent = 'FETCH ERROR:\\n' + error.message;
            }
        }
        </script>
    </body>
    </html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
};