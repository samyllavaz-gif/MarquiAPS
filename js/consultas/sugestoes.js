/** Atalhos para ferramentas existentes. A categoria organiza a lista, sem indicar aplicação automática. */
export const FERRAMENTAS = {
  cardiovascular: { nome: 'PREVENT e risco cardiovascular', detalhe: 'Risco e metas cardiovasculares', modulo: 'cv', resultado: 'cv_result', local: '[data-tab="rcv"]', tiposLocais: ['hiperdia'] },
  renal: { nome: 'TFG · CKD-EPI e KDIGO', detalhe: 'Função renal e classificação por TFG/albuminúria', modulo: 'drc', resultado: 'drc_result', local: '[data-tab="tfg"]', tiposLocais: ['hiperdia'] },
  findrisc: { nome: 'FINDRISC', detalhe: 'Questionário de risco de diabetes tipo 2', local: '[data-tab="fr"]', tiposLocais: ['hiperdia'] },
  diabetes: { nome: 'Calculadoras de diabetes', detalhe: 'IMC, metas e ferramentas do módulo de diabetes', modulo: 'dm', resultado: 'dm_result' },
  phq9: { nome: 'PHQ-9', detalhe: 'Questionário de sintomas depressivos', modulo: 'mental', resultado: 'phq9_result', local: '[data-scoreid="phq9"]', tiposLocais: ['mental'] },
  gad7: { nome: 'GAD-7', detalhe: 'Questionário de sintomas ansiosos', modulo: 'mental', resultado: 'gad7_result', local: '[data-scoreid="gad7"]', tiposLocais: ['mental'] },
  auditc: { nome: 'AUDIT-C', detalhe: 'Questionário sobre consumo de álcool', modulo: 'mental', resultado: 'auditc_result', local: '[data-scoreid="mental_auditc"], [data-scoreid="homem_auditc"]', tiposLocais: ['mental', 'homem'] },
  phq2: { nome: 'PHQ-2', detalhe: 'Questionário breve de sintomas depressivos', local: '[data-scoreid="phq2"]', tiposLocais: ['puerperal'] },
  ig: { nome: 'Idade gestacional e DPP', detalhe: 'Datas e cálculo da idade gestacional', modulo: 'prenatal', resultado: 'pn_result', local: '[data-calc="ig"]', tiposLocais: ['prenatal'] },
  ganho: { nome: 'Ganho de peso gestacional', detalhe: 'Registro e avaliação do peso na gestação', modulo: 'prenatal', resultado: 'peso_result', local: '[data-calc="ganho"]', tiposLocais: ['prenatal'] },
  totg: { nome: 'TOTG na gestação', detalhe: 'Ferramenta de interpretação dos valores do exame', modulo: 'prenatal', resultado: 'totg_result' },
  crescimento: { nome: 'Crescimento · curvas da OMS', detalhe: 'Medidas, escores-z e percentis', modulo: 'ped', resultado: 'ped_imc_result', local: '[data-growth]', tiposLocais: ['puericultura'] },
  dose: { nome: 'Dose pediátrica', detalhe: 'Cálculo com peso, medicamento e apresentação', modulo: 'dose', resultado: 'dz_result' },
  desenvolvimento: { nome: 'Marcos do desenvolvimento', detalhe: 'Roteiro de registro dos marcos', modulo: 'ped', resultado: 'marcos_result', local: '[data-marcos]', tiposLocais: ['puericultura'] },
  ipss: { nome: 'IPSS', detalhe: 'Questionário de sintomas urinários', local: '[data-scoreid="ipss"]', tiposLocais: ['homem'] },
  rastreios: { nome: 'Painel de rastreamentos', detalhe: 'Ferramenta já disponível no roteiro de saúde da mulher', local: '[data-calc="rastreio"]', tiposLocais: ['mulher'] },
  acr: { nome: 'ACR/EULAR 2010', detalhe: 'Critérios de classificação da artrite reumatoide; confira os pré-requisitos do roteiro', local: '[data-calc="acr"]', tiposLocais: ['reumato'] },
  lombalgia: { nome: 'Sinais de alerta · lombalgia', detalhe: 'Checklist disponível no módulo de dor', modulo: 'dor', resultado: 'rf_result' },
  respiratorio: { nome: 'mMRC, CAT e ACT', detalhe: 'Questionários disponíveis no módulo respiratório', modulo: 'resp', resultado: 'mmrc_result' },
};
export const POR_CATEGORIA = {
  queixas: ['respiratorio', 'lombalgia'],
  hiperdia: ['cardiovascular', 'renal', 'findrisc', 'diabetes'],
  mulher: ['rastreios'],
  prenatal: ['ig', 'ganho', 'totg'],
  puerperal: ['phq2'],
  puericultura: ['crescimento', 'desenvolvimento', 'dose'],
  homem: ['ipss', 'auditc'],
  mental: ['phq9', 'gad7', 'auditc'],
  reumato: ['acr', 'lombalgia'],
  ortopedia: ['lombalgia'],
};
export function selecionarSugestoes(tipos) {
  const lista = new Map();
  for (const tipo of tipos) for (const id of POR_CATEGORIA[tipo] || []) {
    if (!lista.has(id)) {
      const f = FERRAMENTAS[id];
      const naConsulta = !!f.local && f.tiposLocais.some(t => tipos.includes(t));
      lista.set(id, { id, ...f, naConsulta, categorias: [], href: f.modulo ? `calculadoras.html#${f.modulo}/${f.resultado}` : null });
    }
    lista.get(id).categorias.push(tipo);
  }
  return [...lista.values()].sort((a, b) => Number(b.naConsulta) - Number(a.naConsulta));
}
