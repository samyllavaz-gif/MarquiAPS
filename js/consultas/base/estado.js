/**
 * Estado da base da consulta (dados comuns, queixas do dia e HiperDia): valores marcados (state),
 * tipos marcados (sessao.tipos) e texto SOAP (soapBase = só a base · soap = base + módulos, o que é copiado).
 * O objeto state é único e compartilhado; substituirEstado() troca o conteúdo sem trocar a referência.
 */
import { finalizarFrase } from '../../utils/texto.js';
import { NEG } from './dados.js';

export const blankDg = () => ({
  on: false,
  sint: {},
  prev: [],
  alarme: [],
  choque: [],
  esp: [],
  gest: '',
  contato: '',
  viagem: '',
  orient: [],
  liq: '',
  atest: '',
  inc: true,
});
export const blank = () => ({
  chips: { ant: [], risco: [], prior: [], orient: [], alarme: [], prev: [] },
  na: {},
  cron: {},
  presc: [{ m: '', p: '', d: '' }],
  alergia: '',
  semMeds: false,
  q: [],
  dg: blankDg(),
  hd: {
    ath: [],
    cond: [],
    ear: [],
    emar: [],
    agr: [],
    sexo: '',
    dm: '',
    tab: '',
    antiht: '',
    estatina: '',
    dcv: '',
    deform: '',
    ulcprev: '',
    amput: '',
    ulcativa: '',
    feet: { d: {}, e: {} },
    fr: {},
    inc: { rcv: true, tfg: true, pe: true, fr: true },
    tab_: 'rcv',
  },
});
export const state = blank();
export const sessao = { tipos: [], iniciada: false };
/** O tipo de consulta está marcado? (queixas, hiperdia, mulher, prenatal…) */
export const temTipo = id => sessao.tipos.includes(id);
export const soapBase = { S: '', O: '', A: '', P: '' };
export const soap = { S: '', O: '', A: '', P: '' };

/** Troca todo o conteúdo de state pelo de `novo` (mesmo objeto, novos valores). */
export function substituirEstado(novo) {
  for (const k of Object.keys(state)) delete state[k];
  Object.assign(state, novo);
}

export const v = id => {
  const e = document.getElementById(id);
  return e ? e.value.trim() : '';
};
export const chronic = () => state.chips.ant.filter(c => c !== NEG.ant);
export const list = (arr, obs) => [arr.join(', '), obs].filter(Boolean).join('. ');
export function line(arr, label, text) {
  if (text) arr.push(label ? `${label}: ${finalizarFrase(text)}` : finalizarFrase(text));
}
