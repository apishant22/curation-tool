# How to run the app
## Step 1:
Open a terminal and run:

```bash
flask --app backend.app.main run -h localhost -p 3002
```

## Step 2:
Open a second terminal and run:
```bash
cd ./frontend-production/
winget install Schniz.fnm
fnm env --use-on-cd | Out-String | Invoke-Expression
fnm use --install-if-missing 20
npm install
npm run dev
```

## Also...
Auto installs potentially missing libraries

```bash
cd backend 
pip install beautifulsoup4==4.12.3
pip install blinker==1.8.2
pip install bs4==0.0.2
pip install certifi==2024.8.30
pip install charset-normalizer==3.4.0
pip install click==8.1.7
pip install deepdiff==8.0.1
pip install Flask==3.0.3
pip install Flask-Cors==5.0.0
pip install fuzzywuzzy==0.18.0
pip install idna==3.10
pip install iniconfig==2.0.0
pip install itsdangerous==2.2.0
pip install Jinja2==3.1.4
pip install Levenshtein==0.26.0
pip install MarkupSafe==3.0.2
pip install orderly-set==5.2.2
pip install packaging==24.1
pip install pluggy==1.5.0
pip install pyodbc==5.2.0
pip install pytest==8.3.3
pip install python-dotenv==1.0.1
pip install python-Levenshtein==0.26.0
pip install RapidFuzz==3.10.0
pip install requests==2.32.3
pip install soupsieve==2.6
pip install SQLAlchemy==2.0.36
pip install typing_extensions==4.12.2
pip install urllib3==2.2.3
pip install Werkzeug==3.0.4
```
