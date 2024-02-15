import { useEffect, useCallback, useRef } from 'react';
import { exportAsImage } from '@lib/exportAsImage';
import { fetchTracks, fetchAudioPreview, fetchProfile } from '@lib/fetch-data';
import { getAccessToken, redirectToAuthCodeFlow, code } from '@lib/auth-pkce';
import { expiryInMinutes } from '@lib/expiry';
import Note from '@domain/Note/Note';
import Theme from '@domain/Theme/theme';
import Footer from '@domain/Footer/footer';
import Header from '@domain/Header/header';

import styles from './domain/Header/header.module.scss';
import './App.scss';

function App() {
  const exportRef = useRef(null);
  const tok = useRef(null);
  let currentlyPlayingAudio = useRef(null);
  let currentlyPlayingElement = useRef(null);
  let timeoutRef = useRef(null);

  const fetchData = useCallback(async () => {
    const token = await getAccessToken();
    const tracks = await fetchTracks(token);
    const profile = await fetchProfile(token);
    checkExpiry(tracks);
    populateUI(profile, tracks);
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

  function playAudio(url) {
    const audio = new Audio(url);
    audio.volume = 0.5;
    audio.play();

    const THIRTY_SECONDS = 30 * 1000;
    timeoutRef.current = setTimeout(() => {
      stopAudio();
    }, THIRTY_SECONDS);

    return audio;
  }

  function stopAudio() {
    const audio = currentlyPlayingAudio.current;
    if (audio) {
      clearTimeout(timeoutRef.current);
      audio.pause();
      audio.currentTime = 0;

      currentlyPlayingElement.current?.classList.remove('active');
      currentlyPlayingElement.current = null;
      currentlyPlayingAudio.current = null;
    }
  }

  const calculateTrackDuration = (ms) => {
    let min = ms / 1000 / 60;
    let sec = Math.round((min - Math.floor(min)) * 60);
    min = Math.floor(min);
    sec = sec.toString().padStart(2, '0');
    return [min, sec];
  };

  function checkExpiry(tracks) {
    const now = new Date();
    tracks.items.forEach((track) => {
      const id = track.id;
      if (localStorage.getItem(id)) {
        const expiry = localStorage.getItem(id).expiry;
        if (now.getTime() > expiry) {
          localStorage.removeItem(id);
        }
      }
    });
  }

  function populateUI(profile, tracks) {
    const handle = document.querySelector(`.${styles.handle}`);
    if (handle && profile) {
      handle.innerHTML = `<a href="${profile.external_urls?.spotify}">@${profile.display_name}</a>`;
    }

    const ol = document.getElementById('tracks');
    tracks.items.forEach(function (track, index) {
      const { id, album, artists, name: title } = track;
      const [min, sec] = calculateTrackDuration(track.duration_ms);

      const li = document.createElement('li');
      li.setAttribute('data-id', id);
      li.innerHTML = `
      <div class="track">
        <div class="track-rank">
        <span class="track-bg"></span>
        <span class="number">
        ${index + 1}
        </span>
        </div>
        <img src="${album.images[1].url}" /> 
        <div class="wrapper">
          <div class="song">  
            <span class="song-title">${title}</span>
            <span class="song-artist">${artists[0].name}</span>
          </div>
          <div class="song-duration">${min}:${sec}</div>
        </div>
      </div>`;

      li.addEventListener('click', async function () {
        if (currentlyPlayingElement.current === this) {
          stopAudio();
          currentlyPlayingElement.current = null;
        } else {
          stopAudio();
          li.classList.add('active');
          // @hack: this is temporary so that I don't call API anymore
          let item = localStorage.getItem(li.dataset.id);
          if (!item) {
            const { preview_url: audioURL } = await fetchAudioPreview(
              id,
              tok.current
            );
            localStorage.setItem(li.dataset.id, audioURL);
            item = audioURL;
          }
          currentlyPlayingAudio.current = playAudio(item);
          currentlyPlayingElement.current = this;
        }
      });
      ol.append(li);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      stopAudio();
    }
  });

  return (
    <div className='main'>
      <div
        ref={exportRef}
        id='trend'>
        <Header />
        <ol id='tracks'></ol>
        <Footer />
      </div>
      <div className='section-wrapper'>
        <div className='options'>
          <Theme />
          <button
            className={'btn-save'}
            onClick={() => exportAsImage(exportRef.current, 'yourtrack')}>
            <p>Download</p>
          </button>
        </div>
        <Note />
      </div>
    </div>
  );
}

export default App;
