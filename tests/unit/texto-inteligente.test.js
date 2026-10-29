import { test } from 'node:test';
import assert from 'node:assert/strict';
import { unirTextoSOAP, inserirTrechoUnico } from '../../js/consultas/texto-inteligente.js';

test('SOAP remove somente linhas completas repetidas, mantendo relatos diferentes', () => {
  assert.equal(unirTextoSOAP('HDA: Tosse.\nNega febre.', 'Nega febre.\nRefere febre ontem.'), 'HDA: Tosse.\nNega febre.\nRefere febre ontem.');
  assert.equal(unirTextoSOAP('HAS.', '  HAS.  '), 'HAS.');
});
test('itens numerados e listas não são eliminados fora de seu contexto', () => {
  assert.equal(unirTextoSOAP('1. Tratamento\n→ Orientação', '1. Tratamento\n→ Orientação').split('\n').length, 4);
});
test('inserir exame duas vezes não duplica o registro; achados distintos permanecem', () => {
  assert.equal(inserirTrechoUnico('Ausculta normal.', 'Ausculta normal.'), 'Ausculta normal.');
  assert.equal(inserirTrechoUnico('Sibilos.', 'Ausculta normal.'), 'Sibilos.\nAusculta normal.');
});
