const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function request(path) {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) throw new Error("The movie service is unavailable.");
  return response.json();
}

export async function fetchMovies() {
  return request("/movies");
}

export async function searchMovies(query) {
  return request(`/movies/search?q=${encodeURIComponent(query)}`);
}

export async function fetchMovie(movieId) {
  return request(`/movies/${movieId}`);
}

export async function fetchRecommendations(movieId) {
  return request(`/movies/${movieId}/recommendations?top_n=8`);
}
