from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import sqlite3
import os
from functools import wraps

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Configuration
app.config['SECRET_KEY'] = 'your-secret-key-change-this-in-production'
DATABASE = 'dashboard_management.db'

# Database setup
def init_db():
    """Initialize the database with tables and sample data"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            is_manager BOOLEAN DEFAULT FALSE,
            name TEXT NOT NULL
        )
    ''')
    
    # Create user_dashboard_access table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_dashboard_access (
            user_id INTEGER,
            dashboard_id TEXT,
            can_access BOOLEAN DEFAULT FALSE,
            PRIMARY KEY (user_id, dashboard_id),
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Insert sample users if they don't exist
    sample_users = [
        ('manager', 'password123', True, 'Manager Admin'),
        ('john', 'password123', False, 'John Smith'),
        ('jane', 'password123', False, 'Jane Doe')
    ]
    
    for username, password, is_manager, name in sample_users:
        cursor.execute('SELECT id FROM users WHERE username = ?', (username,))
        if not cursor.fetchone():
            password_hash = generate_password_hash(password)
            cursor.execute(
                'INSERT INTO users (username, password_hash, is_manager, name) VALUES (?, ?, ?, ?)',
                (username, password_hash, is_manager, name)
            )
    
    # Insert sample dashboard access
    sample_access = [
        (2, 'sales', True),    # John can access sales
        (2, 'hr', False),      # John cannot access hr
        (2, 'finance', True),  # John can access finance
        (3, 'sales', False),   # Jane cannot access sales
        (3, 'hr', True),       # Jane can access hr
        (3, 'finance', False)  # Jane cannot access finance
    ]
    
    for user_id, dashboard_id, can_access in sample_access:
        cursor.execute(
            'INSERT OR REPLACE INTO user_dashboard_access (user_id, dashboard_id, can_access) VALUES (?, ?, ?)',
            (user_id, dashboard_id, can_access)
        )
    
    conn.commit()
    conn.close()

# Database helper functions
def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def get_user_by_username(username):
    """Get user by username"""
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
    conn.close()
    return user

def get_user_by_id(user_id):
    """Get user by ID"""
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    conn.close()
    return user

# JWT helper functions
def generate_jwt_token(user_id, username, is_manager):
    """Generate JWT token for user"""
    payload = {
        'user_id': user_id,
        'username': username,
        'is_manager': is_manager,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

def verify_jwt_token(token):
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

# Authentication decorator
def token_required(f):
    """Decorator to require JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token[7:]
        
        payload = verify_jwt_token(token)
        if not payload:
            return jsonify({'message': 'Token is invalid'}), 401
        
        current_user = get_user_by_id(payload['user_id'])
        if not current_user:
            return jsonify({'message': 'User not found'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

def manager_required(f):
    """Decorator to require manager role"""
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if not current_user['is_manager']:
            return jsonify({'message': 'Manager access required'}), 403
        return f(current_user, *args, **kwargs)
    
    return decorated

# API Endpoints

@app.route('/api/login', methods=['POST'])
def login():
    """Login endpoint - authenticate user and return JWT token"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'success': False, 'message': 'Username and password required'}), 400
        
        # Get user from database
        user = get_user_by_username(username)
        if not user:
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
        
        # Check password
        if not check_password_hash(user['password_hash'], password):
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
        
        # Generate JWT token
        token = generate_jwt_token(user['id'], user['username'], user['is_manager'])
        
        return jsonify({
            'success': True,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'name': user['name'],
                'isManager': user['is_manager']
            },
            'token': token
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/dashboards', methods=['GET'])
@token_required
def get_user_dashboards(current_user):
    """Get user's dashboard access permissions"""
    try:
        conn = get_db_connection()
        
        # Get user's dashboard access
        access_data = conn.execute(
            'SELECT dashboard_id, can_access FROM user_dashboard_access WHERE user_id = ?',
            (current_user['id'],)
        ).fetchall()
        
        conn.close()
        
        # Convert to dictionary
        access_dict = {}
        for row in access_data:
            access_dict[row['dashboard_id']] = row['can_access']
        
        return jsonify({
            'success': True,
            'access': access_dict
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/users', methods=['GET'])
@token_required
@manager_required
def get_all_users(current_user):
    """Get all users (manager only)"""
    try:
        conn = get_db_connection()
        
        # Get all non-manager users
        users = conn.execute(
            'SELECT id, username, name FROM users WHERE is_manager = FALSE'
        ).fetchall()
        
        conn.close()
        
        users_list = []
        for user in users:
            users_list.append({
                'id': user['id'],
                'username': user['username'],
                'name': user['name']
            })
        
        return jsonify({
            'success': True,
            'users': users_list
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/toggle-access', methods=['POST'])
@token_required
@manager_required
def toggle_user_access(current_user):
    """Toggle user dashboard access (manager only)"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        dashboard_id = data.get('dashboard_id')
        can_access = data.get('can_access')
        
        if not user_id or not dashboard_id or can_access is None:
            return jsonify({'success': False, 'message': 'Missing required parameters'}), 400
        
        conn = get_db_connection()
        
        # Update or insert access record
        conn.execute(
            'INSERT OR REPLACE INTO user_dashboard_access (user_id, dashboard_id, can_access) VALUES (?, ?, ?)',
            (user_id, dashboard_id, can_access)
        )
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Access updated successfully'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/user-dashboard-access/<int:user_id>', methods=['GET'])
@token_required
@manager_required
def get_user_dashboard_access(current_user, user_id):
    """Get specific user's dashboard access (manager only)"""
    try:
        conn = get_db_connection()
        
        # Get user's dashboard access
        access_data = conn.execute(
            'SELECT dashboard_id, can_access FROM user_dashboard_access WHERE user_id = ?',
            (user_id,)
        ).fetchall()
        
        conn.close()
        
        # Convert to dictionary
        access_dict = {}
        for row in access_data:
            access_dict[row['dashboard_id']] = row['can_access']
        
        return jsonify({
            'success': True,
            'access': access_dict
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/generate-dashboard-jwt', methods=['POST'])
@token_required
def generate_dashboard_jwt(current_user):
    """Generate JWT for Superset dashboard access"""
    try:
        data = request.get_json()
        dashboard_id = data.get('dashboard_id')
        
        if not dashboard_id:
            return jsonify({'success': False, 'message': 'Dashboard ID required'}), 400
        
        # Check if user has access to this dashboard
        conn = get_db_connection()
        access = conn.execute(
            'SELECT can_access FROM user_dashboard_access WHERE user_id = ? AND dashboard_id = ?',
            (current_user['id'], dashboard_id)
        ).fetchone()
        conn.close()
        
        if not access or not access['can_access']:
            return jsonify({'success': False, 'message': 'Access denied to this dashboard'}), 403
        
        # Generate Superset JWT (customize this based on your Superset configuration)
        superset_payload = {
            'user': {
                'username': current_user['username'],
                'first_name': current_user['name'].split()[0] if current_user['name'] else current_user['username'],
                'last_name': current_user['name'].split()[-1] if len(current_user['name'].split()) > 1 else ''
            },
            'resources': [
                {
                    'type': 'dashboard',
                    'id': dashboard_id
                }
            ],
            'rls': [],  # Row Level Security rules (customize as needed)
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        }
        
        # Use your Superset secret key here
        superset_jwt = jwt.encode(superset_payload, app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'success': True,
            'jwt': superset_jwt
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.datetime.utcnow().isoformat()})

# Initialize database on startup
if __name__ == '__main__':
    # Initialize database
    init_db()
    print("Database initialized successfully!")
    print("\nSample users created:")
    print("- Username: manager, Password: password123 (Manager)")
    print("- Username: john, Password: password123 (User)")
    print("- Username: jane, Password: password123 (User)")
    print("\nStarting Flask server...")
    
    # Run the app
    app.run(debug=True, host='0.0.0.0', port=5000) 