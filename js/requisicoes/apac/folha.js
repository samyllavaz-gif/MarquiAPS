/**
 * Desenho do laudo de APAC: escreve os dados sobre a imagem do formulário oficial.
 * Coordenadas em pt; as do formulário original são medidas de baixo para cima (função B).
 */
import { partesDaDataIso } from '../../utils/datas-iso.js';
import { ajustarBlocoNaFolha, ajustarLinhaNaFolha } from '../comum.js';

export const maiusculasPtBr = s => s.toLocaleUpperCase('pt-BR');

/** Altura da folha (pt) e conversão da coordenada do PDF original (de baixo para cima) para linha de base. */
const ALTURA_FOLHA_APAC = 842,
  H = ALTURA_FOLHA_APAC,
  B = y0 => H - y0 - 4.6;
/** Linhas de procedimento: [y, x do nome, x final do nome, x da qtde., x final da qtde.] (1 principal + 5 secundários). */
const LINHAS_PROCEDIMENTO_APAC = [[557.0, 216.6, 494.2, 500, 552.6]].concat(
  [513.1, 486.7, 460.3, 433.8, 407.4].map(y => [y, 216.6, 512.2, 513.6, 561.6]),
);
export function pintarFolhaApac(folha, dados) {
  const v = dados.v,
    sh = folha;
  sh.querySelectorAll('.t,.mt,.xx,.wh').forEach(e => e.remove());
  const add = (cls, txt, st) => {
    const d = document.createElement('div');
    d.className = cls;
    d.textContent = txt;
    Object.assign(d.style, st);
    sh.appendChild(d);
    return d;
  };
  const line = (s, x, x1, base, o = {}) => {
    if (!s) return;
    if (o.upper !== 0) s = maiusculasPtBr(s);
    const F = o.size || 9;
    const d = add('t' + (o.center ? ' tc' : ''), s, { left: x + 'pt', width: x1 - x + 'pt' });
    let f = ajustarLinhaNaFolha(d, x1 - x, F, 5);
    d.style.top = base - 0.92 * f + 'pt';
  };
  const comb = (s, x, x1, n, base) => {
    const w = (x1 - x) / n;
    for (let i = 0; i < n && i < s.length; i++)
      add('t tc', s[i], { left: x + i * w + 'pt', width: w + 'pt', top: base - 0.92 * 9.5 + 'pt', fontSize: '9.5pt' });
  };
  const box = (x0, y0, x1, y1) =>
    add('xx', 'X', { left: x0 + 'pt', top: H - y1 + 'pt', width: x1 - x0 + 'pt', height: y1 - y0 + 'pt' });
  // solicitante
  line(dados.estabelecimento, 35, 452, B(736.5));
  comb(v.cnes, 460, 562.3, 7, B(736.9));
  // paciente
  line(v.nome, 36, 469, B(695.3));
  line(v.pront, 479, 559, B(695.3), { center: 1 });
  comb(v.cns, 32.26, 298.0, 15, B(671.8));
  const nb = partesDaDataIso(dados.nasc);
  line(nb[0], 323, 345, 167.6, { center: 1 });
  line(nb[1], 349, 369, 167.6, { center: 1 });
  line(nb[2], 372, 409, 167.6, { center: 1 });
  if (dados.sexoM) box(461, 672.6, 479, 687.7);
  if (dados.sexoF) box(525.3, 673.3, 542.9, 688.8);
  line(v.mae, 36, 397, B(648.1));
  const ddd = v.ddd,
    tel = v.tel;
  comb(ddd, 404.35, 435.85, 2, B(648.1));
  if (tel.length === 9) {
    const w = (561.8 - 435.85) / 9;
    for (let i = 0; i < 9; i++)
      add('t tc', tel[i], {
        left: 435.85 + i * w + 'pt',
        width: w + 'pt',
        top: B(648.1) - 0.92 * 8.5 + 'pt',
        fontSize: '8.5pt',
      });
  } else comb(tel, 435.85, 561.8, 8, B(648.1));
  line(v.end, 36, 559, B(624.6));
  line(v.mun, 36, 352, B(600.4));
  line(v.ibge, 357, 434, B(600.4), { center: 1 });
  comb(maiusculasPtBr(v.uf), 437.2, 468.6, 2, B(600.4));
  comb(v.cep, 469.5, 561, 8, B(600.4));
  // procedimentos
  dados.procedimentos.slice(0, 6).forEach((p, i) => {
    const [y, nx, nx1, qx, qx1] = LINHAS_PROCEDIMENTO_APAC[i];
    comb(p.code, 32.5, 212.5, 10, B(y) + 1);
    line(p.name, nx + 3, nx1 - 2, B(y) + 1);
    line(p.q, qx, qx1, B(y) + 1, { center: 1, size: 10 });
  });
  // justificativa
  line(v.diag, 36, 334, B(361.9));
  line(v.cid1, 338, 396, B(361.9), { center: 1 });
  line(v.cid2, 400, 466, B(361.9), { center: 1 });
  line(v.cid3, 469, 560, B(361.9), { center: 1 });
  const obs = v.obs;
  if (obs) {
    const top = H - 352,
      bottom = H - 268;
    const d = add('mt', obs, { left: '37pt', width: '521pt', top: top + 'pt' });
    ajustarBlocoNaFolha(d, bottom - top, 9, 11);
  }
  // solicitação
  line(v.prof, 36, 296, B(217.3));
  const ds = partesDaDataIso(dados.dsol);
  line(ds[0], 302, 323, 620, { center: 1 });
  line(ds[1], 327, 346, 620, { center: 1 });
  line(ds[2], 348, 381, 620, { center: 1 });
  if (dados.documentoCns) box(47.3, 195.9, 64.5, 208.1);
  if (dados.documentoCpf) box(98.3, 196.5, 115.1, 208.7);
  comb(v.profdoc, 145.6, 381.2, 15, B(193.8));
  // executante
  line(v.exec, 39, 421, B(31.8));
  comb(v.execcnes, 440.9, 543.2, 7, B(31.1));
}
