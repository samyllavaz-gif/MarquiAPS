/**
 * Regras da calculadora renal (KDIGO): classe de risco por estágio, mapa G×A,
 * critérios de encaminhamento e ajuste de metformina/dapagliflozina. Funções puras.
 * A TFG (CKD-EPI 2021) e o estágio G vêm de js/regras/renal.js.
 */
import { estagioTfg, tfgCkdEpi2021 } from '../../regras/renal.js';

const CLASSE_POR_ESTAGIO_TFG = {
  G1: 'risk-low',
  G2: 'risk-low',
  G3a: 'risk-mod',
  G3b: 'risk-high',
  G4: 'risk-vhigh',
  G5: 'risk-vhigh',
};

/** TFG arredondada, estágio G e classe de risco. */
export function estadiarFuncaoRenal(creatinina, idade, sexo) {
  const etfg = Math.round(tfgCkdEpi2021(creatinina, idade, sexo));
  const estagio = estagioTfg(etfg);
  return { etfg, estagio, cls: CLASSE_POR_ESTAGIO_TFG[estagio] };
}

/** Mapa de risco KDIGO (heat map simplificado): linhas A1–A3, colunas G1, G2, G3a, G3b, G4, G5. */
const MAPA_RISCO_KDIGO = {
  A1: ['baixo', 'baixo', 'moderado', 'alto', 'muitoalto', 'muitoalto'],
  A2: ['moderado', 'moderado', 'alto', 'muitoalto', 'muitoalto', 'muitoalto'],
  A3: ['alto', 'alto', 'muitoalto', 'muitoalto', 'muitoalto', 'muitoalto'],
};

const ROTULOS_RISCO_KDIGO = {
  baixo: ['Risco baixo', 'risk-low'],
  moderado: ['Risco moderadamente aumentado', 'risk-mod'],
  alto: ['Risco alto', 'risk-high'],
  muitoalto: ['Risco muito alto', 'risk-vhigh'],
};

const ESTAGIOS_G = ['G1', 'G2', 'G3a', 'G3b', 'G4', 'G5'];

/** Classificação combinada G×A e risco de progressão/eventos. rac = 'A1' | 'A2' | 'A3'. */
export function riscoKdigo(etfg, rac) {
  const coluna = etfg >= 90 ? 0 : etfg >= 60 ? 1 : etfg >= 45 ? 2 : etfg >= 30 ? 3 : etfg >= 15 ? 4 : 5;
  const [rotulo, cls] = ROTULOS_RISCO_KDIGO[MAPA_RISCO_KDIGO[rac][coluna]];
  return { classificacao: ESTAGIOS_G[coluna] + ' ' + rac, rotulo, cls };
}

/** Resultado da checagem de critérios de encaminhamento à nefrologia. */
export function avaliarEncaminhamentoNefrologia(quantidadeMarcados) {
  return quantidadeMarcados > 0
    ? { cls: 'risk-high', rotulo: `Critério(s) presente(s) (${quantidadeMarcados}) — encaminhar à nefrologia` }
    : { cls: 'risk-low', rotulo: 'Nenhum critério de encaminhamento identificado — manter seguimento na APS' };
}

/** Ajuste de metformina e dapagliflozina pela eTFG. */
export function ajusteRenalAntidiabeticos(etfg) {
  let metformina, cls;
  if (etfg >= 45) {
    metformina = 'Dose plena permitida';
    cls = 'risk-low';
  } else if (etfg >= 30) {
    metformina = 'Reduzir dose (até ~50%), reforçar monitoramento; reavaliar risco-benefício';
    cls = 'risk-mod';
  } else {
    metformina = 'Contraindicada (eTFG <30)';
    cls = 'risk-high';
  }

  let dapagliflozina;
  if (etfg >= 25) dapagliflozina = 'Pode iniciar/manter para controle glicêmico, proteção renal e cardiovascular';
  else if (etfg >= 15)
    dapagliflozina =
      'Pode manter se já em uso para proteção cardiorrenal (não iniciar novo uso para controle glicêmico)';
  else dapagliflozina = 'Não recomendada (eTFG <15 / diálise)';

  return { metformina, dapagliflozina, cls };
}
