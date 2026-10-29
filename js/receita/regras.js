/**
 * Regras da "Receita sem data": localizar, no texto do PDF do e-SUS PEC, a data abaixo
 * da assinatura e o rodapé "Impresso em…". Funções puras, sem acesso à página.
 */

/** Data por extenso (ex.: "10 de outubro de 2026"). */
export const DATA_POR_EXTENSO = /\d{1,2}\s+de\s+[A-Za-zÀ-ÿçÇ]+\s+de\s+\d{4}/;

/** Rodapé de impressão do PEC (ex.: "Impresso em 10/10/2026 às 10:00"). */
export const RODAPE_IMPRESSO = /Impresso\s+em\s+\d{1,2}\/\d{1,2}\/\d{2,4}(\s+às\s+\d{1,2}:\d{2})?/;

/** Linha em branco que substitui a data, para preencher à mão. */
export const DATA_EM_BRANCO = '_____ de ____________________ de ________';

/**
 * Junta os pedaços de texto da mesma linha e próximos entre si (cada via fica separada).
 * Trabalha no sistema de coordenadas do próprio texto, pois o PEC gera a página girada.
 * @param {Array} items itens do pdf.js (str, transform, width, height)
 * @returns {Array} corridas: { text, ang, co, si, u0, u1, v, h }
 */
export function agruparCorridasDeTexto(items) {
  const pedacos = items
    .filter(i => i.str && i.str.trim() !== '')
    .map(i => {
      const [a, b, c, d, e, f] = i.transform;
      const ang = Math.atan2(b, a);
      const co = Math.cos(ang);
      const si = Math.sin(ang);
      return {
        str: i.str,
        ang,
        co,
        si,
        u: e * co + f * si,
        v: -e * si + f * co,
        w: i.width,
        h: Math.hypot(c, d) || Math.abs(i.height) || 8,
      };
    })
    .sort((p, q) => Math.round(p.ang * 100) - Math.round(q.ang * 100) || q.v - p.v || p.u - q.u);
  const corridas = [];
  for (const it of pedacos) {
    const r = corridas.find(
      r => Math.abs(r.ang - it.ang) < 0.01 && Math.abs(r.v - it.v) < 1.5 && it.u - r.u1 < 12 && it.u - r.u1 > -2,
    );
    if (r) {
      r.text += (it.u - r.u1 > 1 ? ' ' : '') + it.str;
      r.u1 = Math.max(r.u1, it.u + it.w);
      r.h = Math.max(r.h, it.h);
    } else
      corridas.push({ text: it.str, ang: it.ang, co: it.co, si: it.si, u0: it.u, u1: it.u + it.w, v: it.v, h: it.h });
  }
  return corridas;
}

/** Converte um ponto (u, v) do sistema do texto de volta para a página. */
export const paraPagina = (r, u, v) => ({ x: u * r.co - v * r.si, y: u * r.si + v * r.co });

/** 'data' (data da assinatura), 'rodape' (Impresso em…, se a opção estiver ligada) ou null. */
export function classificarCorrida(texto, { rodape }) {
  if (DATA_POR_EXTENSO.test(texto) && !RODAPE_IMPRESSO.test(texto)) return 'data';
  if (rodape && RODAPE_IMPRESSO.test(texto)) return 'rodape';
  return null;
}

/** Texto que entra no lugar da data: o que vinha antes dela (ex.: "São Manuel,") + linha em branco. */
export function textoNoLugarDaData(texto) {
  return texto.slice(0, texto.search(DATA_POR_EXTENSO)) + DATA_EM_BRANCO;
}

/** Rodapé sem a data: "Impresso em 10/10/2026 às 10:00" → "Impresso". */
export const rodapeSemData = texto => texto.replace(RODAPE_IMPRESSO, 'Impresso').replace(/\s+/g, ' ').trim();

/** Nome do arquivo gerado: "receita.pdf" → "receita_sem_data.pdf". */
export const nomeSemData = nome => nome.replace(/\.pdf$/i, '') + '_sem_data.pdf';
