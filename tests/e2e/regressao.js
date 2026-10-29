/**
 * Teste de regressão de ponta a ponta (navegador real, Playwright).
 *
 * Abre todas as páginas, preenche formulários, clica nos botões e compara o texto
 * produzido com a referência gravada em tests/e2e/referencia/saidas.json.
 * Também verifica: erros de JavaScript, rolagem horizontal em 390 px (celular)
 * e um fuzz das calculadoras com 150 combinações por cartão.
 *
 * Uso:
 *   npm run test:e2e                 compara com a referência
 *   npm run test:e2e:atualizar       regrava a referência (após uma mudança INTENCIONAL)
 *   node tests/e2e/regressao.js --base http://localhost:8080/   testa um servidor já aberto
 *
 * O relógio da página é fixado (DATA_FIXA) para que idades e IG não mudem com o dia.
 * Navegador: `npx playwright install chromium` uma vez, ou defina CHROMIUM_PATH.
 * Nenhum dado sai da máquina: as páginas são servidas localmente.
 */
import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { criarServidor } from '../../scripts/servidor.js';
import { EXERCITAR, fuzzCalculadoras } from './exercicios.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
const REFERENCIA = join(AQUI, 'referencia', 'saidas.json');
const DATA_FIXA = '2026-10-14T12:00:00-03:00';
const ATUALIZAR = process.argv.includes('--atualizar');
const indiceBase = process.argv.indexOf('--base');
const filtro = process.argv.includes('--filtro')
  ? new RegExp(process.argv[process.argv.indexOf('--filtro') + 1])
  : null;

const PAGINAS = [
  'index.html',
  'calculadoras.html',
  'contracepcao.html',
  'implante.html',
  'mamografia.html',
  'densitometria.html',
  'apac.html',
  'receita.html',
];

