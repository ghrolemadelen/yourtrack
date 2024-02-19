import html2canvas from 'html2canvas';

export const exportAsImage = async (tracksList, el, imageFileName) => {
  const MAX_CHAR = 26;
  const originalTitle = [];

  [...tracksList.children].forEach((list) => {
    const songTitle = list.querySelector('.song-title');
    // originalTitle.push(songTitle.textContent);
    if (songTitle.scrollWidth > songTitle.clientWidth) {
      originalTitle.push({ idx: songTitle.textContent });
      songTitle.textContent = songTitle.textContent.substr(0, MAX_CHAR) + '...';
    }
  });

  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
  });
  const image = canvas.toDataURL('image/png', 1.0);
  downloadImage(tracksList, image, imageFileName);

  originalTitle.map((idx, text) => {
    tracksList.children[idx].querySelector('.song-title').textContent = text;
  });
};

const downloadImage = (tracksList, blob, fileName) => {
  const fakeLink = window.document.createElement('a');
  fakeLink.style = 'display:none';
  fakeLink.download = fileName;

  fakeLink.href = blob;

  document.body.appendChild(fakeLink);
  fakeLink.click();
  document.body.removeChild(fakeLink);
  fakeLink.remove();
};
