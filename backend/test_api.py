"""Smoke tests for search, details, recommendation, and auth endpoints."""

import tempfile
from pathlib import Path

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_auth_signup_and_signin():
    import main

    original_db = main.AUTH_DB
    with tempfile.TemporaryDirectory() as directory:
        main.AUTH_DB = Path(directory) / "accounts.db"
        signup = client.post("/auth/signup", json={"name": "Alex", "email": "Alex@example.com", "password": "secret123"})
        assert signup.status_code == 201
        assert signup.json()["user"] == {"name": "Alex", "email": "alex@example.com"}

        signin = client.post("/auth/signin", json={"email": "alex@example.com", "password": "secret123"})
        assert signin.status_code == 200
        assert signin.json()["user"]["email"] == "alex@example.com"

        wrong_password = client.post("/auth/signin", json={"email": "alex@example.com", "password": "wrong123"})
        assert wrong_password.status_code == 401
    main.AUTH_DB = original_db


def test_list_movies():
    response = client.get("/movies")
    assert response.status_code == 200
    movies = response.json()
    assert isinstance(movies, list)
    assert len(movies) >= 11
    first = movies[0]
    for key in ("id", "title", "year", "genres", "keywords", "overview", "cast", "director"):
        assert key in first
    assert "soup" not in first


def test_search_by_title():
    response = client.get("/movies/search", params={"q": "inception"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["count"] >= 1
    titles = [movie["title"].lower() for movie in payload["results"]]
    assert any("inception" in title for title in titles)


def test_search_by_director():
    response = client.get("/movies/search", params={"q": "Miyazaki"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["count"] >= 2
    assert all(movie["director"] == "Hayao Miyazaki" for movie in payload["results"])


def test_search_missing_query():
    response = client.get("/movies/search")
    assert response.status_code == 422


def test_movie_details():
    response = client.get("/movies/2")
    assert response.status_code == 200
    movie = response.json()
    assert movie["id"] == 2
    assert movie["title"] == "Inception"
    assert movie["director"] == "Christopher Nolan"
    assert "Leonardo DiCaprio" in movie["cast"]


def test_movie_details_not_found():
    response = client.get("/movies/9999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Movie not found"


def test_nested_recommendations():
    response = client.get("/movies/2/recommendations")
    assert response.status_code == 200
    payload = response.json()
    assert payload["movie_id"] == 2
    assert payload["title"] == "Inception"
    recs = payload["recommendations"]
    assert len(recs) == 10
    ids = [movie["id"] for movie in recs]
    assert 2 not in ids
    assert recs == sorted(recs, key=lambda m: m["similarity"], reverse=True)
    for movie in recs:
        assert "similarity" in movie
        assert movie["title"]


def test_recommendations_query_string_and_top_n():
    response = client.get("/recommendations", params={"movie_id": 4, "top_n": 5})
    assert response.status_code == 200
    recs = response.json()["recommendations"]
    assert len(recs) == 5
    titles = [movie["title"] for movie in recs]
    assert any("Batman" in title or "Dark Knight" in title or "Prestige" in title for title in titles)


def test_recommendations_unknown_movie():
    response = client.get("/movies/9999/recommendations")
    assert response.status_code == 404


if __name__ == "__main__":
    tests = [
        test_health,
        test_auth_signup_and_signin,
        test_list_movies,
        test_search_by_title,
        test_search_by_director,
        test_search_missing_query,
        test_movie_details,
        test_movie_details_not_found,
        test_nested_recommendations,
        test_recommendations_query_string_and_top_n,
        test_recommendations_unknown_movie,
    ]
    for test in tests:
        test()
        print(f"ok  {test.__name__}")
    print(f"\n{len(tests)} tests passed")
