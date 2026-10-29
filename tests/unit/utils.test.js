import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lerDataBr, formatarDataBr, diferencaEmDias, somarDias, textoSemanasEDias } from '../../js/utils/datas.js';
import { formatarNumero, lerNumero, escaparHtml, finalizarFrase, finalizarTexto } from '../../js/utils/texto.js';

test('lerDataBr aceita datas válidas e recusa datas impossíveis', () => {
  const d = lerDataBr('15/03/2026');
  assert.equal(d.getFullYear(), 2026);
  assert.equal(d.getMonth(), 2);
  assert.equal(d.getDate(), 15);
  assert.equal(lerDataBr('31/02/2026'), null);
  assert.equal(lerDataBr('15/13/2026'), null);
  assert.equal(lerDataBr('texto'), null);
  assert.equal(lerDataBr(''), null);
});

test('formatação e aritmética de datas', () => {
  const a = new Date(2026, 0, 1);
  assert.equal(formatarDataBr(a), '01/01/2026');
  assert.equal(diferencaEmDias(a, new Date(2026, 0, 31)), 30);
  assert.equal(formatarDataBr(somarDias(a, 280)), '08/10/2026');
  assert.equal(textoSemanasEDias(64), '9 semanas e 1 dia');
  assert.equal(textoSemanasEDias(70), '10 semanas e 0 dias');
});

test('números com vírgula decimal', () => {
  assert.equal(lerNumero('7,5'), 7.5);
  assert.equal(lerNumero('1.62'), 1.62);
  assert.ok(Number.isNaN(lerNumero('abc')));
  assert.ok(Number.isNaN(lerNumero(undefined)));
  assert.equal(formatarNumero(29.04), '29,0');
  assert.equal(formatarNumero(3.14159, 2), '3,14');
});

test('escape de HTML e pontuação final', () => {
  assert.equal(escaparHtml('<b>"x" & y</b>'), '&lt;b&gt;&quot;x&quot; &amp; y&lt;/b&gt;');
  assert.equal(finalizarFrase('Sem queixas'), 'Sem queixas.');
  assert.equal(finalizarFrase('Sem queixas!'), 'Sem queixas!');
  assert.equal(finalizarTexto('Exames:'), 'Exames:');
});
