## Component Design

### Frontend
- **Main Components**:
  - `App.jsx`: The main React component that fetches and displays member data.
  - `App.css`: Styles for the React components.
  - `index.css`: Global styles.
  - `main.jsx`: Entry point for the React app.

### Backend
- **Main Components**:
  - `server.js`: The Bun server that handles incoming requests and interacts with the Discord API.
  - `.env`: Contains environment variables like Discord bot token and guild ID.
  - `utils.js`: (Optional) Utility functions for logging, error handling, etc.

## Data Flow
1. The frontend makes API calls to the backend to fetch member data.
2. The backend processes these requests and interacts with the Discord API to retrieve the necessary information.
3. The backend returns the member data to the frontend, which then displays it to the user.

## Directory Structure

``` bash
/member
│
├── /frontend              # React frontend
│   ├── /public           # Static assets
│   │   └── vite.svg
│   ├── /src              # Source files
│   │   ├── App.css       # Styles for the main component
│   │   ├── App.jsx       # Main React component
│   │   ├── index.css     # Global styles
│   │   └── main.jsx      # Entry point for the React app
│   ├── package.json      # Frontend dependencies
│   └── vite.config.js    # Vite configuration
│
├── /backend               # Backend (Bun + Discord bot)
│   ├── server.js         # Main server file
│   ├── .env              # Environment variables (Discord bot token, guild ID)
│   ├── /utils            # Optional: Utility functions
│   │   └── helpers.js    # Helper functions for the backend
│   └── discordBot.js     # Discord bot implementation
│
└── README.md             # Project documentation
```

## Deployment Strategy
1. **Dockerization**:
   - Create Docker images for both the frontend and backend.
   - Use separate Dockerfiles for the frontend and backend.

2. **Cloud Deployment**:
   - Deploy the backend to cloud.
   - Deploy the frontend to cloud or a static hosting service.

3. **Local Development**:
   - Use Docker Compose to run both the frontend and backend locally for testing.


## Future Improvements
- Add functionality to retrieve member roles.
- Integrate with Google Sheet.

