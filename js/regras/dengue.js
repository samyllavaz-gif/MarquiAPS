/**
 * Dengue: dia de doença, grupo de estadiamento (A, B, C, D — Ministério da Saúde)
 * e volume de hidratação oral. Funções puras.
 */
/** Sinais de alarme respiratórios (sugerem COVID/influenza grave, não entram no grupo da dengue). */
const DG_RESP = ['Dispneia importante', 'Saturação < 94%', 'Respiração rápida/ofegante', 'Febre persistente'];

/** Dia de doença a partir da data de início "dd/mm" ou "dd/mm/aaaa" (1 = hoje); null se inválido ou ≥ 60. */
export function diaDeDoenca(textoInicio, agora = new Date()) {
  const m = textoInicio.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (!m) return null;
  let ano = m[3] ? +m[3] : agora.getFullYear();
  if (ano < 100) ano += 2000;
  const d = new Date(ano, +m[2] - 1, +m[1]);
  if (isNaN(d)) return null;
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const n = Math.round((hoje - d) / 864e5) + 1;
  return n >= 1 && n < 60 ? n : null;
}

/**
 * Grupo da dengue.
 * @param {object} g ficha: alarme[], choque[], sint{nome:'+'|'-'}, gest ('sim'|…), prev[], esp[]
 * @returns {{gr:'A'|'B'|'C'|'D', why:string[], resp:string[]}|{miss:true, resp:string[]}}
 */
export function grupoDengue(g) {
  const alarmeDengue = g.alarme.filter(x => x !== 'Nenhum' && !DG_RESP.includes(x)),
    resp = g.alarme.filter(x => DG_RESP.includes(x));
  const choque = g.choque.filter(x => x !== 'Nenhum');
  if (choque.length) return { gr: 'D', why: choque, resp };
  if (alarmeDengue.length) return { gr: 'C', why: alarmeDengue, resp };
  if (!g.alarme.length || !g.choque.length) return { miss: true, resp };
  const why = [];
  if (g.sint['Petéquias'] === '+') why.push('petéquias');
  if (g.sint['Prova do laço positiva'] === '+') why.push('prova do laço positiva');
  if (g.gest === 'sim') why.push('gestante');
  g.prev.filter(x => x !== 'Nenhuma').forEach(x => why.push(x.toLowerCase()));
  g.esp.forEach(x => why.push(x.toLowerCase()));
  return { gr: why.length ? 'B' : 'A', why, resp };
}

/** Volume diário de hidratação oral sugerido (60 mL/kg, arredondado a 100 mL), como texto; '' sem peso. */
export const volumeHidratacaoOral = peso => (peso > 0 ? String(Math.round((peso * 60) / 100) * 100) : '');
