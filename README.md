# MemberSense

A powerful Bun app for the Discord API (and later Microsoft Outlook) which securely manages private keys in both Github and the .env.local file.

## Navigation
- [MemberSense](#membersense)
  - [Navigation](#navigation)
  - [Tech Stack](#tech-stack)
  - [Component Design](#component-design)
    - [Backend](#backend)
  - [Backend Logic](#backend-logic)
  - [Project Structure](#project-structure)
  - [Test Suite](#test-suite)
  - [Setup \& Deployment](#setup--deployment)
    - [Backend Setup (Development)](#backend-setup-development)
    - [Docker Setup](#docker-setup)
    - [Google Cloud Run Deployment](#google-cloud-run-deployment)
  - [Deployment Strategy](#deployment-strategy)
  - [Future Improvements](#future-improvements)

Also see [Frontend](https://github.com/ModelEarth/feed/blob/main/MemberSense.md)

## Tech Stack

<p align="center">
  <img src="https://img.shields.io/badge/bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white" alt="Bun">
  <img src="https://img.shields.io/badge/discord.js-%235865F2.svg?style=for-the-badge&logo=discord&logoColor=white" alt="Discord.js">
  <img src="https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/Google%20Cloud-%234285F4.svg?style=for-the-badge&logo=google-cloud&logoColor=white" alt="Google Cloud">
  <img src="https://img.shields.io/badge/unit%20testing-%23E33332.svg?style=for-the-badge&logo=testing-library&logoColor=white" alt="Unit Testing">
  <img src="https://img.shields.io/badge/github%20actions-%232671E5.svg?style=for-the-badge&logo=githubactions&logoColor=white" alt="GitHub Actions">
</p>

## Component Design 

### Backend 
- **Core Components**:
  - `server.js`: Main Bun server with request handling and session management
  - `index.js`: Application entry point, initializes and starts the server
  - `services/discordFactory.js`: Factory for creating Discord service instances
  - `services/discord.service.js`: Core Discord API integration service
  - `.env` [Optional]: Environment configuration (Discord tokens, server settings)

## Backend Logic 

The backend uses Bun for high-performance JavaScript runtime execution. Key features include:

1. **Authentication & Session Management** 
   - Secure session handling with nanoid-generated unique IDs
   - Configurable session timeout and cleanup
   - Rate limiting per client IP
   - Maximum concurrent users limit

2. **Discord Integration** 
   - Factory pattern for Discord service instances
   - Comprehensive guild management capabilities
   - Efficient message and channel handling

3. **API Endpoints** 
   - **Authentication**
     - `POST /api/auth/login`: Create new Discord bot instance and session
       ```json
       {
         "token": "your-discord-token"
       }
       ```
     - `POST /api/auth/logout`: Destroy bot instance and clear session
   
   - **Discord Data**
     - `GET /api/members`: Fetch all server members
     - `GET /api/channels`: Get all text channels
     - `GET /api/messages?channelId={id}&limit={count}`: Retrieve channel messages
       - Optional `limit` parameter (default: 100)
   
   - **System**
     - `GET /_ah/health`: Health check endpoint

4. **Error Handling** 
   - Comprehensive error management with appropriate status codes
   - Request tracking with unique request IDs
   - Detailed error logging for debugging

5. **Security Features** 
   - CORS configuration with allowlist support
   - Rate limiting with configurable windows
   - Request tracking and logging
   - Session timeout management

## Project Structure 

```bash
MemberSense
│
├── backend
│   ├── node_modules
│   ├── src
│   │   ├── services
│   │   │   ├── discord.service.js
│   │   │   ├── discordFactory.js
│   │   │   └── index.js
│   │   └── server.js
│   ├── tests
│   │   ├── mocks
│   │   └── server.test.js
│   ├── .env
│   ├── package.json
│   └── bun.lockb
│
└── docs
    ├── DESIGNDOC.md
    ├── GUIDE.md
    └── README.md
```

## Test Suite

The project includes a comprehensive test suite using Bun's built-in testing framework. Key test categories include:

1. **Server Configuration Tests**
   - Environment variable handling
   - Custom configuration override
   - CORS setup validation

2. **Authentication Tests**
   - Login flow validation
   - Session management
   - Concurrent user limits
   - Token validation

3. **Session Management Tests**
   - Session timeout handling
   - Activity tracking
   - Cleanup processes
   - Bot instance lifecycle

4. **Rate Limiting Tests**
   - Request tracking per IP
   - Window-based limiting
   - Retry-after header handling

5. **API Error Handling Tests**
   - Invalid JSON handling
   - Missing parameter validation
   - Discord API error handling
   - Authentication failures

To run the tests:
```bash
cd backend
bun test
```

For watch mode during development:
```bash
bun test --watch
```

## Setup & Deployment

### Backend Setup (Development)

1. **Clone and install**
   ```bash
   git clone https://github.com/yourusername/membersense.git
   cd membersense/backend
   bun install
   ```

2. **Configure Environment**  
   The `backend/.env` file is optional as all settings have defaults. You can override any of these values based on your needs:

   ```bash
   # Server Configuration
   PORT=8080                    # Server port number
   ALLOWED_ORIGINS=*           # CORS allowed origins, use comma for multiple

   # Discord Configuration
   DISCORD_BOT_TOKEN=your_token_here    # Discord bot token

   # Security Settings
   MAX_CONCURRENT_USERS=100    # Maximum concurrent bot instances
   RATE_LIMIT_WINDOW=60000     # Rate limit window (60 seconds)
   RATE_LIMIT_MAX_REQUESTS=100 # Maximum requests per window

   # Session Management
   SESSION_TIMEOUT=1800000     # Session timeout (30 minutes)
   CLEANUP_INTERVAL=300000     # Cleanup interval (5 minutes)
   ```

3. **Start Development Server**
   ```bash
   bun run src/server.js
   ```

### Docker Setup

1. **Build the Image**
   ```bash
   # Build the image
   docker build -t your-image-name .

   # Run the container locally
   docker run -p 8080:8080 your-image-name

   # Container Management
   docker ps                     # List running containers
   docker stop your-container-name  # Stop the container
   docker start your-container-name # Restart the container
   ```

2. **Docker Compose (Development)**
   ```yaml
   # docker-compose.yml
   version: '3.8'
   services:
     backend:
       build: .
       ports:
         - "8080:8080"
       env_file: .env
       volumes:
         - ./src:/app/src
   ```

   ```bash
   docker-compose up --build
   ```

### Google Cloud Run Deployment

1. **Setup Google Cloud**
   ```bash
   # Install Google Cloud CLI
   brew install google-cloud-sdk  # macOS
   
   # Initialize and set project
   gcloud init
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **Configure Deployment**
   ```bash
   # Build and push to Google Container Registry
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/membersense-backend
   
   # Deploy to Cloud Run
   gcloud run deploy membersense-backend \
     --image gcr.io/YOUR_PROJECT_ID/membersense-backend \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --port 8080
   ```

3. **Environment Variables** [Optional]
   - Go to Google Cloud Console → Cloud Run
   - Select your service
   - Edit & Deploy New Revision
   - Add environment variables from your `.env` file

4. **Continuous Deployment**
   [TBD]


## Deployment Strategy 

1. **Containerization** 
   - Multi-stage Docker builds for optimization
   - Separate production and development configurations

2. **Cloud Deployment** 
   - Cloud platform deployment support (AWS ECS, Google Cloud Run)
   - CDN integration for static assets
   - Environment-based configuration

3. **Local Development** 
   - Docker Compose for development environment
   - Hot-reloading support
   - Test suite integration

## Future Improvements 

- WebSocket integration for real-time Discord updates
- Enhanced member role management
- Google Sheets API integration
- Redis caching layer implementation
- Multi-server support per user
- Expanded test coverage
- Performance monitoring and analytics
