/**
 * Processamento do PDF da receita no navegador: lê o texto com o pdf.js e cobre a data
 * (e o rodapé "Impresso em…") com o pdf-lib. O arquivo não sai deste computador.
 */
import { PDFDocument, StandardFonts, degrees, rgb } from '../../assets/vendor/pdf-lib/pdf-lib.esm.min.js';
import { agruparCorridasDeTexto, classificarCorrida, paraPagina, rodapeSemData, textoNoLugarDaData } from './regras.js';

/* global pdfjsLib */ // definido por assets/vendor/pdfjs/pdf.min.js (script clássico na página)

/** A Helvetica padrão só tem caracteres latinos; troca o que não couber por "?". */
function textoSeguro(fonte, s) {
  return [...s]
    .map(ch => {
      try {
        fonte.encodeText(ch);
        return ch;
      } catch {
        return '?';
      }
    })
    .join('');
}

/**
 * @param {Uint8Array} bytes PDF original
 * @param {{ emBranco: boolean, rodape: boolean }} opcoes
 * @returns {Promise<{ bytes: Uint8Array, encontrados: Array<{ tipo: 'data'|'rodape', texto: string }> }>}
 */
export async function removerDataDaReceita(bytes, opcoes) {
  const leitura = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
  const saida = await PDFDocument.load(bytes.slice(0));
  const fonte = await saida.embedFont(StandardFonts.Helvetica);
  const branco = rgb(1, 1, 1);
  const preto = rgb(0.1, 0.1, 0.1);
  const paginas = saida.getPages();
  const encontrados = [];

  for (let n = 1; n <= leitura.numPages; n++) {
    const conteudo = await (await leitura.getPage(n)).getTextContent();
    const pagina = paginas[n - 1];
    for (const r of agruparCorridasDeTexto(conteudo.items)) {
      const tipo = classificarCorrida(r.text, opcoes);
      if (!tipo) continue;
      const rotacao = degrees((r.ang * 180) / Math.PI);
      const canto = paraPagina(r, r.u0 - 2, r.v - r.h * 0.25 - 0.5);
      pagina.drawRectangle({
        x: canto.x,
        y: canto.y,
        width: r.u1 - r.u0 + 4,
        height: r.h * 1.05 + 0.5,
        color: branco,
        rotate: rotacao,
      });
      encontrados.push({ tipo, texto: r.text });
      if (tipo === 'data') {
        if (!opcoes.emBranco) continue;
        const novo = textoSeguro(fonte, textoNoLugarDaData(r.text));
        const largura = fonte.widthOfTextAtSize(novo, r.h);
        const p = paraPagina(r, (r.u0 + r.u1) / 2 - largura / 2, r.v);
        pagina.drawText(novo, { x: p.x, y: p.y, size: r.h, font: fonte, color: preto, rotate: rotacao });
      } else {
        const p = paraPagina(r, r.u0, r.v);
        pagina.drawText(textoSeguro(fonte, rodapeSemData(r.text)), {
          x: p.x,
          y: p.y,
          size: r.h,
          font: fonte,
          color: preto,
          rotate: rotacao,
        });
      }
    }
  }
  return { bytes: await saida.save(), encontrados };
}

/** Desenha a 1ª página do PDF num canvas (prévia). */
export async function desenharPrevia(bytes, canvas) {
  const doc = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
  const pagina = await doc.getPage(1);
  const vista = pagina.getViewport({ scale: 2 });
  canvas.width = vista.width;
  canvas.height = vista.height;
  await pagina.render({ canvasContext: canvas.getContext('2d'), viewport: vista }).promise;
}
