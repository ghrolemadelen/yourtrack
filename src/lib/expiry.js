export const expiryInMinutes = () => {
  const now = new Date();
  const expiryInMins = 24 * 60; // 24 hours
  // return now.getTime() + expiryInMins * 60 * 1000;
  return now.getTime() + 100;
};
