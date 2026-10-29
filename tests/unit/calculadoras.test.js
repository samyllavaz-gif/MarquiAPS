import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  classificarPressao,
  classificarCriseHipertensiva,
  metaPressorica,
  triagemHasResistente,
} from '../../js/calculadoras/regras/hipertensao.js';
import {
  calcularImc,
  classificarImcAdulto,
  avaliarControleGlicemico,
  titularNph,
  classificarHipoglicemia,
  rastreiosPendentesDiabetes,
} from '../../js/calculadoras/regras/diabetes.js';
import { estadiarFuncaoRenal, riscoKdigo, ajusteRenalAntidiabeticos } from '../../js/calculadoras/regras/renal.js';
import {
  classificarKatz,
  classificarLawton,
  classificarRiscoQueda,
  classificarPolifarmacia,
  classificarFragilidade,
} from '../../js/calculadoras/regras/idoso.js';
import {
  classificarPhq9,
  classificarGad7,
  classificarAuditC,
  classificarRiscoSuicida,
} from '../../js/calculadoras/regras/saude-mental.js';
import { classificarCat, classificarAct, classificarCriseAsma } from '../../js/calculadoras/regras/respiratorio.js';
import {
  idadeGestacionalPelaDum,
  avaliarGanhoPesoGestacional,
  classificarRiscoGestacional,
  interpretarTotg,
} from '../../js/calculadoras/regras/pre-natal.js';
import { interpretarChadsVasc, interpretarHasBled } from '../../js/calculadoras/regras/anticoagulacao.js';
import { avaliarRedFlags } from '../../js/calculadoras/regras/dor.js';
import { classificarDesidratacao, marcosParaIdade, vacinasParaIdade } from '../../js/calculadoras/regras/pediatria.js';

test('Hipertensão: estadiamento pela maior categoria entre PAS e PAD', () => {
  assert.match(classificarPressao(120, 80).estagio, /ótima/);
  assert.match(classificarPressao(121, 70).estagio, /Limítrofe/);
  assert.match(classificarPressao(135, 70).estagio, /Pré-hipertensão/);
  assert.match(classificarPressao(120, 90).estagio, /Estágio 1/);
  assert.match(classificarPressao(165, 80).estagio, /Estágio 2/);
  assert.match(classificarPressao(150, 110).estagio, /Estágio 3/);
  assert.equal(classificarCriseHipertensiva(190, 100, true).rotulo, 'Emergência hipertensiva');
  assert.equal(classificarCriseHipertensiva(190, 100, false).rotulo, 'Urgência hipertensiva');
  assert.equal(classificarCriseHipertensiva(170, 100, true).cls, 'risk-mod');
  assert.match(metaPressorica(82, 'dm').meta, /<150\/90/, 'idade ≥80 prevalece');
  assert.equal(metaPressorica(null, 'drc_album').meta, '<130/80 mmHg');
  const base = { tresClasses: true, quatroClasses: false, adesao: true, tecnica: true, mapa: true };
  assert.equal(triagemHasResistente(base).cls, 'risk-high');
  assert.equal(triagemHasResistente({ ...base, mapa: false }).cls, 'risk-mod');
  assert.equal(triagemHasResistente({ ...base, tresClasses: false }).cls, 'risk-low');
});

test('Diabetes: IMC, meta de HbA1c, NPH e hipoglicemia', () => {
  assert.ok(Math.abs(calcularImc(70, 170) - 24.22) < 0.01);
  assert.deepEqual([18.4, 24.9, 29.9, 34.9, 39.9, 40].map(classificarImcAdulto), [
    'Baixo peso',
    'Eutrófico',
    'Sobrepeso',
    'Obesidade I',
    'Obesidade II',
    'Obesidade III',
  ]);
  assert.equal(avaliarControleGlicemico(7, false).cls, 'risk-low');
  assert.equal(avaliarControleGlicemico(7.5, false).cls, 'risk-mod');
  assert.equal(avaliarControleGlicemico(7.5, true).cls, 'risk-low', 'meta 8% no idoso frágil');
  assert.equal(avaliarControleGlicemico(null, false).texto, 'Não informada');
  assert.equal(titularNph(20, 200, false).novaDose, 24);
  assert.equal(titularNph(20, 140, false).novaDose, 22);
  assert.equal(titularNph(20, 100, false).novaDose, 20);
  assert.equal(titularNph(20, 60, false).novaDose, 18);
  assert.equal(titularNph(20, 200, true).novaDose, 16, 'hipoglicemia reduz mesmo com jejum alto');
  assert.equal(titularNph(8, 100, true).novaDose, 6);
  assert.equal(classificarHipoglicemia(50, false).emergencia, true);
  assert.equal(classificarHipoglicemia(50, true).cls, 'risk-high');
  assert.equal(classificarHipoglicemia(60, true).cls, 'risk-mod');
  assert.equal(classificarHipoglicemia(70, false).cls, 'risk-low');
  assert.deepEqual(rastreiosPendentesDiabetes({ pe: true, renal: false, retina: true }).pendentes, [
    'Função renal / albuminúria',
  ]);
});

