/**
 * Importação de PDFs do e-SUS PEC para as requisições:
 * - solicitação de exame (ou laudo) gerada pelo PEC;
 * - tela "Informações do cidadão" impressa (cadastro).
 * Os PDFs são lidos só neste navegador (pdf.js local); nada é enviado.
 *
 * A leitura (lerSolicitacaoPec, lerCadastroPec, identificarPdfPec) é pura;
 * aplicarDadosPec e ligarImportacaoCidadaoPec mexem no formulário da página.
 */
import {
  agruparEmLinhas,
  configurarLeitorPdf,
  extrairTrechosDoPdf,
  leitorPdfDisponivel,
} from '../servicos/leitor-pdf.js';
import { normalizarTexto } from '../utils/texto.js';
import { mostrarMensagem } from './comum.js';

const N = s => normalizarTexto(s || '').trim();

const UF_POR_ESTADO = {
  acre: 'AC',
  alagoas: 'AL',
  amapa: 'AP',
  amazonas: 'AM',
  bahia: 'BA',
  ceara: 'CE',
  'distrito federal': 'DF',
  'espirito santo': 'ES',
  goias: 'GO',
  maranhao: 'MA',
  'mato grosso': 'MT',
  'mato grosso do sul': 'MS',
  'minas gerais': 'MG',
  para: 'PA',
  paraiba: 'PB',
  parana: 'PR',
  pernambuco: 'PE',
  piaui: 'PI',
  'rio de janeiro': 'RJ',
  'rio grande do norte': 'RN',
  'rio grande do sul': 'RS',
  rondonia: 'RO',
  roraima: 'RR',
  'santa catarina': 'SC',
  'sao paulo': 'SP',
  sergipe: 'SE',
  tocantins: 'TO',
};

