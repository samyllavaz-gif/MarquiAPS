import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  classificarCorrida,
  nomeSemData,
  rodapeSemData,
  textoNoLugarDaData,
  agruparCorridasDeTexto,
} from '../../js/receita/regras.js';
import { ajustarAoLimite, identificarPdfPec } from '../../js/requisicoes/importar-cidadao-pec.js';
import { examesDaSolicitacao } from '../../js/requisicoes/mamografia/regras.js';

test('Receita sem data: reconhece a data da assinatura e o rodapé', () => {
  assert.equal(classificarCorrida('São Manuel, 10 de outubro de 2026', { rodape: true }), 'data');
  assert.equal(classificarCorrida('Impresso em 10/10/2026 às 10:00', { rodape: true }), 'rodape');
  assert.equal(classificarCorrida('Impresso em 10/10/2026 às 10:00', { rodape: false }), null);
  assert.equal(classificarCorrida('Clonazepam 2 mg', { rodape: true }), null);
  assert.equal(
    textoNoLugarDaData('São Manuel, 3 de março de 2026'),
    'São Manuel, _____ de ____________________ de ________',
  );
  assert.equal(rodapeSemData('Impresso em 03/03/2026 às 08:15 por Fulano'), 'Impresso por Fulano');
  assert.equal(nomeSemData('Receita.PDF'), 'Receita_sem_data.pdf');
});

test('Receita sem data: junta pedaços da mesma linha e separa as duas vias', () => {
  const item = (str, x, y, w) => ({ str, transform: [10, 0, 0, 10, x, y], width: w, height: 10 });
  const r = agruparCorridasDeTexto([
    item('São Manuel,', 70, 170, 55),
    item('10 de outubro de 2026', 127, 170, 100),
    item('São Manuel, 10 de outubro de 2026', 491, 170, 160),
  ]);
  assert.deepEqual(
    r.map(x => x.text),
    ['São Manuel, 10 de outubro de 2026', 'São Manuel, 10 de outubro de 2026'],
  );
});

test('Importação do PEC: abrevia e corta para caber nos quadradinhos', () => {
  assert.deepEqual(ajustarAoLimite('Rua Santa Rita', 20), { valor: 'Rua Santa Rita', situacao: '' });
  assert.deepEqual(ajustarAoLimite('Rua Doutor Jardim Santa Rita', 20), {
    valor: 'Rua Dr Jd Santa Rita',
    situacao: 'abreviado',
  });
  assert.equal(ajustarAoLimite('Maria Aparecida da Silva Santos de Oliveira', 10).situacao, 'cortado');
});

test('Importação do PEC: reconhece a solicitação de exame e o cadastro do cidadão', () => {
  const t = (s, x, y) => ({ s, x, y });
  const solicitacao = identificarPdfPec([
    t('Nome do cidadão', 40, 100),
    t('MARIA DA SILVA', 40, 112),
    t('Procedimentos solicitados', 40, 200),
    t('1. MAMOGRAFIA BILATERAL PARA RASTREAMENTO - 0204030188', 40, 212),
  ]);
  assert.equal(solicitacao.origem, 'solicitacao');
  assert.equal(solicitacao.nome, 'MARIA DA SILVA');
  assert.deepEqual(solicitacao.procs, [{ name: 'MAMOGRAFIA BILATERAL PARA RASTREAMENTO', code: '0204030188' }]);
  const cadastro = identificarPdfPec([
    t('Dados pessoais', 40, 50),
    t('Contatos', 40, 300),
    t('CNS', 40, 80),
    t('700001234567890', 40, 92),
  ]);
  assert.equal(cadastro.origem, 'cadastro');
  assert.equal(cadastro.cns, '700001234567890');
  assert.equal(identificarPdfPec([t('Qualquer coisa', 1, 1)]), null);
});

test('Mamografia: exames marcados a partir dos procedimentos da solicitação', () => {
  assert.deepEqual(examesDaSolicitacao([{ name: 'MAMOGRAFIA', code: '0204030030' }]), {
    mamografia: true,
    citopatologico: false,
    mamografiaDiagnostica: true,
  });
  assert.deepEqual(examesDaSolicitacao([{ name: 'EXAME CITOPATOLOGICO', code: '0203010019' }]), {
    mamografia: false,
    citopatologico: true,
    mamografiaDiagnostica: false,
  });
});
