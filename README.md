# Movie Recommendation Engine

A beginner-friendly full-stack starter:

- **Frontend:** React (Vite) — the pages you see in the browser
- **Backend:** Python FastAPI — the API that serves movie data

Recommendations are **content-based**: each movie is turned into one text blob (overview, genres, keywords, cast, director), then TF-IDF + cosine similarity ranks the 10 closest titles.

## Project layout

```
movie-recommender/
├── README.md                 ← you are here
├── .gitignore                ← files Git should not track (venv, node_modules)
├── backend/
│   ├── main.py               ← FastAPI app and routes
│   ├── recommender.py        ← TF-IDF + cosine similarity engine
│   ├── movies.json           ← sample movie data
│   └── requirements.txt      ← Python packages to install
└── frontend/
    ├── index.html            ← the HTML shell React mounts into
    ├── package.json          ← Node packages and npm scripts
    ├── vite.config.js        ← Vite (dev server) settings
    └── src/
        ├── main.jsx          ← starts React and renders <App />
        ├── App.jsx           ← main UI: loads movies, shows a placeholder recommend button
        ├── api.js            ← fetch() helpers that call the FastAPI server
        ├── index.css         ← global styles
        └── App.css           ← styles for the movie list
```

### What each major file does

| File | Role |
| --- | --- |
| `backend/main.py` | FastAPI routes: list, search, details, and recommendations. |
| `backend/recommender.py` | Builds a “soup” string per movie, vectorizes with TF-IDF, ranks by cosine similarity. |
| `backend/movies.json` | Sample catalog with overview, genres, keywords, cast, and director. |
| `backend/requirements.txt` | FastAPI, Uvicorn, pandas, and scikit-learn. |
| `frontend/src/App.jsx` | The main React screen: fetch movies on load, display cards, call the stub recommend endpoint. |
| `frontend/src/api.js` | Central place for backend URLs (`http://localhost:8000`). |
| `frontend/src/main.jsx` | Boots React and attaches it to `#root` in `index.html`. |
| `frontend/vite.config.js` | Runs the frontend on port **5173**. |

## Prerequisites

- **Python 3** (already used to create this project)
- **Node.js** (includes `npm`) — needed to run the React app. Install from [https://nodejs.org](https://nodejs.org) if `node` is not on your PATH.

## Run the backend

In a terminal:

```powershell
cd C:\Users\rakes\movie-recommender\backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

- API: [http://localhost:8000](http://localhost:8000)
- Interactive docs: [http://localhost:8000/docs](http://localhost:8000/docs)

## Run the frontend

In a **second** terminal (after Node.js is installed):

```powershell
cd C:\Users\rakes\movie-recommender\frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). You should see the sample movies from the API.

If the frontend says it cannot reach the backend, make sure Uvicorn is still running on port 8000.

For a deployed frontend, set the `VITE_API_URL` environment variable to the public URL of the deployed FastAPI backend before building, for example `https://your-api-service.onrender.com`.

## Try the recommender from the command line

```powershell
cd C:\Users\rakes\movie-recommender\backend
.\.venv\Scripts\activate
python recommender.py
```

That prints the 10 titles most similar to *Inception*.

### Algorithm (short version)

1. **Soup** — glue overview, genres, keywords, cast, and director into one string per movie. Cast/director names have spaces removed so `Christopher Nolan` is one token (`christophernolan`).
2. **TF-IDF** — turn those strings into weighted word counts. Rare, distinctive words matter more than words that appear in almost every movie.
3. **Cosine similarity** — compare the seed movie’s vector to every other movie. Higher score = more similar content.
4. **Top 10** — sort those scores and skip the movie itself.
