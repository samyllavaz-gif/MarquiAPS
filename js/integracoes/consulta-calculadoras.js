import { CHAVES } from '../config.js';

export const PREFIXO_ENVIO = 'marqui-envio-';
export const PREFIXO_RETORNO = 'marqui-retorno-';
export const PRAZO = 2 * 60 * 60 * 1000;
const numero = x => {
  const s = String(x ?? '').trim().replace(',', '.');
  return s && /^\d+(?:\.\d+)?$/.test(s) ? Number(s) : null;
};
export function mapearDados({ base = {}, modulos = {} } = {}) {
  const t = base.t || {}, hd = base.state?.hd || {};
  const campos = {};
  const copiar = (origem, destinos, transformar = x => x) => {
    const n = numero(origem);
    if (n === null) return;
    const valor = String(transformar(n));
    destinos.forEach(id => { campos[id] = valor; });
  };
  copiar(t['hd-idade'], ['drc_idade', 'cv_idade', 'dm_idade']);
  copiar(t['sv-peso'], ['dm_peso', 'dz_peso', 'ped_peso']);
  const altura = numero(t['sv-alt']);
  if (altura > 0 && altura <= 3) {
    campos.dm_altura = campos.ped_altura = String(Math.round(altura * 10000) / 100);
    const peso = numero(t['sv-peso']);
    if (peso > 0) campos.cv_imc = String(Math.round(peso / altura ** 2 * 100) / 100);
  }
  copiar(t['hd-cr'], ['drc_creat']);
  copiar(t['hd-ct'], ['cv_ct']);
  copiar(t['hd-hdl'], ['cv_hdl']);
  copiar(t['hd-ldl'], ['cv_ldl']);
  copiar(t['hd-rac'], ['cv_rac']);
  copiar(t['hd-lpa'], ['cv_lpa']);
  copiar(t['hd-cac'], ['cv_cac']);
  copiar(t['hd-tfg'], ['cv_tfg']);
  const pas = numero(t['hd-pas']) ?? numero(String(t['sv-pa'] || '').split('/')[0]);
  if (pas !== null) campos.cv_pas = String(pas);
  if (['F', 'M'].includes(hd.sexo)) ['drc_sexo', 'cv_sexo', 'ped_sexo'].forEach(id => { campos[id] = hd.sexo; });
  for (const [origem, destino] of [['dm', 'cv_dm'], ['tab', 'cv_tab'], ['antiht', 'cv_antiht'], ['estatina', 'cv_estat']]) {
    if (['0', '1'].includes(hd[origem])) campos[destino] = hd[origem];
  }
  // A DUM só é enviada se houver uma única data compatível nos roteiros.
  const datas = [modulos.dt?.dum, modulos.menst?.dum].filter(Boolean);
  if (new Set(datas).size === 1) {
    const m = String(datas[0]).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) {
      const iso = `${m[3]}-${m[2]}-${m[1]}`;
      const d = new Date(iso + 'T12:00:00Z');
      if (!isNaN(d) && d.toISOString().slice(0, 10) === iso) campos.pn_dum = iso;
    }
  }
  return campos;
}
export function resultadoRepetido(resultados, candidato) {
  return resultados.some(r => r.ferramenta === candidato.ferramenta && r.texto.trim() === candidato.texto.trim() && r.dados === candidato.dados && r.bloco === candidato.bloco);
}
export function envioValido(envio, idConsulta, agora = Date.now()) {
  return !!envio && envio.idConsulta === idConsulta && Number.isFinite(envio.criado) && agora >= envio.criado && agora - envio.criado < PRAZO;
}
export function lerJSON(chave) {
  try { return JSON.parse(localStorage.getItem(chave)); } catch { return null; }
}
export function idConsultaAtual() { return lerJSON(CHAVES.rascunhoConsulta)?.idConsulta; }
export function chavesLocais() {
  try { return Object.keys(localStorage); } catch { return []; }
}
export function limparTransferencias(idConsulta) {
  for (const chave of chavesLocais()) {
    if ((chave.startsWith(PREFIXO_ENVIO) || chave.startsWith(PREFIXO_RETORNO)) && lerJSON(chave)?.idConsulta === idConsulta) { try { localStorage.removeItem(chave); } catch { /* armazenamento indisponível */ } }
  }
}
