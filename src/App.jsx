import { useEffect, useCallback, useRef } from 'react';
import { exportAsImage } from '@lib/exportAsImage';
import { getAccessToken, redirectToAuthCodeFlow, code } from '@lib/auth-pkce';
import { Note } from '@domain/Note/Note';
import './App.scss';
import ThemeButton from './domain/Theme/theme-button';

function App() {
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
    const [userData, profile] = await fetchTracks(token);
    populateUI(userData, profile);
    tok.current = token;
  }, []);

  useEffect(() => {
    document.querySelector('#theme-blue').checked = true;

    if (code) {
      fetchData();
    } else {
      redirectToAuthCodeFlow();
    }
  }, [fetchData]);

  async function fetchTracks(token) {
    const request = {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    };

    const USER_PROFILE_URL = 'https://api.spotify.com/v1/me';
    const TOP_MONTH_TRACK_URL = `https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=10`;

    const userData = await fetch(USER_PROFILE_URL, request);
    const result = await fetch(TOP_MONTH_TRACK_URL, request);
    return Promise.all([userData.json(), result.json()]);
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

    const THIRTY_SECONDS = 30 * 1000;
    timeoutRef.current = setTimeout(() => {
      stopAudio();
      currentlyPlayingAudio.current = null;
      currentlyPlayingElement.current?.classList.remove('active');
      currentlyPlayingElement.current = null;
    }, THIRTY_SECONDS);

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

        if (!item || !item.audioUrl || !item.expiry) {
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
              <ThemeButton color='red' />
              <ThemeButton color='green' />
              <ThemeButton color='purple' />
            </div>
            <div>
              <ThemeButton color='orange' />
              <ThemeButton color='blue' />
              <ThemeButton color='black' />
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
        <Note />
      </div>
    </div>
  );
}

export default App;
