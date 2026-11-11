/** Datas no formato brasileiro (dd/mm/aaaa) e cálculos de intervalo. */
/** Lê "dd/mm/aaaa" (ou dd/mm/aa → 20aa). Devolve Date ou null quando a data não existe. */
export function lerDataBr(texto) {
  const m = String(texto || '')
    .trim()
    .match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  let ano = +m[3];
  if (ano < 100) ano += 2000;
  const data = new Date(ano, +m[2] - 1, +m[1]);
  return data.getDate() === +m[1] && data.getMonth() === +m[2] - 1 ? data : null;
}

/** Date → "dd/mm/aaaa". */
export const formatarDataBr = d =>
  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

/** Hoje, sem horas (00:00 local). */
export const hojeSemHora = () => {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
};

/** Diferença em dias inteiros entre duas datas (b − a). */
export const diferencaEmDias = (a, b) => Math.round((b - a) / 864e5);

/** Nova data somando n dias. */
export const somarDias = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

/** 45 → "6 semanas e 3 dias". */
export const textoSemanasEDias = n => `${Math.floor(n / 7)} semanas e ${n % 7} dia${n % 7 === 1 ? '' : 's'}`;

/** Idade completa entre o nascimento e a data t: { y, m, d, mo (meses totais) }. */
export function idadeDetalhada(nascimento, t) {
  let y = t.getFullYear() - nascimento.getFullYear(),
    m = t.getMonth() - nascimento.getMonth(),
    d = t.getDate() - nascimento.getDate();
  if (d < 0) {
    m--;
    d += new Date(t.getFullYear(), t.getMonth(), 0).getDate();
  }
  if (m < 0) {
    y--;
    m += 12;
  }
  return { y, m, d, mo: y * 12 + m };
}
