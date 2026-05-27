const express = require('express');
const axios = require('axios');
const app = express();

// Base HTML Page with Search Engine & Integrated Bookmark Manager
const getHomeHTML = () => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cloud Proxy Browser</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: #0b0f19; color: #f3f4f6; margin: 0; padding: 20px; box-sizing: border-box; }
        .wrapper { background: #111827; border: 1px solid #1f2937; padding: 40px; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); text-align: center; width: 100%; max-width: 550px; margin-bottom: 25px; }
        h2 { margin-top: 0; color: #38bdf8; font-size: 28px; font-weight: 700; }
        p { color: #9ca3af; font-size: 14px; margin-bottom: 25px; }
        .input-group { position: relative; margin-bottom: 15px; }
        input { width: 100%; padding: 14px 16px; border: 2px solid #374151; background: #1f2937; color: white; border-radius: 8px; box-sizing: border-box; font-size: 16px; transition: border-color 0.2s; }
        input:focus { outline: none; border-color: #38bdf8; }
        button { background: #2563eb; color: white; border: none; padding: 14px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600; width: 100%; margin-bottom: 12px; transition: background 0.2s; }
        button:hover { background: #1d4ed8; }
        .btn-bookmark { background: #059669; }
        .btn-bookmark:hover { background: #047857; }
        .bookmark-card { background: #111827; border: 1px solid #1f2937; padding: 25px; border-radius: 16px; width: 100%; max-width: 550px; box-sizing: border-box; text-align: left; }
        .bookmark-card h3 { margin-top: 0; color: #f3f4f6; font-size: 18px; border-bottom: 1px solid #374151; padding-bottom: 10px; }
        .bookmark-item { display: flex; justify-content: space-between; align-items: center; background: #1f2937; padding: 12px 16px; margin: 8px 0; border-radius: 8px; border: 1px solid #374151; }
        .bookmark-item a { color: #38bdf8; text-decoration: none; font-weight: 500; word-break: break-all; margin-right: 15px; font-size: 14px; }
        .bookmark-item a:hover { text-decoration: underline; }
        .delete-btn { background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; }
        .delete-btn:hover { background: #dc2626; }
        .empty-text { color: #6b7280; font-size: 14px; font-style: italic; }
    </style>
</head>
<body>

    <div class="wrapper">
        <h2>Cloud Browser proxy</h2>
        <p>Your requests route entirely through Render's hosted server network.</p>
        
        <div class="input-group">
            <input type="text" id="targetUrl" placeholder="https://example.com" value="https://">
        </div>
        
        <button onclick="launchProxy()">Launch Browser</button>
        <button class="btn-bookmark" onclick="saveToBookmarks()">⭐ Bookmark URL</button>
    </div>

    <div class="bookmark-card">
        <h3>My Saved Bookmarks</h3>
        <div id="bookmarksList" class="empty-text">No bookmarks saved yet.</div>
    </div>

    <script>
        function launchProxy(directUrl) {
            let target = directUrl || document.getElementById('targetUrl').value.trim();
            if (!target || target === "https://" || target === "http://") {
                alert("Please enter a valid website destination URL.");
                return;
            }
            if (!target.startsWith('http://') && !target.startsWith('https://')) {
                target = 'https://' + target;
            }
            window.location.href = window.location.origin + "/go?url=" + encodeURIComponent(target);
        }

        function saveToBookmarks() {
            let target = document.getElementById('targetUrl').value.trim();
            if (!target || target === "https://" || target === "http://") return;
            
            let list = JSON.parse(localStorage.getItem('cloud_proxy_links')) || [];
            if (!list.includes(target)) {
                list.push(target);
                localStorage.setItem('cloud_proxy_links', JSON.stringify(list));
                renderBookmarks();
            }
        }

        function deleteLink(idx) {
            let list = JSON.parse(localStorage.getItem('cloud_proxy_links')) || [];
            list.splice(idx, 1);
            localStorage.setItem('cloud_proxy_links', JSON.stringify(list));
            renderBookmarks();
        }

        function renderBookmarks() {
            let list = JSON.parse(localStorage.getItem('cloud_proxy_links')) || [];
            let box = document.getElementById('bookmarksList');
            if (list.length === 0) {
                box.innerHTML = "No bookmarks saved yet.";
                box.className = "empty-text";
                return;
            }
            box.className = "";
            box.innerHTML = "";
            list.forEach((url, i) => {
                box.innerHTML += \`
                    <div class="bookmark-item">
                        <a href="#" onclick="launchProxy('\${url}')">\${url}</a>
                        <button class="delete-btn" onclick="deleteLink(\${i})">Remove</button>
                    </div>
                \`;
            });
        }
        renderBookmarks();
    </script>
</body>
</html>
`;

// Landing Dashboard
app.get('/', (req, res) => {
    res.send(getHomeHTML());
});

// Proxy Request Handling Engine
app.get('/go', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('Target URL query parameter is missing.');

    try {
        const response = await axios({
            method: 'get',
            url: targetUrl,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            },
            responseType: 'text',
            timeout: 10000
        });

        // Content Rewriter: Ensures links clicked within the site continue using the proxy route
        let cleanHTML = response.data;
        const originUrl = new URL(targetUrl);
        
        // Match standard links and asset pathways
        cleanHTML = cleanHTML.replace(/(href|src)="(?!\/)(?!http)([^"]+)"/g, `$1="${originUrl.origin}/$2"`);
        
        res.send(cleanHTML);
    } catch (err) {
        res.status(500).send(`<h3>Proxy Error: Could not connect to target website.</h3><p>${err.message}</p>`);
    }
});

// Start application listener
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Proxy server core active on port ${PORT}`));
