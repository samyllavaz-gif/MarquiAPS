import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularFindrisc } from '../../js/regras/findrisc.js';
import { grupoDengue, volumeHidratacaoOral, diaDeDoenca } from '../../js/regras/dengue.js';
import { classificarPeDiabetico } from '../../js/regras/pe-diabetico.js';
import { escoreZ } from '../../js/regras/crescimento-oms.js';

test('FINDRISC: pontuação e faixas de risco', () => {
  const baixo = {
    idade: 30,
    imc: 22,
    cintura: 70,
    sexo: 'F',
    diabetes: '0',
    antiHipertensivo: '0',
    ativ: '1',
    frutas: '1',
    glic: '0',
    fam: '0',
  };
  assert.deepEqual(calcularFindrisc(baixo), { p: 0, c: ['Baixo', 'cerca de 1 em 100', 'k-ok'] });
  // 4 (≥65) + 3 (IMC>30) + 4 (cintura F>88) + 2 + 1 + 2 + 5 + 5 = 26
  const alto = {
    idade: 70,
    imc: 32,
    cintura: 95,
    sexo: 'F',
    diabetes: '0',
    antiHipertensivo: '1',
    ativ: '0',
    frutas: '0',
    glic: '1',
    fam: '5',
  };
  assert.equal(calcularFindrisc(alto).p, 26);
  assert.equal(calcularFindrisc(alto).c[0], 'Muito alto');
  assert.deepEqual(calcularFindrisc({ diabetes: '1' }), { dm: true });
  assert.ok(calcularFindrisc({ ...baixo, idade: NaN }).miss.includes('idade'));
});

test('Dengue: grupos A a D', () => {
  const ficha = { alarme: ['Nenhum'], choque: ['Nenhum'], sint: {}, gest: 'nao', prev: ['Nenhuma'], esp: [] };
  assert.equal(grupoDengue(ficha).gr, 'A');
  assert.equal(grupoDengue({ ...ficha, sint: { Petéquias: '+' } }).gr, 'B');
  assert.equal(grupoDengue({ ...ficha, gest: 'sim' }).gr, 'B');
  assert.equal(grupoDengue({ ...ficha, alarme: ['Dor abdominal intensa'] }).gr, 'C');
  assert.equal(grupoDengue({ ...ficha, choque: ['Hipotensão'] }).gr, 'D');
  assert.equal(grupoDengue({ ...ficha, alarme: [] }).miss, true);
  // Sinal respiratório isolado não define grupo C
  assert.equal(grupoDengue({ ...ficha, alarme: ['Saturação < 94%'] }).gr, 'A');
  assert.equal(volumeHidratacaoOral(70), '4200');
  assert.equal(volumeHidratacaoOral(0), '');
  assert.equal(diaDeDoenca('12/10/2026', new Date(2026, 9, 14)), 3);
  assert.equal(diaDeDoenca('31/02', new Date(2026, 9, 14)), null);
});

test('Pé diabético: categorias 0 a 3 (MS 2016)', () => {
  const normal = { mono: 'n', diap: 'n', refl: 'n', dor: 'n', pulso: 'n' };
  const hist = { ulcprev: '0', amput: '0', deform: '0', ulcativa: '0' };
  assert.equal(classificarPeDiabetico({ d: normal, e: normal }, hist).cat, 0);
  assert.equal(classificarPeDiabetico({ d: { ...normal, mono: 'a' }, e: normal }, hist).cat, 1);
  assert.equal(classificarPeDiabetico({ d: { ...normal, diap: 'a', refl: 'a' }, e: normal }, hist).cat, 1);
  assert.equal(
    classificarPeDiabetico({ d: { ...normal, diap: 'a' }, e: normal }, hist).cat,
    0,
    'um teste isolado não basta',
  );
  assert.equal(classificarPeDiabetico({ d: { ...normal, pulso: 'a' }, e: normal }, hist).cat, 2);
  assert.equal(classificarPeDiabetico({ d: normal, e: normal }, { ...hist, amput: '1' }).cat, 3);
  assert.equal(classificarPeDiabetico({ d: { mono: '' }, e: normal }, hist).miss, true);
});

test('Curvas da OMS: medianas aos 6 meses (meninos) têm escore z ≈ 0', () => {
  assert.ok(Math.abs(escoreZ('wfa', 'M', 6, 7.9)) < 0.05);
  assert.ok(Math.abs(escoreZ('lhfa', 'M', 6, 67.6)) < 0.05);
  assert.ok(escoreZ('wfa', 'M', 6, 6.0) < -2, '6 kg aos 6 meses: abaixo de −2');
});
