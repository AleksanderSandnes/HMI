# HMI - Home Management Interface

[![Vercel Deploy](https://deploy-badge.vercel.app/vercel/hmi-git-main-apsandnes-projects)](https://hmi-git-main-apsandnes-projects.vercel.app)
[![Deploy to Render](https://github.com/APSandnes/HMI/actions/workflows/deploy-render.yml/badge.svg)](https://github.com/APSandnes/HMI/actions/workflows/deploy-render.yml)
[![Service Status](https://github.com/APSandnes/HMI/actions/workflows/status-badges.yml/badge.svg)](https://github.com/APSandnes/HMI/actions/workflows/status-badges.yml)

> ⚠️ **Note**: Backend services run on Render's free tier and may take 30-60 seconds to start from cold state.

A comprehensive home management interface with solar monitoring, weather tracking, and IoT integration.

## 🚀 Live Deployments

- **Frontend**: [https://hmi-git-main-apsandnes-projects.vercel.app](https://hmi-git-main-apsandnes-projects.vercel.app)
- **Backend API**: [https://weatherAPI.onrender.com](https://weatherAPI.onrender.com/api/health)
- **Java Solar API**: [https://growattAPI.onrender.com](https://growattAPI.onrender.com/actuator/health)

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Node.js API   │    │   Java API      │
│   (Vercel)      │◄──►│   (Render)      │◄──►│   (Render)      │
│                 │    │                 │    │                 │
│ • React Native  │    │ • Authentication│    │ • Solar Data    │
│ • Expo Web      │    │ • Weather API   │    │ • Growatt API   │
│ • Charts        │    │ • User Settings │    │ • Power Metrics │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   MongoDB       │
                    │   (Atlas)       │
                    │                 │
                    │ • User Data     │
                    │ • Settings      │
                    │ • API Keys      │
                    └─────────────────┘
```

## 🌟 Features

- **Solar Energy Monitoring**: Real-time and historical solar panel data
- **Weather Integration**: Current weather and forecasts
- **User Authentication**: Secure login with JWT tokens
- **Settings Management**: Encrypted credential storage
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Updates**: Live data synchronization

## 🛠️ Technology Stack

### Frontend

- React Native with Expo
- TypeScript
- Chart.js for data visualization
- Responsive design

### Backend

- Node.js with Express
- MongoDB with Mongoose
- JWT Authentication
- CORS enabled

### Solar API

- Spring Boot (Java)
- Maven build system
- Actuator for health checks
- Growatt API integration

## 📋 Getting Started

### Prerequisites

- Node.js 18+
- Java 17+
- MongoDB Atlas account
- Growatt account (for solar data)

### Local Development

1. **Clone the repository**

   ```bash
   git clone https://github.com/APSandnes/HMI.git
   cd HMI
   ```

2. **Setup Backend**

   ```bash
   cd backend/weatherAPI
   npm install
   cp .env.example .env
   # Configure your environment variables
   npm start
   ```

3. **Setup Java API**

   ```bash
   cd backend/growattAPI
   mvn clean install
   mvn spring-boot:run
   ```

4. **Setup Frontend**
   ```bash
   npm install
   npm start
   ```

## 🚀 Deployment

### Automatic Deployment

Push to `main` branch triggers automatic deployment:

- Frontend → Vercel
- Backend → Render.com
- Java API → Render.com

### Manual Deployment

See [PRODUCTION_DEPLOYMENT_GUIDE.md](PRODUCTION_DEPLOYMENT_GUIDE.md) for detailed instructions.

## 🔐 Security

- JWT-based authentication
- Encrypted credential storage
- Environment-based configuration
- User-managed API keys
- CORS protection

## 📊 Monitoring

- Health check endpoints for all services
- Automated deployment status
- Real-time service monitoring
- Error tracking and logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

For questions or issues:

- Check the [deployment guide](PRODUCTION_DEPLOYMENT_GUIDE.md)
- Review health check endpoints
- Check GitHub Actions logs
- Open an issue on GitHub
