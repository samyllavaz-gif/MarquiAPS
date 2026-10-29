/**
 * Estado dos módulos (modelos do motor) na consulta única.
 * estado.modelo = definição com os módulos marcados · estado.rotulos = nome de cada módulo
 * st.v = valores preenchidos · soap = texto montado pelos módulos.
 */
export const estado = { modelo: null, rotulos: {} };
export const st = { v: {} };
export const soap = { S: '', O: '', A: '', P: '' };

/** Zera a consulta (mantém o mesmo objeto st, compartilhado entre os módulos). */
export function reiniciarConsulta(valores = {}) {
  for (const k of Object.keys(st)) delete st[k];
  st.v = valores;
}

export const V = id => st.v[id],
  S_ = id => String(st.v[id] || '').trim();
export const gv = (g, k) => String((st.v[g] || {})[k] || '').trim();
