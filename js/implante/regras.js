/**
 * Regras do roteiro de inserção do implante subdérmico (etonogestrel).
 * Funções puras: recebem dados já lidos do formulário e devolvem resultados,
 * sem acessar a página. A interface fica em js/implante/app.js.
 */
/** Classificação do IMC (OMS) usada no roteiro. */
function classificarImcImplante(imc) {
  if (imc < 18.5) return 'Baixo peso';
  if (imc < 25) return 'Eutrofia';
  if (imc < 30) return 'Sobrepeso';
  if (imc < 35) return 'Obesidade grau I';
  if (imc < 40) return 'Obesidade grau II';
  return 'Obesidade grau III';
}

/** IMC a partir do peso (kg) e da altura (m); null se faltar algum valor. */
export function calcularImcImplante(pesoTexto, alturaTexto) {
  const peso = parseFloat(pesoTexto),
    altura = parseFloat(alturaTexto);
  if (!peso || !altura) return null;
  const imc = peso / (altura * altura);
  return { valor: imc.toFixed(1), classe: classificarImcImplante(imc) };
}

/** Idade em anos completos a partir da data de nascimento (aaaa-mm-dd). Texto "N anos" ou ''. */
export function idadeEmAnosTexto(dataNascimento, hoje = new Date()) {
  if (!dataNascimento) return '';
  const nascimento = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const meses = hoje.getMonth() - nascimento.getMonth();
  if (meses < 0 || (meses === 0 && hoje.getDate() < nascimento.getDate())) idade--;
  return isFinite(idade) && idade >= 0 ? idade + ' anos' : '';
}

/** Data prevista de retirada: inserção + 3 anos (aaaa-mm-dd). */
export function dataRetiradaPrevista(dataInsercao) {
  if (!dataInsercao) return '';
  const data = new Date(dataInsercao + 'T00:00:00');
  data.setFullYear(data.getFullYear() + 3);
  return data.toISOString().slice(0, 10);
}

/** Converte aaaa-mm-dd em dd/mm/aaaa. */
function dataIsoParaBr(texto) {
  if (!texto) return '';
  const partes = texto.split('-');
  if (partes.length !== 3) return texto;
  return partes[2] + '/' + partes[1] + '/' + partes[0];
}

/**
 * Estimativa do risco de gravidez antes da inserção.
 * @param {object} c critérios: testeFeito ('sim'|'nao'|''), resultado ('positivo'|'negativo'|''),
 *   menstruada, menstruou7, usoCorreto, relacaoDesprotegida, posParto, amenorreia (booleanos)
 * @returns {{nivel:'ok'|'warn'|'danger', percentual:string, descricao:string}}
 */
export function avaliarRiscoGravidez(c) {
  const algum = c.menstruada || c.menstruou7 || c.usoCorreto || c.relacaoDesprotegida || c.posParto || c.amenorreia;
  const r = (nivel, percentual, descricao) => ({ nivel, percentual, descricao });
  if (c.testeFeito === 'sim' && c.resultado === 'negativo')
    return r('ok', '0%', 'Gravidez descartada pelo teste rápido de gravidez.');
  if (c.testeFeito === 'sim' && c.resultado === 'positivo')
    return r('danger', '100%', 'Teste rápido positivo — gestação confirmada. Não inserir o implante.');
  if (c.relacaoDesprotegida && !c.menstruada && !c.menstruou7)
    return r(
      'danger',
      '≈ 40–60%',
      'Relação desprotegida recente, sem outro critério de razoável certeza atendido — risco elevado. Recomenda-se teste rápido de gravidez antes de inserir.',
    );
  if (c.menstruada || c.menstruou7)
    return r('ok', '< 1%', 'Critério de razoável certeza atendido (menstruação atual ou nos últimos 7 dias).');
  if (c.amenorreia && !c.relacaoDesprotegida)
    return r('ok', '≈ 2%', 'Critério de amenorreia lactacional (LAM) atendido.');
  if (c.usoCorreto && !c.relacaoDesprotegida)
    return r('ok', '≈ 1–5%', 'Uso correto e consistente do método contraceptivo atual referido.');
  if (c.posParto && !c.amenorreia)
    return r(
      'warn',
      '≈ 10–20%',
      'Pós-parto sem confirmação de amenorreia exclusiva — avaliar com cautela, considerar teste rápido.',
    );
  if (!algum)
    return r(
      'warn',
      'indeterminado',
      'Nenhum critério de razoável certeza assinalado — recomenda-se realizar teste rápido de gravidez.',
    );
  return r('warn', '≈ 5–15%', 'Critérios parciais atendidos — avalie a necessidade de teste rápido de gravidez.');
}

