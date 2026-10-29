/**
 * Extração do texto de um PDF com o pdf.js (assets/vendor/pdfjs), no próprio navegador.
 * Usado nas importações de PDFs do e-SUS PEC (APAC, mamografia e citopatológico). Nenhum dado sai do computador.
 */
import { PDFJS_WORKER } from '../config.js';

/* global pdfjsLib */ // definido por assets/vendor/pdfjs/pdf.min.js (script clássico na página)

/** Configura o pdf.js (carregado como script clássico na página) para usar o worker local. */
export function configurarLeitorPdf() {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
  } catch (erro) {
    /* leitor indisponível */
  }
}

/** Disponível quando o script do pdf.js foi carregado. */
export const leitorPdfDisponivel = () => typeof pdfjsLib !== 'undefined';

/**
 * Trechos de texto do PDF com posição: [{ s: texto, x, y }], ordenados de cima para baixo.
 * As páginas são empilhadas (y cresce página após página).
 */
export async function extrairTrechosDoPdf(buf) {
  const doc = await pdfjsLib.getDocument({ data: buf }).promise;
  const all = [];
  let off = 0;
  for (let p = 1; p <= doc.numPages; p++) {
    const pg = await doc.getPage(p);
    const tc = await pg.getTextContent();
    const h = pg.view[3];
    tc.items.forEach(it => {
      const s = (it.str || '').replace(/\s+/g, ' ').trim();
      if (s) all.push({ s, x: it.transform[4], y: off + (h - it.transform[5]) });
    });
    off += h + 50;
  }
  all.sort((a, b) => a.y - b.y || a.x - b.x);
  return all;
}

/** Agrupa trechos na mesma linha (|Δy| < 2,5): [{ y, x, s, items }], de cima para baixo. */
export function agruparEmLinhas(items) {
  const L = [];
  items.forEach(it => {
    const l = L.find(l => Math.abs(l.y - it.y) < 2.5);
    if (l) l.items.push(it);
    else L.push({ y: it.y, items: [it] });
  });
  L.forEach(l => {
    l.items.sort((a, b) => a.x - b.x);
    l.x = l.items[0].x;
    l.s = l.items.map(i => i.s).join(' ');
  });
  return L.sort((a, b) => a.y - b.y);
}
