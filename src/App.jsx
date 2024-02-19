import { useEffect, useCallback, useRef } from 'react';
import { exportAsImage } from './lib/exportAsImage';
import { checkExpiry, expiryInMinutes } from './lib/expiry';
import { fetchTracks, fetchAudioPreview, fetchProfile } from './lib/fetch-data';
import { getAccessToken, redirectToAuthCodeFlow, code } from './lib/auth-pkce';

import { trackTemplate } from './domain/Track/track-template';
import Theme from './domain/Theme/theme';
import Note from './domain/Note/note';
import Header from './domain/Header/header';
import Footer from './domain/Footer/footer';

import styles from './domain/Header/header.module.scss';
import './App.scss';

function App() {
  const currentlyPlayingAudio = useRef(null);
  const currentlyPlayingElement = useRef(null);
  const exportRef = useRef(null);
  const timeoutRef = useRef(null);
  const tracksRef = useRef(null);

  const fetchData = useCallback(async () => {
    const token = await getAccessToken();
    const tracks = await fetchTracks(token);
    const profile = await fetchProfile(token);
    checkExpiry(tracks);
    saveTracksToLocalStorage(tracks, token);
    populateUI(profile, tracks);
  }, []);

  useEffect(() => {
    window.addEventListener('beforeunload', () => {
      window.location.href = window.location.origin;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') stopAudio();
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
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

  async function saveTracksToLocalStorage(tracks, token) {
    const itemsToSave = tracks.items.filter(
      ({ id }) => localStorage.getItem(id) === null
    );

    const promises = itemsToSave.map(async ({ id }) => {
      const { preview_url } = await fetchAudioPreview(id, token);
      const expiry = expiryInMinutes();
      localStorage.setItem(id, JSON.stringify({ url: preview_url, expiry }));
    });

    await Promise.all(promises);
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

  function attachEventListeners() {
    tracksRef.current.addEventListener('click', (e) => {
      const listItem = e.target.closest('li');
      if (listItem) {
        handleTrackPreview({ currentTarget: listItem });
      }
    });
  }

  function populateUI(profile, tracks) {
    const handle = document.querySelector(`.${styles.handle}`);
    if (handle && profile) {
      handle.innerHTML = `<a href="${profile.external_urls?.spotify}">@${profile.display_name}</a>`;
    }

    tracks.items.forEach(({ id, album, artists, name, duration_ms }, index) => {
      const li = document.createElement('li');
      li.dataset.id = id;
      li.insertAdjacentHTML(
        'beforeend',
        trackTemplate(index, { album, artists, name, duration_ms })
      );

      tracksRef.current.append(li);
    });

    attachEventListeners();
  }

  return (
    <div className='main'>
      <div
        ref={exportRef}
        id='trend'>
        <Header />
        <ol
          ref={tracksRef}
          id='tracks'></ol>
        <Footer />
      </div>
      <div className='section-wrapper'>
        <div className='options'>
          <Theme />
          <button
            className={'btn-save'}
            onClick={() => {
              stopAudio();
              exportAsImage(tracksRef.current, exportRef.current, 'yourtrack');
            }}>
            <p>Download</p>
          </button>
        </div>
        <Note />
      </div>
    </div>
  );
}

export default App;
