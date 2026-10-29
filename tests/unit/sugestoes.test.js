import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FERRAMENTAS, POR_CATEGORIA, selecionarSugestoes } from '../../js/consultas/sugestoes.js';
import { TIPOS_DE_CONSULTA } from '../../js/consultas/tipos.js';

test('todas as categorias possuem sugestões e destinos disponíveis', () => {
  for (const { id } of TIPOS_DE_CONSULTA) {
    assert.ok(POR_CATEGORIA[id]?.length, id);
    for (const ferramenta of POR_CATEGORIA[id]) assert.ok(FERRAMENTAS[ferramenta]);
  }
  for (const f of selecionarSugestoes(TIPOS_DE_CONSULTA.map(t => t.id))) assert.ok(f.naConsulta ? f.local : f.href);
});
test('categorias combinadas não repetem ferramenta e mantêm sua origem', () => {
  const audit = selecionarSugestoes(['homem', 'mental']).filter(f => f.id === 'auditc');
  assert.equal(audit.length, 1);
  assert.deepEqual(audit[0].categorias, ['homem', 'mental']);
  assert.ok(audit[0].naConsulta);
  assert.deepEqual(selecionarSugestoes([]), []);
  assert.deepEqual(selecionarSugestoes(['desconhecida']), []);
});
test('destino integrado depende da presença do roteiro; TOTG abre separadamente', () => {
  assert.ok(selecionarSugestoes(['hiperdia']).find(f => f.id === 'renal').naConsulta);
  assert.equal(selecionarSugestoes(['prenatal']).find(f => f.id === 'totg').naConsulta, false);
});
test('links apontam para resultados existentes no módulo correto', () => {
  const arquivos = { cv: 'cardiovascular', drc: 'renal', dm: 'diabetes', mental: 'saude-mental', prenatal: 'pre-natal', ped: 'pediatria', dose: 'dose-pediatrica', dor: 'dor', resp: 'respiratorio' };
  for (const f of Object.values(FERRAMENTAS).filter(f => f.modulo)) {
    const fonte = readFileSync(new URL(`../../js/calculadoras/modulos/${arquivos[f.modulo]}.js`, import.meta.url), 'utf8');
    assert.ok(fonte.includes(`id: '${f.resultado}'`), f.nome);
  }
});
