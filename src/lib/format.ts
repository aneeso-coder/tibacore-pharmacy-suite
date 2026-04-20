export const fmtTZS = (n: number) =>
  `TZS ${Math.round(n).toLocaleString("en-US")}`;

export const fmtNum = (n: number) => Math.round(n).toLocaleString("en-US");

export const fmtDate = (d: Date | string) => {
  const date = typeof d === "string" ? new Date(d) : d;
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${date.getFullYear()}`;
};

export const fmtDateTime = (d: Date | string) => {
  const date = typeof d === "string" ? new Date(d) : d;
  const time = date.toTimeString().slice(0, 5);
  return `${fmtDate(date)} ${time}`;
};
