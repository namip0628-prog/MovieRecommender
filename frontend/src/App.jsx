import { useEffect, useMemo, useState } from "react";
import { fetchMovie, fetchMovies, fetchRecommendations, searchMovies } from "./api.js";
import "./App.css";

const genreThemes = {
  Action: "poster-action",
  Animation: "poster-animation",
  Crime: "poster-crime",
  Drama: "poster-drama",
  Fantasy: "poster-fantasy",
  Romance: "poster-romance",
  "Sci-Fi": "poster-scifi",
};

function posterTheme(movie) {
  return genreThemes[movie.genres[0]] || "poster-mystery";
}

function posterFor(movie) {
  const gradients = {
    "poster-action": "linear-gradient(135deg, #152f3d, #bd593f 58%, #111615)",
    "poster-animation": "linear-gradient(135deg, #5e4777, #e29a68 55%, #252033)",
    "poster-crime": "linear-gradient(135deg, #20272e, #a04a3c 55%, #101112)",
    "poster-drama": "linear-gradient(135deg, #403c39, #ad8061 52%, #151616)",
    "poster-fantasy": "linear-gradient(135deg, #294c4b, #b4a45d 55%, #101917)",
    "poster-romance": "linear-gradient(135deg, #643c4d, #d28e78 55%, #22191d)",
    "poster-scifi": "linear-gradient(135deg, #1b3658, #687fbd 55%, #10151f)",
    "poster-mystery": "linear-gradient(135deg, #292b40, #8f6c9b 55%, #111217)",
  };
  return gradients[posterTheme(movie)];
}

