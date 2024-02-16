import { useEffect, useCallback, useRef } from 'react';
import { exportAsImage } from './lib/exportAsImage';
import { expiryInMinutes } from './lib/expiry';
import { fetchTracks, fetchAudioPreview, fetchProfile } from './lib/fetch-data';
import { getAccessToken, redirectToAuthCodeFlow, code } from './lib/auth-pkce';

import { trackTemplate } from './domain/Track/track-template';
import Note from './domain/Note/Note';
import Theme from './domain/Theme/theme';
import Header from './domain/Header/header';
import Footer from './domain/Footer/footer';

import styles from './domain/Header/header.module.scss';
import './App.scss';

function App() {
  const exportRef = useRef(null);
  const currentlyPlayingAudio = useRef(null);
  const currentlyPlayingElement = useRef(null);
  const timeoutRef = useRef(null);

  const fetchData = useCallback(async () => {
    const token = await getAccessToken();
    const tracks = await fetchTracks(token);
    const profile = await fetchProfile(token);
    checkExpiry(tracks);
    saveTracksToLocalStorage(tracks, token);
    populateUI(profile, tracks);
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

  function checkExpiry(tracks) {
    const now = new Date();
    tracks.items.forEach(({ id }) => {
      if (localStorage.getItem(id)) {
        const expiry = JSON.parse(localStorage.getItem(id)).expiry;
        if (now.getTime() > expiry) {
          localStorage.removeItem(id);
        }
      }
    });
  }

  function saveTracksToLocalStorage(tracks, token) {
    tracks.items.forEach(async ({ id }) => {
      if (localStorage.getItem(id) === null) {
        const { preview_url } = await fetchAudioPreview(id, token);
        const expiry = expiryInMinutes();
        localStorage.setItem(id, JSON.stringify({ url: preview_url, expiry }));
      }
    });
  }

  async function handleTrackPreview(e) {
    let notSameTrack = currentlyPlayingElement.current !== e.currentTarget;

    stopAudio();
    if (notSameTrack) {
      e.currentTarget.classList.add('active');
      const { url } = JSON.parse(
        localStorage.getItem(e.currentTarget.dataset.id)
      );
      currentlyPlayingAudio.current = playAudio(url);
      currentlyPlayingElement.current = e.currentTarget;
    }
  }

  function populateUI(profile, tracks) {
    const handle = document.querySelector(`.${styles.handle}`);
    if (handle && profile) {
      handle.innerHTML = `<a href="${profile.external_urls?.spotify}">@${profile.display_name}</a>`;
    }

    const ol = document.getElementById('tracks');
    tracks.items.forEach(({ id, album, artists, name, duration_ms }, index) => {
      const li = document.createElement('li');
      li.setAttribute('data-id', id);
      li.innerHTML = trackTemplate(index, {
        album,
        artists,
        name,
        duration_ms,
      });

      li.addEventListener('click', (e) => handleTrackPreview(e));
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
