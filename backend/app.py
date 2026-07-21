import sqlite3
import uuid
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app)

def init_db():
    conn = sqlite3.connect('coffee.db')
    c = conn.cursor()
    
    # Updated Users Table: Now stores the text of the chosen questions
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            q1_text TEXT NOT NULL,
            sec_q1_hash TEXT NOT NULL,
            q2_text TEXT NOT NULL,
            sec_q2_hash TEXT NOT NULL
        )
    ''')

    c.execute('''
        CREATE TABLE IF NOT EXISTS beans (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            roaster TEXT NOT NULL,
            name TEXT NOT NULL,
            roast_date TEXT,
            roast_level TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')

    c.execute('''
        CREATE TABLE IF NOT EXISTS brew_logs (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            bean_id TEXT NOT NULL,
            method TEXT NOT NULL,
            dose_grams REAL NOT NULL,
            yield_grams REAL NOT NULL,
            time_seconds INTEGER NOT NULL,
            rating INTEGER,
            notes TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (bean_id) REFERENCES beans (id)
        )
    ''')
    
    conn.commit()
    conn.close()

init_db()

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    q1_text = data.get('q1_text')
    sec_q1 = data.get('sec_q1')
    q2_text = data.get('q2_text')
    sec_q2 = data.get('sec_q2')

    if not all([username, password, q1_text, sec_q1, q2_text, sec_q2]):
        return jsonify({"error": "All fields are required"}), 400

    pass_hash = generate_password_hash(password, method='pbkdf2:sha256')
    q1_hash = generate_password_hash(sec_q1.strip().lower(), method='pbkdf2:sha256')
    q2_hash = generate_password_hash(sec_q2.strip().lower(), method='pbkdf2:sha256')
    
    user_id = str(uuid.uuid4())

    try:
        conn = sqlite3.connect('coffee.db')
        c = conn.cursor()
        # Insert the question text along with the hashes
        c.execute("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?)", 
                  (user_id, username, pass_hash, q1_text, q1_hash, q2_text, q2_hash))
        conn.commit()
        return jsonify({"message": "User created successfully!"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "Username already exists"}), 409
    finally:
        conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    conn = sqlite3.connect('coffee.db')
    conn.row_factory = sqlite3.Row 
    c = conn.cursor()
    user = c.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
    conn.close()

    if user is None or not check_password_hash(user['password_hash'], password):
        return jsonify({"error": "Invalid username or password"}), 401

    return jsonify({
        "message": f"Welcome back, {username}!",
        "user_id": user['id'],
        "username": user['username']
    }), 200

# NEW: Fetch a user's specific security questions
@app.route('/api/get-questions', methods=['POST'])
def get_questions():
    username = request.json.get('username')
    conn = sqlite3.connect('coffee.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    user = c.execute('SELECT q1_text, q2_text FROM users WHERE username = ?', (username,)).fetchone()
    conn.close()
    
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    return jsonify({"q1": user["q1_text"], "q2": user["q2_text"]}), 200

# NEW: Verify answers and reset password
@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.json
    username = data.get('username')
    new_password = data.get('new_password')
    ans1 = data.get('ans1')
    ans2 = data.get('ans2')

    conn = sqlite3.connect('coffee.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    user = c.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
    
    # Check if the scrambled answers match
    if not check_password_hash(user['sec_q1_hash'], ans1.strip().lower()) or \
       not check_password_hash(user['sec_q2_hash'], ans2.strip().lower()):
        conn.close()
        return jsonify({"error": "Security answers are incorrect"}), 401
        
    new_hash = generate_password_hash(new_password, method='pbkdf2:sha256')
    c.execute('UPDATE users SET password_hash = ? WHERE username = ?', (new_hash, username))
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Password reset successfully!"}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5001)