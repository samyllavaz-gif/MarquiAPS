/**
 * Tipos de consulta que podem ser marcados na consulta única.
 * - 'queixas' e 'hiperdia' são partes da base (js/consultas/base);
 * - os demais são modelos do motor (js/consultas/modelos), mostrados como módulos.
 * A ordem aqui é a ordem dos botões na tela e dos módulos no texto do SOAP.
 */
export const TIPOS_DE_CONSULTA = [
  { id: 'queixas', rotulo: 'Queixas do dia', resumo: 'Queixas frequentes e ficha de dengue, COVID-19 e influenza' },
  { id: 'hiperdia', rotulo: 'Hipertensão e diabetes', resumo: 'PREVENT, SBC 2025, TFG, pé diabético e FINDRISC' },
  { id: 'mulher', rotulo: 'Saúde da mulher', modelo: 'mulher' },
  { id: 'prenatal', rotulo: 'Pré-natal', modelo: 'prenatal' },
  { id: 'puerperal', rotulo: 'Puerpério', modelo: 'puerperal' },
  { id: 'puericultura', rotulo: 'Puericultura', modelo: 'puericultura' },
  { id: 'homem', rotulo: 'Saúde do homem', modelo: 'homem' },
  { id: 'mental', rotulo: 'Saúde mental', modelo: 'mental' },
  { id: 'reumato', rotulo: 'Reumatologia', modelo: 'reumato' },
  { id: 'ortopedia', rotulo: 'Ortopedia', modelo: 'ortopedia' },
];

/** Tipos marcados ao abrir uma consulta nova. */
export const TIPOS_INICIAIS = ['queixas'];

/** Endereços antigos (index.html#padrao…) continuam abrindo a consulta com o tipo correspondente. */
export const ROTAS_ANTIGAS = { padrao: 'queixas' };

export const tipoExiste = id => TIPOS_DE_CONSULTA.some(t => t.id === id);

/** Ordena uma lista de tipos pela ordem de TIPOS_DE_CONSULTA (e descarta os desconhecidos). */
export const ordenarTipos = ids => TIPOS_DE_CONSULTA.map(t => t.id).filter(id => ids.includes(id));
