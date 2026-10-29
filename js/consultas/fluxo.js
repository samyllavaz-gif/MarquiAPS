import { sessao, soap, state, v } from './base/estado.js';

let etapa = 'S';
let todas = false;
let iniciado = false;
const ids = { S: 'sec-s', O: 'sec-o', A: 'sec-a', P: 'sec-p' };
function mostrarEtapa() {
  for (const [letra, id] of Object.entries(ids)) {
    document.getElementById(id).hidden = !todas && etapa !== letra;
  }
  document.getElementById('sec-hd').hidden = !sessao.tipos.includes('hiperdia') || (!todas && etapa !== 'O');
  document.querySelectorAll('[data-etapa]').forEach(b => b.setAttribute('aria-pressed', String(!todas && etapa === b.dataset.etapa)));
  document.getElementById('ver-todas').setAttribute('aria-pressed', String(todas));
}
export function reiniciarFluxo() {
  etapa = 'S';
  todas = false;
}
export function iniciarFluxo() {
  if (iniciado) return;
  iniciado = true;
  document.querySelectorAll('[data-etapa]').forEach(b => b.addEventListener('click', () => {
    etapa = b.dataset.etapa;
    todas = false;
    mostrarEtapa();
  }));
  document.getElementById('ver-todas').addEventListener('click', () => {
    todas = !todas;
    mostrarEtapa();
  });
  document.getElementById('form').addEventListener('click', e => {
    const link = e.target.closest('a[href="#dados-antecedentes"], a[href="#dados-habitos"]');
    if (!link) return;
    e.preventDefault();
    etapa = 'S';
    todas = false;
    mostrarEtapa();
    const alvo = document.querySelector(link.getAttribute('href'));
    alvo.scrollIntoView({ behavior: 'smooth', block: 'center' });
    alvo.querySelector('button, input')?.focus({ preventScroll: true });
  });
}
export function atualizarFluxo() {
  if (!iniciado) return;
  mostrarEtapa();
  const n = Object.values(soap).filter(Boolean).length;
  document.getElementById('resumo-consulta').textContent = `${n} de 4 blocos com registro · ${sessao.tipos.length} roteiro(s) selecionado(s)`;
  const notas = [];
  const lembrar = (texto, id, letra) => notas.push({ texto, id, letra });
  if (!v('f-motivo') && !v('f-hda') && !soap.S) lembrar('Registre o motivo ou a história da consulta.', 'f-motivo', 'S');
  if (state.alergia === 'sim' && !v('f-alergia-txt')) lembrar('Especifique a alergia e a reação referida.', 'f-alergia-txt', 'S');
  if (v('sv-peso') && !v('sv-alt')) lembrar('Falta a altura para calcular o IMC.', 'sv-alt', 'O');
  if (v('sv-alt') && !v('sv-peso')) lembrar('Falta o peso para calcular o IMC.', 'sv-peso', 'O');
  if (v('hd-cr') && sessao.tipos.includes('hiperdia') && (!v('hd-idade') || !state.hd.sexo)) lembrar('Informe idade e sexo para o cálculo da função renal.', 'hd-idade', 'S');
  if (!soap.A) lembrar('A avaliação ainda está sem registro.', 'f-aval', 'A');
  if (!soap.P) lembrar('O plano ainda está sem registro.', 'f-conduta', 'P');
  for (const grupo of ['ant', 'risco']) {
    const itens = state.chips[grupo];
    if (itens.some(x => x.startsWith('Nega ')) && itens.some(x => !x.startsWith('Nega '))) {
      lembrar('Revise a opção “Nega” junto de antecedentes ou hábitos assinalados.', grupo === 'ant' ? 'f-ant-obs' : 'f-risco-obs', 'S');
    }
  }
  const lista = document.getElementById('pendencias-consulta');
  lista.replaceChildren();
  notas.forEach(({ texto, id, letra }) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pendencia-link';
    b.textContent = texto;
    b.onclick = () => {
      etapa = letra;
      todas = false;
      mostrarEtapa();
      const alvo = document.getElementById(id);
      alvo.scrollIntoView({ behavior: 'smooth', block: 'center' });
      alvo.focus({ preventScroll: true });
    };
    li.appendChild(b);
    lista.appendChild(li);
  });
  if (!notas.length) {
    const li = document.createElement('li');
    li.textContent = 'Sem lembretes de preenchimento. Revise o texto antes de copiar.';
    lista.appendChild(li);
  }
  // Mostra quantos registros existem mesmo com o roteiro recolhido.
  document.querySelectorAll('.roteiro-detalhe').forEach(d => {
    const n = d.querySelectorAll('input, textarea').length;
    const preenchidos = [...d.querySelectorAll('input, textarea')].filter(i => i.type === 'checkbox' ? i.checked : i.value.trim()).length;
    const marcados = d.querySelectorAll('[aria-pressed="true"], [data-s="+"], [data-s="-"], [data-s="?"]').length;
    const alertas = d.querySelectorAll('.tri.al[data-s="+"]').length;
    d.querySelector('summary').dataset.resumo = alertas ? `${alertas} alerta(s) assinalado(s) — revisar` : preenchidos + marcados ? `${preenchidos + marcados} registro(s)` : n ? 'Abrir para preencher' : 'Abrir roteiro';
  });
}

/** Abre a etapa e os detalhes, sem responder perguntas clínicas automaticamente. */
export function irParaFerramenta(seletor) {
  const alvo = document.querySelector(seletor);
  if (!alvo) return false;
  const secao = alvo.closest('section.sec');
  etapa = secao?.id === 'sec-hd' ? 'O' : Object.keys(ids).find(k => ids[k] === secao?.id) || 'S';
  todas = false;
  mostrarEtapa();
  let pai = alvo.parentElement;
  while (pai) {
    if (pai.tagName === 'DETAILS') pai.open = true;
    pai = pai.parentElement;
  }
  const condicional = alvo.closest('.mgrp-b[hidden]');
  const destino = condicional ? condicional.parentElement.querySelector('.mgrp-h') : alvo;
  if (alvo.matches('[data-tab]')) alvo.click();
  destino.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const foco = destino.matches('button, input, select, textarea') ? destino : destino.querySelector('button, input, select, textarea, summary');
  foco?.focus({ preventScroll: true });
  return true;
}
