export async function fetchTracks(token) {
  const request = {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  };

  const TOP_MONTH_TRACK_URL = `https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=10`;

  const result = await fetch(TOP_MONTH_TRACK_URL, request);
  return await result.json();
}

export async function fetchAudioPreview(id, token) {
  const result = await fetch(`https://api.spotify.com/v1/tracks/${id}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  return await result.json();
}

export async function fetchProfile(token) {
  const request = {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  };

  const USER_PROFILE_URL = 'https://api.spotify.com/v1/me';
  const userData = await fetch(USER_PROFILE_URL, request);

  return await userData.json();
}