async function main() {
  let servidor = null;
  let base = indiceBase > 0 ? process.argv[indiceBase + 1] : null;
  if (!base) {
    servidor = criarServidor();
    await new Promise(ok => servidor.listen(0, '127.0.0.1', ok));
    base = `http://127.0.0.1:${servidor.address().port}/`;
  }

  const navegador = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  );
  const saidas = {};
  const erros = {};

  async function cenario(nome, url, roteiro, viewport = { width: 1280, height: 900 }) {
    if (filtro && !filtro.test(nome)) return;
    const contexto = await navegador.newContext({ viewport, timezoneId: 'America/Sao_Paulo', locale: 'pt-BR' });
    const pagina = await contexto.newPage();
    await pagina.clock.setFixedTime(new Date(DATA_FIXA));
    const lista = [];
    pagina.on('pageerror', e => lista.push(e.message));
    pagina.on('console', m => {
      // O pedido automático de /favicon.ico (inexistente) não é erro do site.
      if (m.type() === 'error' && !/favicon/.test(m.text() + (m.location().url || ''))) lista.push(m.text());
    });
    await pagina.goto(base + url);
    await pagina.waitForTimeout(400);
    try {
      await roteiro(pagina);
    } catch (e) {
      lista.push('ROTEIRO: ' + e.message);
    }
    erros[nome] = lista;
    await contexto.close();
    process.stdout.write('.');
  }

  const texto = (p, seletor) =>
    p.evaluate(s => {
      const e = document.querySelector(s);
      return e ? e.innerText.replace(/[ \t]+\n/g, '\n') : null;
    }, seletor);

  // ---------- Layout no celular: sem rolagem horizontal ----------
  for (const url of [...PAGINAS, 'index.html#padrao', 'index.html#prenatal', 'calculadoras.html#dose']) {
    await cenario(
      'layout390_' + url,
      url,
      async p => {
        const largura = await p.evaluate(() => document.documentElement.scrollWidth);
        saidas['layout390_' + url] = largura <= 390 ? 'ok' : 'rolagem horizontal: ' + largura + 'px';
      },
      { width: 390, height: 844 },
    );
  }

  // ---------- Início e modelos de consulta ----------
  await cenario('home', 'index.html#inicio', async p => (saidas.home = await texto(p, 'body')));
  for (const m of [
    'padrao',
    'hiperdia',
    'prenatal',
    'puerperal',
    'puericultura',
    'mulher',
    'homem',
    'mental',
    'reumato',
    'ortopedia',
  ]) {
    for (const pass of [1, 2]) {
      await cenario(`m_${m}_${pass}`, 'index.html#' + m, async p => {
        await p.evaluate(`(${EXERCITAR})(document.querySelector('main')||document.body,${pass})`);
        await p.waitForTimeout(300);
        await p.evaluate(`(${EXERCITAR})(document.querySelector('main')||document.body,${pass})`);
        await p.waitForTimeout(400);
        saidas[`m_${m}_${pass}`] = (await texto(p, 'main')) || (await texto(p, 'body'));
      });
    }
  }

  // ---------- Calculadoras ----------
  for (const m of ['has', 'dm', 'cv', 'drc', 'idoso', 'mental', 'resp', 'prenatal', 'fa', 'dor', 'ped', 'dose']) {
    for (const pass of [1, 2]) {
      await cenario(`c_${m}_${pass}`, 'calculadoras.html', async p => {
        await p.click('#nav-' + m);
        await p.evaluate(`(${EXERCITAR})(document.getElementById('mod-${m}'),${pass})`);
        await p.evaluate(`[...document.querySelectorAll('#mod-${m} button.calc')].forEach(b=>b.click())`);
        await p.waitForTimeout(200);
        saidas[`c_${m}_${pass}`] = await texto(p, '#mod-' + m);
      });
    }
  }

  // Dose pediátrica: todo medicamento × indicação × apresentação, em quatro pesos/idades
  await cenario('c_dose_todas', 'calculadoras.html#dose', async p => {
    saidas.c_dose_todas = await p.evaluate(() => {
      const out = [];
      const set = (id, v) => {
        const e = document.getElementById(id);
        e.value = v;
        e.dispatchEvent(new Event('input', { bubbles: true }));
      };
      for (const [kg, a, m] of [
        ['4', '0', '1'],
        ['12', '2', '3'],
        ['22', '6', '0'],
        ['45', '13', '0'],
      ]) {
        set('dz_peso', kg);
        set('dz_anos', a);
        set('dz_meses', m);
        const sm = document.getElementById('dz_med');
        out.push(
          'QUICK ' +
            document.getElementById('dz_quick').innerText +
            ' CHK ' +
            document.getElementById('dz_chk').innerText,
        );
        for (const o of [...sm.options].filter(o => o.value)) {
          sm.value = o.value;
          sm.dispatchEvent(new Event('change'));
          const si = document.getElementById('dz_ind');
          for (const io of [...si.options]) {
            si.value = io.value;
            si.dispatchEvent(new Event('change'));
            const sa = document.getElementById('dz_ap');
            for (const ao of [...sa.options]) {
              sa.value = ao.value;
              sa.dispatchEvent(new Event('change'));
              out.push(
                [
                  kg,
                  o.value,
                  io.value,
                  ao.value,
                  document.getElementById('dz_result').innerText,
                  document.getElementById('dz_alert').innerText,
                  document.getElementById('dz_rx').value,
                ].join(' | '),
              );
            }
          }
        }
      }
      return out.join('\n');
    });
  });

  // Fuzz: guardado como hash por caso para manter a referência pequena
  await cenario('c_fuzz', 'calculadoras.html', async p => {
    const casos = await p.evaluate(fuzzCalculadoras, 150);
    saidas.c_fuzz = casos
      .map(([id, s]) => id + ' ' + createHash('sha1').update(s).digest('hex').slice(0, 12))
      .join('\n');
  });

  // ---------- Contracepção e implante ----------
  for (const pass of [1, 2]) {
    await cenario('contra_' + pass, 'contracepcao.html', async p => {
      await p.evaluate(`(${EXERCITAR})(document.querySelector('main'),${pass})`);
      await p.evaluate(() => {
        for (const b of document.querySelectorAll('main button'))
          if (/gerar|avaliar|calcular|analisar|verificar/i.test(b.textContent)) b.click();
      });
      await p.waitForTimeout(200);
      saidas['contra_' + pass] = await texto(p, 'main');
    });
  }
  const CASOS_CONTRACEPCAO = [
    [
      't_contra_a',
      {
        motivo: 'Contracepção de emergência',
        idade: '38',
        pas: '150',
        pad: '95',
        tabagismo: 'sim',
        cigarrosDia: '10',
        preferencia: 'longa',
        rs5: 'sim',
        amamentando: 'nao',
      },
      ['enxaquecaAura', 'sangramentoAnormal', 'riscoIST'],
    ],
    [
      't_contra_b',
      {
        motivo: 'Pós-parto / amamentação',
        idade: '25',
        amamentando: 'sim',
        semanasParto: '4',
        preferencia: 'diario',
        rsdum: 'incerto',
      },
      ['dificuldadeLembrar', 'istAtual', 'rifampicina'],
    ],
  ];
  for (const [nome, valores, marcados] of CASOS_CONTRACEPCAO) {
    await cenario(nome, 'contracepcao.html', async p => {
      saidas[nome] = await p.evaluate(
        ([valores, marcados]) => {
          for (const [k, v] of Object.entries(valores)) {
            const e = document.getElementById(k);
            e.value = v;
            e.dispatchEvent(new Event('change', { bubbles: true }));
          }
          marcados.forEach(k => (document.getElementById(k).checked = true));
          [...document.querySelectorAll('button')].find(b => /Gerar resultado/.test(b.textContent)).click();
          return (
            ['painelResumo', 'resumoRapido', 'prioridade', 'alertas', 'metodosResultado']
              .map(i => document.getElementById(i).innerHTML.replace(/\s+/g, ' '))
              .join('\n') +
            '\n' +
            document.getElementById('soap').innerText
          );
        },
        [valores, marcados],
      );
    });
  }
  for (const pass of [1, 2]) {
    await cenario('impl_' + pass, 'implante.html', async p => {
      await p.evaluate(`(${EXERCITAR})(document.querySelector('.wrap'),${pass})`);
      await p.evaluate(() => {
        const g = document.getElementById('gerarBtn');
        g.disabled = false;
        g.click();
      });
      await p.waitForTimeout(200);
      saidas['impl_' + pass] =
        (await texto(p, '.wrap')) +
        '\nSOAP:' +
        (await p.evaluate(() =>
          ['ta_s', 'ta_o', 'ta_a', 'ta_p'].map(i => document.getElementById(i).value).join('\n---\n'),
        )) +
        '\nBARRA:' +
        (await texto(p, 'footer.bar'));
    });
  }

  // ---------- Requisições (texto e posição de cada campo nas folhas) ----------
  for (const f of ['mamografia', 'densitometria', 'apac']) {
    for (const pass of [1, 2]) {
      await cenario(`r_${f}_${pass}`, f + '.html', async p => {
        await p.evaluate(`(${EXERCITAR})(document.querySelector('main'),${pass})`);
        await p.waitForTimeout(200);
        await p.evaluate(() => {
          window.print = () => {};
        });
        await p.click('#bPrint').catch(() => {});
        await p.waitForTimeout(150);
        saidas[`r_${f}_${pass}`] =
          (await texto(p, 'main')) +
          '\nPENDENCIAS:' +
          (await texto(p, '#pending')) +
          '\nFOLHAS:' +
          (await p.evaluate(() =>
            [...document.querySelectorAll('#print .page')]
              .map(
                pg =>
                  (pg.hidden ? '[oculta]' : '') +
                  [...pg.querySelectorAll('div')]
                    .filter(d => d.textContent.trim())
                    .map(
                      d =>
                        d.className +
                        '@' +
                        d.style.left +
                        ',' +
                        d.style.top +
                        ':' +
                        d.textContent +
                        '/' +
                        d.style.fontSize,
                    )
                    .join(';'),
              )
              .join('\n'),
          ));
      });
    }
  }

  // ---------- Cenários clínicos realistas ----------
  await cenario('t_hiperdia', 'index.html#hiperdia', async p => {
    saidas.t_hiperdia = await p.evaluate(async () => {
      const W = ms => new Promise(r => setTimeout(r, ms));
      const seg = (k, v) => document.querySelector(`[data-hd="${k}"] [data-v="${v}"]`).click();
      const typ = (id, v) => {
        const e = document.getElementById(id);
        e.value = v;
        e.dispatchEvent(new Event('input', { bubbles: true }));
      };
      const out = [];
      const foto = () => out.push(document.querySelector('#v-consulta').innerText);
      seg('sexo', 'F');
      typ('hd-idade', '60');
      typ('hd-ct', '220');
      typ('hd-hdl', '45');
      typ('hd-ldl', '140');
      typ('hd-pas', '145');
      typ('hd-imc', '29');
      typ('hd-cr', '0,9');
      seg('dm', '0');
      seg('tab', '1');
      seg('antiht', '1');
      seg('estatina', '0');
      seg('dcv', '0');
      await W(100);
      foto();
      seg('dm', '1');
      typ('hd-rac', '45');
      await W(100);
      foto();
      seg('sexo', 'M');
      typ('hd-idade', '45');
      typ('hd-ldl', '195');
      seg('dm', '0');
      await W(100);
      foto();
      return out.join('\n=====\n');
    });
  });
  // Consulta com vários tipos marcados: dados comuns uma vez e um SOAP só
  await cenario('t_combinada', 'index.html#consulta', async p => {
    saidas.t_combinada = await p.evaluate(async () => {
      const W = ms => new Promise(r => setTimeout(r, ms));
      const typ = (id, v) => {
        const e = document.getElementById(id);
        e.value = v;
        e.dispatchEvent(new Event('input', { bubbles: true }));
      };
      ['hiperdia', 'mulher', 'prenatal'].forEach(t => document.querySelector(`#tipos [data-tipo="${t}"]`).click());
      await W(100);
      document.querySelector('.seg[data-hd="sexo"] [data-v="F"]').click();
      typ('hd-idade', '34');
      typ('f-motivo', 'Pré-natal e rotina');
      typ('sv-pa', '130/85');
      typ('sv-peso', '68');
      typ('sv-alt', '1,62');
      typ('m-dt-dum', '01/05/2026');
      typ('m-pg-pprev', '60');
      typ('m-pg-alt', '1,62');
      typ('m-sv-au', '25');
      typ('hd-cr', '0,8');
      await W(200);
      return (
        document.querySelector('#saida').innerText +
        '\n---\n' +
        [...document.querySelectorAll('[data-calc]')].map(e => e.innerText).join('\n')
      );
    });
  });
  await cenario('t_padrao', 'index.html#padrao', async p => {
    saidas.t_padrao = await p.evaluate(async () => {
      const W = ms => new Promise(r => setTimeout(r, ms));
      const typ = (id, v) => {
        const e = document.getElementById(id);
        e.value = v;
        e.dispatchEvent(new Event('input', { bubbles: true }));
      };
      typ('f-motivo', 'Febre e dor no corpo');
      typ('sv-pa', '130/85');
      typ('sv-peso', '70');
      typ('sv-alt', '1,65');
      [...document.querySelectorAll('#v-consulta button')]
        .filter(b => /dengue|febre/i.test(b.textContent))
        .slice(0, 3)
        .forEach(b => b.click());
      await W(150);
      return document.querySelector('#v-consulta').innerText;
    });
  });
  await cenario('t_prenatal', 'index.html#prenatal', async p => {
    saidas.t_prenatal = await p.evaluate(async () => {
      const W = ms => new Promise(r => setTimeout(r, ms));
      const F = () => document.querySelector('#form');
      const typ = (sel, v) => {
        const i = document.querySelector(sel);
        i.value = v;
        i.dispatchEvent(new Event('input', { bubbles: true }));
      };
      const btn = t => [...F().querySelectorAll('button')].find(b => b.textContent.trim() === t).click();
      const ultimo = (k, v) => {
        const i = [...F().querySelectorAll(`[data-k="${k}"]`)].pop();
        i.value = v;
        i.dispatchEvent(new Event('input'));
      };
      typ('#m-dt-dum', '01/03/2026');
      typ('#m-pg-pprev', '60');
      typ('#m-pg-alt', '1,62');
      btn('+ Registrar peso');
      ultimo('p', '66');
      ultimo('d', '01/10/2026');
      btn('+ Adicionar gestação');
      const g = F().querySelector('[data-k="via"]');
      g.value = 'vaginal';
      g.dispatchEvent(new Event('input'));
      typ('#m-l3-gbs', 'positivo');
      typ('#m-l1-real', '10/04/2026');
      await W(100);
      return document.querySelector('main').innerText;
    });
  });
  await cenario('t_puericultura', 'index.html#puericultura', async p => {
    saidas.t_puericultura = await p.evaluate(async () => {
      const W = ms => new Promise(r => setTimeout(r, ms));
      const F = () => document.querySelector('#form');
      const typ = (sel, v) => {
        const i = document.querySelector(sel);
        i.value = v;
        i.dispatchEvent(new Event('input', { bubbles: true }));
      };
      [...F().querySelectorAll('button')].find(b => b.textContent.trim() === 'Feminino').click();
      typ('#m-nasc-dn', '01/04/2026');
      typ('#m-nasc-igs', '33');
      typ('#m-rn-peso', '2100');
      typ('#m-rn-comp', '44');
      typ('#m-rn-pc', '31');
      const add = [...F().querySelectorAll('button')].find(b => /medida/i.test(b.textContent));
      if (add) {
        add.click();
        const r = (k, v) => {
          const i = [...F().querySelectorAll(`[data-k="${k}"]`)].pop();
          if (i) {
            i.value = v;
            i.dispatchEvent(new Event('input'));
          }
        };
        r('d', '01/09/2026');
        r('p', '5,1');
        r('e', '58');
        r('pc', '39');
      }
      F().querySelector('[data-mk="m2a"][data-v="Ausente"]').click();
      await W(100);
      return document.querySelector('main').innerText;
    });
  });
  await cenario('t_calc', 'calculadoras.html', async p => {
    saidas.t_calc = await p.evaluate(() => {
      const set = (id, v) => {
        const e = document.getElementById(id);
        e.value = v;
        e.dispatchEvent(new Event('input', { bubbles: true }));
      };
      const calcular = id =>
        document
          .querySelector('#' + id)
          .closest('.card')
          .querySelector('button.calc')
          .click();
      const html = id => document.getElementById(id).innerHTML;
      const out = [];
      set('cv_sexo', 'F');
      set('cv_idade', '60');
      set('cv_ct', '220');
      set('cv_hdl', '45');
      set('cv_ldl', '140');
      set('cv_pas', '145');
      set('cv_imc', '29');
      set('cv_tfg', '80');
      set('cv_dm', '0');
      set('cv_tab', '1');
      set('cv_has', '1');
      set('cv_antiht', '1');
      set('cv_estat', '0');
      calcular('cv_result');
      out.push(html('cv_result') + html('cv_alert'));
      set('cv_dm', '1');
      document.getElementById('cv_dmx_0').checked = true;
      calcular('cv_result');
      out.push(html('cv_result'));
      set('cv_evento', '1');
      calcular('cv_result');
      out.push(html('cv_result'));
      set('ped_sexo', 'M');
      set('ped_idade_meses', '6');
      set('ped_peso', '7,9');
      set('ped_altura', '67,6');
      set('ped_pc', '43,3');
      calcular('ped_imc_result');
      out.push(html('ped_imc_result'));
      set('ped_ig', '32');
      set('ped_peso', '6');
      set('ped_altura', '62');
      calcular('ped_imc_result');
      out.push(html('ped_imc_result'));
      set('peso_pre', '60');
      set('peso_altura', '160');
      set('peso_atual', '70');
      set('peso_ig', '40');
      [...document.querySelectorAll('button.calc')].find(b => b.textContent === 'Avaliar ganho de peso').click();
      out.push(html('peso_result'));
      return out.join('\n=====\n');
    });
  });

  await navegador.close();
  if (servidor) servidor.close();
  process.stdout.write('\n');

  // ---------- Resultado ----------
  const comErro = Object.entries(erros).filter(([, v]) => v.length);
  if (ATUALIZAR) {
    if (comErro.length) {
      console.error('Referência NÃO atualizada: há erros de JavaScript.', comErro);
      process.exit(1);
    }
    mkdirSync(dirname(REFERENCIA), { recursive: true });
    writeFileSync(REFERENCIA, JSON.stringify(saidas, null, 1) + '\n');
    console.log(`Referência gravada: ${Object.keys(saidas).length} cenários.`);
    return;
  }

  const referencia = JSON.parse(readFileSync(REFERENCIA, 'utf8'));
  const normalizar = s =>
    String(s ?? '')
      .replace(/\s+/g, ' ')
      .trim();
  const falhas = [];
  for (const [nome, valor] of Object.entries(saidas)) {
    if (normalizar(valor) === normalizar(referencia[nome])) continue;
    const a = String(referencia[nome] ?? '').split('\n'),
      b = String(valor ?? '').split('\n');
    let i = 0;
    while (i < a.length && a[i] === b[i]) i++;
    falhas.push(
      `✗ ${nome} (linha ${i + 1})\n    esperado: ${(a[i] || '').slice(0, 240)}\n    obtido:   ${(b[i] || '').slice(0, 240)}`,
    );
  }
  for (const [nome, lista] of comErro) falhas.push(`✗ ${nome}: erro de JavaScript — ${lista.slice(0, 3).join(' | ')}`);

  if (falhas.length) {
    console.error(falhas.join('\n'));
    console.error(`\n${falhas.length} problema(s) em ${Object.keys(saidas).length} cenários.`);
    process.exit(1);
  }
  console.log(`✓ ${Object.keys(saidas).length} cenários idênticos à referência, sem erros de JavaScript.`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
