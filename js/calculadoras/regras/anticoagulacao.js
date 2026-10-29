/**
 * Regras da calculadora de anticoagulação (fibrilação atrial): CHA₂DS₂-VASc e HAS-BLED.
 * Funções puras.
 */
/** Recomendação pelo escore CHA₂DS₂-VASc já somado. */
export function interpretarChadsVasc(total) {
  if (total === 0) return { recomendacao: 'Baixo risco.', cls: 'risk-low' };
  if (total === 1) return { recomendacao: 'Considerar anticoagulação individualizada.', cls: 'risk-mod' };
  return { recomendacao: 'Anticoagulação geralmente recomendada, salvo contraindicação.', cls: 'risk-high' };
}

/** Risco de sangramento pelo HAS-BLED (1 ponto por item). */
export function interpretarHasBled(total) {
  if (total >= 3) return { rotulo: 'Risco alto de sangramento — atenção e seguimento mais próximo', cls: 'risk-high' };
  if (total >= 1) return { rotulo: 'Risco moderado de sangramento', cls: 'risk-mod' };
  return { rotulo: 'Risco baixo de sangramento', cls: 'risk-low' };
}
