/**
 * Regras da calculadora de hipertensão (Diretriz Brasileira de Hipertensão).
 * Funções puras: recebem números/booleanos e devolvem textos e a classe de risco.
 */
/** Estadiamento pela maior categoria entre PAS e PAD. */
export function classificarPressao(pas, pad) {
  if (pas >= 180 || pad >= 110) return { estagio: 'Estágio 3 (PA ≥180/110 mmHg)', cls: 'risk-vhigh' };
  if (pas >= 160 || pad >= 100) return { estagio: 'Estágio 2 (PA 160–179 / 100–109 mmHg)', cls: 'risk-high' };
  if (pas >= 140 || pad >= 90) return { estagio: 'Estágio 1 (PA 140–159 / 90–99 mmHg)', cls: 'risk-mod' };
  if (pas >= 130 || pad >= 85) return { estagio: 'Pré-hipertensão (130–139 / 85–89 mmHg)', cls: 'risk-mod' };
  if (pas >= 121 || pad >= 81) return { estagio: 'Limítrofe (121–129 / 81–84 mmHg)', cls: 'risk-low' };
  return { estagio: 'PA ótima/normal (≤120/80 mmHg)', cls: 'risk-low' };
}

/** Urgência × emergência hipertensiva. lesaoOrgaoAlvo = algum sinal agudo marcado. */
export function classificarCriseHipertensiva(pas, pad, lesaoOrgaoAlvo) {
  const paAlta = pas >= 180 || pad >= 120;
  if (paAlta && lesaoOrgaoAlvo) {
    return {
      rotulo: 'Emergência hipertensiva',
      cls: 'risk-vhigh',
      conduta:
        'Reduzir PA com anti-hipertensivo IV em ambiente monitorado; encaminhamento hospitalar imediato. Meta: redução de ~25% da PAM na 1ª hora (exceto AVC/dissecção, que seguem metas específicas).',
    };
  }
  if (paAlta) {
    return {
      rotulo: 'Urgência hipertensiva',
      cls: 'risk-high',
      conduta:
        'Sem lesão de órgão-alvo aguda. Ajustar/reintroduzir anti-hipertensivo oral, repouso, reavaliar em 24–72h. Evitar redução abrupta da PA.',
    };
  }
  return {
    rotulo: 'PA elevada sem critérios de crise',
    cls: 'risk-mod',
    conduta: 'Reavaliar em consulta de rotina, investigar adesão e causas secundárias se persistente.',
  };
}

/** Meta pressórica por perfil (idade pode ser null). */
export function metaPressorica(idade, perfil) {
  if (perfil === 'idoso_fragil' || (idade !== null && idade >= 80)) {
    return {
      meta: '<150/90 mmHg, individualizar conforme tolerância e fragilidade',
      obs: 'Evitar hipotensão postural e quedas; afrouxar meta se sintomas de baixa perfusão.',
    };
  }
  if (perfil === 'drc_album')
    return { meta: '<130/80 mmHg', obs: 'Priorizar IECA/BRA na dose máxima tolerada; monitorar potássio e eTFG.' };
  if (perfil === 'drc')
    return {
      meta: '<130/80 mmHg (alvo) ou <140/90 mmHg se tolerância limitada',
      obs: 'Monitorar função renal após ajustes.',
    };
  if (perfil === 'dm')
    return { meta: '<130/80 mmHg, individualizar', obs: 'Evitar metas muito agressivas em idosos frágeis diabéticos.' };
  if (perfil === 'cv_alto')
    return { meta: '<130/80 mmHg, se bem tolerado', obs: 'Prevenção secundária — meta mais estrita quando tolerada.' };
  return {
    meta: '<140/90 mmHg (considerar <130/80 mmHg se jovem e bem tolerado)',
    obs: 'Meta padrão para a maioria dos adultos de baixo a moderado risco.',
  };
}

/** Triagem de HAS resistente a partir dos itens marcados. */
export function triagemHasResistente({ tresClasses, quatroClasses, adesao, tecnica, mapa }) {
  const criterioBase = tresClasses || quatroClasses;
  if (criterioBase && adesao && tecnica && mapa) {
    return {
      rotulo: 'Critérios compatíveis com HAS resistente',
      cls: 'risk-high',
      nota: 'Investigar causas secundárias (se ainda não feito), revisar esquema terapêutico, considerar encaminhamento para referência em hipertensão.',
    };
  }
  if (criterioBase) {
    return {
      rotulo: 'Suspeita não confirmada — checar adesão/técnica/avental branco',
      cls: 'risk-mod',
      nota: 'Antes de rotular como resistente, confirmar adesão, técnica de medida e excluir efeito do avental branco com MAPA/MRPA.',
    };
  }
  return {
    rotulo: 'Critérios de resistência não preenchidos',
    cls: 'risk-low',
    nota: 'Seguir ajuste terapêutico padrão.',
  };
}
