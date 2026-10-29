/**
 * Regras da calculadora de saúde mental: PHQ-9, GAD-7, AUDIT-C,
 * triagem de risco suicida e escore simplificado de insônia. Funções puras.
 */
export function classificarPhq9(total) {
  if (total < 5) return { rotulo: 'Mínimo', cls: 'risk-low' };
  if (total < 10) return { rotulo: 'Leve', cls: 'risk-mod' };
  if (total < 15) return { rotulo: 'Moderado', cls: 'risk-high' };
  return { rotulo: 'Grave', cls: 'risk-vhigh' };
}

/** Item 9 do PHQ-9 (pensamentos de morte/autolesão) com qualquer pontuação > 0. */
export const ALERTA_ITEM9_PHQ9 =
  'Item 9 positivo — investigar ideação suicida/autolesão imediatamente, ver módulo de risco suicida abaixo.';

export function classificarGad7(total) {
  if (total < 5) return { rotulo: 'Mínima', cls: 'risk-low' };
  if (total < 10) return { rotulo: 'Leve', cls: 'risk-mod' };
  if (total < 15) return { rotulo: 'Moderada', cls: 'risk-high' };
  return { rotulo: 'Grave', cls: 'risk-vhigh' };
}

export function classificarAuditC(total) {
  if (total === 0) return { rotulo: 'Sem indício de uso de risco', cls: 'risk-low' };
  if (total <= 3) return { rotulo: 'Baixo risco / consumo de baixo risco', cls: 'risk-low' };
  if (total <= 5) return { rotulo: 'Possível uso de risco — orientar e reavaliar', cls: 'risk-mod' };
  return { rotulo: 'Uso de risco / provável uso nocivo — intervenção breve recomendada', cls: 'risk-high' };
}

export const ALERTA_RISCO_SUICIDA =
  'Não deixar o paciente sozinho se risco iminente; garantir ambiente seguro, remover acesso a meios letais quando possível, encaminhar para avaliação especializada/emergência conforme gravidade.';

/** Triagem de risco suicida. alerta=true quando a orientação de segurança deve aparecer. */
export function classificarRiscoSuicida({ ideacao, plano, meios, tentativaPrevia, intencao }) {
  const iminente = plano && meios && intencao;
  const alerta = iminente || ideacao;
  if (iminente) return { rotulo: 'Risco iminente / emergência psiquiátrica', cls: 'risk-vhigh', alerta };
  if (ideacao && (plano || tentativaPrevia))
    return { rotulo: 'Alto risco — avaliação especializada urgente', cls: 'risk-high', alerta };
  if (ideacao) return { rotulo: 'Risco presente — avaliação e seguimento próximo', cls: 'risk-mod', alerta };
  return { rotulo: 'Sem ideação suicida ativa identificada nesta triagem', cls: 'risk-low', alerta };
}

export function classificarInsonia(total) {
  if (total <= 3) return { rotulo: 'Sem insônia clinicamente relevante', cls: 'risk-low' };
  if (total <= 7) return { rotulo: 'Insônia leve', cls: 'risk-mod' };
  if (total <= 11) return { rotulo: 'Insônia moderada', cls: 'risk-high' };
  return { rotulo: 'Insônia grave', cls: 'risk-vhigh' };
}
