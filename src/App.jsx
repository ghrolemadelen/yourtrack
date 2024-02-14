import { useEffect, useCallback, useRef } from 'react';
import { exportAsImage } from './exportAsImage';
import './App.scss';

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
  const currentDate = new Date();
  let pastDate = new Date(
    new Date().setDate(new Date().getDate() - 28)
  ).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const fetchData = useCallback(async () => {
    const token = await getAccessToken();
    const [userData, profile] = await fetchProfile(token);
    populateUI(userData, profile);
    tok.current = token;
  }, []);

  useEffect(() => {
    document.querySelector('#theme-blue').checked = true;

    if (!code) {
      redirectToAuthCodeFlow();
    } else {
      fetchData();
    }
  }, [code, fetchData]);

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
    const userData = await fetch(`https://api.spotify.com/v1/me`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await fetch(
      `https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=${limit}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return Promise.all([userData.json(), result.json()]);
    // return await result.json();
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
    audio.volume = 0.5;
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

  function populateUI(userData, tracks) {
    tracks = tracks.items;
    const handle = document.querySelector('span.handle');
    if (userData)
      handle.innerHTML = `<a href="${userData.external_urls.spotify}">@${userData.display_name}</a>`;
    const ol = document.getElementById('tracks');
    tracks.forEach(function (track, index) {
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
        let item = JSON.parse(localStorage.getItem(li.dataset.id));

        if (!item) {
          const now = new Date();
          const expiryInMinutes = 24 * 60; // 24 hours

          console.log('called!.... saving it to localstorage');
          const audioJSON = await playAudioPreview(li.dataset.id);
          const audioUrl = audioJSON.preview_url;

          const item = {
            audioUrl,
            expiry: now.getTime() + expiryInMinutes * 60 * 1000,
          };

          localStorage.setItem(li.dataset.id, JSON.stringify(item));
        }

        item = JSON.parse(localStorage.getItem(li.dataset.id));
        stopAudio();
        if (item.audioUrl) {
          if (li === currentlyPlayingElement.current) {
            li.classList.remove('active');
            currentlyPlayingAudio.current = null;
            currentlyPlayingElement.current = null;
          } else {
            currentlyPlayingElement.current?.classList.remove('active');

            li.classList.add('active');
            currentlyPlayingAudio.current = playAudio(item.audioUrl);
            currentlyPlayingElement.current = li;
          }
        } else {
          currentlyPlayingAudio.current = null;
          currentlyPlayingElement.current = null;
        }

        const now = new Date();
        if (now.getTime() > item.expiry) {
          localStorage.removeItem(li.dataset.id);
        }
      });
      ol.append(li);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      currentlyPlayingElement.current?.classList.remove('active');
      stopAudio(currentlyPlayingAudio.current);
      currentlyPlayingAudio.current = null;
      currentlyPlayingElement.current = null;
    }
  });

  const changeTheme = (e) => {
    const theme = e.target.dataset.theme;
    const themeColors = {
      blue: { primary: '#6ec1ff' },
      red: { primary: '#ff9898' },
      black: { primary: '#777' },
      orange: { primary: '#ff8051' },
      green: { primary: '#7af17a' },
      purple: { primary: '#e16fe1' },
    };

    document.documentElement.style.setProperty(
      '--primary',
      themeColors[theme].primary
    );
    document.documentElement.style.setProperty(
      '--secondary',
      themeColors[theme].text
    );
  };

  return (
    <div className='main'>
      <div
        ref={exportRef}
        id='trend'>
        <h2>
          YOUR TRACK - Top 10
          <div className='info'>
            <span className='date'>
              {`${pastDate} - ${currentDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}`}
            </span>
            <span className='handle'></span>
          </div>
        </h2>
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
      </div>
      <div className='section-wrapper'>
        <div className='options'>
          <h2>Choose a Theme</h2>
          <div className='themes'>
            <div>
              <div>
                <label className='form-control'>
                  <input
                    type='radio'
                    name='theme'
                    id='theme-red'
                    data-theme='red'
                    onChange={(e) => changeTheme(e)}
                  />
                  Red
                </label>
              </div>
              <div>
                <label className='form-control'>
                  <input
                    type='radio'
                    name='theme'
                    id='theme-green'
                    data-theme='green'
                    onChange={(e) => changeTheme(e)}
                  />
                  Green
                </label>
              </div>

              <div>
                <label className='form-control'>
                  <input
                    type='radio'
                    name='theme'
                    id='theme-purple'
                    data-theme='purple'
                    onChange={(e) => changeTheme(e)}
                  />
                  Purple
                </label>
              </div>
            </div>

            <div>
              <div>
                <label className='form-control'>
                  <input
                    type='radio'
                    name='theme'
                    id='theme-orange'
                    data-theme='orange'
                    onChange={(e) => changeTheme(e)}
                  />
                  Orange
                </label>
              </div>
              <div>
                <label className='form-control'>
                  <input
                    type='radio'
                    name='theme'
                    id='theme-blue'
                    data-theme='blue'
                    onChange={(e) => changeTheme(e)}
                  />
                  Blue
                </label>
              </div>
              <div>
                <label className='form-control'>
                  <input
                    type='radio'
                    name='theme'
                    id='theme-black'
                    data-theme='black'
                    onChange={(e) => changeTheme(e)}
                  />
                  Black
                </label>
              </div>
            </div>
          </div>
          <button
            className={'btn-save'}
            onClick={() =>
              exportAsImage(
                exportRef.current,
                `yourtrack-${currentDate.toLocaleDateString('en-US')}`
              )
            }>
            <p>Download</p>
          </button>
        </div>
        <div className='note'>
          <ol>
            <li>
              Top 10 tracks based on the last 28 days of your listening history.
            </li>
            <li>
              Click a track to play a 30-second preview (some tracks may not
              have a preview available).
            </li>
            <li>
              To stop the preview, click the track again or press the ESC key.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default App;
