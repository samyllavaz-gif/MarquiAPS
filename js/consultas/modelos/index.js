/**
 * Lista dos modelos de consulta disponíveis (a chave é a rota: index.html#prenatal…).
 * Para incluir um modelo: crie o arquivo nesta pasta e acrescente-o em MODELOS.
 */
import { MODELO_ORTOPEDIA } from './ortopedia.js';
import { MODELO_PRENATAL } from './pre-natal.js';
import { MODELO_PUERICULTURA } from './puericultura.js';
import { MODELO_PUERPERAL } from './puerperal.js';
import { MODELO_REUMATOLOGIA } from './reumatologia.js';
import { MODELO_SAUDE_HOMEM } from './saude-homem.js';
import { MODELO_SAUDE_MENTAL } from './saude-mental.js';
import { MODELO_SAUDE_MULHER } from './saude-mulher.js';

export const MODELOS = {
  puerperal: MODELO_PUERPERAL,
  prenatal: MODELO_PRENATAL,
  puericultura: MODELO_PUERICULTURA,
  mulher: MODELO_SAUDE_MULHER,
  homem: MODELO_SAUDE_HOMEM,
  reumato: MODELO_REUMATOLOGIA,
  ortopedia: MODELO_ORTOPEDIA,
  mental: MODELO_SAUDE_MENTAL,
};

/** Prepara cada modelo: marca o bloco SOAP de cada campo e dá ids aos grupos (com atalhos em _k). */
function normalizarModelo(def, nome) {
  let n = 0;
  def._k = {};
  const walk = (fs, b) =>
    fs.forEach(f => {
      f.b = f.s || b;
      if (f.t === 'group') {
        f.gid = `${nome}_g${n++}`; // único entre todos os modelos (a consulta junta vários)
        if (f.key) def._k[f.key] = f.gid;
        walk(f.f, f.b);
      }
    });
  def.secs.forEach(s => walk(s.f, s.k));
}
Object.entries(MODELOS).forEach(([nome, def]) => normalizarModelo(def, nome));
