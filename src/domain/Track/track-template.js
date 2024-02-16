const calculateTrackDuration = (ms) => {
  let min = ms / 1000 / 60;
  let sec = Math.round((min - Math.floor(min)) * 60);
  min = Math.floor(min);
  sec = sec.toString().padStart(2, '0');
  return [min, sec];
};

export const trackTemplate = (index, track) => {
  const { album, artists, name, duration_ms } = track;
  const [min, sec] = calculateTrackDuration(duration_ms);

  return `
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
            <span class="song-title">${name}</span>
            <span class="song-artist">${artists[0].name}</span>
          </div>
          <div class="song-duration">${min}:${sec}</div>
        </div>
      </div>`;
};
