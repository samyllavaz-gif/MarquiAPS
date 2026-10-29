/**
 * Função renal: taxa de filtração glomerular (CKD-EPI 2021, sem raça) e estadiamento KDIGO.
 * Funções puras.
 */
/** TFG estimada (mL/min/1,73 m²) pela CKD-EPI 2021. Sexo 'F' ou 'M'. */
export function tfgCkdEpi2021(creatinina, idade, sexo) {
  const feminino = sexo === 'F',
    k = feminino ? 0.7 : 0.9,
    a = feminino ? -0.241 : -0.302;
  return (
    142 *
    Math.pow(Math.min(creatinina / k, 1), a) *
    Math.pow(Math.max(creatinina / k, 1), -1.2) *
    Math.pow(0.9938, idade) *
    (feminino ? 1.012 : 1)
  );
}

/** Estágio KDIGO da TFG (G1…G5); '' quando não informada. */
export const estagioTfg = g =>
  isNaN(g) ? '' : g >= 90 ? 'G1' : g >= 60 ? 'G2' : g >= 45 ? 'G3a' : g >= 30 ? 'G3b' : g >= 15 ? 'G4' : 'G5';

/** Descrição de cada estágio KDIGO. */
export const DESCRICAO_ESTAGIO_TFG = {
  G1: 'normal ou elevada',
  G2: 'levemente diminuída',
  G3a: 'leve a moderadamente diminuída',
  G3b: 'moderada a gravemente diminuída',
  G4: 'gravemente diminuída',
  G5: 'falência renal',
};

/** Albuminúria KDIGO pela relação albumina/creatinina (mg/g); null quando não informada. */
export const categoriaAlbuminuria = rac => (isFinite(rac) ? (rac < 30 ? 'A1' : rac <= 300 ? 'A2' : 'A3') : null);
