# LLMs for Wikipedia Rebalance

# How to get started

## Running the backend server locally

1. You can either use your system environment Python or virtual environment Python. For best practices, it is better to use a virtual environment.
2. To create a virtual environment in Python, run the commands below.

```
cd backend
python3 -m venv .venv (create virtual environment in the directory)
source .venv/bin/activate (MAC)
.venv\Scripts\activate (WINDOWS)
```

1. Once your virtual environment is running, install the necessary Python modules in the requirements.txt file by running the command below, please make sure you are in the backend folder!

```
which python
pip install --upgrade pip
pip install -r requirements.txt
```

1. Then, go back to the root folder and run the command below to start the flask backend server.

```
flask --app backend.app.main:app run -h localhost -p 3002
```

## Running the frontend server locally

1. Go to the frontend-productions folder.

```
cd frontend-productions
```

2. Install the necessary node modules. (Make sure you have NPM installed in your PC!)

```
npm install
```

3. Start the frontend server.

```
npm run dev
```

\*\* If you encounter any problems, please ask in the Group chat.

# ignore, for deployment to vercel purposes
