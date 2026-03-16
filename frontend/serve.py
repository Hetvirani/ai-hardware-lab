from flask import Flask, send_from_directory
import os

app = Flask(__name__)

frontend_dir = os.path.dirname(os.path.abspath(__file__))

@app.route("/")
def index():
    return send_from_directory(frontend_dir, "index.html")

@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(frontend_dir, path)

if __name__ == "__main__":
    print("Dashboard running at http://localhost:3000")
    app.run(port=3000, debug=False)