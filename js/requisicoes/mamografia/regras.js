/**
 * Regras das requisições do SISCAN (mamografia e citopatológico):
 * capacidade dos campos, distribuição do texto nos quadradinhos, faixas etárias de rastreamento
 * e campos obrigatórios. Funções puras, sem acesso à página.
 */
import { FOLHAS_SISCAN } from './mapa.js';

/** Número de quadradinhos de um campo na folha X ('m' ou 'c'). */
function celulasDoCampo(folha, id) {
  const campo = FOLHAS_SISCAN[folha].fields.find(f => f.id === id);
  return campo ? campo.combs.reduce((n, c) => n + c.length - 2, 0) : 0;
}

/** Limite de caracteres do campo (o menor entre as duas requisições, quando existe nas duas). */
export function limiteDeCaracteres(id) {
  const a = celulasDoCampo('m', id),
    b = celulasDoCampo('c', id);
  return a && b ? Math.min(a, b) : a || b;
}

/**
 * Ajusta o texto de um campo de duas linhas de quadradinhos para não quebrar palavras
 * entre a primeira e a segunda linha.
 */
export function distribuirTextoEmLinhas(texto, campo, folha) {
  let s = texto;
  if (campo.t === 'txt' && campo.combs.length > 1) {
    const L1 = campo.combs[0].length - 2,
      total = celulasDoCampo(folha, campo.id);
    if (s.length > L1 && s[L1 - 1] !== ' ' && s[L1] !== ' ') {
      const espaco = s.lastIndexOf(' ', L1 - 1);
      if (espaco > 0) {
        const t = s.slice(0, espaco).padEnd(L1, ' ') + s.slice(espaco + 1);
        if (t.length <= total) s = t;
      }
    } else if (s[L1] === ' ') s = s.slice(0, L1) + s.slice(L1 + 1);
  }
  return s;
}

/** Avisos de idade fora da população-alvo do rastreamento (ou ''). */
export function avisoIdadeMamografia(idadeTexto, rastreamento) {
  const n = +idadeTexto;
  return idadeTexto !== '' && rastreamento && (n < 50 || n > 69)
    ? `A paciente tem ${n} anos. A população alvo do rastreamento de mama é de 50 a 69 anos.`
    : '';
}
export function avisoIdadeCitopatologico(idadeTexto, rastreamento) {
  const n = +idadeTexto;
  return idadeTexto !== '' && rastreamento && (n < 25 || n > 64)
    ? `A paciente tem ${n} anos. O rastreamento do colo do útero é indicado de 25 a 64 anos para mulheres que já tiveram atividade sexual.`
    : '';
}

/**
 * Campos obrigatórios em branco.
 * @param {object} d { v, on (Set de caixas 'm:n'/'c:id'), mamografia, citopatologico, nasc, dt, dum }
 */
export function pendenciasSiscan(d) {
  const { v, on } = d,
    m = [];
  const algum = caixas => caixas.some(b => on.has(b));
  if (!d.mamografia && !d.citopatologico) return ['Escolha pelo menos um exame'];
  if (!v.cns) m.push('Cartão SUS');
  if (!v.nome) m.push('Nome');
  if (!v.mae) m.push('Nome da mãe');
  if (!d.nasc) m.push('Data de nascimento');
  if (d.mamografia) {
    const mm = [];
    if (!algum(['m:12', 'm:14', 'm:16'])) mm.push('1');
    if (!algum(['m:19', 'm:20', 'm:21'])) mm.push('2');
    if (!algum(['m:22', 'm:23', 'm:24'])) mm.push('3');
    if (!algum(['m:25', 'm:26', 'm:27'])) mm.push('4');
    if (!algum(['m:13', 'm:15', 'm:17', 'm:18'])) mm.push('5');
    if (!on.has('m:28') && !Object.keys(v).some(k => k.startsWith('cir_') && v[k])) mm.push('6');
    if (!algum(['m:137', 'm:138', 'm:139', 'm:29', 'm:80', 'm:81', 'm:82', 'm:113', 'm:114']))
      mm.push('indicação clínica');
    if (mm.length) m.push('Mamografia: ' + mm.join(', '));
  }
  if (d.citopatologico) {
    const cc = [];
    if (!algum(['c:mot_ras', 'c:mot_rep', 'c:mot_seg'])) cc.push('1');
    ['q2', 'q3', 'q4', 'q5', 'q6', 'q7'].forEach((q, i) => {
      if (!algum(['c:' + q + '_sim', 'c:' + q + '_nao', 'c:' + q + '_ns'])) cc.push(String(i + 2));
    });
    if (!on.has('c:q8_ns') && !d.dum) cc.push('8');
    if (!algum(['c:q9_sim', 'c:q9_nao'])) cc.push('9');
    if (!algum(['c:q10_sim', 'c:q10_nao'])) cc.push('10');
    if (!algum(['c:q11_normal', 'c:q11_ausente', 'c:q11_alterado', 'c:q11_nv'])) cc.push('11');
    if (cc.length) m.push('Citopatológico: ' + cc.join(', '));
  }
  if (!d.dt) m.push('Data');
  if (!v.resp) m.push('Responsável');
  return m;
}

/**
 * Exames da solicitação importada do PEC (códigos SIGTAP 02.04.03 = mamografia, 02.03.01 = citopatológico).
 * 02.04.03.003-0 é a mamografia diagnóstica (unilateral); as demais entram como rastreamento.
 */
export function examesDaSolicitacao(procedimentos) {
  const m = procedimentos.find(p => /^020403/.test(p.code) || /mamograf/i.test(p.name));
  const c = procedimentos.find(p => /^020301/.test(p.code) || /citopatol|papanicol|preventivo/i.test(p.name));
  return { mamografia: !!m, citopatologico: !!c, mamografiaDiagnostica: !!m && m.code === '0204030030' };
}
