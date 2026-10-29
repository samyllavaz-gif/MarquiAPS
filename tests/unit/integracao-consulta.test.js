import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapearDados, envioValido, resultadoRepetido, PRAZO } from '../../js/integracoes/consulta-calculadoras.js';

test('reaproveita medidas com vírgula e converte metros para centímetros explicitamente', () => {
  const r = mapearDados({ base: { t: { 'sv-peso': '72,5', 'sv-alt': '1,65', 'hd-idade': '58', 'hd-cr': '0,9', 'sv-pa': '120/80' }, state: { hd: { sexo: 'F', tab: '0' } } } });
  assert.equal(r.dm_peso, '72.5');
  assert.equal(r.dm_altura, '165');
  assert.equal(r.drc_idade, '58');
  assert.equal(r.drc_creat, '0.9');
  assert.equal(r.cv_pas, '120');
  assert.equal(r.cv_tab, '0');
  assert.equal(r.cv_dm, undefined, 'ausência de registro não vira resposta negativa');
  assert.equal(r.classGA_rac, undefined, 'RAC numérica não preenche seleção de categoria');
});
test('valores ausentes, inválidos e altura em unidade incompatível não são inferidos', () => {
  const r = mapearDados({ base: { t: { 'hd-idade': 'não sei', 'sv-peso': '', 'sv-alt': '165', 'hd-cr': '-1' } } });
  assert.equal(r.drc_idade, undefined);
  assert.equal(r.dm_altura, undefined);
  assert.equal(r.drc_creat, undefined);
  assert.deepEqual(mapearDados(), {});
});
test('DUM divergente ou impossível não é enviada', () => {
  assert.equal(mapearDados({ modulos: { dt: { dum: '01/08/2026' } } }).pn_dum, '2026-08-01');
  assert.equal(mapearDados({ modulos: { dt: { dum: '31/02/2026' } } }).pn_dum, undefined);
  assert.equal(mapearDados({ modulos: { dt: { dum: '01/08/2026' }, menst: { dum: '02/08/2026' } } }).pn_dum, undefined);
});
test('vínculo não vale para outra consulta, após o prazo ou com data futura', () => {
  const e = { idConsulta: 'consulta-1', criado: 1000 };
  assert.ok(envioValido(e, 'consulta-1', 2000));
  assert.ok(!envioValido(e, 'consulta-2', 2000));
  assert.ok(!envioValido(e, 'consulta-1', 1000 + PRAZO));
  assert.ok(!envioValido(e, 'consulta-1', 999));
  assert.ok(!envioValido(null, 'consulta-1', 2000));
});
test('resultado idêntico não duplica; mudança de dados ou bloco exige nova revisão', () => {
  const r = { ferramenta: 'drc_result', texto: 'TFG 90.', dados: 'idade: 58', bloco: 'A' };
  assert.ok(resultadoRepetido([r], { ...r, texto: ' TFG 90. ' }));
  assert.ok(!resultadoRepetido([r], { ...r, dados: 'idade: 59' }));
  assert.ok(!resultadoRepetido([r], { ...r, bloco: 'O' }));
});
