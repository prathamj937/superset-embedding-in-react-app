# Dashboard Management System with Superset Integration

A complete dashboard management system that allows managers to control user access to Superset dashboards through a React frontend, with a Flask backend for authentication and access control.

## Features

- **User Authentication**: JWT-based authentication with role-based access control
- **Manager Dashboard**: Control user access to different dashboards
- **User Dashboard**: View assigned Superset dashboards with embedded iframes
- **Real-time Access Control**: Toggle dashboard access for users
- **Superset Integration**: Embedded Superset dashboards with JWT authentication

## Project Structure

```
superset_project/
├── backend/
│   ├── app.py                 # Flask backend application
│   ├── requirements.txt       # Python dependencies
│   └── dashboard_management.db # SQLite database (created automatically)
├── frontend/
│   ├── public/
│   │   └── index.html         # Main HTML file
│   ├── src/
│   │   ├── App.js            # Main React application
│   │   ├── App.css           # Styles
│   │   ├── index.js          # React entry point
│   │   └── index.css         # Global styles
│   ├── package.json          # Node.js dependencies
│   ├── tailwind.config.js    # Tailwind CSS configuration
│   └── postcss.config.js     # PostCSS configuration
└── README.md                 # This file
```

## Prerequisites

- Python 3.7+
- Node.js 14+
- Superset instance running (for dashboard embedding)

## Setup Instructions

### 1. Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment (optional but recommended):**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the Flask backend:**
   ```bash
   python app.py
   ```

   The backend will start on `http://localhost:5000` and automatically create the database with sample users.

### 2. Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Start the React development server:**
   ```bash
   npm start
   ```

   The frontend will start on `http://localhost:3000`.

### 3. Superset Configuration

To enable dashboard embedding, configure your Superset instance:

1. **Enable embedded dashboards** in your Superset configuration
2. **Configure JWT authentication** with the same secret key as your Flask backend
3. **Update dashboard IDs** in the frontend configuration

## Sample Users

The system comes with pre-configured users:

| Username | Password | Role | Access |
|----------|----------|------|--------|
| manager | password123 | Manager | Full access to all features |
| john | password123 | User | Sales, Finance dashboards |
| jane | password123 | User | HR dashboard only |

## Configuration

### Environment Variables

Create a `.env` file in the frontend directory:

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SUPERSET_URL=http://localhost:8088
```

### Superset Dashboard IDs

Update the dashboard configurations in `frontend/src/App.js`:

```javascript
const dashboardConfigs = [
  { 
    id: 'sales', 
    name: 'Sales Dashboard', 
    description: 'Sales performance metrics and analytics',
    supersetUrl: process.env.REACT_APP_SUPERSET_URL || 'http://localhost:8088',
    supersetDashboardId: '1' // Replace with your actual Superset dashboard ID
  },
  // ... other dashboards
];
```

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `GET /api/health` - Health check

### Dashboard Management
- `GET /api/dashboards` - Get user's dashboard access
- `POST /api/generate-dashboard-jwt` - Generate JWT for Superset access

### User Management (Manager Only)
- `GET /api/users` - Get all users
- `POST /api/toggle-access` - Toggle user dashboard access
- `GET /api/user-dashboard-access/<user_id>` - Get specific user's access

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Manager and user roles
- **Dashboard-level Permissions**: Granular access control per dashboard
- **CORS Protection**: Configured for secure cross-origin requests

## Usage

### Manager Workflow

1. Login as `manager` with password `password123`
2. View all users and their current dashboard access
3. Toggle access permissions for each user-dashboard combination
4. Changes are immediately reflected in the database

### User Workflow

1. Login with your credentials
2. View available dashboards based on your permissions
3. Click on a dashboard to load it in an embedded iframe
4. The system generates a JWT token for Superset authentication

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure the Flask backend is running and CORS is properly configured
2. **JWT Token Issues**: Check that the secret key matches between Flask and Superset
3. **Dashboard Not Loading**: Verify Superset is running and dashboard IDs are correct
4. **Database Issues**: Delete `dashboard_management.db` and restart the backend to recreate

### Debug Mode

The Flask backend runs in debug mode by default. Check the console for detailed error messages.

## Development

### Adding New Dashboards

1. Add dashboard configuration to `dashboardConfigs` in `frontend/src/App.js`
2. Update the database with access permissions
3. Configure the corresponding Superset dashboard

### Adding New Users

1. Insert user data into the `users` table
2. Configure dashboard access in the `user_dashboard_access` table
3. Or use the manager interface to add access permissions

## Production Deployment

### Security Considerations

1. **Change the secret key** in `backend/app.py`
2. **Use HTTPS** for all communications
3. **Configure proper CORS settings** for your domain
4. **Use environment variables** for sensitive configuration
5. **Set up proper database** (PostgreSQL, MySQL) instead of SQLite

### Deployment Steps

1. **Backend**: Deploy Flask app to your preferred hosting service
2. **Frontend**: Build and deploy React app to a static hosting service
3. **Database**: Set up a production database
4. **Superset**: Ensure Superset is accessible from your frontend domain

## License

This project is for educational and demonstration purposes.

## Support

For issues and questions, please check the troubleshooting section or create an issue in the repository. 