function thumbnailFor(movie) {
  const colors = {
    Action: ["#102f3c", "#d85f45"],
    Animation: ["#563f72", "#efad70"],
    Crime: ["#20252b", "#a94e40"],
    Drama: ["#403b37", "#b88a68"],
    Fantasy: ["#214744", "#c3b15f"],
    Romance: ["#633b4b", "#df907a"],
    "Sci-Fi": ["#183456", "#738fd4"],
  };
  const [start, end] = colors[movie.genres[0]] || ["#292b40", "#9671a2"];
  const scenes = {
    1: '<rect x="42" y="260" width="316" height="180" rx="6" fill="#263d3c"/><path d="M42 355h316" stroke="#d8ef72" stroke-width="3"/><circle cx="110" cy="315" r="34" fill="#bd805e"/><circle cx="220" cy="315" r="34" fill="#9a684f"/>',
    2: '<path d="M0 410 Q110 350 205 410 T400 390V580H0Z" fill="#315b75"/><path d="M0 475 Q130 420 400 475" fill="none" stroke="#d8ef72" stroke-width="3"/><circle cx="278" cy="240" r="72" fill="#d8ef72" opacity=".75"/>',
    3: '<path d="M0 410 Q90 305 180 410 T400 400V580H0Z" fill="#315d4b"/><circle cx="205" cy="310" r="80" fill="#334f55"/><circle cx="180" cy="290" r="15" fill="#d8ef72"/><circle cx="230" cy="290" r="15" fill="#d8ef72"/>',
    4: '<path d="M0 420L80 275l38 110 72-170 54 170 73-120 83 155v160H0Z" fill="#171d27"/><circle cx="307" cy="115" r="45" fill="#bd593f" opacity=".8"/>',
    5: '<rect x="48" y="250" width="300" height="220" fill="#b98969"/><path d="M80 250v-78h38v78m78 0v-78h38v78" stroke="#e9c48c" stroke-width="18"/><path d="M80 470h270" stroke="#d8ef72" stroke-width="4"/>',
    6: '<circle cx="288" cy="265" r="105" fill="#b9cbe4" opacity=".45"/><path d="M0 440 Q130 330 400 440V580H0Z" fill="#1d344e"/><circle cx="90" cy="175" r="4" fill="white"/><circle cx="150" cy="125" r="3" fill="white"/><circle cx="355" cy="160" r="5" fill="white"/>',
    7: '<path d="M42 440L105 180l65 260M230 440l63-260 65 260" fill="none" stroke="#d8ef72" stroke-width="5"/><path d="M76 180h57m126 0h57" stroke="#e8b477" stroke-width="8"/><circle cx="200" cy="285" r="38" fill="#a94e40"/>',
    8: '<path d="M0 445L75 300l50 108 82-190 63 190 62-115 68 152v135H0Z" fill="#182431"/><path d="M205 225v205M150 355h110" stroke="#d8ef72" stroke-width="6"/>',
    9: '<path d="M0 460l65-90 55 40 77-120 65 70 52-55 86 155v120H0Z" fill="#252b36"/><path d="M65 370h70M250 350h82" stroke="#bd593f" stroke-width="9"/>',
    10: '<rect x="65" y="230" width="270" height="245" fill="#304238"/><path d="M105 230v245m190-245v245" stroke="#d8ef72" stroke-width="5"/><circle cx="200" cy="170" r="46" fill="#d8ef72" opacity=".55"/>',
    11: '<path d="M55 410L100 175h190l55 235Z" fill="#3d5c52"/><path d="M105 175L155 95h90l40 80" fill="#bd805e"/><circle cx="195" cy="275" r="48" fill="#d8ef72" opacity=".5"/><path d="M40 455h320" stroke="#d8ef72" stroke-width="4"/>',
    12: '<path d="M0 440Q100 325 200 440T400 440V580H0Z" fill="#315b4b"/><circle cx="200" cy="300" r="88" fill="#665d43"/><circle cx="160" cy="285" r="12" fill="#111"/><circle cx="240" cy="285" r="12" fill="#111"/><path d="M105 390q95 55 190 0" fill="none" stroke="#d8ef72" stroke-width="7"/>',
    13: '<rect x="52" y="205" width="296" height="225" fill="#263d59"/><path d="M52 315h296M200 205v225" stroke="#738fd4" stroke-width="4"/><circle cx="200" cy="315" r="62" fill="#d8ef72" opacity=".65"/><path d="M200 205v225M52 315h296" stroke="#111" stroke-opacity=".5"/>',
    14: '<circle cx="200" cy="300" r="110" fill="#d8ef72" opacity=".55"/><path d="M0 425Q120 360 400 425V580H0Z" fill="#273c52"/><path d="M70 420q60-100 120 0t120 0" fill="none" stroke="#e0a56c" stroke-width="7"/>',
    15: '<path d="M0 445l85-115 45 75 90-155 72 125 55-70 53 140v135H0Z" fill="#263746"/><path d="M80 445h250" stroke="#d8ef72" stroke-width="4"/><circle cx="310" cy="165" r="45" fill="#e0a56c"/>',
    16: '<path d="M65 185h270v285H65Z" fill="#b98969"/><path d="M120 185v285m160-285v285" stroke="#e9c48c" stroke-width="10"/><circle cx="200" cy="275" r="42" fill="#633b4b" opacity=".8"/><path d="M90 450h220" stroke="#d8ef72" stroke-width="4"/>',
    17: '<path d="M0 450Q120 375 400 450V580H0Z" fill="#1d344e"/><rect x="95" y="190" width="210" height="190" fill="#101820"/><path d="M115 210h170v150H115Z" fill="#738fd4" opacity=".7"/><circle cx="200" cy="275" r="42" fill="#d8ef72" opacity=".7"/>',
    18: '<path d="M0 430Q90 325 175 430T400 420V580H0Z" fill="#315d4b"/><circle cx="205" cy="300" r="92" fill="#b4a45d" opacity=".8"/><path d="M150 330q50-70 100 0" fill="none" stroke="#214744" stroke-width="9"/><circle cx="170" cy="285" r="8" fill="#214744"/><circle cx="230" cy="285" r="8" fill="#214744"/>',
  };
  const title = movie.title.replace(/&/g, "and").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const genre = movie.genres[0].toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 580"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${start}"/><stop offset="1" stop-color="${end}"/></linearGradient></defs><rect width="400" height="580" fill="url(#g)"/>${scenes[movie.id] || scenes[1]}<text x="32" y="46" fill="#d8ef72" font-family="monospace" font-size="14" letter-spacing="3">${genre} / ${movie.year}</text><text x="32" y="505" fill="white" font-family="Georgia,serif" font-size="29">${title}</text><rect x="32" y="535" width="42" height="3" fill="#d8ef72"/></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function PosterArtwork({ movie, detail = false }) {
  return <div className={`poster-art ${posterTheme(movie)} ${detail ? "poster-art--detail" : ""}`}>
    <span className="poster-art__orb" />
    <span className="poster-art__kicker">{movie.genres[0]}  /  {movie.year}</span>
    <strong>{movie.title}</strong>
    <span className="poster-art__keywords">{movie.keywords.slice(0, 2).join("  ·  ")}</span>
  </div>;
}
function readRoute() {
  const params = new URLSearchParams(window.location.search);
  return { view: params.get("view") || "home", id: params.get("id") };
}

function MovieCard({ movie, onSelect, isSaved, onToggleSave }) {
  return <article className="movie-card">
    <button className="poster-button" type="button" onClick={() => onSelect(movie.id)} aria-label={`Open ${movie.title}`}>
      <img className="movie-thumbnail" src={thumbnailFor(movie)} alt={`${movie.title} thumbnail`} /><span className="poster-shade" /><span className="poster-year">{movie.year}</span><span className="play-mark">+</span>
    </button>
    <div className="movie-card__body"><div className="movie-card__heading">
      <button className="title-button" type="button" onClick={() => onSelect(movie.id)}>{movie.title}</button>
      <button className={`save-button ${isSaved ? "is-saved" : ""}`} type="button" onClick={() => onToggleSave(movie)} aria-label={isSaved ? "Remove from watchlist" : "Add to watchlist"}>{isSaved ? "♥" : "♡"}</button>
    </div><p className="card-meta">{movie.genres.slice(0, 2).join("  /  ")}</p></div>
  </article>;
}

function SectionHeading({ label, title }) { return <div className="section-heading"><p className="eyebrow">{label}</p><h2>{title}</h2></div>; }
function MovieGrid({ movies, onSelect, saved, onToggleSave }) {
  return movies.length ? <div className="movie-grid">{movies.map((movie) => <MovieCard key={movie.id} movie={movie} onSelect={onSelect} isSaved={saved.some((item) => item.id === movie.id)} onToggleSave={onToggleSave} />)}</div> : <div className="empty-state">No films here yet. Try another genre or search.</div>;
}

function AuthModal({ mode, onClose, onModeChange, onSubmit, error }) {
  const [showPassword, setShowPassword] = useState(false);
  const isSignIn = mode === "signin";

  return <div className="auth-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button className="auth-close" type="button" onClick={onClose} aria-label="Close account dialog">×</button>
      <p className="eyebrow">YOUR PRIVATE SCREENING ROOM</p>
      <h2 id="auth-title">{isSignIn ? "Welcome back." : "Make a little room."}</h2>
      <p className="auth-intro">{isSignIn ? "Sign in to keep your watchlist close." : "Create an account to save films for later."}</p>
      <form className="auth-form" onSubmit={onSubmit}>
        {!isSignIn && <label>Display name<input name="name" type="text" autoComplete="name" placeholder="Your name" required /></label>}
        <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
        <label>Password<div className="password-field"><input name="password" type={showPassword ? "text" : "password"} autoComplete={isSignIn ? "current-password" : "new-password"} placeholder="At least 6 characters" minLength="6" required /><button type="button" onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? "Hide" : "Show"}</button></div></label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="primary-button auth-submit" type="submit">{isSignIn ? "Sign in" : "Create account"}<span>→</span></button>
      </form>
      <p className="auth-switch">{isSignIn ? "New to MUBI?" : "Already have an account?"} <button type="button" onClick={() => onModeChange(isSignIn ? "signup" : "signin")}>{isSignIn ? "Create an account" : "Sign in"}</button></p>
    </section>
  </div>;
}

