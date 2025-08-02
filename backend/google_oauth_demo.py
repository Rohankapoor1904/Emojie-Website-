import os
from flask import Flask, redirect, request, session, url_for, jsonify
import requests


# --- User DB helpers (shared with app.py) ---
import json
USERS_FILE = 'users.json'
def load_users():
    if not os.path.exists(USERS_FILE):
        return {}
    with open(USERS_FILE, 'r') as f:
        return json.load(f)
def save_users(users):
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f)

app = Flask(__name__)
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'your_secret_key')

GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', 'YOUR_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', 'YOUR_CLIENT_SECRET')
GOOGLE_REDIRECT_URI = os.environ.get('GOOGLE_REDIRECT_URI', 'http://127.0.0.1:5000/api/auth/google/callback')

@app.route('/api/auth/google')
def google_login():
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
    code = request.args.get('code')
    if not code:
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
            'oauth_provider': 'google'
        }
        save_users(users)
    # Set session (simple, for demo)
    session['user_email'] = email
    session['username'] = users[email]['username']
    # Send success to opener
    return '''
    <script>
      window.opener.postMessage({socialLogin: 'success', user: %s}, window.location.origin);
      window.close();
    </script>
    ''' % json.dumps({"email": email, "username": users[email]["username"]})

if __name__ == '__main__':
    app.run(debug=True)
