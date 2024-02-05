import { useEffect } from 'react';
import './App.css';

function App() {
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const limit = 10;

  useEffect(() => {
    if (!code) {
      redirectToAuthCodeFlow();
    } else {
      (async function () {
        const accessToken = await getAccessToken();
        const profile = await fetchProfile(accessToken);
        populateUI(profile);
      })();
    }
  }, []);

  async function redirectToAuthCodeFlow() {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem('verifier', verifier);

    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('response_type', 'code');
    params.append('redirect_uri', 'http://localhost:5173/callback');
    params.append('scope', 'user-read-private user-read-email user-top-read');
    params.append('code_challenge_method', 'S256');
    params.append('code_challenge', challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  function generateCodeVerifier(length) {
    let text = '';
    let possible =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; ++i) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  async function generateCodeChallenge(codeVerifier) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  async function getAccessToken() {
    const verifier = localStorage.getItem('verifier');

    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', 'http://localhost:5173/callback');
    params.append('code_verifier', verifier);

    const result = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    const { access_token } = await result.json();
    return access_token;
  }

  async function fetchProfile(token) {
    console.log(token);
    const result = await fetch(
      `https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=${limit}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return await result.json();
  }

  function populateUI(tracks) {
    console.log(tracks);

    tracks = tracks.items;
    const ol = document.getElementById('tracks');
    tracks.forEach((track, index) => {
      const li = document.createElement('li');
      li.innerHTML = `
      <div class="track">
        <span class="track-rank">${index + 1}</span>
        <img src="${track.album.images[1].url}" /> 
        <div class="song">  
          <span class="song-title">${track.name}</span>
          <span class="song-artist">${track.artists[0].name}</span>
        </div>
      </div>`;
      ol.append(li);
    });
  }

  return (
    <section id='trend'>
      <h2> Top {limit} tracks</h2>
      <ol id='tracks'></ol>
    </section>
  );
}

export default App;
