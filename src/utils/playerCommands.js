// src/utils/playerCommands.js

function normalizeOne(raw) {
  const id = raw?.id ?? raw?.key ?? raw?.code;
  if (!id) return null;

  const maxUses = Number(raw?.maxUses ?? raw?.max_uses ?? raw?.uses);
  return {
    id: String(id),
    label: raw?.label ?? raw?.name ?? raw?.title ?? String(id),
    description: raw?.description ?? raw?.desc ?? "",
    defaultEnabled: Boolean(raw?.defaultEnabled ?? raw?.isDefault ?? raw?.enabled ?? false),
    maxUses: Number.isFinite(maxUses) && maxUses > 0 ? maxUses : null,
  };
}

function extractList(payload) {
  if (Array.isArray(payload)) return payload;
  const candidates = [
    payload?.commands,
    payload?.data,
    payload?.data?.commands,
    payload?.items,
    payload?.results,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

export function normalizeCommandList(payload) {
  const seen = new Set();
  return extractList(payload)
    .map(normalizeOne)
    .filter((cmd) => {
      if (!cmd || seen.has(cmd.id)) return false;
      seen.add(cmd.id);
      return true;
    });
}