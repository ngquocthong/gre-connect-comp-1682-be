# GreConnect Backend Deployment Guide

## Prerequisites

- Node.js 16+ installed
- MongoDB instance (local or MongoDB Atlas)
- Cloudinary account
- Agora account

## Local Development

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Setup

Create `.env` file:

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb://localhost:27017/greconnect

JWT_SECRET=your_secure_jwt_secret_minimum_32_chars
JWT_EXPIRE=7d

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_app_certificate

CLIENT_URL=http://localhost:8081
```

### 3. Start MongoDB

Local MongoDB:
```bash
mongod
```

Or use MongoDB Atlas connection string.

### 4. Seed Database (Optional)

```bash
npm run seed
```

This creates test accounts:
- **Staff**: admin@greconnect.edu / Admin123!
- **Teacher**: teacher1@greconnect.edu / Teacher123!
- **Student**: student1@greconnect.edu / Student123!

### 5. Start Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server runs on: http://localhost:5000

### 6. Test API

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "GreConnect API is running",
  "timestamp": "2024-11-29T..."
}
```

## Production Deployment

### Option 1: VPS/Dedicated Server

#### 1. Install Node.js and MongoDB

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

sudo apt-get install -y mongodb
```

#### 2. Install PM2

```bash
sudo npm install -g pm2
```

#### 3. Clone and Setup

```bash
git clone <your-repo>
cd backend
npm install
```

#### 4. Configure Environment

```bash
nano .env
```

Set production values:
```env
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/greconnect
JWT_SECRET=<strong-random-secret>
...
```

#### 5. Start with PM2

```bash
pm2 start server.js --name greconnect-api
pm2 save
pm2 startup
```

#### 6. Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name api.greconnect.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 2: Heroku

#### 1. Create Heroku App

```bash
heroku create greconnect-api
```

#### 2. Add MongoDB Add-on

```bash
heroku addons:create mongolab:sandbox
```

#### 3. Set Environment Variables

```bash
heroku config:set JWT_SECRET=your_secret
heroku config:set CLOUDINARY_CLOUD_NAME=your_name
heroku config:set CLOUDINARY_API_KEY=your_key
heroku config:set CLOUDINARY_API_SECRET=your_secret
heroku config:set AGORA_APP_ID=your_app_id
heroku config:set AGORA_APP_CERTIFICATE=your_cert
heroku config:set CLIENT_URL=your_frontend_url
```

#### 4. Deploy

```bash
git push heroku main
```

### Option 3: Docker

#### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

#### 2. Create docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/greconnect
    depends_on:
      - mongo

  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

#### 3. Deploy

```bash
docker-compose up -d
```

## Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | `5000` |
| `NODE_ENV` | Environment | No | `production` |
| `MONGODB_URI` | MongoDB connection | Yes | `mongodb://...` |
| `JWT_SECRET` | JWT signing key | Yes | `min-32-chars` |
| `JWT_EXPIRE` | Token expiry | No | `7d` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary name | Yes | `your-cloud` |
| `CLOUDINARY_API_KEY` | Cloudinary key | Yes | `123456789` |
| `CLOUDINARY_API_SECRET` | Cloudinary secret | Yes | `abc123xyz` |
| `AGORA_APP_ID` | Agora app ID | Yes | `your-app-id` |
| `AGORA_APP_CERTIFICATE` | Agora certificate | Yes | `cert-string` |
| `CLIENT_URL` | Frontend URL | Yes | `http://...` |

## Database Indexes

MongoDB automatically creates indexes based on schema definitions. To manually ensure indexes:

```javascript
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ username: 1 }, { unique: true })
db.conversations.createIndex({ participants: 1 })
db.messages.createIndex({ conversationId: 1, createdAt: -1 })
db.questions.createIndex({ userId: 1 })
db.questions.createIndex({ isActive: 1, createdAt: -1 })
db.resources.createIndex({ type: 1, createdAt: -1 })
db.events.createIndex({ date: 1 })
db.notifications.createIndex({ recipientId: 1, createdAt: -1 })
```

## Monitoring

### PM2 Monitoring

```bash
pm2 status
pm2 logs greconnect-api
pm2 monit
```

### Health Check Endpoint

```
GET /api/health
```

Returns server status and timestamp.

## Backup

### MongoDB Backup

```bash
mongodump --uri="mongodb://localhost:27017/greconnect" --out=/backup/
```

### Restore

```bash
mongorestore --uri="mongodb://localhost:27017/greconnect" /backup/greconnect
```

## Security Checklist

- [ ] Strong JWT secret (min 32 chars)
- [ ] MongoDB authentication enabled
- [ ] HTTPS/SSL certificate installed
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Helmet security headers active
- [ ] Environment variables secured
- [ ] Database backups scheduled
- [ ] Firewall configured
- [ ] Server updates automated

## Troubleshooting

### Connection Issues

```bash
curl http://localhost:5000/api/health
```

### MongoDB Connection

```bash
mongosh
show dbs
use greconnect
db.users.countDocuments()
```

### PM2 Issues

```bash
pm2 logs --err
pm2 restart greconnect-api
```

### Socket.IO Issues

Check WebSocket support:
```bash
curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     http://localhost:5000/socket.io/
```

## Performance Optimization

1. Enable MongoDB indexes
2. Use Redis for session storage (optional)
3. Enable gzip compression
4. Configure CDN for static assets
5. Implement caching strategies
6. Monitor with tools like New Relic or Datadog

## Support

For deployment issues, check logs and consult:
- Backend README.md
- API documentation
- MongoDB logs
- PM2 logs

