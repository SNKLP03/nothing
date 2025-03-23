# from flask import Flask, request, jsonify
# from flask_cors import CORS
# from flask_pymongo import PyMongo
# from datetime import datetime
# import requests
# from werkzeug.security import generate_password_hash, check_password_hash

# app = Flask(__name__)
# app.config["MONGO_URI"] = "mongodb://localhost:27017/chessAnalysis"
# app.config["SECRET_KEY"] = "{~DKvCX5dJ/j.r!k3~'DF?mY59k75]pN"
# CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})
# mongo = PyMongo(app)

# @app.route('/api/chesscom/games', methods=['GET'])
# def chesscom_games():
#     username = request.args.get('username')
#     if not username:
#         return jsonify({"error": "No Chess.com username provided"}), 400
    
#     username = username.lower()
#     archives_url = f"https://api.chess.com/pub/player/{username}/games/archives"
#     headers = {
#         "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
#         "Accept": "application/ld+json"
#     }

#     archives_response = requests.get(archives_url, headers=headers)
#     if archives_response.status_code != 200:
#         return jsonify({"error": "Error fetching archives from Chess.com."}), archives_response.status_code
    
#     archives_data = archives_response.json()
#     archives_list = archives_data.get("archives", [])
#     if not archives_list:
#         return jsonify({"error": "No games found"}), 404
    
#     pgn_list = []
#     for archive_url in archives_list[-3:]:
#         games_response = requests.get(archive_url, headers=headers)
#         if games_response.status_code == 200:
#             games_data = games_response.json()
#             games = games_data.get("games", [])
#             pgn_list.extend([game.get("pgn", "") for game in games if game.get("pgn")])
    
#     pgn_list = pgn_list[-10:] if len(pgn_list) > 10 else pgn_list
#     print('Returning games:', pgn_list[:2])
#     return jsonify({"games": pgn_list})

# @app.route('/api/save-analysis', methods=['POST'])
# def save_analysis():
#     data = request.get_json()
#     print('Received request data:', data)
#     username = data.get("username")
#     pgn = data.get("pgn")
#     analysis = data.get("analysis", [])
#     last_viewed_move = data.get("last_viewed_move", 0)
#     comments = data.get("comments", [])

#     if not username or not pgn:
#         error_msg = "Missing username or pgn"
#         print('Validation failed:', error_msg)
#         return jsonify({"error": error_msg}), 400

#     analysis_entry = {
#         "username": username,
#         "pgn": pgn,
#         "analysis": analysis,
#         "last_viewed_move": last_viewed_move,
#         "comments": comments,
#         "timestamp": datetime.now().isoformat()
#     }
#     result = mongo.db.analysis_history.insert_one(analysis_entry)
#     print('Saved analysis with ID:', str(result.inserted_id))
#     return jsonify({"message": "Analysis saved", "id": str(result.inserted_id)})

# @app.route('/api/analysis-history/<username>', methods=['GET'])
# def get_analysis_history(username):
#     history = mongo.db.analysis_history.find({"username": username}).sort("timestamp", -1).limit(10)
#     history_list = [
#         {
#             "id": str(entry["_id"]),
#             "pgn": entry["pgn"],
#             "analysis": entry["analysis"],
#             "last_viewed_move": entry["last_viewed_move"],
#             "comments": entry.get("comments", []),
#             "timestamp": entry["timestamp"]
#         }
#         for entry in history
#     ]
#     print('Returning analysis history for', username, ':', history_list)
#     return jsonify({"history": history_list})

# @app.route('/api/login', methods=['POST'])
# def login():
#     data = request.get_json()
#     print('Login request data:', data)
#     username = data.get("username")
#     password = data.get("password")

#     if not username or not password:
#         return jsonify({"error": "Missing fields"}), 400
    
#     user = mongo.db.users.find_one({"username": username})
#     if user and check_password_hash(user["password"], password):
#         return jsonify({
#             "message": "Logged in successfully",
#             "user": {"username": user["username"], "email": user.get("email", "")}
#         })
#     return jsonify({"error": "Invalid credentials"}), 400

# @app.route('/api/register', methods=['POST'])
# def register():
#     data = request.get_json()
#     username = data.get("username")
#     email = data.get("email")
#     password = data.get("password")

#     if not username or not email or not password:
#         return jsonify({"error": "Missing fields"}), 400
#     if mongo.db.users.find_one({"username": username}):
#         return jsonify({"error": "Username already exists"}), 400
    
#     password_hash = generate_password_hash(password)
#     user_data = {"username": username, "email": email, "password": password_hash}
#     mongo.db.users.insert_one(user_data)
#     return jsonify({"message": "User registered successfully"})

# if __name__ == '__main__':
#     app.run(host='0.0.0.0', port=5000, debug=True)

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
from datetime import datetime
import requests
from werkzeug.security import generate_password_hash, check_password_hash
import chess
import chess.pgn
from io import StringIO

app = Flask(__name__)
app.config["MONGO_URI"] = "mongodb://localhost:27017/chessAnalysis"
app.config["SECRET_KEY"] = "{~DKvCX5dJ/j.r!k3~'DF?mY59k75]pN"
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})
mongo = PyMongo(app)

# Dummy evaluation function (replace with your ChessNN if available)
def evaluate_position(board):
    return 0.5  # Placeholder

