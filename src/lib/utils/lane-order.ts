/**
 * Urutan Lintasan Renang (Spearhead / Zig-Zag dari Tengah Outward)
 * Standar World Aquatics / FINA.
 * Untuk 8 Lane: [4, 5, 3, 6, 2, 7, 1, 8]
 */
export function getLaneOrder(totalLanes: number): number[] {
  const center = Math.ceil(totalLanes / 2);
  const lanes = [center];
  let offset = 1;

  while (lanes.length < totalLanes) {
    if (center + offset <= totalLanes) lanes.push(center + offset);
    if (center - offset >= 1) lanes.push(center - offset);
    offset++;
  }
  return lanes;
}
