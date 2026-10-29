/**
 * Reumatologia: articulações dolorosas e com sinovite (contagem para ACR/EULAR e texto).
 */
import { V } from './estado.js';

export const JOINTS = [
  ['Ombro', 'L'],
  ['Cotovelo', 'L'],
  ['Punho', 'S'],
  ['MCF 1', 'S'],
  ['MCF 2', 'S'],
  ['MCF 3', 'S'],
  ['MCF 4', 'S'],
  ['MCF 5', 'S'],
  ['IF do polegar', 'S'],
  ['IFP 2', 'S'],
  ['IFP 3', 'S'],
  ['IFP 4', 'S'],
  ['IFP 5', 'S'],
  ['IFD 2', 'X'],
  ['IFD 3', 'X'],
  ['IFD 4', 'X'],
  ['IFD 5', 'X'],
  ['Quadril', 'L'],
  ['Joelho', 'L'],
  ['Tornozelo', 'L'],
  ['MTF 1', 'X'],
  ['MTF 2', 'S'],
  ['MTF 3', 'S'],
  ['MTF 4', 'S'],
  ['MTF 5', 'S'],
];
export function jointSum() {
  const o = V('art') || {},
    d = [],
    i = [],
    inv = [];
  let L = 0,
    S = 0,
    sw = 0,
    swS = 0;
  JOINTS.forEach(([n, t]) =>
    ['D', 'E'].forEach(sd => {
      const j = o[n + '|' + sd] || {};
      if (j.d) d.push([n, sd]);
      if (j.i) {
        i.push([n, sd]);
        sw++;
        if (t === 'S') swS++;
      }
      if (j.d || j.i) {
        inv.push([n, sd, t]);
        if (t === 'L') L++;
        if (t === 'S') S++;
      }
    }),
  );
  const grp = a => {
    const m = {};
    a.forEach(([n, sd]) => {
      (m[n] = m[n] || []).push(sd);
    });
    return Object.entries(m)
      .map(
        ([n, s]) =>
          `${/^[A-Z]{2,}/.test(n) ? n : n.charAt(0).toLowerCase() + n.slice(1)} ${s.length === 2 ? 'bilateral' : s[0] === 'D' ? 'D' : 'E'}`,
      )
      .join(', ');
  };
  const sym = (() => {
    const names = [...new Set(inv.map(x => x[0]))];
    if (!names.length) return '';
    const bil = names.filter(
      n => o[n + '|D'] && (o[n + '|D'].d || o[n + '|D'].i) && o[n + '|E'] && (o[n + '|E'].d || o[n + '|E'].i),
    ).length;
    return bil >= names.length / 2 ? 'simétrico' : 'assimétrico';
  })();
  const nInv = inv.length,
    pat = nInv === 0 ? '' : nInv === 1 ? 'monoarticular' : nInv <= 4 ? 'oligoarticular' : 'poliarticular';
  const dOnly = d.filter(([n, sd]) => !(o[n + '|' + sd] || {}).i);
  return { d, i, inv, L, S, sw, swS, grpD: grp(d), grpI: grp(i), grpDo: grp(dOnly), sym, pat };
}
