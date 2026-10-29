/**
 * Regras da calculadora de pré-natal: idade gestacional pela DUM, ganho de peso (MS 2022),
 * risco gestacional, exames por trimestre e TOTG (IADPSG/OMS). Funções puras.
 */
const MS_POR_DIA = 1000 * 60 * 60 * 24;

/** IG, DPP (DUM + 280 dias) e trimestre. dum e hoje são objetos Date. */
export function idadeGestacionalPelaDum(dum, hoje) {
  const diasDesdeDum = Math.round((hoje - dum) / MS_POR_DIA);
  const semanas = Math.floor(diasDesdeDum / 7);
  const dias = diasDesdeDum % 7;
  const dpp = new Date(dum);
  dpp.setDate(dpp.getDate() + 280);
  const trimestre = semanas < 14 ? '1º trimestre' : semanas < 28 ? '2º trimestre' : '3º trimestre';
  return { semanas, dias, dpp, trimestre };
}

/** Faixa de ganho de peso até o termo (kg) pelo IMC pré-gestacional (MS 2022). */
function faixaGanhoPesoGestacional(imcPre) {
  if (imcPre < 18.5) return { categoria: 'Baixo peso', faixaMin: 9.7, faixaMax: 12.2 };
  if (imcPre < 25) return { categoria: 'Eutrofia', faixaMin: 8, faixaMax: 12 };
  if (imcPre < 30) return { categoria: 'Sobrepeso', faixaMin: 7, faixaMax: 9 };
  return { categoria: 'Obesidade', faixaMin: 5, faixaMax: 7.2 };
}

/** Avalia o ganho de peso; antes de 37 semanas compara com a fração proporcional à IG. ig pode ser null. */
export function avaliarGanhoPesoGestacional(pesoPre, alturaCm, pesoAtual, ig) {
  const imcPre = pesoPre / (alturaCm / 100) ** 2;
  const ganho = pesoAtual - pesoPre;
  const { categoria, faixaMin, faixaMax } = faixaGanhoPesoGestacional(imcPre);
  let avaliacao, cls;
  if (ig !== null && ig < 37) {
    const proporcaoIg = ig / 40;
    const minEsperado = faixaMin * proporcaoIg * 0.7;
    const maxEsperado = faixaMax * proporcaoIg * 1.3;
    if (ganho < minEsperado) {
      avaliacao = 'Ganho de peso abaixo do esperado para a IG';
      cls = 'risk-mod';
    } else if (ganho > maxEsperado) {
      avaliacao = 'Ganho de peso acima do esperado para a IG';
      cls = 'risk-mod';
    } else {
      avaliacao = 'Ganho de peso dentro do esperado para a IG';
      cls = 'risk-low';
    }
  } else {
    if (ganho < faixaMin) {
      avaliacao = 'Ganho total abaixo da faixa recomendada';
      cls = 'risk-mod';
    } else if (ganho > faixaMax) {
      avaliacao = 'Ganho total acima da faixa recomendada';
      cls = 'risk-mod';
    } else {
      avaliacao = 'Ganho total dentro da faixa recomendada';
      cls = 'risk-low';
    }
  }
  return { imcPre, ganho, categoria, faixaMin, faixaMax, avaliacao, cls };
}

/** Fatores que, isoladamente, já indicam pré-natal de alto risco. */
export const FATORES_ALTO_RISCO_DIRETO = [
  'rg_has',
  'rg_cardiopatia',
  'rg_sangramento',
  'rg_crescimento',
  'rg_infeccao',
];

export function classificarRiscoGestacional(quantidadeFatores, temFatorDeAltoRiscoDireto) {
  if (quantidadeFatores === 0) return { rotulo: 'Gestação de risco habitual — seguimento na APS', cls: 'risk-low' };
  if (temFatorDeAltoRiscoDireto || quantidadeFatores >= 3)
    return { rotulo: 'Gestação de alto risco — encaminhar ao pré-natal de alto risco', cls: 'risk-high' };
  return {
    rotulo: 'Gestação de risco intermediário — acompanhamento mais próximo, considerar avaliação especializada',
    cls: 'risk-mod',
  };
}

/** Exames e condutas por trimestre (HTML exibido no resultado). */
const EXAMES_POR_TRIMESTRE = {
  1: `
          <strong>1º trimestre (até 13s6d):</strong>
          <ul>
            <li>Tipagem sanguínea/Rh, hemograma, glicemia de jejum</li>
            <li>Sífilis (VDRL/teste rápido), HIV, hepatites B e C, toxoplasmose IgG/IgM</li>
            <li>Urina tipo I e urocultura</li>
            <li>Ultrassom obstétrico precoce</li>
            <li>Vacina dTpa pode ser iniciada a partir de 20 semanas; atualizar dT se necessário; hepatite B e influenza/COVID conforme calendário vigente</li>
          </ul>`,
  2: `
          <strong>2º trimestre (14–27s6d):</strong>
          <ul>
            <li>TOTG 75g entre 24–28 semanas</li>
            <li>Repetir sífilis/HIV no início do 3º trimestre, se indicado</li>
            <li>Ultrassom morfológico (idealmente 20–24 semanas)</li>
            <li>dTpa a partir de 20 semanas (idealmente entre 27–36 semanas)</li>
            <li>Sulfato ferroso/ácido fólico conforme protocolo</li>
          </ul>`,
  3: `
          <strong>3º trimestre (≥28 semanas):</strong>
          <ul>
            <li>Repetir hemograma, sífilis e HIV próximo ao parto</li>
            <li>Cultura para Streptococcus do grupo B (35–37 semanas, se protocolo local indicar)</li>
            <li>Avaliação de crescimento fetal e bem-estar a partir de 36 semanas</li>
            <li>Confirmar dTpa e demais vacinas em dia</li>
          </ul>`,
};

export function examesDaIdadeGestacional(ig) {
  return EXAMES_POR_TRIMESTRE[ig < 14 ? 1 : ig < 28 ? 2 : 3];
}

/** TOTG 75 g: cortes 92 / 180 / 153 mg/dL; jejum ≥126 = diabetes franco. Valores podem ser null. */
export function interpretarTotg(jejum, umaHora, duasHoras) {
  const alterado =
    (jejum !== null && jejum >= 92) || (umaHora !== null && umaHora >= 180) || (duasHoras !== null && duasHoras >= 153);
  if (jejum !== null && jejum >= 126)
    return { rotulo: 'Glicemia de jejum compatível com diabetes mellitus franco na gestação', cls: 'risk-vhigh' };
  if (alterado) return { rotulo: 'Diabetes mellitus gestacional (critérios IADPSG/OMS)', cls: 'risk-high' };
  return { rotulo: 'TOTG normal para diabetes gestacional', cls: 'risk-low' };
}
