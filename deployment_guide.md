# Production Deployment Guide

## Architecture Overview

```
Client (Browser) → Node.js Server → Python ML Service
```

## Deployment Options

### Option 1: Single Server Deployment

1. **Install Python and Node.js on your server**
2. **Set up the ML service:**
   ```bash
   cd ml_service
   pip install -r requirements.txt
   python model_extractor.py  # Extract your model
   gunicorn --bind 127.0.0.1:5000 --workers 2 app:app &
   ```

3. **Set up the Node.js server:**
   ```bash
   npm install
   export ML_SERVICE_URL=http://127.0.0.1:5000
   npm start
   ```

### Option 2: Docker Deployment

1. **Create docker-compose.yml:**
   ```yaml
   version: '3.8'
   services:
     ml-service:
       build: ./ml_service
       ports:
         - "5000:5000"
       environment:
         - DEBUG=false
     
     web-service:
       build: .
       ports:
         - "3000:3000"
       environment:
         - ML_SERVICE_URL=http://ml-service:5000
       depends_on:
         - ml-service
   ```

2. **Deploy:**
   ```bash
   docker-compose up -d
   ```

### Option 3: Cloud Deployment (Heroku)

1. **Deploy ML service to Heroku:**
   ```bash
   cd ml_service
   heroku create your-ml-service
   git add .
   git commit -m "Deploy ML service"
   git push heroku main
   ```

2. **Deploy web service:**
   ```bash
   heroku create your-web-app
   heroku config:set ML_SERVICE_URL=https://your-ml-service.herokuapp.com
   git push heroku main
   ```

## Environment Configuration

### Production Environment Variables

```bash
# Node.js Server
PORT=3000
ML_SERVICE_URL=http://your-ml-service-url:5000
NODE_ENV=production

# Python ML Service
PORT=5000
DEBUG=false
WORKERS=2
```

## Performance Optimization

1. **Enable caching in the ML service**
2. **Use a reverse proxy (nginx)**
3. **Implement connection pooling**
4. **Add monitoring and logging**

## Security Considerations

1. **Use HTTPS in production**
2. **Implement API authentication**
3. **Add input sanitization**
4. **Set up rate limiting**
5. **Use environment variables for secrets**

## Monitoring

1. **Health check endpoints**
2. **Application logs**
3. **Performance metrics**
4. **Error tracking**