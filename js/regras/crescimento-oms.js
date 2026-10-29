/**
 * Avaliação do crescimento pelas curvas da OMS (método LMS), de 0 a 5 anos.
 * Usada na consulta de puericultura e na calculadora de pediatria. Funções puras.
 */
import { TABELAS_LMS_OMS } from '../dados/oms-lms.js';
import { formatarNumero } from '../utils/texto.js';

/** Valores [L, M, S] interpolados para a idade em meses (0 a 60); null fora da faixa. */
export function valoresLmsNaIdade(indicador, sexo, meses) {
  const tabela = TABELAS_LMS_OMS[indicador][sexo];
  if (meses < 0 || meses > 60) return null;
  const i = Math.min(59, Math.floor(meses)),
    f = meses - i,
    a = tabela[i],
    b = tabela[i + 1];
  return a.map((x, k) => x + (b[k] - x) * f);
}

/** Medida correspondente a um escore-z: inversa do LMS. */
export const medidaNoEscoreZ = ([L, M, S], z) => (L === 0 ? M * Math.exp(S * z) : M * Math.pow(1 + L * S * z, 1 / L));

/**
 * Escore-z da medida X. Para peso/idade e IMC/idade, acima de |3| usa a extrapolação
 * linear recomendada pela OMS. null quando a idade está fora da faixa ou X não é positivo.
 */
export function escoreZ(indicador, sexo, meses, X) {
  const p = valoresLmsNaIdade(indicador, sexo, meses);
  if (!p || !(X > 0)) return null;
  const [L, M, S] = p;
  let z = L === 0 ? Math.log(X / M) / S : (Math.pow(X / M, L) - 1) / (L * S);
  if ((indicador === 'wfa' || indicador === 'bmifa') && Math.abs(z) > 3) {
    if (z > 3) {
      const s3 = medidaNoEscoreZ(p, 3),
        d = s3 - medidaNoEscoreZ(p, 2);
      z = 3 + (X - s3) / d;
    } else {
      const s3 = medidaNoEscoreZ(p, -3),
        d = medidaNoEscoreZ(p, -2) - s3;
      z = -3 - (s3 - X) / d;
    }
  }
  return z;
}

