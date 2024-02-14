import html2canvas from 'html2canvas';

export const exportAsImage = async (el, imageFileName) => {
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
  });
  const image = canvas.toDataURL('image/png', 1.0);
  downloadImage(image, imageFileName);
};

const downloadImage = (blob, fileName) => {
  if (screen.width < 1024) {
    document.getElementById('viewport').setAttribute('content', 'width=1200px');
  }
  const fakeLink = window.document.createElement('a');
  fakeLink.style = 'display:none';
  fakeLink.download = fileName;

  fakeLink.href = blob;

  document.body.appendChild(fakeLink);
  fakeLink.click();
  document.body.removeChild(fakeLink);
  fakeLink.remove();
};
