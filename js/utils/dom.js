/** Atalhos de seleção de elementos na página. */
/** Primeiro elemento que corresponde ao seletor CSS. */
export const $ = seletor => document.querySelector(seletor);

/** Todos os elementos que correspondem ao seletor CSS, como array. */
export const $$ = seletor => [...document.querySelectorAll(seletor)];
