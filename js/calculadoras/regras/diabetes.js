/**
 * Regras da calculadora de diabetes: IMC, meta de HbA1c, insulina basal,
 * titulação de NPH, hipoglicemia e rastreios anuais. Funções puras.
 */
export function calcularImc(pesoKg, alturaCm) {
  return pesoKg / (alturaCm / 100) ** 2;
}

export function classificarImcAdulto(imc) {
  if (imc < 18.5) return 'Baixo peso';
  if (imc < 25) return 'Eutrófico';
  if (imc < 30) return 'Sobrepeso';
  if (imc < 35) return 'Obesidade I';
  if (imc < 40) return 'Obesidade II';
  return 'Obesidade III';
}

/** Meta de HbA1c (7%, ou 8% se idoso frágil / DRC avançada) e situação do controle. */
export function avaliarControleGlicemico(hba1c, fragil) {
  const meta = fragil ? 8 : 7;
  if (hba1c === null) return { meta, texto: 'Não informada', cls: 'risk-info' };
  if (hba1c <= meta) return { meta, texto: 'Dentro da meta individualizada', cls: 'risk-low' };
  if (hba1c <= meta + 1) return { meta, texto: 'Próxima da meta', cls: 'risk-mod' };
  return { meta, texto: 'Controle inadequado', cls: 'risk-high' };
}

/** Dose inicial de insulina basal. fator = UI/kg/dia; 0,5 = DM1 (metade basal). */
export function doseInsulinaBasal(peso, fator) {
  const doseTotal = peso * fator;
  const ehDm1 = fator === 0.5;
  return { doseTotal, ehDm1, doseBasal: ehDm1 ? doseTotal * 0.5 : doseTotal };
}

/** Titulação de NPH pela glicemia de jejum e ocorrência de hipoglicemia. */
export function titularNph(dose, glicemiaJejum, houveHipoglicemia) {
  if (houveHipoglicemia) {
    return {
      novaDose: Math.max(0, dose - (dose >= 10 ? 4 : 2)),
      nota: 'Houve hipoglicemia — reduzir a dose independentemente da glicemia de jejum atual.',
      cls: 'risk-high',
    };
  }
  if (glicemiaJejum >= 180)
    return { novaDose: dose + 4, nota: 'Glicemia de jejum muito elevada — aumentar a dose.', cls: 'risk-mod' };
  if (glicemiaJejum >= 130)
    return { novaDose: dose + 2, nota: 'Glicemia de jejum acima da meta — aumentar discretamente.', cls: 'risk-mod' };
  if (glicemiaJejum >= 70)
    return { novaDose: dose, nota: 'Glicemia de jejum dentro da meta — manter dose.', cls: 'risk-low' };
  return { novaDose: Math.max(0, dose - 2), nota: 'Glicemia de jejum baixa — reduzir a dose.', cls: 'risk-high' };
}

/** Classificação e conduta na hipoglicemia. */
export function classificarHipoglicemia(glicemia, consciente) {
  if (glicemia >= 70) {
    return {
      rotulo: 'Sem hipoglicemia pelos critérios usuais',
      cls: 'risk-low',
      conduta: 'Reavaliar sintomas e contexto clínico.',
      emergencia: false,
    };
  }
  if (!consciente) {
    return {
      rotulo: 'Hipoglicemia grave — paciente incapaz de deglutir',
      cls: 'risk-vhigh',
      emergencia: true,
      conduta:
        'Não oferecer nada por via oral. Administrar glucagon IM/SC se disponível, ou glicose IV em serviço com acesso venoso. Acionar suporte de emergência.',
    };
  }
  if (glicemia < 54) {
    return {
      rotulo: 'Hipoglicemia clinicamente significativa',
      cls: 'risk-high',
      emergencia: false,
      conduta:
        'Regra dos 15-15: ofertar 15g de carboidrato de absorção rápida (ex.: 3 colheres de açúcar em água, ou suco), reavaliar glicemia em 15 min e repetir se necessário. Após normalizar, oferecer lanche com carboidrato complexo.',
    };
  }
  return {
    rotulo: 'Hipoglicemia leve a moderada (54–69 mg/dL)',
    cls: 'risk-mod',
    emergencia: false,
    conduta:
      'Regra dos 15-15: 15g de carboidrato rápido, reavaliar em 15 minutos. Revisar esquema terapêutico se eventos recorrentes.',
  };
}

/** Rastreios anuais do diabetes ainda pendentes. */
export function rastreiosPendentesDiabetes({ pe, renal, retina }) {
  const pendentes = [];
  if (!pe) pendentes.push('Exame do pé');
  if (!renal) pendentes.push('Função renal / albuminúria');
  if (!retina) pendentes.push('Fundoscopia/retinografia');
  const cls = pendentes.length === 0 ? 'risk-low' : pendentes.length === 3 ? 'risk-high' : 'risk-mod';
  return { pendentes, cls };
}
