const API_BASE = import.meta.env.VITE_API_URL || "https://movierec-fastapi-2026.onrender.com";

async function request(path) {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) throw new Error("The movie service is unavailable.");
  return response.json();
}

async function authRequest(path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.detail || "The account service is unavailable.");
  return payload;
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

export function signUp(name, email, password) {
  return authRequest("/auth/signup", { name, email, password });
}

export function signIn(email, password) {
  return authRequest("/auth/signin", { email, password });
}
