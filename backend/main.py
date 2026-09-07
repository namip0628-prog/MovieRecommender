"""
main.py — the FastAPI backend for the Movie Recommendation Engine.

Endpoints:
  GET /movies                              list the catalog
  GET /movies/search?q=nolan               search title, people, tags, plot
  GET /movies/{movie_id}                   one movie's details
  GET /movies/{movie_id}/recommendations   10 similar movies (content-based)
  GET /recommendations?movie_id=2          same engine, query-string style

Run from the backend folder:
  .venv\\Scripts\\activate
  uvicorn main:app --reload
"""

from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from recommender import ContentRecommender

app = FastAPI(
    title="Movie Recommendation Engine",
    description="Search movies, view details, and get TF-IDF content-based recommendations.",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = Path(__file__).parent / "movies.json"

# Fit TF-IDF + cosine similarity once. Every recommendation request reuses this.
recommender = ContentRecommender(DATA_FILE)


@app.get("/")
def root():
    """Quick check that the server is running, plus links to the main routes."""
    return {
        "message": "Movie Recommendation Engine API",
        "docs": "/docs",
        "endpoints": {
            "list": "/movies",
            "search": "/movies/search?q=inception",
            "details": "/movies/2",
            "recommendations": "/movies/2/recommendations",
        },
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/movies")
def list_movies():
    """Return every movie in the catalog."""
    return recommender.list_movies()


@app.get("/movies/search")
def search_movies(
    q: str = Query(..., min_length=1, description="Text to look for, e.g. nolan or gotham"),
):
    """
    Search movies by title, year, overview, genres, keywords, cast, or director.

    Example: /movies/search?q=miyazaki
    """
    results = recommender.search(q)
    return {"query": q.strip(), "count": len(results), "results": results}


@app.get("/movies/{movie_id}")
def get_movie_details(movie_id: int):
    """Return full details for one movie, or 404 if the id is unknown."""
    try:
        return recommender.get_movie(movie_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Movie not found")


@app.get("/movies/{movie_id}/recommendations")
def get_movie_recommendations(
    movie_id: int,
    top_n: int = Query(10, ge=1, le=20),
):
    """
    Content-based recommendations from the TF-IDF engine.

    Example: /movies/2/recommendations?top_n=5
    """
    try:
        seed = recommender.get_movie(movie_id)
        results = recommender.recommend(movie_id, top_n=top_n)
    except KeyError:
        raise HTTPException(status_code=404, detail="Movie not found")

    return {
        "movie_id": seed["id"],
        "title": seed["title"],
        "recommendations": results,
    }


@app.get("/recommendations")
def get_recommendations(
    movie_id: int = Query(..., description="Id of the movie to recommend from"),
    top_n: int = Query(10, ge=1, le=20),
):
    """Same as /movies/{id}/recommendations, kept for the React app."""
    return get_movie_recommendations(movie_id, top_n=top_n)
