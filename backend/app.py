from flask import Flask, request, jsonify, session, redirect
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
import json
import os
import requests
from dotenv import load_dotenv
from datetime import datetime
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

# --- Google OAuth routes merged from google_oauth_demo.py ---
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', 'YOUR_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', 'YOUR_CLIENT_SECRET')
GOOGLE_REDIRECT_URI = os.environ.get('GOOGLE_REDIRECT_URI', 'http://127.0.0.1:5000/api/auth/google/callback')

app = Flask(__name__)
app.secret_key = os.urandom(24)  # Needed for session management
# --- Fix: Set session cookie attributes for OAuth/session sharing ---
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True if using HTTPS
# Updated CORS origins to include LAN IP
CORS(app, supports_credentials=True, origins=[
    "http://localhost:5507",
    "http://localhost:5000",
    "http://127.0.0.1:5507",
    "http://127.0.0.1:5000",
    "http://192.168.1.5:5507"
])  # Allow localhost, 127.0.0.1, and LAN IP
USERS_FILE = 'users.json'
# File to store channel join data
CHANNELS_FILE = 'channels.json'
# File to store analytics data
ANALYTICS_FILE = 'analytics.json'

# Helper to load users
def load_users():
    if not os.path.exists(USERS_FILE):
        return {}
    with open(USERS_FILE, 'r') as f:
        return json.load(f)

# Helper to save users
def save_users(users):
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f)

# Helper to load channel data
def load_channels():
    if not os.path.exists(CHANNELS_FILE):
        return {}
    with open(CHANNELS_FILE, 'r') as f:
        return json.load(f)

# Helper to save channel data
def save_channels(channels):
    with open(CHANNELS_FILE, 'w') as f:
        json.dump(channels, f, indent=2)

# Helper to load analytics data
def load_analytics():
    if not os.path.exists(ANALYTICS_FILE):
        return {}
    with open(ANALYTICS_FILE, 'r') as f:
        return json.load(f)

# Helper to save analytics data
def save_analytics(analytics):
    with open(ANALYTICS_FILE, 'w') as f:
        json.dump(analytics, f, indent=2)

# Helper to load user channel joins
def load_user_joins():
    users = load_users()
    for email in users:
        if 'joined_channels' not in users[email]:
            users[email]['joined_channels'] = []
    return users

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    username = data.get('username')
    if not email or not password or not username:
        return jsonify({'success': False, 'message': 'Missing fields'}), 400
    users = load_users()
    if email in users:
        return jsonify({'success': False, 'message': 'Email already registered'}), 409
    users[email] = {
        'username': username,
        'password_hash': generate_password_hash(password),
        'download_count': 0
    }
    save_users(users)
    return jsonify({'success': True, 'message': 'Account created'})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return jsonify({'success': False, 'message': 'Missing fields'}), 400
    users = load_users()
    user = users.get(email)
    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
    # Store user info in session
    session['user_email'] = email
    session['username'] = user['username']
    return jsonify({'success': True, 'message': 'Login successful', 'username': user['username']})

@app.route('/api/user', methods=['GET'])
def get_user():
    email = session.get('user_email')
    username = session.get('username')
    print(f"Debug: /api/user called. Session: email={email}, username={username}")
    print(f"Debug: Full session data: {dict(session)}")
    if email and username:
        # Load user data to get profile picture
        users = load_users()
        user_data = users.get(email, {})
        user_response = {
            'logged_in': True,
            'user': {
                'email': email,
                'username': username,
                'name': username,
                'picture': user_data.get('profile_pic', ''),
                'download_count': user_data.get('download_count', 0)
            }
        }
        print(f"Debug: Returning user data: {user_response}")
        return jsonify(user_response)
    print("Debug: No user logged in")
    return jsonify({'logged_in': False, 'user': None})

@app.route('/api/test')
def test_endpoint():
    print("Debug: /api/test endpoint called")
    return jsonify({'status': 'Backend is working', 'message': 'API endpoint is accessible'})

@app.route('/api/health')
def health_check():
    print("Debug: /api/health endpoint called")
    return jsonify({'status': 'healthy', 'timestamp': str(os.popen('date /t && time /t').read().strip())})

