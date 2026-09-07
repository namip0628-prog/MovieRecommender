"""
Content-based movie recommendations (TF-IDF + cosine similarity).

How the algorithm works
-----------------------
1. Each movie is turned into one long "soup" string:
   overview + genres + keywords + cast + director.

2. TF-IDF (Term Frequency–Inverse Document Frequency) converts that
   text into numbers. Words that appear a lot in one movie but are rare
   across the whole catalog get a high weight. Common words like "the"
   are ignored (English stop words).

3. Cosine similarity measures the angle between two movies' TF-IDF
   vectors. 1.0 means the texts are almost the same direction (very
   similar). 0.0 means they share almost no important words.

4. For a chosen movie we rank every other movie by that score and
   return the top 10.

This file is a standalone module. FastAPI can later do:

    from recommender import ContentRecommender
    engine = ContentRecommender("movies.json")
    engine.recommend(movie_id=2)
"""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

DEFAULT_TOP_N = 10


def _as_list(value) -> list[str]:
    """Turn a string, list, or missing value into a list of strings."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return []
    if isinstance(value, list):
        return [str(item) for item in value if str(item).strip()]
    text = str(value).strip()
    return [text] if text else []


def _squash_names(names: list[str]) -> str:
    """
    Join multi-word names into one token.

    "Christopher Nolan" -> "christophernolan"

    TF-IDF splits on spaces. If we left the space, "Nolan" and
    "Christopher" would be counted separately and might mix with
    other people who share a first or last name.
    """
    return " ".join(name.lower().replace(" ", "") for name in names)


def build_soup(row: pd.Series) -> str:
    """Combine the fields that describe what a movie is about."""
    overview = str(row.get("overview") or "")
    genres = " ".join(_as_list(row.get("genres"))).lower()
    keywords = " ".join(_as_list(row.get("keywords"))).lower()
    cast = _squash_names(_as_list(row.get("cast")))
    director = _squash_names(_as_list(row.get("director")))

    # Repeat metadata so unique plot wording does not drown shared
    # signals like director, genres, and keywords.
    metadata = " ".join(
        part for part in (genres, keywords, cast, director) if part
    )
    return f"{overview} {metadata} {metadata}".strip()


class ContentRecommender:
    """Fit once on a movie catalog, then recommend similar titles."""

    def __init__(self, movies_path: str | Path):
        self.movies_path = Path(movies_path)
        self.movies = self._load_movies(self.movies_path)
        self.tfidf_matrix = None
        self.similarity_matrix = None
        self._id_to_index = {}
        self._fit()

    def _load_movies(self, path: Path) -> pd.DataFrame:
        with path.open(encoding="utf-8") as file:
            records = json.load(file)

        df = pd.DataFrame(records)
        required = {"id", "title", "overview", "genres", "keywords", "cast", "director"}
        missing = required - set(df.columns)
        if missing:
            raise ValueError(f"movies.json is missing columns: {sorted(missing)}")

        # soup = the text document we will vectorize
        df["soup"] = df.apply(build_soup, axis=1)
        return df.reset_index(drop=True)

    def _fit(self) -> None:
        """
        Learn a vocabulary from every movie soup, then compare all pairs.

        TfidfVectorizer:
          - stop_words='english' drops very common words
          - min_df=1 keeps rare tokens (useful on a small sample catalog)

        cosine_similarity(matrix, matrix) returns an N x N grid where
        cell [i][j] is how similar movie i is to movie j.
        """
        vectorizer = TfidfVectorizer(stop_words="english")
        self.tfidf_matrix = vectorizer.fit_transform(self.movies["soup"])
        self.similarity_matrix = cosine_similarity(self.tfidf_matrix)
        self._id_to_index = {
            int(movie_id): index
            for index, movie_id in enumerate(self.movies["id"])
        }

    def _row_to_dict(self, movie: pd.Series) -> dict:
        """Turn a pandas row into JSON-safe movie details (no TF-IDF soup)."""
        return {
            "id": int(movie["id"]),
            "title": str(movie["title"]),
            "year": int(movie["year"]) if pd.notna(movie.get("year")) else None,
            "genres": list(movie["genres"]),
            "keywords": list(movie["keywords"]),
            "overview": str(movie["overview"]),
            "cast": list(movie["cast"]),
            "director": str(movie["director"]),
        }

    def list_movies(self) -> list[dict]:
        return [self._row_to_dict(row) for _, row in self.movies.iterrows()]

    def get_movie(self, movie_id: int) -> dict:
        """Full details for one movie, or KeyError if the id is unknown."""
        if movie_id not in self._id_to_index:
            raise KeyError(f"Unknown movie_id: {movie_id}")
        row = self.movies.iloc[self._id_to_index[movie_id]]
        return self._row_to_dict(row)

    def search(self, query: str) -> list[dict]:
        """
        Case-insensitive search across title, year, overview, genres,
        keywords, cast, and director.
        """
        needle = query.strip().lower()
        if not needle:
            return []

        matches = []
        for _, movie in self.movies.iterrows():
            haystack = " ".join(
                [
                    str(movie["title"]),
                    str(movie.get("year") or ""),
                    str(movie.get("overview") or ""),
                    str(movie.get("director") or ""),
                    " ".join(_as_list(movie.get("genres"))),
                    " ".join(_as_list(movie.get("keywords"))),
                    " ".join(_as_list(movie.get("cast"))),
                ]
            ).lower()
            if needle in haystack:
                matches.append(self._row_to_dict(movie))
        return matches

    def recommend(self, movie_id: int, top_n: int = DEFAULT_TOP_N) -> list[dict]:
        """
        Return up to `top_n` movies most similar to `movie_id`.

        The seed movie is never included in the results.
        """
        if movie_id not in self._id_to_index:
            raise KeyError(f"Unknown movie_id: {movie_id}")

        row_index = self._id_to_index[movie_id]
        scores = self.similarity_matrix[row_index]

        # Pair each catalog index with its similarity to the seed movie,
        # skip the movie itself (similarity to itself is always ~1.0),
        # then take the highest scores.
        ranked = sorted(
            (
                (other_index, float(score))
                for other_index, score in enumerate(scores)
                if other_index != row_index
            ),
            key=lambda item: item[1],
            reverse=True,
        )[:top_n]

        results = []
        for other_index, score in ranked:
            movie = self.movies.iloc[other_index]
            results.append(
                {
                    "id": int(movie["id"]),
                    "title": movie["title"],
                    "year": int(movie["year"]) if pd.notna(movie.get("year")) else None,
                    "genres": list(movie["genres"]),
                    "overview": movie["overview"],
                    "similarity": round(score, 4),
                }
            )
        return results


def load_default_recommender() -> ContentRecommender:
    """Helper so FastAPI can build one engine from movies.json next to this file."""
    data_path = Path(__file__).parent / "movies.json"
    return ContentRecommender(data_path)


if __name__ == "__main__":
    engine = load_default_recommender()
    seed_id = 2  # Inception
    seed = engine.movies.loc[engine.movies["id"] == seed_id].iloc[0]
    print(f"Recommendations for: {seed['title']}\n")
    for rank, movie in enumerate(engine.recommend(seed_id), start=1):
        print(
            f"{rank:2}. {movie['title']} ({movie['year']})  "
            f"similarity={movie['similarity']:.4f}"
        )
