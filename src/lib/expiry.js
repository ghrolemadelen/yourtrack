export const expiryInMinutes = () => {
  const now = new Date();
  const expiryInMins = 24 * 60; // 24 hours
  return now.getTime() + expiryInMins * 60 * 1000;
};

export function checkExpiry(tracks) {
  const now = new Date();
  tracks.items.forEach(({ id }) => {
    const track = localStorage.getItem(id);
    if (track) {
      const expiry = JSON.parse(track).expiry;
      if (now.getTime() > expiry) {
        localStorage.removeItem(id);
      }
    }
  });
}