test('Renal: estadiamento, mapa KDIGO e ajuste de antidiabéticos', () => {
  const r = estadiarFuncaoRenal(1.0, 50, 'F');
  assert.deepEqual(r, { etfg: 69, estagio: 'G2', cls: 'risk-low' });
  assert.deepEqual(riscoKdigo(50, 'A2'), { classificacao: 'G3a A2', rotulo: 'Risco alto', cls: 'risk-high' });
  assert.equal(riscoKdigo(95, 'A1').rotulo, 'Risco baixo');
  assert.equal(riscoKdigo(10, 'A1').rotulo, 'Risco muito alto');
  assert.equal(ajusteRenalAntidiabeticos(40).cls, 'risk-mod');
  assert.match(ajusteRenalAntidiabeticos(28).metformina, /Contraindicada/);
  assert.match(ajusteRenalAntidiabeticos(20).dapagliflozina, /Pode manter/);
});

test('Pessoa idosa', () => {
  assert.equal(classificarKatz(6).cls, 'risk-low');
  assert.equal(classificarKatz(1).cls, 'risk-vhigh');
  assert.equal(classificarLawton(21).cls, 'risk-low');
  assert.equal(classificarLawton(10).cls, 'risk-vhigh');
  assert.equal(classificarRiscoQueda(0, true).rotulo, 'Alto risco de queda');
  assert.equal(classificarRiscoQueda(1, false).cls, 'risk-mod');
  assert.equal(classificarPolifarmacia(3, 2).cls, 'risk-high', 'fatores adicionais elevam o risco');
  assert.equal(classificarPolifarmacia(10, 0).cls, 'risk-vhigh');
  assert.equal(classificarFragilidade(3).rotulo, 'Frágil (≥3 critérios)');
});

test('Saúde mental', () => {
  assert.deepEqual(
    [4, 9, 14, 15].map(t => classificarPhq9(t).rotulo),
    ['Mínimo', 'Leve', 'Moderado', 'Grave'],
  );
  assert.equal(classificarGad7(10).rotulo, 'Moderada');
  assert.equal(classificarAuditC(6).cls, 'risk-high');
  const sem = { ideacao: false, plano: false, meios: false, tentativaPrevia: false, intencao: false };
  assert.equal(classificarRiscoSuicida(sem).alerta, false);
  assert.equal(classificarRiscoSuicida({ ...sem, plano: true, meios: true, intencao: true }).cls, 'risk-vhigh');
  assert.equal(classificarRiscoSuicida({ ...sem, ideacao: true, tentativaPrevia: true }).cls, 'risk-high');
  assert.equal(classificarRiscoSuicida({ ...sem, ideacao: true }).alerta, true);
});

test('Respiratório', () => {
  assert.equal(classificarCat(9).cls, 'risk-low');
  assert.equal(classificarCat(30).cls, 'risk-vhigh');
  assert.equal(classificarAct(19).cls, 'risk-high');
  const nenhum = {
    cianose: false,
    silencioPulmonar: false,
    alteracaoConsciencia: false,
    exaustao: false,
    falaEntrecortada: false,
    tiragem: false,
  };
  assert.equal(classificarCriseAsma(nenhum, 89, null).grave, true);
  assert.equal(classificarCriseAsma(nenhum, 93, null).cls, 'risk-high');
  assert.equal(classificarCriseAsma(nenhum, null, 31).cls, 'risk-high');
  assert.equal(classificarCriseAsma(nenhum, 97, 20).cls, 'risk-mod');
});

test('Pré-natal', () => {
  const ig = idadeGestacionalPelaDum(new Date(2026, 0, 1), new Date(2026, 2, 5));
  assert.deepEqual([ig.semanas, ig.dias, ig.trimestre], [9, 0, '1º trimestre']);
  assert.equal(ig.dpp.toDateString(), new Date(2026, 9, 8).toDateString());
  const peso = avaliarGanhoPesoGestacional(60, 160, 70, 40);
  assert.equal(peso.categoria, 'Eutrofia');
  assert.equal(peso.avaliacao, 'Ganho total dentro da faixa recomendada');
  assert.equal(avaliarGanhoPesoGestacional(60, 160, 75, 40).avaliacao, 'Ganho total acima da faixa recomendada');
  assert.equal(classificarRiscoGestacional(1, true).cls, 'risk-high');
  assert.equal(classificarRiscoGestacional(1, false).cls, 'risk-mod');
  assert.equal(interpretarTotg(92, null, null).cls, 'risk-high');
  assert.equal(interpretarTotg(91, 179, 152).cls, 'risk-low');
  assert.equal(interpretarTotg(126, null, null).cls, 'risk-vhigh');
});

test('Anticoagulação, dor e pediatria', () => {
  assert.equal(interpretarChadsVasc(0).cls, 'risk-low');
  assert.equal(interpretarChadsVasc(2).cls, 'risk-high');
  assert.equal(interpretarHasBled(3).cls, 'risk-high');
  assert.equal(avaliarRedFlags(2, false).rotulo, '2 red flag(s) presente(s) — investigar.');
  assert.equal(avaliarRedFlags(1, true).cls, 'risk-vhigh');
  const nada = {
    consciencia: false,
    olhosFundos: false,
    bebeMal: false,
    sinalDaPrega: false,
    sede: false,
    irritado: false,
  };
  assert.match(classificarDesidratacao(nada).plano, /^Plano A/);
  assert.match(classificarDesidratacao({ ...nada, sede: true }).plano, /^Plano B/);
  assert.match(classificarDesidratacao({ ...nada, olhosFundos: true }).plano, /^Plano C/);
  assert.equal(marcosParaIdade(0).faixa, '0–1 mês');
  assert.equal(marcosParaIdade(12).faixa, '10–12 meses');
  assert.equal(marcosParaIdade(48).faixa, '>36 meses');
  assert.match(vacinasParaIdade(9), /^9 meses: Febre amarela/);
  assert.match(vacinasParaIdade(60), /^A partir de 4 anos/);
});
