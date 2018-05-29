from flask import Flask
import os

app = Flask(__name__)

@app.route('/')
def hello_world():
    return "Hello World!" #future change

@app.route('/migrate')
def migrate():
    os.system("truffle migrate --network testrpc")
    return '', 200

@app.route('/balance')
def balance(): # to be continued
    return '', 200

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)
