# Troubleshooting: AI Chat không gọi đến Dify

## Vấn đề: AI Chat không gọi đến Dify API

### Các nguyên nhân phổ biến:

1. **DIFY_API_KEY chưa được set**
2. **DIFY_BASE_URL sai**
3. **DIFY_APP_TYPE không đúng**
4. **Network/Connection issues**
5. **Dify API key không hợp lệ**

---

## Cách kiểm tra và fix:

### Step 1: Kiểm tra Environment Variables

```bash
# Kiểm tra trong .env file
cat .env | grep DIFY

# Hoặc check trong server logs khi start
# Bạn sẽ thấy:
# ✅ Dify AI Service initialized
# HOẶC
# ⚠️  Dify API key not found. AI Chat service disabled.
```

**Cần có:**
```bash
DIFY_API_KEY=app-xxxxxxxxxxxxx
DIFY_BASE_URL=https://api.dify.ai/v1  # Optional, default value
DIFY_APP_TYPE=chatflow  # hoặc 'workflow'
DIFY_DEBUG=true  # Optional, để bật debug logging
```

### Step 2: Kiểm tra Dify Service Status

**API Endpoint:**
```bash
GET /api/ai-chat/status
Authorization: Bearer <your-token>
```

**Response khi OK:**
```json
{
  "available": true,
  "appType": "chatflow",
  "environment": {
    "DIFY_API_KEY": true,
    "DIFY_BASE_URL": "https://api.dify.ai/v1 (default)",
    "DIFY_APP_TYPE": "chatflow (default)",
    "DIFY_DEBUG": false
  },
  "appInfo": { ... }
}
```

**Response khi FAIL:**
```json
{
  "available": false,
  "appType": "chatflow",
  "environment": {
    "DIFY_API_KEY": false,
    ...
  },
  "error": {
    "message": "Dify service not configured",
    "reason": "DIFY_API_KEY is not set in environment variables",
    "instructions": [ ... ]
  }
}
```

### Step 3: Kiểm tra Server Logs

Khi gửi message, bạn sẽ thấy logs như sau:

**Khi Dify service KHÔNG available:**
```
⚠️  AI Chat: Dify service not available for user ...
   Check: DIFY_API_KEY=NOT SET
   Check: DIFY_BASE_URL=NOT SET (using default)
   Check: DIFY_APP_TYPE=chatflow (default)
```

**Khi gọi Dify API:**
```
🤖 AI Chat: Sending message to Dify for user ...
   Conversation ID: (new)
   Message: Hello...
   App Type: chatflow

🤖 Dify Chatflow: Sending request to https://api.dify.ai/v1/chat-messages
🤖 Dify Chatflow: Response received in 1234ms, Status: 200
✅ Dify Chatflow: Success! Answer length: 150 chars
   Conversation ID: abc123...

🤖 AI Chat: Dify response received
   Success: true
   Answer length: 150 chars
   Dify Conversation ID: abc123...
```

**Khi có lỗi:**
```
❌ Dify Chatflow Error: {
  status: 401,
  statusText: "Unauthorized",
  error: "Invalid API key",
  details: { ... }
}
```

### Step 4: Test Dify Service

```bash
# Run test script
npm run test:dify
```

Script này sẽ:
- ✅ Check MongoDB connection
- ✅ Check Dify initialization
- ✅ Test sending message to Dify
- ✅ Show detailed error messages

### Step 5: Kiểm tra Dify API Key

1. **Lấy API Key từ Dify Dashboard:**
   - Vào https://dify.ai
   - Chọn App của bạn
   - Vào tab **API**
   - Copy **API Key** (format: `app-xxxxxxxxxxxxx`)

2. **Verify API Key:**
   ```bash
   # Test với curl
   curl -X POST "https://api.dify.ai/v1/chat-messages" \
     -H "Authorization: Bearer app-xxxxxxxxxxxxx" \
     -H "Content-Type: application/json" \
     -d '{
       "inputs": {},
       "query": "Hello",
       "response_mode": "blocking",
       "user": "test-user"
     }'
   ```

3. **Nếu API key sai, bạn sẽ nhận:**
   ```json
   {
     "code": "unauthorized",
     "message": "Invalid API key"
   }
   ```

---

## Common Errors và Solutions:

### Error 1: "Dify service not configured"

**Nguyên nhân:** `DIFY_API_KEY` không được set

**Fix:**
```bash
# Thêm vào .env
DIFY_API_KEY=app-xxxxxxxxxxxxx

# Restart server
npm run dev
```

### Error 2: "Invalid API key" (401 Unauthorized)

**Nguyên nhân:** API key sai hoặc đã bị revoke

**Fix:**
1. Lấy API key mới từ Dify dashboard
2. Update `.env` file
3. Restart server

### Error 3: "Failed to connect to AI service"

**Nguyên nhân:** 
- Network issue
- DIFY_BASE_URL sai
- Dify service down

**Fix:**
```bash
# Check network
curl https://api.dify.ai/v1/parameters

# Verify DIFY_BASE_URL
echo $DIFY_BASE_URL
# Should be: https://api.dify.ai/v1
```

### Error 4: "not_workflow_app" hoặc "not_chatflow_app"

**Nguyên nhân:** `DIFY_APP_TYPE` không khớp với app type trong Dify

**Fix:**
```bash
# Nếu app của bạn là Chatflow:
DIFY_APP_TYPE=chatflow

# Nếu app của bạn là Workflow:
DIFY_APP_TYPE=workflow
```

### Error 5: "fetch is not defined"

**Nguyên nhân:** Node.js version < 18 (fetch không có sẵn)

**Fix:**
```bash
# Option 1: Upgrade Node.js to 18+
node --version  # Should be >= 18.0.0

# Option 2: Install node-fetch
npm install node-fetch@2

# Then add to difyService.js:
const fetch = require('node-fetch');
```

---

## Debug Mode

Để bật debug logging chi tiết:

```bash
# Thêm vào .env
DIFY_DEBUG=true

# Restart server
npm run dev
```

Bạn sẽ thấy logs chi tiết:
```
[Dify Debug] Chatflow Request: { endpoint: '...', body: { ... } }
[Dify Debug] Chatflow Response: { status: 200, data: { ... } }
```

---

## Testing Checklist

- [ ] `DIFY_API_KEY` được set trong `.env`
- [ ] Server logs hiển thị "✅ Dify AI Service initialized"
- [ ] `GET /api/ai-chat/status` trả về `available: true`
- [ ] `npm run test:dify` chạy thành công
- [ ] Gửi message trong AI chat và check server logs
- [ ] Nhận được response từ Dify (không phải fallback message)

---

## Next Steps

1. **Check server logs** khi gửi message trong AI chat
2. **Run test script:** `npm run test:dify`
3. **Check API status:** `GET /api/ai-chat/status`
4. **Verify environment variables** trong `.env`
5. **Test Dify API key** với curl command

Nếu vẫn không hoạt động, hãy check server logs và share error messages để debug tiếp!

