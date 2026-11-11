/** Formatação de textos e números no padrão brasileiro. */
/** Número com vírgula decimal: formatarNumero(3.14159, 2) → "3,14". */
export const formatarNumero = (n, casas = 1) => n.toFixed(casas).replace('.', ',');

/** Lê um número digitado com vírgula ou ponto; NaN quando inválido. */
export const lerNumero = s => {
  const x = parseFloat(String(s ?? '').replace(',', '.'));
  return isFinite(x) ? x : NaN;
};

/** Escapa &, <, > e aspas para inserir texto em HTML. */
export const escaparHtml = s =>
  String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/** Primeira letra minúscula, preservando siglas (ex.: "DM2 há…" continua "DM2 há…"). */
export const minusculaInicialPreservandoSiglas = x =>
  /^[A-ZÁÉÍÓÚ][A-Z0-9]/.test(x) ? x : x.charAt(0).toLowerCase() + x.slice(1);

/** Número arredondado com vírgula e sem zeros à direita: (2.50, 2) → "2,5"; não finito → "—". */
export const formatarNumeroArredondado = (n, d = 1) => {
  if (!isFinite(n)) return '—';
  const r = Math.round(n * Math.pow(10, d)) / Math.pow(10, d);
  return String(r).replace('.', ',');
};

/** Primeira letra minúscula. */
export const minusculaInicial = s => s.charAt(0).toLowerCase() + s.slice(1);

/** Lista separada por vírgulas, cada item com a primeira letra minúscula. */
export const listaEmMinusculas = itens => itens.map(minusculaInicial).join(', ');

/** Acrescenta ponto final quando o texto não termina em . ! ? ou : (textos do motor de modelos). */
export const finalizarTexto = s => (s && !/[.!?:]$/.test(s) ? s + '.' : s);

/** Acrescenta ponto final quando o texto não termina em . ! ou ? (base da consulta). */
export const finalizarFrase = s => (s && !/[.!?]$/.test(s) ? s + '.' : s);

/** Sem acentos e em minúsculas, para comparar textos. */
export const normalizarTexto = s =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