const MESES = [
  'janeiro',
  'fevereiro',
  'marco',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

/* ---------- Solicitação de exame / laudo gerado pelo PEC ---------- */

const ROTULOS_SOLICITACAO = [
  'Nome do cidadão',
  'CPF',
  'CNS',
  'Sexo',
  'Idade',
  'Data de nascimento',
  'Telefone',
  'Nome da mãe',
  'Endereço',
  'Código do município',
  'Unidade de saúde solicitante',
  'CNES',
  'Profissional solicitante',
  'CID10',
  'Justificativa do procedimento',
  'Observações',
].map(N);

export function lerSolicitacaoPec(items) {
  const ehRotulo = it => ROTULOS_SOLICITACAO.includes(N(it.s));
  const achar = (rotulo, perto) => {
    const c = items.filter(i => N(i.s) === N(rotulo));
    if (!perto) return c[0] || null;
    return c.find(i => Math.abs(i.y - perto.y) < 2.5) || null;
  };
  const titulo = re => items.find(i => re.test(N(i.s)));
  // valor logo abaixo do rótulo, na coluna dele
  const abaixo = (L, { maxLinhas = 1, ate = null, distancia = 30 } = {}) => {
    if (!L) return '';
    const vizinhos = items.filter(i => Math.abs(i.y - L.y) < 2.5 && i.x > L.x + 2 && ehRotulo(i)).map(i => i.x);
    const proximoX = vizinhos.length ? Math.min(...vizinhos) : 1e9;
    const limite = ate ? ate.y - 1 : L.y + distancia * maxLinhas + 20;
    const linhas = agruparEmLinhas(
      items.filter(i => i.y > L.y + 2 && i.y < limite && i.x >= L.x - 12 && i.x < proximoX - 2 && !ehRotulo(i)),
    );
    if (!linhas.length) return '';
    if (!ate) {
      if (linhas[0].y - L.y > distancia) return '';
      return linhas
        .slice(0, maxLinhas)
        .map(l => l.s)
        .join('\n');
    }
    return linhas.map(l => l.s).join('\n');
  };

  const r = { origem: 'solicitacao' };
  r.nome = abaixo(achar('Nome do cidadão'));
  r.cpf = abaixo(achar('CPF')).replace(/\D/g, '');
  r.sexo = N(abaixo(achar('Sexo')));
  r.nasc = abaixo(achar('Data de nascimento'));
  r.tel = abaixo(achar('Telefone'));
  r.mae = abaixo(achar('Nome da mãe'));

  const endL = achar('Endereço');
  const uniL = achar('Unidade de saúde solicitante');
  const codL = achar('Código do município', endL);
  r.ibge = codL ? abaixo(codL, { maxLinhas: 3 }).replace(/\D/g, '').slice(0, 7) : '';
  if (endL) {
    const limiteX = codL ? codL.x : 1e9;
    const linhas = agruparEmLinhas(
      items.filter(
        i => i.y > endL.y + 2 && i.y < (uniL ? uniL.y - 1 : endL.y + 60) && i.x < limiteX - 5 && !ehRotulo(i),
      ),
    ).map(l => l.s);
    if (linhas.length) {
      const ultima = linhas[linhas.length - 1];
      const m = ultima.match(/^(.*?)\s*-\s*(\d{5}-?\d{3})\s*-\s*(.+?)\s*-\s*([A-Z]{2})$/);
      if (m) {
        r.bairro = m[1];
        r.cep = m[2].replace(/\D/g, '');
        r.mun = m[3];
        r.uf = m[4];
        linhas.pop();
      }
      const rua = linhas.join(', ');
      const mm = rua.match(/^(.*?),\s*([0-9]+[A-Za-z]?|S\/?N)\s*(?:,\s*(.*))?$/i);
      if (mm) {
        r.logradouro = mm[1];
        r.numero = mm[2];
        if (mm[3]) r.complemento = mm[3];
      } else r.logradouro = rua;
    }
  }
  r.unidade = abaixo(uniL);
  r.cnes = abaixo(achar('CNES', uniL)).replace(/\D/g, '');
  const profL = achar('Profissional solicitante');
  r.prof = abaixo(profL);
  r.profcpf = abaixo(achar('CPF', profL)).replace(/\D/g, '');

  const munH = titulo(/^municipio de /);
  const estH = titulo(/^estado de /);
  if (munH) r.unimun = munH.s.replace(/^munic[ií]pio de /i, '');
  if (estH) r.uniuf = UF_POR_ESTADO[N(estH.s.replace(/^estado de /i, ''))] || '';

  const procH = titulo(/^procedimentos? solicitados?/);
  const jusH = titulo(/^justificativa da solicitacao/);
  r.procs = [];
  if (procH) {
    const texto = agruparEmLinhas(items.filter(i => i.y > procH.y + 2 && (!jusH || i.y < jusH.y - 1)))
      .map(l => l.s)
      .join(' ');
    const re = /(?:\d+\.\s*)?(.+?)\s*-\s*(\d{10})\b/g;
    let m;
    while ((m = re.exec(texto))) r.procs.push({ name: m[1].trim(), code: m[2] });
  }

  const linhaData = items.map(i => i.s).find(s => /\d{1,2} de [a-zç]+ de \d{4}/i.test(s) && !/impresso/i.test(s));
  if (linhaData) {
    const m = linhaData.match(/(\d{1,2}) de ([a-zç]+) de (\d{4})/i);
    const mes = MESES.indexOf(N(m[2]));
    if (mes >= 0) r.dsol = `${m[3]}-${String(mes + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }
  return r;
}

/* ---------- Cadastro do cidadão (tela "Informações" do PEC impressa) ---------- */

const ROTULOS_CADASTRO = [
  'CPF',
  'Nº NIS (PIS/PASEP)',
  'CNS',
  'DNV',
  'Data de nascimento',
  'Sexo',
  'Estado civil',
  'Raça/cor',
  'Tipo sanguíneo',
  'Nome da mãe',
  'Nome do pai',
  'Orientação sexual',
  'Identidade de gênero',
  'Nacionalidade',
  'Município de nascimento',
  'Contatos',
  'Telefone celular',
  'Telefone residencial',
  'Telefone de contato',
  'E-mail',
  'Equipe de referência',
  'Equipe',
  'Unidade de saúde',
  'Responsável familiar',
  'Microárea',
  'Residência',
  'País de residência',
  'CEP',
  'Estado',
  'Município',
  'Bairro',
  'Tipo de logradouro',
  'Logradouro',
  'Número',
  'Complemento',
  'Ponto de referência',
  'Está em situação de rua',
  'Etnia',
  'Escolaridade',
  'Nome social',
].map(N);

export function lerCadastroPec(items) {
  const dadosPessoais = items.find(i => N(i.s) === 'dados pessoais');
  const y0 = dadosPessoais ? dadosPessoais.y : 0;
  const corpo = items.filter(i => i.y > y0);
  const ehRotulo = it => ROTULOS_CADASTRO.includes(N(it.s));
  const achar = rotulo => corpo.find(i => N(i.s) === N(rotulo)) || null;
  // valor na linha abaixo do rótulo, na mesma coluna
  const coluna = rotulo => {
    const L = achar(rotulo);
    if (!L) return '';
    const vizinhos = corpo.filter(i => Math.abs(i.y - L.y) < 2.5 && i.x > L.x + 2 && ehRotulo(i)).map(i => i.x);
    const proximoX = vizinhos.length ? Math.min(...vizinhos) : 1e9;
    const linhas = agruparEmLinhas(corpo.filter(i => i.y > L.y + 2 && i.x >= L.x - 12 && i.x < proximoX - 2));
    if (!linhas.length) return '';
    const primeira = linhas[0];
    if (primeira.items.some(ehRotulo)) return '';
    return primeira.s;
  };
  // valor à direita do rótulo, na mesma linha
  const aDireita = rotulo => {
    const L = achar(rotulo);
    if (!L) return '';
    return corpo
      .filter(i => Math.abs(i.y - L.y) < 2.5 && i.x > L.x + 2)
      .sort((a, b) => a.x - b.x)
      .map(i => i.s)
      .join(' ');
  };

  const r = { origem: 'cadastro' };
  const topo = items.filter(i => i.y < y0);
  const sexoTopo = topo.find(i => /^\|\s*sexo/i.test(i.s));
  if (sexoTopo) {
    r.nome = topo
      .filter(i => Math.abs(i.y - sexoTopo.y) < 2.5 && i.x < sexoTopo.x)
      .sort((a, b) => a.x - b.x)
      .map(i => i.s)
      .join(' ');
  }
  r.cpf = coluna('CPF').replace(/\D/g, '');
  r.cns = coluna('CNS').replace(/\D/g, '');
  r.nasc = coluna('Data de nascimento');
  r.sexo = N(coluna('Sexo'));
  r.raca = coluna('Raça/cor');
  r.etnia = coluna('Etnia');
  r.mae = coluna('Nome da mãe');
  r.nacionalidade = coluna('Nacionalidade');
  r.tel = coluna('Telefone celular') || coluna('Telefone de contato') || coluna('Telefone residencial');
  r.cep = coluna('CEP').replace(/\D/g, '');
  r.uf = UF_POR_ESTADO[N(coluna('Estado'))] || '';
  r.mun = coluna('Município');
  r.bairro = coluna('Bairro');
  r.logradouro = [coluna('Tipo de logradouro'), coluna('Logradouro')].filter(Boolean).join(' ');
  r.numero = coluna('Número');
  r.complemento = coluna('Complemento');
  r.referencia = coluna('Ponto de referência');
  const unidade = aDireita('Unidade de saúde').match(/^(.*?)\s*-\s*(\d{7})$/);
  if (unidade) {
    r.unidade = unidade[1];
    r.cnes = unidade[2];
  }
  return r;
}

/** Reconhece o tipo de PDF e lê os dados; null quando não é um dos dois. */
export function identificarPdfPec(items) {
  const textos = items.map(i => N(i.s));
  if (textos.includes('dados pessoais') && (textos.includes('residencia') || textos.includes('contatos')))
    return lerCadastroPec(items);
  if (textos.some(s => /^procedimentos? solicitados?$/.test(s)) || textos.includes('nome do cidadao'))
    return lerSolicitacaoPec(items);
  return null;
}

/* ---------- Aplicação no formulário ---------- */

const ABREVIACOES = [
  [/\bresidencial\b/gi, 'Res'],
  [/\bjardim\b/gi, 'Jd'],
  [/\bparque\b/gi, 'Pq'],
  [/\bconjunto\b/gi, 'Cj'],
  [/\bvila\b/gi, 'Vl'],
  [/\bavenida\b/gi, 'Av'],
  [/\btravessa\b/gi, 'Tv'],
  [/\bdoutor(a)?\b/gi, 'Dr'],
  [/\bprofessor(a)?\b/gi, 'Prof'],
  [/\bsanta\b/gi, 'Sta'],
  [/\bsanto\b/gi, 'Sto'],
  [/\bunidade\b/gi, 'Un'],
  [/\brua\b/gi, 'R'],
  [/\b(de|da|do|dos|das)\s/gi, ''],
];

/** Abrevia (e, em último caso, corta) para caber no número de quadradinhos do formulário. */
export function ajustarAoLimite(texto, maximo) {
  let s = String(texto).trim();
  if (!maximo || s.length <= maximo) return { valor: s, situacao: '' };
  for (const [re, por] of ABREVIACOES) {
    s = s.replace(re, por).replace(/\s+/g, ' ').trim();
    if (s.length <= maximo) break;
  }
  if (s.length > maximo) return { valor: s.slice(0, maximo), situacao: 'cortado' };
  return { valor: s, situacao: 'abreviado' };
}

const NOMES_DOS_CAMPOS = {
  nome: 'nome',
  mae: 'nome da mãe',
  logradouro: 'logradouro',
  complemento: 'complemento',
  bairro: 'bairro',
  unidade: 'unidade',
  referencia: 'ponto de referência',
  resp: 'responsável',
  municipio: 'município',
  mun_res: 'município',
};

/**
 * Preenche o formulário com os dados lidos (o primeiro valor encontrado vale).
 * cfg: { dataSolicitacao: seletor, sexoF, sexoM, aoLerProcedimentos(procs, notas, lidos), depois() }
 */
export function aplicarDadosPec(registros, cfg) {
  const R = {};
  const vazio = v => v == null || v === '' || (Array.isArray(v) && !v.length);
  registros.forEach(r =>
    Object.entries(r).forEach(([k, v]) => {
      if (!vazio(v) && vazio(R[k])) R[k] = v;
    }),
  );

  const lidos = [],
    faltam = [],
    notas = [],
    abreviados = [],
    cortados = [];
  const marcar = (ok, rotulo) => (ok ? lidos : faltam).push(rotulo);
  const preencher = (k, v) => {
    const campo = document.querySelector(`[data-f="${k}"]`);
    if (!campo || v == null || v === '') return false;
    const { valor, situacao } = ajustarAoLimite(v, campo.maxLength > 0 ? campo.maxLength : 0);
    if (situacao === 'cortado') cortados.push(k);
    if (situacao === 'abreviado') abreviados.push(k);
    campo.value = valor;
    return true;
  };

  marcar(preencher('nome', R.nome), 'Nome');
  marcar(preencher('mae', R.mae), 'Nome da mãe');
  if (R.cns && R.cns.length === 15) marcar(preencher('cns', R.cns), 'Cartão SUS');
  else faltam.push('Cartão SUS');
  if (R.cpf && R.cpf.length === 11 && preencher('cpf', R.cpf)) lidos.push('CPF');

  const nasc = (R.nasc || '').match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (nasc) {
    document.querySelector('#nasc').value = `${nasc[3]}-${nasc[2]}-${nasc[1]}`;
    lidos.push('Data de nascimento');
  } else faltam.push('Data de nascimento');

  if (R.sexo) {
    const feminino = /^fem/.test(R.sexo);
    const opcao = document.querySelector(feminino ? cfg.sexoF || '#__nenhum' : cfg.sexoM || '#__nenhum');
    if (opcao) {
      opcao.checked = true;
      lidos.push('Sexo');
    }
    if (!feminino) notas.push('O cadastro indica sexo masculino. Confira o pedido.');
  }
  if (R.raca) {
    const procurada = N(R.raca).slice(0, 5);
    const opcao = [...document.querySelectorAll('input[name="raca"]')].find(i =>
      N(i.closest('label').textContent).startsWith(procurada),
    );
    if (opcao) {
      opcao.checked = true;
      lidos.push('Raça/cor');
    }
  } else faltam.push('Raça/cor');
  if (R.etnia) preencher('etnia', R.etnia);
  if (preencher('nacionalidade', R.nacionalidade)) lidos.push('Nacionalidade');

  const tel = (R.tel || '').replace(/\D/g, '');
  if (tel.length >= 10) {
    preencher('ddd', tel.slice(0, 2));
    preencher('tel', tel.slice(2));
    lidos.push('Telefone');
  }
  const temEndereco = preencher('logradouro', R.logradouro);
  preencher('numero', R.numero);
  preencher('complemento', R.complemento);
  preencher('bairro', R.bairro);
  preencher('referencia', R.referencia);
  marcar(temEndereco, 'Endereço');
  if (preencher('mun_res', R.mun)) preencher('uf_res', R.uf);
  if (preencher('cep', R.cep)) lidos.push('CEP');
  if (preencher('codmun_res', R.ibge)) lidos.push('Cód. IBGE');

  if (R.unidade) {
    preencher('unidade', R.unidade);
    preencher('cnes', R.cnes);
    lidos.push('Unidade e CNES');
    const municipioUnidade = R.unimun || R.mun;
    if (municipioUnidade) {
      preencher('municipio', municipioUnidade);
      preencher('uf', R.uniuf || R.uf);
      if (R.ibge && N(municipioUnidade) === N(R.mun || '')) preencher('codmun', R.ibge);
    }
  }
  if (R.prof) {
    preencher('resp', R.prof);
    lidos.push('Responsável');
  }
  if (R.dsol && cfg.dataSolicitacao) {
    document.querySelector(cfg.dataSolicitacao).value = R.dsol;
    lidos.push('Data');
  }
  if (R.procs && R.procs.length && cfg.aoLerProcedimentos) cfg.aoLerProcedimentos(R.procs, notas, lidos);

  const nomes = lista => [...new Set(lista.map(k => NOMES_DOS_CAMPOS[k] || k))].join(', ');
  if (abreviados.length) notas.push('Abreviado para caber nos quadradinhos: ' + nomes(abreviados) + '.');
  if (cortados.length)
    notas.push('<b>Cortado</b> por falta de espaço no formulário: ' + nomes(cortados) + '. Confira.');
  if (cfg.depois) cfg.depois();
  return { lidos, faltam, notas };
}

/**
 * Liga a área de importação (#drop, #pdfIn, #impRes) da página.
 * cfg: o mesmo de aplicarDadosPec, mais campoFaltando: { 'Cartão SUS': seletor, … } para destacar o que faltou.
 */
export function ligarImportacaoCidadaoPec(cfg) {
  configurarLeitorPdf();
  const caixa = document.getElementById('impRes');
  const entrada = document.getElementById('pdfIn');
  const area = document.getElementById('drop');
  const mostrar = html => {
    caixa.hidden = false;
    caixa.innerHTML = html;
  };

  async function importar(arquivos) {
    arquivos = [...arquivos].filter(f => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name));
    if (!arquivos.length) return;
    mostrar('<div class="note">Lendo o PDF…</div>');
    const registros = [],
      naoLidos = [];
    for (const arquivo of arquivos) {
      try {
        if (!leitorPdfDisponivel()) throw new Error('pdf.js indisponível');
        const trechos = await extrairTrechosDoPdf(await arquivo.arrayBuffer());
        const r = trechos.length ? identificarPdfPec(trechos) : null;
        if (r) registros.push(r);
        else naoLidos.push(arquivo.name);
      } catch {
        naoLidos.push(arquivo.name);
      }
    }
    entrada.value = '';
    const nomesNaoLidos = naoLidos.map(n => n.replace(/[<>&"]/g, '')).join(', ');
    if (!registros.length) {
      mostrar(
        `<div class="bad">Não reconheci ${naoLidos.length > 1 ? 'estes arquivos' : 'este arquivo'}. Use a solicitação de exame ou a tela de informações do cidadão impressas pelo e-SUS PEC.</div>`,
      );
      return;
    }
    const { lidos, faltam, notas } = aplicarDadosPec(registros, cfg);
    const tipos = [
      ...new Set(registros.map(r => (r.origem === 'cadastro' ? 'cadastro do cidadão' : 'solicitação de exame'))),
    ].join(' + ');
    document.querySelectorAll('.miss').forEach(e => e.classList.remove('miss'));
    faltam.forEach(rotulo => {
      const seletor = (cfg.campoFaltando || {})[rotulo];
      const campo = seletor && document.querySelector(seletor);
      if (campo) campo.classList.add('miss');
    });
    const dica =
      faltam.includes('Cartão SUS') && !registros.some(r => r.origem === 'cadastro')
        ? ' O Cartão SUS e a raça/cor vêm no PDF do cadastro do cidadão; carregue ele também.'
        : '';
    mostrar(
      `<div class="okbox"><b>Lido: ${tipos}.</b> Preenchido: ${lidos.join(', ')}.</div>` +
        (faltam.length ? `<div class="warn"><b>Falta preencher:</b> ${faltam.join(', ')}.${dica}</div>` : '') +
        (notas.length ? `<div class="warn">${notas.join('<br>')}</div>` : '') +
        (naoLidos.length ? `<div class="bad">Não reconheci: ${nomesNaoLidos}.</div>` : ''),
    );
    mostrarMensagem('Dados importados');
  }

  entrada.addEventListener('change', e => {
    e.stopPropagation();
    importar(e.target.files);
  });
  ['dragenter', 'dragover'].forEach(t =>
    area.addEventListener(t, e => {
      e.preventDefault();
      area.classList.add('over');
    }),
  );
  ['dragleave', 'drop'].forEach(t =>
    area.addEventListener(t, e => {
      e.preventDefault();
      area.classList.remove('over');
    }),
  );
  area.addEventListener('drop', e => importar(e.dataTransfer.files));
  document.addEventListener(
    'input',
    e => {
      if (e.target.classList.contains('miss')) e.target.classList.remove('miss');
    },
    true,
  );
}

/** Esconde o resultado da importação e os destaques (usado em "Nova paciente"). */
export function limparImportacaoCidadaoPec() {
  const caixa = document.getElementById('impRes');
  if (caixa) caixa.hidden = true;
  document.querySelectorAll('.miss').forEach(e => e.classList.remove('miss'));
}
