import { avisoRapido } from '../componentes/aviso.js';
import { PREFIXO_RETORNO, chavesLocais, idConsultaAtual, envioValido, lerJSON, resultadoRepetido } from '../integracoes/consulta-calculadoras.js';

let configuracao;
export function iniciarResultadosCalculadoras(config) {
  configuracao = config;
  window.addEventListener('storage', e => { if (e.key?.startsWith(PREFIXO_RETORNO)) atualizarResultadosCalculadoras(); });
  window.addEventListener('focus', atualizarResultadosCalculadoras);
}
export function atualizarResultadosCalculadoras() {
  if (!configuracao) return;
  const atual = configuracao.ler();
  const pendentes = document.getElementById('resultados-pendentes');
  const lista = document.getElementById('lista-resultados-pendentes');
  lista.replaceChildren();
  if (idConsultaAtual() && idConsultaAtual() !== atual.idConsulta) { pendentes.hidden = true; return; }
  for (const chave of chavesLocais().filter(k => k.startsWith(PREFIXO_RETORNO))) {
    const r = lerJSON(chave);
    if (!envioValido(r, atual.idConsulta) || typeof r.texto !== 'string' || !['O', 'A', 'P'].includes(r.bloco)) continue;
    const card = document.createElement('div'); card.className = 'resultado-pendente';
    const titulo = document.createElement('h4'); titulo.textContent = 'Conferir resultado recebido';
    const texto = document.createElement('textarea'); texto.value = r.texto; texto.rows = 5; texto.setAttribute('aria-label', 'Texto do resultado recebido');
    const bloco = document.createElement('select'); bloco.setAttribute('aria-label', 'Bloco para o resultado');
    for (const [id, nome] of [['O', 'Objetivo'], ['A', 'Avaliação'], ['P', 'Plano']]) {
      const op = document.createElement('option'); op.value = id; op.textContent = nome; bloco.appendChild(op);
    }
    bloco.value = r.bloco;
    const dados = document.createElement('details');
    const sum = document.createElement('summary'); sum.textContent = 'Conferir os dados usados no cálculo';
    const pre = document.createElement('pre'); pre.textContent = r.dados || 'Sem campos registrados.';
    dados.append(sum, pre);
    const aviso = document.createElement('p'); aviso.className = 'note';
    aviso.textContent = r.origem !== JSON.stringify(atual.campos) ? 'Os dados atuais da consulta diferem dos enviados à calculadora. Confira o resultado e os valores usados antes de incluir.' : r.dadosAlterados ? 'Há valores diferentes dos recebidos na calculadora. Confira os dados usados antes de incluir no SOAP.' : 'Revise o texto e os dados usados antes de incluir no SOAP.';
    let camposRevisados = JSON.stringify(atual.campos);
    const aceitar = document.createElement('button'); aceitar.type = 'button'; aceitar.className = 'btn primary small';
    const anterior = atual.resultados.some(x => x.ferramenta === r.ferramenta);
    aceitar.textContent = anterior ? 'Substituir resultado anterior desta ferramenta' : 'Adicionar ao SOAP';
    aceitar.onclick = () => {
      if (idConsultaAtual() !== configuracao.ler().idConsulta || !envioValido(r, configuracao.ler().idConsulta)) { avisoRapido('Este resultado não pertence à consulta atual ou expirou.'); atualizarResultadosCalculadoras(); return; }
      const camposAtuais = JSON.stringify(configuracao.ler().campos);
      if (camposAtuais !== camposRevisados) {
        camposRevisados = camposAtuais;
        aviso.textContent = 'Os dados da consulta mudaram durante esta revisão. Confira os valores usados no cálculo e clique novamente se deseja incluir este resultado.';
        return;
      }
      const candidato = { ...r, texto: texto.value.trim(), bloco: bloco.value };
      if (!candidato.texto) { avisoRapido('Escreva o texto que deseja incluir.'); return; }
      if (resultadoRepetido(configuracao.ler().resultados, candidato)) avisoRapido('Este resultado já está no SOAP.');
      else configuracao.aceitar(candidato);
      localStorage.removeItem(chave);
      atualizarResultadosCalculadoras();
    };
    const descartar = document.createElement('button'); descartar.type = 'button'; descartar.className = 'btn small'; descartar.textContent = 'Descartar resultado recebido';
    descartar.onclick = () => { localStorage.removeItem(chave); atualizarResultadosCalculadoras(); };
    card.append(titulo, aviso, texto, bloco, dados, aceitar, descartar); lista.appendChild(card);
  }
  pendentes.hidden = !lista.children.length;
  document.getElementById('mbar-go').textContent = lista.children.length ? `Conferir ${lista.children.length} resultado(s)` : 'Ver texto SOAP';
  const incluidos = document.getElementById('resultados-incluidos'); incluidos.replaceChildren();
  atual.resultados.forEach(r => {
    const linha = document.createElement('div'); linha.className = 'resultado-incluido';
    const nome = document.createElement('span'); nome.textContent = `${r.bloco} · ${r.texto.split('\n')[0]}`;
    const remover = document.createElement('button'); remover.type = 'button'; remover.className = 'btn small'; remover.textContent = 'Remover do SOAP';
    remover.onclick = () => { configuracao.remover(r.ferramenta); atualizarResultadosCalculadoras(); };
    linha.append(nome, remover); incluidos.appendChild(linha);
  });
  incluidos.hidden = !atual.resultados.length;
}