/**
 * Alertas de segurança exibidos durante o preenchimento.
 * @param {object} d radios (testeresultado, temabsoluta, temrelativa, usaindutor, palpavel, inseridosucesso)
 *   e contagens (absolutas, relativas, indutores)
 */
export function avaliarAlertasImplante(d) {
  const absoluta = d.temabsoluta === 'sim' || d.absolutas > 0;
  const relativa = d.temrelativa === 'sim' || d.relativas > 0;
  return {
    gravidez: d.testeresultado === 'positivo',
    absoluta,
    relativa: !absoluta && relativa,
    elegivel: !absoluta && !relativa,
    indutor: d.usaindutor === 'sim' || d.indutores > 0,
    naoInserido: d.palpavel === 'nao' || d.inseridosucesso === 'nao',
  };
}

function juntarLista(itens, vazio) {
  if (!itens.length) return vazio || 'nenhum registrado';
  return itens.join('; ');
}

/**
 * Monta o texto SOAP da consulta de inserção.
 * @param {object} d dados do formulário:
 *   valores (id → texto), radios (nome → valor), marcados (id → booleano),
 *   listas (grupo → rótulos marcados: anteriores, indutores, braco, absolutas, relativas, orientacoes, posProcedimento),
 *   imc ({valor, classe} ou null)
 * @returns {{S:string,O:string,A:string,P:string}}
 */
