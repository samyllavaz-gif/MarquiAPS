/**
 * Regras da calculadora da pessoa idosa: VES-13, Katz, Lawton, risco de queda,
 * polifarmácia e fragilidade (fenótipo de Fried). Funções puras.
 */
/** VES-13: escore ≥3 indica idoso vulnerável. */
export function avaliarVes13(total) {
  const vulneravel = total >= 3;
  return {
    vulneravel,
    nota: vulneravel
      ? 'Idoso vulnerável — maior risco de declínio funcional e morte em 2 anos.'
      : 'Idoso não vulnerável pelos critérios do VES-13.',
    cls: vulneravel ? 'risk-high' : 'risk-low',
  };
}

/** Katz: número de AVDs realizadas com independência (0–6). */
export function classificarKatz(independentes) {
  if (independentes === 6) return { rotulo: 'Independência total nas AVDs', cls: 'risk-low' };
  if (independentes >= 4) return { rotulo: 'Dependência parcial leve', cls: 'risk-mod' };
  if (independentes >= 2) return { rotulo: 'Dependência moderada', cls: 'risk-high' };
  return { rotulo: 'Dependência grave/total nas AVDs', cls: 'risk-vhigh' };
}

/** Lawton: escore de 8 a 24. */
export function classificarLawton(total) {
  if (total >= 21) return { rotulo: 'Independência para AIVDs', cls: 'risk-low' };
  if (total >= 16) return { rotulo: 'Dependência leve', cls: 'risk-mod' };
  if (total >= 11) return { rotulo: 'Dependência moderada', cls: 'risk-high' };
  return { rotulo: 'Dependência grave para AIVDs', cls: 'risk-vhigh' };
}

/** Risco de queda: histórico de queda ou ≥3 fatores = alto. */
export function classificarRiscoQueda(fatores, historicoDeQueda) {
  if (historicoDeQueda || fatores >= 3) return { rotulo: 'Alto risco de queda', cls: 'risk-high' };
  if (fatores >= 1) return { rotulo: 'Risco moderado de queda', cls: 'risk-mod' };
  return { rotulo: 'Baixo risco de queda', cls: 'risk-low' };
}

/** Polifarmácia pelo número de fármacos; ≥2 fatores adicionais elevam o risco. */
export function classificarPolifarmacia(medicamentos, fatoresAdicionais) {
  let rotulo, cls;
  if (medicamentos >= 10) {
    rotulo = 'Polifarmácia extrema';
    cls = 'risk-vhigh';
  } else if (medicamentos >= 5) {
    rotulo = 'Polifarmácia';
    cls = 'risk-high';
  } else {
    rotulo = 'Sem polifarmácia pelo número de fármacos';
    cls = 'risk-low';
  }
  if (fatoresAdicionais >= 2 && cls !== 'risk-vhigh') cls = 'risk-high';
  return { rotulo, cls };
}

/** Fragilidade (fenótipo de Fried, 5 critérios). */
export function classificarFragilidade(criterios) {
  if (criterios === 0) return { rotulo: 'Robusto (nenhum critério)', cls: 'risk-low' };
  if (criterios <= 2) return { rotulo: 'Pré-frágil (1–2 critérios)', cls: 'risk-mod' };
  return { rotulo: 'Frágil (≥3 critérios)', cls: 'risk-high' };
}
