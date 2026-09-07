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

import os
import hashlib
import hmac
import secrets
import sqlite3
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from recommender import ContentRecommender

app = FastAPI(
    title="Movie Recommendation Engine",
    description="Search movies, view details, and get TF-IDF content-based recommendations.",
    version="0.2.0",
)

frontend_url = os.getenv("FRONTEND_URL", "")
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://movierecommender-um4p.onrender.com",
    "https://movie-recommender-web.onrender.com",
    "https://movie-recommender-frontend-og9a.onrender.com",
]
if frontend_url:
    allowed_origins.extend(origin.strip() for origin in frontend_url.split(",") if origin.strip())

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https?://(?:10\.[0-9.]+|192\.168\.[0-9.]+|172\.(?:1[6-9]|2[0-9]|3[0-1])\.[0-9.]+):5173",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = Path(__file__).parent / "movies.json"
AUTH_DB = Path(os.getenv("AUTH_DB", Path(__file__).parent / "accounts.db"))


class SignUpRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=6, max_length=128)


class SignInRequest(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=128)


def get_auth_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(AUTH_DB)
    connection.row_factory = sqlite3.Row
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            password_salt TEXT NOT NULL
        )
        """
    )
    return connection


def normalise_email(email: str) -> str:
    return email.strip().lower()


def hash_password(password: str, salt: bytes) -> str:
    return hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 120_000).hex()


def account_response(user: sqlite3.Row) -> dict[str, str]:
    return {"name": user["name"], "email": user["email"]}

# Fit TF-IDF + cosine similarity once. Every recommendation request reuses this.
recommender = ContentRecommender(DATA_FILE)


@app.post("/auth/signup", status_code=201)
def sign_up(payload: SignUpRequest):
    email = normalise_email(payload.email)
    salt = secrets.token_bytes(16)
    password_hash = hash_password(payload.password, salt)
    connection = get_auth_connection()
    try:
        cursor = connection.execute(
            "INSERT INTO users (name, email, password_hash, password_salt) VALUES (?, ?, ?, ?)",
            (payload.name.strip(), email, password_hash, salt.hex()),
        )
        connection.commit()
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="An account with that email already exists.")
    finally:
        connection.close()
    return {"user": {"name": payload.name.strip(), "email": email}}


@app.post("/auth/signin")
def sign_in(payload: SignInRequest):
    connection = get_auth_connection()
    user = connection.execute(
        "SELECT name, email, password_hash, password_salt FROM users WHERE email = ?",
        (normalise_email(payload.email),),
    ).fetchone()
    connection.close()
    if not user:
        raise HTTPException(status_code=401, detail="That email and password combination is not recognised.")
    salt = bytes.fromhex(user["password_salt"])
    if not hmac.compare_digest(hash_password(payload.password, salt), user["password_hash"]):
        raise HTTPException(status_code=401, detail="That email and password combination is not recognised.")
    return {"user": account_response(user)}


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
