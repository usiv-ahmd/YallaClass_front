// src/utils/format.js

const dateFormatter = new Intl.DateTimeFormat("ar-EG", {
  dateStyle: "medium",
});

const dateTimeFormatter = new Intl.DateTimeFormat("ar-EG", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return dateFormatter.format(date);
}

export function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return dateTimeFormatter.format(date);
}
