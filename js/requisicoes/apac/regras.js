/**
 * Regras da APAC de exames de alto custo: código SIGTAP, lista final de procedimentos
 * e campos obrigatórios. Funções puras, sem acesso à página.
 */
import { EXAMES_POR_ID } from './catalogo.js';

/** Confere o dígito verificador de um código SIGTAP de 10 dígitos (módulo 11). */
export function codigoSigtapValido(codigo) {
  if (!/^\d{10}$/.test(codigo)) return false;
  let total = 0;
  for (let i = 0; i < 9; i++) total += +codigo[i] * (10 - i);
  let dv = 11 - (total % 11);
  if (dv >= 10) dv = 0;
  return dv === +codigo[9];
}

/** 0206010079 → 02.06.01.007-9 */
export function formatarCodigoSigtap(codigo) {
  return codigo.length === 10
    ? `${codigo.slice(0, 2)}.${codigo.slice(2, 4)}.${codigo.slice(4, 6)}.${codigo.slice(6, 9)}-${codigo[9]}`
    : codigo;
}

/**
 * Lista final de procedimentos do laudo (pode passar de 6; o laudo imprime só os 6 primeiros).
 * @param {Array} linhas [{ item, contraste ('com'|'sem'|'na'|''), lado, quantidade, codigoManual, nomeManual }]
 */
export function procedimentosDoLaudo(linhas) {
  const saida = [];
  linhas.forEach(linha => {
    const { item, contraste } = linha;
    if (!item) return;
    if (item.c === 'sim' && contraste !== 'com') return; // exame só com contraste e não confirmado
    const sufixo =
      (linha.lado ? ' - ' + linha.lado : '') +
      (contraste === 'com' ? ' - COM CONTRASTE' : contraste === 'sem' ? ' - SEM CONTRASTE' : '');
    const q = linha.quantidade || '1';
    if (item.id === 'manual') {
      const nome = linha.nomeManual.trim().toLocaleUpperCase('pt-BR');
      if (linha.codigoManual || nome) saida.push({ code: linha.codigoManual, name: nome + sufixo, q });
      return;
    }
    saida.push({ code: item.code, name: item.name + sufixo, q });
    if (item.par) {
      const par = EXAMES_POR_ID[item.par];
      saida.push({ code: par.code, name: par.name + sufixo, q });
    }
  });
  return saida;
}

/** Aviso quando há mais procedimentos do que as 6 linhas do laudo (ou ''). */
export function avisoExcessoDeProcedimentos(quantidade) {
  return quantidade > 6
    ? `São ${quantidade} procedimentos, mas o laudo só tem 6 linhas. Os excedentes não serão impressos; faça um segundo laudo para eles.`
    : '';
}

/**
 * Campos obrigatórios em branco.
 * @param {object} d { estabelecimento, v (valores dos campos), nasc, sexoF, sexoM, dsol, procedimentos, linhas }
 */
export function pendenciasApac(d) {
  const { v } = d,
    m = [];
  if (!d.estabelecimento) m.push('Estabelecimento solicitante');
  if (!v.nome) m.push('Nome do paciente');
  if (v.cns.length !== 15) m.push('CNS (15 dígitos)');
  if (!d.nasc) m.push('Data de nascimento');
  if (!d.sexoF && !d.sexoM) m.push('Sexo');
  if (!v.mae) m.push('Nome da mãe');
  if (!v.end) m.push('Endereço');
  if (!v.mun) m.push('Município');
  if (!d.procedimentos.length) m.push('Exame solicitado');
  d.linhas.forEach((linha, i) => {
    if (linha.item && linha.item.lat && !linha.lado) m.push(`Lado do exame ${i + 1}`);
    if (linha.item && linha.item.id === 'manual' && !codigoSigtapValido(linha.codigoManual))
      m.push(`Código SIGTAP do exame ${i + 1}`);
  });
  if (!v.diag) m.push('Descrição do diagnóstico');
  if (!v.cid1) m.push('CID-10 principal');
  if (!v.obs) m.push('Observações');
  if (!v.prof) m.push('Profissional solicitante');
  if (!d.dsol) m.push('Data da solicitação');
  if (!v.profdoc) m.push('Documento do profissional');
  return m;
}