function App() {
  const [movies, setMovies] = useState([]);
  const [results, setResults] = useState([]);
  const [detail, setDetail] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [saved, setSaved] = useState(() => JSON.parse(localStorage.getItem("movie-watchlist") || "[]"));
  const [route, setRoute] = useState(readRoute());
  const [query, setQuery] = useState("");
  const [activeGenre, setActiveGenre] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [authMode, setAuthMode] = useState(null);
  const [account, setAccount] = useState(() => JSON.parse(localStorage.getItem("movie-session") || "null"));
  const [authError, setAuthError] = useState("");

  useEffect(() => { fetchMovies().then(setMovies).catch((reason) => setError(reason.message)).finally(() => setLoading(false)); }, []);
  useEffect(() => { localStorage.setItem("movie-watchlist", JSON.stringify(saved)); }, [saved]);
  useEffect(() => {
    if (route.view !== "detail" || !route.id) return;
    setDetail(null); setRecommendations([]);
    Promise.all([fetchMovie(route.id), fetchRecommendations(route.id)]).then(([movie, payload]) => { setDetail(movie); setRecommendations(payload.recommendations); }).catch((reason) => setError(reason.message));
  }, [route]);

  const genres = useMemo(() => ["All", ...new Set(movies.flatMap((movie) => movie.genres))], [movies]);
  const filteredMovies = useMemo(() => { const source = route.view === "search" ? results : movies; return activeGenre === "All" ? source : source.filter((movie) => movie.genres.includes(activeGenre)); }, [activeGenre, movies, results, route.view]);
  function navigate(nextRoute) {
    const params = new URLSearchParams(); if (nextRoute.view !== "home") params.set("view", nextRoute.view); if (nextRoute.id) params.set("id", nextRoute.id);
    window.history.pushState({}, "", `${window.location.pathname}${params.toString() ? `?${params}` : ""}`); setRoute(nextRoute); window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function toggleSaved(movie) { setSaved((current) => current.some((item) => item.id === movie.id) ? current.filter((item) => item.id !== movie.id) : [...current, movie]); }
  async function handleSearch(event) {
    event.preventDefault(); if (!query.trim()) return navigate({ view: "home" });
    try { setLoading(true); const data = await searchMovies(query.trim()); setResults(data.results); setActiveGenre("All"); navigate({ view: "search" }); } catch (reason) { setError(reason.message); } finally { setLoading(false); }
  }

  function handleSurprise() {
    if (!movies.length) return;
    const movie = movies[Math.floor(Math.random() * movies.length)];
    navigate({ view: "detail", id: movie.id });
  }

  function openAuth(mode) { setAuthError(""); setAuthMode(mode); }
  function handleAuthSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = form.get("email").toLowerCase().trim();
    const password = form.get("password");
    const accounts = JSON.parse(localStorage.getItem("movie-accounts") || "[]");
    if (authMode === "signup") {
      if (accounts.some((user) => user.email === email)) return setAuthError("An account with that email already exists.");
      const user = { name: form.get("name").trim(), email, password };
      localStorage.setItem("movie-accounts", JSON.stringify([...accounts, user]));
      localStorage.setItem("movie-session", JSON.stringify({ name: user.name, email: user.email }));
      setAccount({ name: user.name, email: user.email });
    } else {
      const user = accounts.find((item) => item.email === email && item.password === password);
      if (!user) return setAuthError("That email and password combination is not recognised.");
      localStorage.setItem("movie-session", JSON.stringify({ name: user.name, email: user.email }));
      setAccount({ name: user.name, email: user.email });
    }
    setAuthMode(null);
  }
  function signOut() { localStorage.removeItem("movie-session"); setAccount(null); }

  const featured = movies.find((movie) => movie.title === "Inception") || movies[0];
  const displayedMovies = route.view === "watchlist" ? saved : filteredMovies;
  return <div className="app-shell">
    <header className="topbar"><button className="brand" type="button" onClick={() => navigate({ view: "home" })}><span className="brand-mark">M</span> MUBI<span className="brand-dot">.</span></button>
      <nav><button className={route.view === "home" ? "active" : ""} onClick={() => navigate({ view: "home" })}>Discover</button><button className={route.view === "watchlist" ? "active" : ""} onClick={() => navigate({ view: "watchlist" })}>Watchlist <span className="count">{saved.length}</span></button></nav>
      <form className="search-box" onSubmit={handleSearch}><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search films, directors..." aria-label="Search films" /></form>
      {account ? <div className="account-menu"><span className="account-name">{account.name}</span><button className="account-action" type="button" onClick={signOut}>Sign out</button></div> : <button className="signin-button" type="button" onClick={() => openAuth("signin")}>Sign in</button>}
    </header>
    {error && <div className="error-banner">{error} <button onClick={() => setError("")}>Dismiss</button></div>}
    {loading && !movies.length ? <div className="loading">Loading your cinema...</div> : route.view === "detail" && detail ? <main className="detail-view">
      <button className="back-button" onClick={() => navigate({ view: "home" })}>← Back to discovery</button><section className="detail-hero"><div className="detail-poster poster-art" style={{ backgroundImage: posterFor(detail) }}><span className="poster-art__title">{detail.title}</span><span className="poster-art__rule" /></div><div className="detail-copy"><p className="eyebrow">{detail.genres.join("  ·  ")}</p><h1>{detail.title}</h1><p className="detail-meta">{detail.year} <span>•</span> Directed by {detail.director}</p><p className="overview">{detail.overview}</p><button className="primary-button" onClick={() => toggleSaved(detail)}>{saved.some((movie) => movie.id === detail.id) ? "♥ In watchlist" : "+ Add to watchlist"}</button><div className="credits"><div><span>CAST</span><strong>{detail.cast.join(", ")}</strong></div><div><span>KEYWORDS</span><strong>{detail.keywords.join("  ·  ")}</strong></div></div></div></section><section className="recommend-section"><SectionHeading label="Because you watched" title={`More like ${detail.title}`} /><MovieGrid movies={recommendations} onSelect={(id) => navigate({ view: "detail", id })} saved={saved} onToggleSave={toggleSaved} /></section>
    </main> : <main>{route.view === "home" && featured && <section className="hero"><div className="hero-backdrop" style={{ backgroundImage: posterFor(featured) }} /><div className="hero-content"><p className="eyebrow">PRIVATE SCREENING  /  01</p><h1>Stories that<br /><em>stay with you.</em></h1><p>One considered film at a time. A handpicked room for curious viewers and the stories that reward a second look.</p><div className="hero-actions"><button className="primary-button" onClick={() => navigate({ view: "detail", id: featured.id })}>Explore {featured.title} <span>→</span></button><button className="ghost-button" onClick={handleSurprise}>Surprise me <span>✦</span></button></div></div><div className="hero-film"><span>NOW SHOWING</span><strong>{featured.title}</strong><small>{featured.year}  /  {featured.genres.join("  ·  ")}</small></div><div className="curator-note"><span>CURATOR'S NOTE</span><strong>“The best films<br />leave a little light on.”</strong></div></section>}
      <section className="catalog-section"><div className="section-top"><SectionHeading label={route.view === "watchlist" ? "Saved for later" : route.view === "search" ? `Results for “${query}”` : "The collection"} title={route.view === "watchlist" ? "Your watchlist" : route.view === "search" ? `${filteredMovies.length} films found` : "Find your next favorite"} /><div className="catalog-note">{movies.length} films <span>·</span> updated daily</div></div>{route.view !== "watchlist" && <div className="genre-row">{genres.map((genre) => <button key={genre} className={genre === activeGenre ? "selected" : ""} onClick={() => setActiveGenre(genre)}>{genre}</button>)}</div>}<MovieGrid movies={displayedMovies} onSelect={(id) => navigate({ view: "detail", id })} saved={saved} onToggleSave={toggleSaved} /></section>
    </main>}
    <footer><span>© 2026 MUBI.</span><span>A quiet place for great films.</span><span>FASTAPI / REACT</span></footer>
    {authMode && <AuthModal mode={authMode} onClose={() => setAuthMode(null)} onModeChange={openAuth} onSubmit={handleAuthSubmit} error={authError} />}
  </div>;
}

export default App;