export function montarSoapImplante(d) {
  const val = id => (d.valores[id] || '').trim();
  const radio = nome => d.radios[nome] || '';
  const marcado = id => !!d.marcados[id];
  const lista = nome => [...(d.listas[nome] || [])];

  const nome = val('f_nome') || 'Usuária';
  const idade = val('f_idade');
  const motivo =
    val('f_motivo') ||
    'Busca método contraceptivo de longa duração; solicita inserção do implante subdérmico de etonogestrel.';

  // --- S ---
  const s = [];
  s.push(
    nome +
      (idade ? ' (' + idade + ')' : '') +
      ' comparece à consulta de enfermagem/médica para planejamento reprodutivo.',
  );
  s.push('Motivo: ' + motivo);

  const gine = [];
  if (val('f_menarca')) gine.push('menarca aos ' + val('f_menarca') + ' anos');
  if (val('f_dum')) gine.push('DUM ' + dataIsoParaBr(val('f_dum')));
  const ciclo = radio('ciclo');
  if (ciclo) gine.push('ciclos ' + ciclo);
  const gpa = [];
  if (val('f_gesta')) gpa.push('G' + val('f_gesta'));
  if (val('f_partos')) gpa.push('PN' + val('f_partos'));
  if (val('f_cesareas')) gpa.push('C' + val('f_cesareas'));
  if (val('f_abortos')) gpa.push('A' + val('f_abortos'));
  if (gpa.length) gine.push(gpa.join(' '));
  const amament = radio('amament');
  if (amament) gine.push('amamentando: ' + (amament === 'sim' ? 'sim' : 'não'));
  const ist = radio('ist');
  if (ist === 'sim') gine.push('história de IST (' + (val('f_ist_qual') || 'não especificada') + ')');
  else if (ist === 'nao') gine.push('nega história de IST');
  if (val('f_citopat_data'))
    gine.push(
      'último citopatológico em ' +
        dataIsoParaBr(val('f_citopat_data')) +
        (val('f_citopat_res') ? ' — ' + val('f_citopat_res') : ''),
    );
  if (gine.length) s.push('História ginecológica/obstétrica: ' + gine.join('; ') + '.');

  const contr = [];
  if (val('f_metodoatual'))
    contr.push(
      'método atual: ' + val('f_metodoatual') + (val('f_tempouso') ? ' (uso há ' + val('f_tempouso') + ')' : ''),
    );
  const anteriores = lista('anteriores');
  if (anteriores.length) contr.push('já utilizou: ' + anteriores.join(', '));
  if (val('f_metodo_outro')) contr.push('outro método prévio: ' + val('f_metodo_outro'));
  if (val('f_motivotroca')) contr.push('motivo da troca: ' + val('f_motivotroca'));
  if (contr.length) s.push('História contraceptiva: ' + contr.join('; ') + '.');

  const descarte = [];
  if (marcado('c_menstruada')) descarte.push('está menstruada atualmente');
  if (marcado('c_menstruou7')) descarte.push('menstruou nos últimos 7 dias');
  if (marcado('c_usoucorreto')) descarte.push('uso correto do método atual');
  if (marcado('c_relacaodesp')) descarte.push('relata relação desprotegida recente');
  if (marcado('c_posparto')) descarte.push('está no pós-parto');
  if (marcado('c_amenorreia')) descarte.push('amenorreia por amamentação exclusiva');
  if (descarte.length) s.push('Descarte de gravidez (critérios referidos): ' + descarte.join('; ') + '.');

  const meds = lista('indutores');
  if (val('f_medoutros')) meds.push(val('f_medoutros'));
  s.push('Medicamentos em uso: ' + juntarLista(meds, 'nega uso de medicamentos') + '.');

  // --- O ---
  const o = [];
  const vitais = [];
  if (val('f_pa')) vitais.push('PA ' + val('f_pa') + ' mmHg');
  if (val('f_fc')) vitais.push('FC ' + val('f_fc') + ' bpm');
  if (val('f_peso')) vitais.push('peso ' + val('f_peso') + ' kg');
  if (val('f_altura')) vitais.push('altura ' + val('f_altura') + ' m');
  if (d.imc) vitais.push('IMC ' + d.imc.valor + ' (' + d.imc.classe + ')');
  if (vitais.length) o.push('Sinais vitais/antropometria: ' + vitais.join(', ') + '.');

  const bracoAlt = lista('braco');
  if (val('f_bracoalt')) bracoAlt.push(val('f_bracoalt'));
  o.push('Avaliação do braço não dominante: ' + juntarLista(bracoAlt, 'sem alterações') + '.');

  const teste = radio('testerapido');
  if (teste === 'sim')
    o.push('Teste rápido de gravidez realizado — resultado: ' + (radio('testeresultado') || 'não registrado') + '.');
  else if (teste === 'nao')
    o.push(
      'Teste rápido de gravidez não realizado; razoável certeza de ausência de gravidez conforme critérios do subjetivo.',
    );

  const absolutas = lista('absolutas');
  const relativas = lista('relativas');
  o.push('Contraindicações absolutas: ' + juntarLista(absolutas, 'nenhuma') + '.');
  o.push('Contraindicações relativas: ' + juntarLista(relativas, 'nenhuma') + '.');

  const proc = [];
  const braco = radio('braco');
  if (braco) proc.push('braço ' + braco + ' (não dominante)');
  const dominancia = radio('dominancia');
  if (dominancia) proc.push(dominancia);
  if (radio('localmarcado') === 'sim')
    proc.push('local identificado e marcado (8–10 cm do epicôndilo medial, 3–5 cm do sulco entre bíceps e tríceps)');
  if (radio('anestesia') === 'sim')
    proc.push('anestesia local: ' + (val('f_anestesico') || 'lidocaína local, sem vasoconstritor'));
  if (radio('inseridosucesso') === 'sim') proc.push('implante inserido com técnica asséptica, sem intercorrências');
  else if (radio('inseridosucesso') === 'nao') proc.push('inserção NÃO confirmada com sucesso — reavaliar');
  if (radio('palpavel') === 'sim')
    proc.push('implante palpável ao final do procedimento, bastão de 4 cm confirmado em ambas as extremidades');
  if (radio('usuariapalpou') === 'sim') proc.push('usuária confirmou a palpação do dispositivo');
  if (radio('curativo') === 'sim') proc.push('realizado curativo compressivo estéril');
  if (proc.length) o.push('Procedimento de inserção: ' + proc.join('; ') + '.');

  // --- A ---
  const a = [];
  const temAbsoluta = radio('temabsoluta') === 'sim' || absolutas.length > 0;
  const temRelativa = radio('temrelativa') === 'sim' || relativas.length > 0;
  if (temAbsoluta) {
    a.push(
      'Usuária NÃO elegível para o implante subdérmico no momento: contraindicação absoluta (categoria 4)' +
        (absolutas.length ? ' — ' + absolutas.join(', ') : '') +
        '. Orientado método contraceptivo alternativo.',
    );
  } else {
    let elegibilidade = 'Usuária elegível para uso do implante subdérmico de etonogestrel';
    if (temRelativa)
      elegibilidade +=
        ', com contraindicação(ões) relativa(s) (categoria 3)' +
        (relativas.length ? ' — ' + relativas.join(', ') : '') +
        ' — avaliada(s) e aceita(s) como última escolha, com acompanhamento rigoroso';
    elegibilidade += ', após avaliação clínica e descarte de gravidez.';
    a.push(elegibilidade);
  }
  if (radio('tclelido') === 'sim')
    a.push(
      'TCLE lido e explicado; dúvidas esclarecidas quanto a método, eficácia, duração, efeitos adversos e possibilidade de remoção a qualquer momento.',
    );
  if (radio('tcleassinado') === 'sim') a.push('TCLE assinado pela usuária.');
  if (radio('inseridosucesso') === 'sim' && radio('palpavel') === 'sim') {
    a.push('Implante inserido com sucesso e palpável ao término do procedimento, sem sinais de complicação imediata.');
  } else if (radio('palpavel') === 'nao' || radio('inseridosucesso') === 'nao') {
    a.push(
      'Pendência na confirmação da inserção/palpação do implante — necessária reavaliação antes de liberar a usuária.',
    );
  }

  // --- P ---
  const p = [];
  const orientacoes = lista('orientacoes');
  if (orientacoes.length) p.push('Orientações fornecidas: ' + orientacoes.join('; ') + '.');
  const pos = lista('posProcedimento');
  if (pos.length) p.push('Orientações pós-procedimento: ' + pos.join('; ') + '.');
  if (val('f_lote') || val('f_validade')) {
    p.push(
      'Registro do dispositivo: lote ' +
        (val('f_lote') || '—') +
        ', validade ' +
        (val('f_validade') ? dataIsoParaBr(val('f_validade')) : '—') +
        (val('f_datainsercao') ? ', inserido em ' + dataIsoParaBr(val('f_datainsercao')) : '') +
        (val('f_dataretirada') ? ', retirada prevista para ' + dataIsoParaBr(val('f_dataretirada')) : '') +
        '.',
    );
  }
  if (radio('cartaoentregue') === 'sim') p.push('Cartão de identificação do implante entregue à usuária.');
  p.push('Reforçado uso de preservativo em todas as relações — implante não protege contra IST.');
  if (val('f_dataretirada'))
    p.push(
      'Agendado/orientado retorno até ' +
        dataIsoParaBr(val('f_dataretirada')) +
        ' para avaliação de retirada ou troca; retorno antecipado se dor, sangramento incomum ou impossibilidade de palpar o implante.',
    );

  return { S: s.join('\n'), O: o.join('\n'), A: a.join('\n'), P: p.join('\n') };
}

/** Junta os quatro blocos no formato copiado pelo botão "Copiar SOAP completo". */
export function soapImplanteCompleto(soap) {
  return (
    'S (SUBJETIVO)\n' +
    soap.S +
    '\n\nO (OBJETIVO)\n' +
    soap.O +
    '\n\nA (AVALIAÇÃO)\n' +
    soap.A +
    '\n\nP (PLANO)\n' +
    soap.P
  );
}