/** Função de distribuição normal padrão (aproximação de Abramowitz-Stegun). */
function probabilidadeNormal(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z)),
    d = 0.3989423 * Math.exp((-z * z) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

/** z com sinal: +0,52 / −1,30 */
export const formatarEscoreZ = z => (z >= 0 ? '+' : '−') + formatarNumero(Math.abs(z), 2);

/** Percentil do escore-z: P1…P99, < P1, > P99. */
export const percentilDoEscore = z => {
  const p = probabilidadeNormal(z) * 100;
  return p < 1 ? '< P1' : p > 99 ? '> P99' : 'P' + Math.round(p);
};

/** Classificação do Ministério da Saúde para cada indicador. */
export const CLASSIFICACOES_OMS = {
  wfa: z =>
    z < -3
      ? 'muito baixo peso para a idade'
      : z < -2
        ? 'baixo peso para a idade'
        : z <= 2
          ? 'peso adequado para a idade'
          : 'peso elevado para a idade',
  lhfa: z =>
    z < -3
      ? 'muito baixa estatura para a idade'
      : z < -2
        ? 'baixa estatura para a idade'
        : 'estatura adequada para a idade',
  hcfa: z =>
    z < -2
      ? 'PC abaixo de −2 escores-z (investigar)'
      : z > 2
        ? 'PC acima de +2 escores-z (investigar)'
        : 'PC adequado para a idade',
  bmifa: z =>
    z < -3
      ? 'magreza acentuada'
      : z < -2
        ? 'magreza'
        : z <= 1
          ? 'eutrofia'
          : z <= 2
            ? 'risco de sobrepeso'
            : z <= 3
              ? 'sobrepeso'
              : 'obesidade',
};

/** Mediana de peso para a idade (média entre meninos e meninas), em kg; null fora de 0–60 meses. */
export function medianaDePesoParaIdade(meses) {
  if (meses == null || meses < 0 || meses > 60) return null;
  const a = valoresLmsNaIdade('wfa', 'M', meses),
    b = valoresLmsNaIdade('wfa', 'F', meses);
  return (a[1] + b[1]) / 2;
}

/** Indicadores avaliados: [código, rótulo]. */
const INDICADORES_CALCULADORA_OMS = [
  ['wfa', 'Peso/idade'],
  ['lhfa', 'Comprimento/idade'],
  ['hcfa', 'PC/idade'],
  ['bmifa', 'IMC/idade'],
];

/**
 * Avaliação de uma medida isolada nas curvas da OMS (calculadora de pediatria).
 * @param {object} d sexo ('M'|'F'), nascimento (Date|null), idadeMeses, igSemanas, peso (kg ou g), comprimento (cm), pc (cm), hoje (Date)
 * @returns {{erro:string}|{nota:string}|{dias:number, idadeUsada:number, meses:number, corrigida:boolean, notaPrematuro:string,
 *   medidas:Array<{indicador,rotulo,valor,medida,z}>, gravidade:0|1|2}}
 */
export function avaliarMedidasOms(d) {
  const { sexo, nascimento, idadeMeses, igSemanas } = d;
  let peso = d.peso;
  if (peso > 200) peso /= 1000;
  const comprimento = d.comprimento,
    pc = d.pc;
  if (!sexo) return { erro: 'Selecione o sexo da criança.' };
  const hoje = new Date(d.hoje);
  hoje.setHours(0, 0, 0, 0);
  const dias = nascimento
    ? Math.round((hoje.getTime() - nascimento.getTime()) / 864e5)
    : isFinite(idadeMeses)
      ? idadeMeses * 30.4375
      : NaN;
  if (!(dias >= 0)) return { erro: 'Informe a data de nascimento ou a idade em meses.' };
  const ig = isFinite(igSemanas) ? Math.round(igSemanas * 7) : null,
    prematuro = ig != null && ig < 259;
  let idadeUsada = dias,
    corrigida = false,
    notaPrematuro = '';
  if (prematuro) {
    const c = dias - (280 - ig);
    if (dias < 730) {
      if (c < 0)
        return {
          nota: `Idade corrigida ainda antes do termo (${Math.round(-c / 7)} semanas para 40 semanas). Usar as curvas Intergrowth-21st até 64 semanas de idade pós-concepcional.`,
        };
      idadeUsada = c;
      corrigida = true;
    } else notaPrematuro = 'Prematuro com mais de 2 anos: usar idade cronológica.';
  }
  const meses = idadeUsada / 30.4375;
  if (meses > 60)
    return {
      nota: 'As curvas desta calculadora vão até 5 anos. Acima disso, use as curvas OMS 2007 (5 a 19 anos) na Caderneta.',
    };
  const imc = peso > 0 && comprimento > 0 ? peso / Math.pow(comprimento / 100, 2) : null;
  const valores = {
    wfa: peso > 0 ? peso : null,
    lhfa: comprimento > 0 ? comprimento : null,
    hcfa: pc > 0 ? pc : null,
    bmifa: imc || null,
  };
  const medidas = INDICADORES_CALCULADORA_OMS.filter(([k]) => valores[k]).map(([k, rotulo]) => ({
    indicador: k,
    rotulo,
    medida: valores[k],
    z: escoreZ(k, sexo, meses, valores[k]),
  }));
  if (!medidas.length) return { erro: 'Informe ao menos peso, comprimento ou PC.' };
  let gravidade = 0;
  medidas.forEach(({ indicador, z }) => {
    if (z == null) return;
    const az = Math.abs(z);
    if (indicador === 'lhfa' ? z < -2 : az > 2) gravidade = Math.max(gravidade, az > 3 ? 2 : 1);
    if (indicador === 'bmifa' && z > 1 && z <= 2) gravidade = Math.max(gravidade, 1);
  });
  return { dias, idadeUsada, meses, corrigida, notaPrematuro, medidas, gravidade, peso };
}
