import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tfgCkdEpi2021, estagioTfg, categoriaAlbuminuria } from '../../js/regras/renal.js';
import { calcularPrevent } from '../../js/regras/cardiovascular.js';

test('CKD-EPI 2021: valores de referência', () => {
  // Creatinina igual ao valor de corte (0,7 F / 0,9 M) aos 40 anos: 142 × 0,9938^40 (× 1,012 se F)
  assert.ok(Math.abs(tfgCkdEpi2021(0.9, 40, 'M') - 142 * 0.9938 ** 40) < 1e-9);
  assert.ok(Math.abs(tfgCkdEpi2021(0.7, 40, 'F') - 142 * 0.9938 ** 40 * 1.012) < 1e-9);
  // Exemplo clínico: mulher, 50 anos, creatinina 1,0 → ~69 mL/min/1,73 m²
  assert.equal(Math.round(tfgCkdEpi2021(1.0, 50, 'F')), 69);
  // TFG cai com a idade e com a creatinina
  assert.ok(tfgCkdEpi2021(1.2, 70, 'M') < tfgCkdEpi2021(1.2, 50, 'M'));
  assert.ok(tfgCkdEpi2021(2.0, 50, 'M') < tfgCkdEpi2021(1.0, 50, 'M'));
});

test('estágios KDIGO de TFG e albuminúria', () => {
  assert.deepEqual([90, 89, 60, 59, 45, 44, 30, 29, 15, 14].map(estagioTfg), [
    'G1',
    'G2',
    'G2',
    'G3a',
    'G3a',
    'G3b',
    'G3b',
    'G4',
    'G4',
    'G5',
  ]);
  assert.equal(estagioTfg(NaN), '');
  assert.equal(categoriaAlbuminuria(29), 'A1');
  assert.equal(categoriaAlbuminuria(30), 'A2');
  assert.equal(categoriaAlbuminuria(300), 'A2');
  assert.equal(categoriaAlbuminuria(301), 'A3');
  assert.equal(categoriaAlbuminuria(NaN), null);
});

const BASE = {
  sx: 'F',
  age: 60,
  tc: 220,
  hdl: 45,
  sbp: 145,
  bmi: 29,
  egfr: 80,
  dm: '0',
  smk: '1',
  bptx: '1',
  st: '0',
  eventoPrevio: false,
};

test('PREVENT: campos faltando, fora da faixa e evento prévio', () => {
  assert.deepEqual(calcularPrevent({ ...BASE, eventoPrevio: true }), { dcv: true });
  assert.ok(calcularPrevent({ ...BASE, hdl: NaN }).miss.includes('HDL'));
  assert.ok(calcularPrevent({ ...BASE, age: 82 }).out[0].startsWith('Idade fora da faixa validada'));
});

test('PREVENT: risco plausível, monotônico e categorizado', () => {
  const r = calcularPrevent(BASE);
  for (const k of ['cvd', 'ascvd', 'hf']) assert.ok(r[k] > 0 && r[k] < 100, k);
  assert.ok(r.cvd >= r.ascvd, 'DCV total inclui a aterosclerótica');
  assert.ok(calcularPrevent({ ...BASE, sbp: 170 }).cvd > r.cvd, 'PAS maior → risco maior');
  assert.ok(calcularPrevent({ ...BASE, smk: '0' }).cvd < r.cvd, 'sem tabagismo → risco menor');
  assert.ok(calcularPrevent({ ...BASE, dm: '1' }).cvd > r.cvd, 'diabetes → risco maior');
  const cat = calcularPrevent(BASE).cat[0];
  assert.equal(cat, r.ascvd < 5 ? 'Baixo' : r.ascvd < 20 ? 'Intermediário' : 'Alto');
  assert.equal(calcularPrevent({ ...BASE, bmi: 45 }).hf, null);
});
