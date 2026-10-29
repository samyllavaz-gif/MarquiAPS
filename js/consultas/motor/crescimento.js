/**
 * Puericultura: medidas registradas, avaliação nas curvas da OMS (idade corrigida até 2 anos),
 * ganho de peso entre consultas e gráficos das curvas.
 */
import {
  CLASSIFICACOES_OMS,
  escoreZ,
  formatarEscoreZ,
  medidaNoEscoreZ,
  percentilDoEscore,
  valoresLmsNaIdade,
} from '../../regras/crescimento-oms.js';
import { diferencaEmDias, formatarDataBr, lerDataBr } from '../../utils/datas.js';
import { finalizarTexto, formatarNumero, lerNumero } from '../../utils/texto.js';
import { gv, S_, V } from './estado.js';

export const IND = {
  wfa: ['Peso para a idade', 'kg'],
  lhfa: ['Comprimento/altura para a idade', 'cm'],
  hcfa: ['Perímetro cefálico para a idade', 'cm'],
  bmifa: ['IMC para a idade', 'kg/m²'],
};
export const ZC = z => (z == null ? '' : z < -3 || z > 3 ? 'k-bad' : z < -2 || z > 2 ? 'k-warn' : 'k-ok');
export function growth() {
  const sx = S_('sexo') === 'Masculino' ? 'M' : S_('sexo') === 'Feminino' ? 'F' : '',
    dn = lerDataBr(gv('nasc', 'dn')),
    igs = lerNumero(gv('nasc', 'igs')),
    igd = lerNumero(gv('nasc', 'igd')) || 0;
  const ga = isNaN(igs) ? null : igs * 7 + igd,
    pre = ga != null && ga < 259;
  const rows = [...(V('gr') || [])];
  const bw = gv('rn', 'peso'),
    bl = gv('rn', 'comp'),
    bh = gv('rn', 'pc');
  if (dn && (bw || bl || bh)) rows.unshift({ d: formatarDataBr(dn), p: bw, e: bl, pc: bh, birth: 1 });
  const pts = [];
  rows.forEach(r => {
    const d = lerDataBr(r.d);
    if (!d || !dn) return;
    const age = diferencaEmDias(dn, d);
    if (age < 0) return;
    const corr = pre ? age - (280 - ga) : age,
      useC = pre && corr < 730,
      a = useC ? corr : age;
    let p = lerNumero(r.p);
    if (p > 200) p /= 1000;
    const e = lerNumero(r.e),
      h = lerNumero(r.pc);
    const m = a / 30.4375,
      ok = a >= 0 && sx;
    const z = {
      wfa: ok && p > 0 ? escoreZ('wfa', sx, m, p) : null,
      lhfa: ok && e > 0 ? escoreZ('lhfa', sx, m, e) : null,
      hcfa: ok && h > 0 ? escoreZ('hcfa', sx, m, h) : null,
    };
    const bmi = p > 0 && e > 0 ? p / Math.pow(e / 100, 2) : null;
    z.bmifa = ok && bmi ? escoreZ('bmifa', sx, m, bmi) : null;
    pts.push({ d, dt: r.d, age, a, m, useC, p, e, h, bmi, z, birth: !!r.birth, preterm: a < 0 });
  });
  pts.sort((x, y) => x.age - y.age);
  return { sx, dn, ga, pre, pts };
}
export const ageTx = days => {
  if (days < 0) return `${Math.round(-days / 7)} sem antes do termo`;
  const mo = Math.floor(days / 30.4375),
    d = Math.round(days - mo * 30.4375);
  return mo ? `${mo} m ${d} d` : `${d} d`;
};
function velRef(m) {
  return m < 3
    ? '~700 g/mês (25 a 30 g/dia)'
    : m < 6
      ? '~600 g/mês (cerca de 20 g/dia)'
      : m < 9
        ? '~500 g/mês (cerca de 15 g/dia)'
        : m < 12
          ? '~300 g/mês (cerca de 10 g/dia)'
          : '~200 g/mês no 2º ano';
}
export function growthEval(G) {
  const P = G.pts.filter(p => !p.preterm),
    L = P[P.length - 1],
    out = { msg: [], lines: [], nut: '', cres: '' };
  if (!L) return out;
  const prev = P.length > 1 ? P[P.length - 2] : null;
  const parts = [];
  if (L.p > 0)
    parts.push(
      `peso ${Math.round(L.p * 1000).toLocaleString('pt-BR')} g${L.z.wfa != null ? ` (z ${formatarEscoreZ(L.z.wfa)}, ${percentilDoEscore(L.z.wfa)})` : ''}`,
    );
  if (L.e > 0)
    parts.push(
      `comprimento ${formatarNumero(L.e)} cm${L.z.lhfa != null ? ` (z ${formatarEscoreZ(L.z.lhfa)}, ${percentilDoEscore(L.z.lhfa)})` : ''}`,
    );
  if (L.h > 0)
    parts.push(
      `PC ${formatarNumero(L.h)} cm${L.z.hcfa != null ? ` (z ${formatarEscoreZ(L.z.hcfa)}, ${percentilDoEscore(L.z.hcfa)})` : ''}`,
    );
  if (L.bmi) parts.push(`IMC ${formatarNumero(L.bmi)}${L.z.bmifa != null ? ` (z ${formatarEscoreZ(L.z.bmifa)})` : ''}`);
  if (parts.length)
    out.lines.push([
      'O',
      `Crescimento (curvas OMS) em ${L.dt}, idade ${ageTx(L.age)}${L.useC ? ` (corrigida ${ageTx(L.a)})` : ''}: ${parts.join('; ')}.`,
    ]);
  if (prev && L.p > 0 && prev.p > 0) {
    const dd = L.age - prev.age;
    if (dd > 0) {
      const g = (L.p - prev.p) * 1000,
        v = g / dd;
      out.msg.push([
        'note',
        `Ganho de peso desde ${prev.dt}: ${g >= 0 ? '+' : ''}${Math.round(g).toLocaleString('pt-BR')} g em ${dd} dias (${formatarNumero(v)} g/dia). Referência prática para a idade: ${velRef(L.a / 30.4375)}.`,
      ]);
      out.lines.push([
        'O',
        `Ganho de peso: ${g >= 0 ? '+' : ''}${Math.round(g).toLocaleString('pt-BR')} g em ${dd} dias (${formatarNumero(v)} g/dia)${prev.z.wfa != null && L.z.wfa != null ? `; escore-z peso/idade ${formatarEscoreZ(prev.z.wfa)} → ${formatarEscoreZ(L.z.wfa)}` : ''}.`,
      ]);
      if (prev.z.wfa != null && L.z.wfa != null) {
        const dz = L.z.wfa - prev.z.wfa;
        if (dz <= -0.67)
          out.msg.push([
            'warnmsg',
            `Queda de ${formatarNumero(-dz, 2)} no escore-z de peso: cruzou uma faixa de percentil. Investigar a causa e reavaliar em curto prazo.`,
          ]);
        else if (dz >= 0.67 && L.z.wfa > 1)
          out.msg.push([
            'warnmsg',
            `Subida de ${formatarNumero(dz, 2)} no escore-z de peso com z acima de +1: atenção ao ganho excessivo.`,
          ]);
      }
    }
  }
  const B = G.pts.find(p => p.birth);
  if (B && B.p > 0 && L.p > 0 && L !== B) {
    const loss = ((B.p - L.p) / B.p) * 100;
    if (L.age <= 15 && loss > 10)
      out.msg.push(['warnmsg', `Perda de ${formatarNumero(loss)}% do peso de nascimento: acima dos 10% esperados.`]);
    else if (L.age > 15 && L.p < B.p)
      out.msg.push([
        'warnmsg',
        'Ainda abaixo do peso de nascimento após 15 dias de vida: avaliar amamentação e causas de baixo ganho.',
      ]);
  }
  const nut = [],
    cres = [];
  if (L.z.wfa != null) nut.push(`${CLASSIFICACOES_OMS.wfa(L.z.wfa)} (z ${formatarEscoreZ(L.z.wfa)})`);
  if (L.z.bmifa != null)
    nut.push(`IMC/idade: ${CLASSIFICACOES_OMS.bmifa(L.z.bmifa)} (z ${formatarEscoreZ(L.z.bmifa)})`);
  if (L.z.lhfa != null) cres.push(`${CLASSIFICACOES_OMS.lhfa(L.z.lhfa)} (z ${formatarEscoreZ(L.z.lhfa)})`);
  if (L.z.hcfa != null) cres.push(`${CLASSIFICACOES_OMS.hcfa(L.z.hcfa)} (z ${formatarEscoreZ(L.z.hcfa)})`);
  out.nut = nut.length ? finalizarTexto(nut.join('; ').replace(/^./, c => c.toUpperCase())) : '';
  out.cres = cres.length ? finalizarTexto(cres.join('; ').replace(/^./, c => c.toUpperCase())) : '';
  return out;
}
export function chartSVG(ind, G) {
  const sx = G.sx;
  if (!sx) return '<p class="note">Selecione o sexo da criança para ver as curvas.</p>';
  const P = G.pts.filter(p => !p.preterm && p.z[ind] != null);
  const maxA = P.length ? Math.max(...P.map(p => p.m)) : 0,
    X = maxA <= 5.5 ? 6 : maxA <= 11 ? 12 : maxA <= 23 ? 24 : 60;
  const W = 640,
    H = 320,
    ml = 44,
    mr = 34,
    mt = 14,
    mb = 34,
    step = X <= 12 ? 0.25 : 0.5;
  const lines = [-3, -2, 0, 2, 3].map(z => {
    const a = [];
    for (let m = 0; m <= X + 1e-9; m += step) {
      const p = valoresLmsNaIdade(ind, sx, m);
      if (p) a.push([m, medidaNoEscoreZ(p, z)]);
    }
    return [z, a];
  });
  const val = p => (ind === 'wfa' ? p.p : ind === 'lhfa' ? p.e : ind === 'hcfa' ? p.h : p.bmi);
  let lo = Math.min(...lines[0][1].map(q => q[1]), ...P.map(val)),
    hi = Math.max(...lines[4][1].map(q => q[1]), ...P.map(val));
  const pad = (hi - lo) * 0.04;
  lo -= pad;
  hi += pad;
  const sxp = m => ml + (m / X) * (W - ml - mr),
    syp = v => mt + (1 - (v - lo) / (hi - lo)) * (H - mt - mb);
  const path = a => a.map((q, i) => (i ? 'L' : 'M') + sxp(q[0]).toFixed(1) + ' ' + syp(q[1]).toFixed(1)).join('');
  const band =
    path(lines[1][1]) +
    lines[3][1]
      .slice()
      .reverse()
      .map(q => 'L' + sxp(q[0]).toFixed(1) + ' ' + syp(q[1]).toFixed(1))
      .join('') +
    'Z';
  const col = { '-3': 'var(--bad)', '-2': 'var(--warn)', 0: 'var(--ok)', 2: 'var(--warn)', 3: 'var(--bad)' };
  const xt = X === 6 ? 1 : X === 12 ? 1 : X === 24 ? 2 : 6;
  let ticks = '';
  for (let m = 0; m <= X; m += xt)
    ticks += `<line x1="${sxp(m)}" x2="${sxp(m)}" y1="${mt}" y2="${H - mb}" stroke="var(--line)" stroke-width="1"/><text x="${sxp(m)}" y="${H - mb + 16}" text-anchor="middle" font-size="11" fill="var(--muted)">${m}</text>`;
  const ys = hi - lo > 40 ? 10 : hi - lo > 15 ? 5 : hi - lo > 6 ? 2 : 1;
  let yt = '';
  for (let v = Math.ceil(lo / ys) * ys; v <= hi; v += ys)
    yt += `<line x1="${ml}" x2="${W - mr}" y1="${syp(v)}" y2="${syp(v)}" stroke="var(--line)" stroke-width="1" stroke-dasharray="2 3"/><text x="${ml - 6}" y="${syp(v) + 4}" text-anchor="end" font-size="11" fill="var(--muted)">${String(v).replace('.', ',')}</text>`;
  const curves = lines
    .map(
      ([z, a]) =>
        `<path d="${path(a)}" fill="none" stroke="${col[z]}" stroke-width="${z === 0 ? 2 : 1.4}"/><text x="${W - mr + 4}" y="${syp(a[a.length - 1][1]) + 4}" font-size="11" fill="${col[z]}">${z > 0 ? '+' : ''}${z}</text>`,
    )
    .join('');
  const pts = P.map(p => [sxp(p.m), syp(val(p))]);
  const line =
    pts.length > 1
      ? `<path d="${pts.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('')}" fill="none" stroke="var(--accent)" stroke-width="2"/>`
      : '';
  const dots = pts
    .map(
      (q, i) =>
        `<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="${i === pts.length - 1 ? 5 : 4}" fill="${i === pts.length - 1 ? 'var(--accent)' : 'var(--surface)'}" stroke="var(--accent)" stroke-width="2"/>`,
    )
    .join('');
  return `<div style="overflow-x:auto"><svg viewBox="0 0 ${W} ${H}" width="100%" style="min-width:420px;display:block" role="img" aria-label="${IND[ind][0]} – curvas da OMS"><rect x="${ml}" y="${mt}" width="${W - ml - mr}" height="${H - mt - mb}" fill="var(--surface)"/><path d="${band}" fill="var(--ok-soft)" opacity=".6"/>${ticks}${yt}${curves}${line}${dots}<text x="${(ml + W - mr) / 2}" y="${H - 4}" text-anchor="middle" font-size="11" fill="var(--muted)">idade (meses)${G.pre ? ' · corrigida até 2 anos' : ''}</text><text x="12" y="${mt + (H - mt - mb) / 2}" font-size="11" fill="var(--muted)" transform="rotate(-90 12 ${mt + (H - mt - mb) / 2})" text-anchor="middle">${IND[ind][1]}</text></svg></div><p class="ref">Curvas da OMS (${sx === 'M' ? 'meninos' : 'meninas'}, 0 a 5 anos). Linhas: escores-z −3, −2, 0, +2 e +3. Faixa verde: entre −2 e +2.</p>`;
}
