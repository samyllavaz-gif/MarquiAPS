import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registrarRevisao, resolverRevisao, OBJETIVOS } from '../../js/consultas/revisao.js';
import { mesmoRelato } from '../../js/consultas/texto-inteligente.js';
const fonte = { S: 'História original.', O: 'Exame registrado.', A: '', P: '' };

test('revisão aplica alterações manuais sem modificar os campos de origem', () => {
  const antes = { ...fonte };
  const revisoes = registrarRevisao(fonte, { ...fonte, S: 'História revisada.' });
  assert.equal(resolverRevisao(fonte, revisoes).texto.S, 'História revisada.');
  assert.deepEqual(fonte, antes);
  assert.deepEqual(Object.keys(revisoes), ['S']);
});
test('mudança na origem invalida apenas a revisão do bloco alterado e preserva a edição anterior', () => {
  const revisoes = registrarRevisao(fonte, { ...fonte, S: 'Revisão S.', O: 'Revisão O.' });
  const atual = { ...fonte, S: 'Nova história.' };
  const r = resolverRevisao(atual, revisoes);
  assert.equal(r.texto.S, 'Nova história.');
  assert.equal(r.texto.O, 'Revisão O.');
  assert.deepEqual(r.desatualizados, ['S']);
  assert.equal(revisoes.S.texto, 'Revisão S.');
});
test('restaurar texto automático e remover um bloco na revisão são operações distintas', () => {
  assert.deepEqual(resolverRevisao(fonte).texto, fonte);
  const revisoes = registrarRevisao(fonte, { ...fonte, S: '' });
  assert.equal(resolverRevisao(fonte, revisoes).texto.S, '');
});
test('rascunhos sem revisão e valores inválidos preservam o texto gerado', () => {
  assert.deepEqual(resolverRevisao(fonte, { S: null, O: { texto: 123 } }).texto, fonte);
  assert.deepEqual(Object.keys(OBJETIVOS), ['queixa', 'acompanhamento', 'prevencao']);
});
test('história não duplica motivo idêntico, mas preserva complementos e relatos diferentes', () => {
  assert.ok(mesmoRelato('Tosse há 3 dias.', ' tosse há 3 dias '));
  assert.ok(!mesmoRelato('Tosse há 3 dias.', 'Tosse há 3 dias, com febre.'));
  assert.ok(!mesmoRelato('', ''));
  assert.ok(!mesmoRelato('Nega febre.', 'Refere febre.'));
});