def board_to_fen(board):
    return board.fen()

@app.route('/api/chesscom/games', methods=['GET'])
def chesscom_games():
    username = request.args.get('username')
    if not username:
        return jsonify({"error": "No Chess.com username provided"}), 400
    
    username = username.lower()
    archives_url = f"https://api.chess.com/pub/player/{username}/games/archives"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Accept": "application/ld+json"
    }

    archives_response = requests.get(archives_url, headers=headers)
    if archives_response.status_code != 200:
        return jsonify({"error": "Error fetching archives from Chess.com."}), archives_response.status_code
    
    archives_data = archives_response.json()
    archives_list = archives_data.get("archives", [])
    if not archives_list:
        return jsonify({"error": "No games found"}), 404
    
    pgn_list = []
    for archive_url in archives_list[-3:]:
        games_response = requests.get(archive_url, headers=headers)
        if games_response.status_code == 200:
            games_data = games_response.json()
            games = games_data.get("games", [])
            pgn_list.extend([game.get("pgn", "") for game in games if game.get("pgn")])
    
    pgn_list = pgn_list[-10:] if len(pgn_list) > 10 else pgn_list
    print('Returning games:', pgn_list[:2])
    return jsonify({"games": pgn_list})

@app.route('/api/save-analysis', methods=['POST'])
def save_analysis():
    data = request.get_json()
    print('Received request data:', data)
    username = data.get("username")
    pgn = data.get("pgn")
    analysis = data.get("analysis", [])
    last_viewed_move = data.get("last_viewed_move", 0)
    comments = data.get("comments", [])

    if not username or not pgn:
        error_msg = "Missing username or pgn"
        print('Validation failed:', error_msg)
        return jsonify({"error": error_msg}), 400

    analysis_entry = {
        "username": username,
        "pgn": pgn,
        "analysis": analysis,
        "last_viewed_move": last_viewed_move,
        "comments": comments,
        "timestamp": datetime.now().isoformat()
    }
    result = mongo.db.analysis_history.insert_one(analysis_entry)
    print('Saved analysis with ID:', str(result.inserted_id))
    return jsonify({"message": "Analysis saved", "id": str(result.inserted_id)})

@app.route('/api/analysis-history/<username>', methods=['GET'])
def get_analysis_history(username):
    history = mongo.db.analysis_history.find({"username": username}).sort("timestamp", -1).limit(10)
    history_list = [
        {
            "id": str(entry["_id"]),
            "pgn": entry["pgn"],
            "analysis": entry["analysis"],
            "last_viewed_move": entry["last_viewed_move"],
            "comments": entry.get("comments", []),
            "timestamp": entry["timestamp"]
        }
        for entry in history
    ]
    print('Returning analysis history for', username, ':', history_list)
    return jsonify({"history": history_list})

@app.route('/api/analyze_game', methods=['POST'])
def analyze_game():
    data = request.get_json()
    pgn_string = data.get("pgn")
    if not pgn_string:
        return jsonify({"error": "No PGN provided"}), 400
    
    pgn_io = StringIO(pgn_string)
    game = chess.pgn.read_game(pgn_io)
    if not game:
        return jsonify({"error": "Invalid PGN"}), 400

    board = game.board()
    analysis = []
    move_number = 1

    for move in game.mainline_moves():
        board.push(move)
        analysis.append({
            "move_number": move_number,
            "played_move": str(move),
            "board_fen": board_to_fen(board),
            "evaluation": evaluate_position(board),
            "predicted_best_move": str(move),  # Placeholder
            "predicted_evaluation": evaluate_position(board),
            "comment": "Placeholder analysis"
        })
        move_number += 1

    print('Game analysis:', analysis[:2])  # Debug first two moves
    return jsonify({"analysis": analysis})

@app.route('/api/update-last-viewed/<analysis_id>', methods=['POST'])
def update_last_viewed(analysis_id):
    data = request.get_json()
    last_viewed_move = data.get("last_viewed_move")
    comments = data.get("comments")
    
    if last_viewed_move is None:
        return jsonify({"error": "Missing last_viewed_move"}), 400
    
    update_data = {"last_viewed_move": last_viewed_move}
    if comments is not None:
        update_data["comments"] = comments
    
    result = mongo.db.analysis_history.update_one(
        {"_id": ObjectId(analysis_id)},
        {"$set": update_data}
    )
    print('Updated analysis ID:', analysis_id, 'with', update_data)
    return jsonify({"message": "Last viewed move updated"})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    print('Login request data:', data)
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Missing fields"}), 400
    
    user = mongo.db.users.find_one({"username": username})
    if user and check_password_hash(user["password"], password):
        return jsonify({
            "message": "Logged in successfully",
            "user": {"username": user["username"], "email": user.get("email", "")}
        })
    return jsonify({"error": "Invalid credentials"}), 400

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not email or not password:
        return jsonify({"error": "Missing fields"}), 400
    if mongo.db.users.find_one({"username": username}):
        return jsonify({"error": "Username already exists"}), 400
    
    password_hash = generate_password_hash(password)
    user_data = {"username": username, "email": email, "password": password_hash}
    mongo.db.users.insert_one(user_data)
    return jsonify({"message": "User registered successfully"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)