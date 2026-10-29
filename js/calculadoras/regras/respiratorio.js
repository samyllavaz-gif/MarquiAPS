/**
 * Regras da calculadora respiratória: mMRC, CAT, ACT e gravidade da crise de asma.
 * Funções puras.
 */
export function classeMmrc(grau) {
  return grau <= 1 ? 'risk-low' : grau === 2 ? 'risk-mod' : 'risk-high';
}

export function classificarCat(total) {
  if (total < 10) return { rotulo: 'Impacto baixo', cls: 'risk-low' };
  if (total < 20) return { rotulo: 'Impacto moderado', cls: 'risk-mod' };
  if (total < 30) return { rotulo: 'Impacto alto', cls: 'risk-high' };
  return { rotulo: 'Impacto muito alto', cls: 'risk-vhigh' };
}

export function classificarAct(total) {
  if (total >= 25) return { rotulo: 'Asma totalmente controlada', cls: 'risk-low' };
  if (total >= 20) return { rotulo: 'Asma bem controlada', cls: 'risk-low' };
  return { rotulo: 'Asma não controlada — revisar plano terapêutico', cls: 'risk-high' };
}

/**
 * Gravidade da crise de asma. saturacao e frequenciaRespiratoria podem ser null.
 * sinais: cianose, silencioPulmonar, alteracaoConsciencia, exaustao, falaEntrecortada, tiragem (booleanos).
 */
export function classificarCriseAsma(sinais, saturacao, frequenciaRespiratoria) {
  const grave =
    sinais.cianose ||
    sinais.silencioPulmonar ||
    sinais.alteracaoConsciencia ||
    sinais.exaustao ||
    (saturacao !== null && saturacao < 90);
  const moderadaGrave =
    sinais.falaEntrecortada ||
    sinais.tiragem ||
    (saturacao !== null && saturacao < 94) ||
    (frequenciaRespiratoria !== null && frequenciaRespiratoria > 30);
  if (grave) {
    return {
      grave,
      rotulo: 'Crise muito grave / risco de vida',
      cls: 'risk-vhigh',
      conduta:
        'Tratamento imediato (O₂, broncodilatador + corticoide sistêmico), preparar para via aérea avançada e remoção urgente para emergência hospitalar.',
    };
  }
  if (moderadaGrave) {
    return {
      grave,
      rotulo: 'Crise grave',
      cls: 'risk-high',
      conduta:
        'Broncodilatador de curta ação repetido, corticoide sistêmico, oxigênio se SatO₂ <94%, reavaliação frequente; considerar encaminhamento para emergência.',
    };
  }
  return {
    grave,
    rotulo: 'Crise leve a moderada',
    cls: 'risk-mod',
    conduta:
      'Broncodilatador de curta ação, reavaliar resposta em 1 hora; considerar corticoide sistêmico se resposta incompleta.',
  };
}
