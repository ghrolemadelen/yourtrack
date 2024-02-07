import { useEffect } from 'react';
import './App.css';
import { exportAsImage } from './exportAsImage';
import { useRef } from 'react';

function App() {
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const limit = 10;
  const exportRef = useRef(null);
  const tok = useRef(null);
  let currentlyPlayingAudio = useRef(null);
  let currentlyPlayingElement = useRef(null);
  let timeoutRef = useRef(null);

  useEffect(() => {
    if (!code) {
      redirectToAuthCodeFlow();
    } else {
      (async function () {
        const token = await getAccessToken();
        const profile = await fetchProfile(token);
        populateUI(profile);
        tok.current = token;
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
    params.append(
      'redirect_uri',
      import.meta.env.VITE_REDIRECT_URI || 'http://localhost:5173/callback'
    );
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
    params.append(
      'redirect_uri',
      import.meta.env.VITE_REDIRECT_URI || 'http://localhost:5173/callback'
    );
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

  async function playAudioPreview(id) {
    const result = await fetch(`https://api.spotify.com/v1/tracks/${id}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tok.current}` },
    });

    return await result.json();
  }

  function playAudio(url) {
    const audio = new Audio(url);
    audio.volume = 0.35;
    audio.play();

    timeoutRef.current = setTimeout(() => {
      stopAudio();
      currentlyPlayingAudio.current = null;
      currentlyPlayingElement.current?.classList.remove('active');
      currentlyPlayingElement.current = null;
    }, 30000);

    return audio;
  }

  function stopAudio() {
    const audio = currentlyPlayingAudio.current;
    if (audio) {
      clearTimeout(timeoutRef.current);
      audio.pause();
      audio.currentTime = 0;
    }
  }

  function populateUI(tracks) {
    console.log(tracks);

    let albumImages = [];

    tracks = tracks.items;
    const ol = document.getElementById('tracks');
    tracks.forEach(function (track, index) {
      albumImages.push(track.album.images[1].url);
      let min = track.duration_ms / 1000 / 60;
      let sec = Math.round((min - Math.floor(min)) * 60);
      min = Math.floor(min);
      const li = document.createElement('li');
      li.setAttribute('data-id', track.id);
      li.innerHTML = `
      <div class="track">
        <div class="track-rank">
        <span class="track-bg"></span>
        <span class="number">
        ${index + 1}
        </span>
        </div>
        <img src="${track.album.images[1].url}" /> 
        <div class="wrapper">
          <div class="song">  
            <span class="song-title">${track.name}</span>
            <span class="song-artist">${track.artists[0].name}</span>
          </div>
          <div class="song-duration">${min}:${sec
        .toString()
        .padStart(2, '0')}</div>
        </div>
      </div>`;
      li.addEventListener('click', async function () {
        console.log('Here: ', tok);

        let audioUrl = localStorage.getItem(li.dataset.id);
        if (!audioUrl) {
          console.log('called!.... saving it to localstorage');
          const audioJSON = await playAudioPreview(li.dataset.id);
          audioUrl = audioJSON.preview_url;
          localStorage.setItem(li.dataset.id, audioUrl);
        }

        stopAudio();
        if (audioUrl) {
          if (li === currentlyPlayingElement.current) {
            li.classList.remove('active');
            currentlyPlayingAudio.current = null;
            currentlyPlayingElement.current = null;
          } else {
            currentlyPlayingElement.current?.classList.remove('active');

            li.classList.add('active');
            currentlyPlayingAudio.current = playAudio(audioUrl);
            currentlyPlayingElement.current = li;
          }
        } else {
          currentlyPlayingAudio.current = null;
          currentlyPlayingElement.current = null;
        }
      });
      ol.append(li);
    });

    const bgDiv = document.getElementById('background');
    albumImages = [
      ...albumImages,
      ...albumImages,
      ...albumImages,
      ...albumImages,
    ];
    albumImages.forEach((url) => {
      const img = document.createElement('img');
      img.setAttribute('src', url);
      img.setAttribute('loading', 'lazy');
      bgDiv.append(img);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      stopAudio(currentlyPlayingAudio.current);
    }
  });

  return (
    <>
      <div id='background'></div>
      <section
        ref={exportRef}
        id='trend'>
        <h2> TOP {limit} TRACKS</h2>
        <ol id='tracks'></ol>
        <div className='footer'>
          YourTrack by{' '}
          <a
            href='https://github.com/rolemadelen'
            target='_blank'
            rel='noopener noreferrer'>
            Jii Yoo
          </a>
        </div>
      </section>
      <div>
        <button onClick={() => exportAsImage(exportRef.current, 'test')}>
          Save as Image
        </button>
      </div>
    </>
  );
}

export default App;
