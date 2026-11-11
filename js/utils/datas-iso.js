/** Datas no formato dos campos <input type="date"> (aaaa-mm-dd). */
/** Data de hoje em aaaa-mm-dd (fuso local). */
export function hojeIso() {
  const t = new Date();
  return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
}

/** Separa aaaa-mm-dd em [dia, mês, ano]; vazio → ['', '', '']. */
export function partesDaDataIso(texto) {
  if (!texto) return ['', '', ''];
  const [ano, mes, dia] = texto.split('-');
  return [dia, mes, ano];
}

/**
 * Idade em anos completos na data de referência (ou hoje).
 * @returns {number|null} null quando a data é inválida ou a idade fica fora de 0–129
 */
export function idadeEmAnosIso(nascimentoIso, referenciaIso) {
  if (!nascimentoIso) return null;
  const [a, m, d] = nascimentoIso.split('-').map(Number);
  let referencia = new Date();
  if (referenciaIso) {
    const [ra, rm, rd] = referenciaIso.split('-').map(Number);
    referencia = new Date(ra, rm - 1, rd);
  }
  let idade = referencia.getFullYear() - a;
  if (referencia.getMonth() + 1 < m || (referencia.getMonth() + 1 === m && referencia.getDate() < d)) idade--;
  return idade >= 0 && idade < 130 ? idade : null;
}
