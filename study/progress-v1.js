// Three-way merge: apply changes made since the last acknowledged snapshot to the current server row.
const progressEqual = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const progressClone = value => JSON.parse(JSON.stringify(value));
function rebaseProgress(base, local, remote, path = []) {
  if (progressEqual(base, local)) return remote;
  if (progressEqual(base, remote)) return local;
  const [section, , field] = path;
  const counter = section === "items" && (field === "r" || field === "w") ||
    (section === "xs" || section === "tm") && path.length === 2 || section === "gp" && field === "n";
  if (counter && Number.isFinite(local) && Number.isFinite(remote))
    return remote + Math.max(0, local - (base || 0));
  if (local === undefined || remote === undefined && base !== undefined) return undefined;
  if (section === "day" && path.length === 1 && local?.d !== remote?.d)
    return (local?.d || 0) > (remote?.d || 0) ? local : remote;
  if (Array.isArray(local) && Array.isArray(remote)) {
    const key = item => section === "words" ? item.w : section === "errs" ? item.r :
      section === "res" ? item.id || item.at : JSON.stringify(item);
    const before = new Map((base || []).map(x => [key(x),x]));
    const mine = new Map(local.map(x => [key(x),x]));
    const theirs = new Map(remote.map(x => [key(x),x]));
    const merged = [];
    for (const id of new Set([...theirs.keys(), ...mine.keys()])) {
      const item = rebaseProgress(before.get(id), mine.get(id), theirs.get(id), [...path, String(id)]);
      if (item !== undefined) merged.push(item);
    }
    return section === "res" ? merged.sort((a,b) => a.at-b.at).slice(-10) : merged;
  }
  if (local && remote && typeof local === "object" && typeof remote === "object") {
    const merged = {};
    for (const key of new Set([...Object.keys(remote), ...Object.keys(local)])) {
      const value = rebaseProgress(base?.[key], local[key], remote[key], [...path,key]);
      if (value !== undefined) merged[key] = value;
    }
    if (path.length === 0) {
      const latest = local.last >= remote.last ? local : remote;
      const earlier = latest === local ? remote : local;
      merged.last = latest.last || 0;
      merged.streak = latest.streak || 0;
      if (earlier.last && earlier.last >= latest.last - (latest.streak || 0)) {
        const firstDay = Math.min(latest.last - (latest.streak || 1), earlier.last - (earlier.streak || 1));
        merged.streak = latest.last - firstDay;
      }
    }
    return merged;
  }
  return local;
}

// A pending request survives a lost acknowledgement. Its receipt travels with the server data.
// Conditional updates also protect concurrent first-time inserts and edits on other devices.
async function syncProgress(io) {
  for (let attempt = 0; attempt < 6 && io.active(); attempt++) {
    const row = await io.read();
    if (!io.active()) return;
    const remote = row?.data;
    const frame = io.frame();
    if (frame.pending && remote?._receipts?.[frame.pending.device || io.device] === frame.pending.id) {
      io.ack(frame.pending);
      continue;
    }
    const local = progressClone(io.current());
    const merged = !remote ? local : !frame.base ? io.first(local, remote) : rebaseProgress(frame.base, local, remote);
    const target = progressClone(merged);
    if (remote && progressEqual(target, remote)) {
      io.accept(remote);
      return;
    }
    const id = crypto.randomUUID();
    target._receipts = {...remote?._receipts, [io.device]: id};
    target.t = Math.max(Date.now(), (row?.t || 0) + 1);
    const pending = {id, device: io.device, local, target};
    await io.prepare(pending);
    if (!io.active()) return;
    if (await io.write(row, target) && io.active()) {
      io.ack(pending);
      if (progressEqual(io.current(), target)) return;
    }
  }
  if (io.active()) throw new Error("Progress changed concurrently; retry");
}
