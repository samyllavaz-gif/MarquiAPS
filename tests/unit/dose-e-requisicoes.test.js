import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularDosePediatrica } from '../../js/regras/dose-pediatrica/calculo.js';
import { MEDICAMENTOS_PEDIATRICOS } from '../../js/regras/dose-pediatrica/medicamentos.js';
import { codigoSigtapValido, formatarCodigoSigtap } from '../../js/requisicoes/apac/regras.js';
import { formatarCpf } from '../../js/requisicoes/densitometria/regras.js';
import { avisoIdadeMamografia, avisoIdadeCitopatologico } from '../../js/requisicoes/mamografia/regras.js';
import { avaliarRiscoGravidez, dataRetiradaPrevista } from '../../js/implante/regras.js';

test('Dose pediátrica: paracetamol 10 mg/kg em gotas 200 mg/mL (1 gota/kg)', () => {
  const r = calcularDosePediatrica('paracetamol', 'f', 'g', { kg: 12, mo: 27 });
  assert.equal(r.doses[0].mg, 120);
  assert.equal(r.doses[0].c.tx, '12 gotas');
  assert.match(r.rx, /^Paracetamol 200 mg\/mL gotas — dar 12 gotas por via oral de 6\/6 horas/);
  const adulto = calcularDosePediatrica('paracetamol', 'f', 'g', { kg: 80, mo: 180 });
  assert.ok(adulto.doses[0].mg <= 750, 'respeita a dose máxima');
});

test('Dose pediátrica: toda combinação produz resultado sem exceção', () => {
  for (const kg of [3, 12, 30, 60]) {
    for (const m of MEDICAMENTOS_PEDIATRICOS) {
      for (const ind of m.ind) {
        for (const ap of m.ap) {
          const r = calcularDosePediatrica(m.id, ind.id, ap.id, { kg, mo: kg * 3 });
          assert.ok(r && Array.isArray(r.doses), `${m.id}/${ind.id}/${ap.id} @ ${kg} kg`);
          r.doses.forEach(d => assert.ok(!(d.mg < 0) && !Number.isNaN(d.mg), `${m.id} dose inválida`));
        }
      }
    }
  }
});

test('APAC: dígito verificador SIGTAP (módulo 11)', () => {
  assert.equal(codigoSigtapValido('0206010079'), true);
  assert.equal(codigoSigtapValido('0206010070'), false);
  assert.equal(codigoSigtapValido('020601007'), false);
  assert.equal(formatarCodigoSigtap('0206010079'), '02.06.01.007-9');
  assert.equal(formatarCpf('12345678901'), '123.456.789-01');
});

test('SISCAN: avisos de idade fora da população-alvo', () => {
  assert.equal(avisoIdadeMamografia('55', true), '');
  assert.match(avisoIdadeMamografia('45', true), /50 a 69 anos/);
  assert.equal(avisoIdadeMamografia('45', false), '', 'só para rastreamento');
  assert.match(avisoIdadeCitopatologico('70', true), /25 a 64 anos/);
});

test('Implante: risco de gravidez e data de retirada (3 anos)', () => {
  assert.equal(avaliarRiscoGravidez({ testeFeito: 'sim', resultado: 'positivo' }).nivel, 'danger');
  assert.equal(dataRetiradaPrevista('2026-10-14'), '2029-10-14');
  assert.equal(dataRetiradaPrevista(''), '');
});