@app.route('/api/debug/session')
def debug_session():
    """Debug endpoint to check session state"""
    return jsonify({
        'session_data': dict(session),
        'user_email': session.get('user_email'),
        'username': session.get('username'),
        'session_id': session.get('_id', 'No session ID'),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/auth/google')
def google_login():
    # For testing purposes, let's add some debugging
    print(f"Google OAuth endpoint hit. Client ID: {GOOGLE_CLIENT_ID[:10]}...")
    
    if GOOGLE_CLIENT_ID == 'YOUR_CLIENT_ID':
        return jsonify({
            'error': 'Google OAuth not configured',
            'message': 'Please set up GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables'
        }), 400
    
    google_auth_url = (
        'https://accounts.google.com/o/oauth2/v2/auth'
        '?response_type=code'
        f'&client_id={GOOGLE_CLIENT_ID}'
        f'&redirect_uri={GOOGLE_REDIRECT_URI}'
        '&scope=openid%20email%20profile'
        '&access_type=online'
        '&prompt=select_account'
    )
    return redirect(google_auth_url)

@app.route('/api/auth/google/callback')
def google_callback():
    print(f"Google OAuth callback received. Args: {request.args}")
    code = request.args.get('code')
    if not code:
        print("No code provided in callback")
        return 'No code provided', 400
    # Exchange code for token
    token_url = 'https://oauth2.googleapis.com/token'
    data = {
        'code': code,
        'client_id': GOOGLE_CLIENT_ID,
        'client_secret': GOOGLE_CLIENT_SECRET,
        'redirect_uri': GOOGLE_REDIRECT_URI,
        'grant_type': 'authorization_code',
    }
    token_resp = requests.post(token_url, data=data)
    if token_resp.status_code != 200:
        return 'Failed to get token', 400
    token_json = token_resp.json()
    access_token = token_json.get('access_token')
    if not access_token:
        return 'No access token', 400
    # Get user info
    userinfo_resp = requests.get(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        headers={'Authorization': f'Bearer {access_token}'}
    )
    if userinfo_resp.status_code != 200:
        return 'Failed to get user info', 400
    userinfo = userinfo_resp.json()
    # --- Integrate with user DB ---
    users = load_users()
    email = userinfo.get('email')
    username = userinfo.get('name') or userinfo.get('email', '').split('@')[0]
    if not email:
        return 'No email from Google', 400
    if email not in users:
        # Register new user (no password, mark as google)
        users[email] = {
            'username': username,
            'google_id': userinfo.get('id'),
            'profile_pic': userinfo.get('picture', ''),
            'oauth_provider': 'google',
            'download_count': 0
        }
        save_users(users)
    # Set session
    session['user_email'] = email
    session['username'] = users[email]['username']
    print(f"Session set for user: {email}, username: {users[email]['username']}")
    print(f"Session data: {dict(session)}")
    # Send success to opener
    # Use the frontend's origin for postMessage - support multiple origins
    frontend_origins = [
        'http://127.0.0.1:5507',
        'http://localhost:5507',
        'http://127.0.0.1:3000',
        'http://localhost:3000',
        'http://127.0.0.1:8080',
        'http://localhost:8080'
    ]
    user_data = {
        "email": email, 
        "username": users[email]["username"],
        "name": users[email]["username"],
        "picture": users[email].get("profile_pic", ""),
        "download_count": users[email].get("download_count", 0)
    }
    
    # Try to send to all possible origins
    post_message_script = '''
    <script>
      try {
        console.log('Sending postMessage to parent window');
        const userData = %s;
        const origins = %s;
        
        // Try to send to all possible origins
        origins.forEach(origin => {
          try {
            window.opener.postMessage({
              socialLogin: 'success',
              type: 'social-login-success',
              user: userData
            }, origin);
            console.log('PostMessage sent to:', origin);
          } catch (e) {
            console.log('Failed to send to origin:', origin, e);
          }
        });
        
        // Also try to send to the opener's origin
        try {
          window.opener.postMessage({
            socialLogin: 'success',
            type: 'social-login-success',
            user: userData
          }, '*');
          console.log('PostMessage sent to opener with wildcard origin');
        } catch (e) {
          console.log('Failed to send with wildcard origin:', e);
        }
        
        console.log('PostMessage attempts completed');
      } catch (e) { 
        console.error('Error sending postMessage:', e); 
      }
      setTimeout(function() { window.close(); }, 2000);
    </script>
    ''' % (json.dumps(user_data), json.dumps(frontend_origins))
    
    return post_message_script

@app.route('/api/auth/facebook')
def facebook_login():
    return jsonify({
        'error': 'Facebook OAuth not configured',
        'message': 'Facebook login is not yet implemented. Please use Google login or regular signup/login.'
    }), 501

@app.route('/api/auth/apple')
def apple_login():
    return jsonify({
        'error': 'Apple OAuth not configured', 
        'message': 'Apple login is not yet implemented. Please use Google login or regular signup/login.'
    }), 501

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out'})

# Endpoint to increment user's download count
@app.route('/api/user/increment_download', methods=['POST'])
def increment_download():
    email = session.get('user_email')
    if not email:
        return jsonify({'success': False, 'message': 'Not logged in'}), 401
    users = load_users()
    if email not in users:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    users[email]['download_count'] = users[email].get('download_count', 0) + 1
    save_users(users)
    return jsonify({'success': True, 'download_count': users[email]['download_count']})

# Endpoint to join a channel/server
@app.route('/api/join-channel', methods=['POST'])
def join_channel():
    email = session.get('user_email')
    if not email:
        return jsonify({'success': False, 'message': 'Please login to join channels'}), 401
    
    data = request.json
    channel_id = data.get('channelId')
    link = data.get('link')
    platform = data.get('platform')
    timestamp = data.get('timestamp')
    
    if not all([channel_id, link, platform]):
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400
    
    # Load existing data
    users = load_user_joins()
    channels = load_channels()
    
    # Update user's joined channels
    if email not in users:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    if 'joined_channels' not in users[email]:
        users[email]['joined_channels'] = []
    
    # Check if already joined
    already_joined = any(
        join['channelId'] == channel_id for join in users[email]['joined_channels']
    )
    
    if already_joined:
        return jsonify({'success': False, 'message': 'Already joined this channel'}), 409
    
    # Add to user's joined channels
    join_data = {
        'channelId': channel_id,
        'link': link,
        'platform': platform,
        'joinedAt': timestamp or datetime.now().isoformat()
    }
    users[email]['joined_channels'].append(join_data)
    
    # Update channel statistics
    if channel_id not in channels:
        channels[channel_id] = {
            'id': channel_id,
            'platform': platform,
            'link': link,
            'members': [],
            'joinCount': 0
        }
    
    if email not in channels[channel_id]['members']:
        channels[channel_id]['members'].append(email)
        channels[channel_id]['joinCount'] += 1
    
    # Save data
    save_users(users)
    save_channels(channels)
    
    return jsonify({
        'success': True, 
        'message': 'Successfully joined channel',
        'channelId': channel_id,
        'joinCount': channels[channel_id]['joinCount']
    })

# Endpoint to track user events
@app.route('/api/track-event', methods=['POST'])
def track_event():
    data = request.json
    event_type = data.get('event')
    timestamp = data.get('timestamp', datetime.now().isoformat())
    
    if not event_type:
        return jsonify({'success': False, 'message': 'Event type required'}), 400
    
    analytics = load_analytics()
    
    if event_type not in analytics:
        analytics[event_type] = []
    
    event_data = {
        'timestamp': timestamp,
        'user_email': session.get('user_email'),
        'user_agent': request.headers.get('User-Agent'),
        'ip': request.remote_addr
    }
    
    analytics[event_type].append(event_data)
    save_analytics(analytics)
    
    return jsonify({'success': True, 'message': 'Event tracked'})

# Endpoint to get user's joined channels
@app.route('/api/user-channels', methods=['GET'])
def get_user_channels():
    email = session.get('user_email')
    if not email:
        return jsonify({'success': False, 'message': 'Not logged in'}), 401
    
    users = load_users()
    if email not in users:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    joined_channels = users[email].get('joined_channels', [])
    return jsonify({
        'success': True,
        'joinedChannels': joined_channels,
        'count': len(joined_channels)
    })

# Endpoint to get channel statistics
@app.route('/api/channel-stats', methods=['GET'])
def get_channel_stats():
    channels = load_channels()
    
    stats = {
        'totalChannels': len(channels),
        'totalJoins': sum(ch.get('joinCount', 0) for ch in channels.values()),
        'platformStats': {}
    }
    
    # Calculate platform statistics
    for channel in channels.values():
        platform = channel.get('platform', 'unknown')
        if platform not in stats['platformStats']:
            stats['platformStats'][platform] = {
                'channels': 0,
                'joins': 0
            }
        stats['platformStats'][platform]['channels'] += 1
        stats['platformStats'][platform]['joins'] += channel.get('joinCount', 0)
    
    return jsonify({
        'success': True,
        'stats': stats
    })

# Endpoint to get popular channels
@app.route('/api/popular-channels', methods=['GET'])
def get_popular_channels():
    channels = load_channels()
    platform = request.args.get('platform', None)
    
    # Sort by join count
    sorted_channels = sorted(
        channels.values(),
        key=lambda x: x.get('joinCount', 0),
        reverse=True
    )
    
    # Filter by platform if specified
    if platform:
        sorted_channels = [ch for ch in sorted_channels if ch.get('platform') == platform]
    
    # Return top 10
    popular = sorted_channels[:10]
    
    return jsonify({
        'success': True,
        'channels': popular
    })

@app.route('/api/channels', methods=['GET'])
def get_all_channels():
    # Admin check can be more sophisticated
    email = session.get('user_email')
    users = load_users()
    if not email or email != 'admin@example.com' or email not in users:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    channels = load_channels()
    return jsonify({'success': True, 'channels': channels})

# Endpoint to create a new channel (admin)
@app.route('/api/channel', methods=['POST'])
def create_channel():
    email = session.get('user_email')
    if not email:
        return jsonify({'success': False, 'message': 'Not logged in'}), 401
    data = request.json
    channel_id = data.get('channel_id')
    if not channel_id:
        return jsonify({'success': False, 'message': 'Channel ID required'}), 400
    users = load_users()
    channels = load_channels()
    # Admin check can be more sophisticated
    if email != 'admin@example.com' or email not in users:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    if channel_id in channels:
        return jsonify({'success': False, 'message': 'Channel ID already exists'}), 409
    # Create new channel
    channels[channel_id] = {
        'members': [],
        'join_time': str(datetime.now())
    }
    save_channels(channels)
    return jsonify({'success': True, 'message': 'Channel created', 'channel_id': channel_id})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
