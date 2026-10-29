import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DONOS_DOS_IDS, MODULOS, montarConsulta, valoresCompartilhados } from '../../js/consultas/modulos.js';
import { ordenarTipos, TIPOS_DE_CONSULTA } from '../../js/consultas/tipos.js';

const ids = def => {
  const out = [];
  const w = fs =>
    fs.forEach(f => {
      if (f.id) out.push(f.id);
      if (f.t === 'group') w(f.f);
    });
  def.secs.forEach(s => w(s.f));
  return out;
};
const todos = montarConsulta(TIPOS_DE_CONSULTA.map(t => t.id));

test('com todos os tipos marcados, nenhum campo repete o id', () => {
  const lista = ids(todos);
  assert.equal(new Set(lista).size, lista.length);
  const gids = [];
  const w = fs =>
    fs.forEach(f => {
      if (f.gid) gids.push(f.gid);
      if (f.t === 'group') w(f.f);
    });
  todos.secs.forEach(s => w(s.f));
  assert.equal(new Set(gids).size, gids.length, 'grupos com id único');
});

test('campos da base saem dos módulos (preenchidos uma vez só)', () => {
  const lista = ids(todos);
  for (const id of ['alerg', 'meds', 'aval', 'hd', 'exsol', 'conduta', 'presc', 'orient', 'alarme_or', 'enc', 'ret'])
    assert.ok(!lista.some(x => x === id || x.endsWith('_' + id)), id);
  assert.ok(!todos.secs.some(s => s.f.some(f => f.t === 'exam')), 'exame físico é um campo só, o da base');
  assert.ok(todos.exame.length >= 6, 'botões de exame dos módulos vão para a base');
});

test('o dono de cada id lido pelo código específico mantém o nome original', () => {
  for (const [id, dono] of Object.entries(DONOS_DOS_IDS)) {
    if (!MODULOS[dono]) continue;
    const doDono = ids(MODULOS[dono]);
    if (['ident'].includes(id)) continue; // a identificação da mulher só tinha idade, que vem da base
    assert.ok(doDono.includes(id), `${dono} mantém ${id}`);
  }
  assert.ok(ids(MODULOS.ortopedia).includes('ortopedia_hip'));
  assert.ok(ids(MODULOS.mental).includes('mental_inicio'));
});

test('sinais vitais da base saem da grade do pré-natal; o exame obstétrico fica', () => {
  const sv = MODULOS.prenatal.secs.flatMap(s => s.f).find(f => f.id === 'sv');
  assert.deepEqual(
    sv.f.map(([k]) => k),
    ['au', 'bcf', 'mf', 'edema'],
  );
  assert.equal(sv.l, 'Exame obstétrico');
});

test('módulos só aparecem para os tipos marcados, na ordem da lista', () => {
  assert.deepEqual(montarConsulta(['queixas', 'hiperdia']).secs, []);
  assert.deepEqual(montarConsulta(['ortopedia', 'mulher']).modulos, ['mulher', 'ortopedia']);
  assert.deepEqual(ordenarTipos(['mental', 'queixas', 'xyz']), ['queixas', 'mental']);
});

test('a base passa idade, sexo e sinais vitais aos módulos', () => {
  const c = valoresCompartilhados({ idade: '30', sexo: 'F', sinais: { peso: '68', pa: '120/80' } });
  assert.deepEqual(c, { ident: { idade: '30' }, sexo: 'Feminino', sv: { peso: '68', pa: '120/80' } });
});

test('antecedentes e hábitos saem dos módulos e mantêm opções específicas na base', async () => {
  const { CHIPS } = await import('../../js/consultas/base/dados.js');
  assert.ok(!ids(todos).some(id => /(^|_)(ant|hab)$/.test(id)));
  assert.ok(CHIPS.ant.includes('Psoríase'));
  assert.equal(CHIPS.ant.filter(x => x === 'HAS').length, 1);
});

test('rascunho anterior migra registros sem apagar divergências com a base', async () => {
  const { migrarCamposCompartilhados } = await import('../../js/consultas/modulos.js');
  const valores = { mulher_ant: ['HAS'], reumato_ant: ['Psoríase'], mulher_hab: ['Tabagismo'] };
  const chips = { ant: ['Nega comorbidades'], risco: [] };
  migrarCamposCompartilhados(valores, chips);
  assert.deepEqual(chips.ant, ['Nega comorbidades', 'HAS', 'Psoríase']);
  assert.deepEqual(chips.risco, ['Tabagismo']);
  assert.deepEqual(valores, {});
  migrarCamposCompartilhados(valores, chips);
  assert.equal(chips.ant.length, 3);
});

test('DUM compatível é compartilhada, DUM divergente preserva os dois registros', async () => {
  const { compartilharDum } = await import('../../js/consultas/modulos.js');
  const def = montarConsulta(['mulher', 'prenatal']);
  const valores = { menst: { dum: '01/08/2026', padrao: 'regular' } };
  const compartilhada = compartilharDum(def, valores);
  assert.ok(compartilhada.dumCompartilhada);
  assert.equal(valores.dt.dum, '01/08/2026');
  assert.equal(valores.menst.padrao, 'regular');
  const divergentes = { menst: { dum: '01/08/2026' }, dt: { dum: '02/08/2026' } };
  assert.ok(compartilharDum(def, divergentes).conflitoDum);
  assert.equal(divergentes.dt.dum, '02/08/2026');
  assert.equal(divergentes.menst.dum, '01/08/2026');
});
