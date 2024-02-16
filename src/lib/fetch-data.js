const request = (token) => ({
  method: 'GET',
  headers: { Authorization: `Bearer ${token}` },
});

export async function fetchTracks(token) {
  console.debug('[Calling fetchTracks]');
  const req = request(token);

  const TOP_MONTH_TRACK_URL = `https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=10`;
  const result = await fetch(TOP_MONTH_TRACK_URL, req);
  return await result.json();
}

export async function fetchAudioPreview(id, token) {
  console.debug('[Calling fetchAudioPreview]');
  const req = request(token);

  const AUDIO_PREVIEW_URL = `https://api.spotify.com/v1/tracks/${id}`;
  const result = await fetch(AUDIO_PREVIEW_URL, req);
  return await result.json();
}

export async function fetchProfile(token) {
  console.debug('[Calling fetchProfile]');
  const req = request(token);

  const USER_PROFILE_URL = 'https://api.spotify.com/v1/me';
  const userData = await fetch(USER_PROFILE_URL, req);

  return await userData.json();
}
