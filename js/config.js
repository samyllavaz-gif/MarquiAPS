/**
 * Configurações centrais do site Marqui APS.
 * Altere aqui o nome do site, os itens do menu, a lista de consultas,
 * as chaves de armazenamento local e os endereços das bibliotecas externas.
 */
export const SITE = {
  nome: 'MarquiAPS',
  subtitulo: 'Ferramentas digitais para a Atenção Primária',
  logoIcone: 'assets/img/logo-icone.png',
  credito: 'Developed by SM APS',
  copyright: 'MarquiAPS © 2026',
};

/** Itens do menu superior. `rota` = seção da página inicial; `pagina` = arquivo HTML próprio. */
export const MENU = [
  { rotulo: 'Início', rota: 'inicio' },
  { rotulo: 'Consultas', rota: 'consultas' },
  { rotulo: 'Requisições', rota: 'requisicoes' },
  { rotulo: 'Calculadoras', pagina: 'calculadoras.html' },
  { rotulo: 'Contracepção', pagina: 'contracepcao.html' },
  { rotulo: 'Implante', pagina: 'implante.html' },
];

/**
 * Chaves usadas no armazenamento local do navegador (localStorage).
 * Os rascunhos ficam apenas neste navegador; nada é enviado para servidores.
 */
export const CHAVES = {
  rascunhoConsulta: 'consulta-unica-v1', // rascunho da consulta (tipos marcados, base e módulos)
  unidadeDensitometria: 'densitometria-unidade-v1',
  unidadeMamografia: 'mamo-cito-unidade-v1',
  unidadeApac: 'apac-unidade-v1',
};

/** Bibliotecas carregadas sob demanda para gerar o PDF das requisições. */
export const BIBLIOTECAS_PDF = [
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
];

/** Leitor de PDF (pdf.js) usado na importação do laudo do e-SUS PEC na APAC. */
export const PDFJS_WORKER = 'assets/vendor/pdfjs/pdf.worker.min.js';
