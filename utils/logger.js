export const log = (message, level = "info") => {
  if (process.env.NODE_ENV !== "production") {
    console[level](`[MeetSuppressor]: ${message}`);
  }
};
