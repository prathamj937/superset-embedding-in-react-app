# Superset Integration Configuration Guide

This guide explains how to configure Apache Superset to work with the Dashboard Management System.

## Prerequisites

- Apache Superset installed and running
- Access to Superset configuration files
- Dashboard Management System backend running

## 1. Enable Embedded Dashboards

### In your Superset configuration (superset_config.py):

```python
# Enable embedded dashboards
EMBEDDED_SUPERSET = True

# Allow iframe embedding
WTF_CSRF_ENABLED = False

# Configure CORS for your React app domain
CORS_OPTIONS = {
    'supports_credentials': True,
    'allow_headers': ['*'],
    'resources': ['*'],
    'origins': ['http://localhost:3000', 'http://your-domain.com']
}
```

## 2. Configure JWT Authentication

### Set up JWT authentication in Superset:

```python
# JWT configuration
JWT_SECRET_KEY = 'your-secret-key-change-this-in-production'  # Must match Flask backend
JWT_ALGORITHM = 'HS256'

# Enable JWT authentication
AUTH_TYPE = AUTH_JWT

# JWT authentication class
AUTHENTICATION_CLASSES = [
    'superset.auth.jwt.JWTAuthentication'
]
```

## 3. Dashboard Embedding Configuration

### For each dashboard you want to embed:

1. **Get the Dashboard ID**: In Superset, go to the dashboard and note the ID from the URL
2. **Enable Embedding**: In the dashboard settings, enable "Embedded Dashboard"
3. **Update Frontend Configuration**: Update the `dashboardConfigs` in `frontend/src/App.js`

## 4. JWT Token Format

The Flask backend generates JWT tokens in this format:

```json
{
  "user": {
    "username": "john",
    "first_name": "John",
    "last_name": "Smith"
  },
  "resources": [
    {
      "type": "dashboard",
      "id": "sales"
    }
  ],
  "rls": [],
  "exp": 1640995200
}
```

## 5. Environment Variables

### For the React frontend (.env file):

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SUPERSET_URL=http://localhost:8088
```

### For the Flask backend:

```env
SECRET_KEY=your-secret-key-change-this-in-production
SUPERSET_SECRET_KEY=your-secret-key-change-this-in-production
```

## 6. Testing the Integration

1. **Start Superset**: Ensure Superset is running on the configured URL
2. **Start Backend**: Run the Flask backend
3. **Start Frontend**: Run the React frontend
4. **Login**: Use the sample users (manager, john, jane)
5. **Test Dashboard Access**: Try accessing different dashboards

## 7. Troubleshooting

### Common Issues:

1. **CORS Errors**: Check Superset CORS configuration
2. **JWT Token Rejected**: Verify secret keys match
3. **Dashboard Not Found**: Check dashboard IDs in configuration
4. **Embedding Disabled**: Ensure embedded dashboards are enabled in Superset

### Debug Steps:

1. Check browser console for errors
2. Verify JWT token format in browser network tab
3. Test Superset embed URL directly
4. Check Superset logs for authentication errors

## 8. Security Considerations

1. **Use HTTPS**: In production, use HTTPS for all communications
2. **Secure Secret Keys**: Use strong, unique secret keys
3. **Limit CORS Origins**: Only allow necessary domains
4. **Token Expiration**: Set appropriate JWT expiration times
5. **Row Level Security**: Implement RLS rules as needed

## 9. Production Deployment

### For production deployment:

1. **Update URLs**: Change localhost URLs to production domains
2. **Secure Configuration**: Use environment variables for sensitive data
3. **Load Balancing**: Configure proper load balancing for Superset
4. **Monitoring**: Set up monitoring for both systems
5. **Backup**: Implement database backup strategies

## 10. Example Configuration Files

### Complete superset_config.py example:

```python
import os

# Basic configuration
SECRET_KEY = os.environ.get('SUPERSET_SECRET_KEY', 'your-secret-key')
SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///superset.db')

# JWT configuration
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key')
JWT_ALGORITHM = 'HS256'

# Authentication
AUTH_TYPE = AUTH_JWT
AUTHENTICATION_CLASSES = [
    'superset.auth.jwt.JWTAuthentication'
]

# Embedded dashboards
EMBEDDED_SUPERSET = True
WTF_CSRF_ENABLED = False

# CORS configuration
CORS_OPTIONS = {
    'supports_credentials': True,
    'allow_headers': ['*'],
    'resources': ['*'],
    'origins': [
        'http://localhost:3000',
        'https://your-production-domain.com'
    ]
}

# Security headers
ENABLE_PROXY_FIX = True
PROXY_FIX_CONFIG = {
    "x_for": 1,
    "x_proto": 1,
    "x_host": 1,
    "x_port": 1,
    "x_prefix": 1,
}
```

This configuration ensures secure integration between your Dashboard Management System and Apache Superset. 