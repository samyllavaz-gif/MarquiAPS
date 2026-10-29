import { avisoRapido } from '../componentes/aviso.js';
import { PREFIXO_ENVIO, PREFIXO_RETORNO, envioValido, idConsultaAtual, lerJSON } from '../integracoes/consulta-calculadoras.js';

const camposDoModulo = modulo => [...modulo.querySelectorAll('input, select, textarea')];
function dadosDoModulo(modulo) {
  return camposDoModulo(modulo).filter(e => !['button', 'submit'].includes(e.type) && (['checkbox', 'radio'].includes(e.type) ? e.checked : e.value.trim())).map(e => {
    const label = e.labels?.[0]?.textContent.trim() || e.closest('label')?.textContent.trim() || e.id || e.name;
    const valor = e.tagName === 'SELECT' ? e.selectedOptions[0]?.textContent : ['checkbox', 'radio'].includes(e.type) ? 'marcado' : e.value;
    return `${label}: ${valor}`;
  }).join('\n');
}
const assinatura = modulo => JSON.stringify(camposDoModulo(modulo).map(e => [e.id || e.name, e.value, e.checked]));

export function iniciarIntegracaoConsulta() {
  const [caminho, consultaQuery = ''] = location.hash.slice(1).split('?');
  const token = new URLSearchParams(consultaQuery).get('consulta');
  if (!token || !/^[a-zA-Z0-9-]+$/.test(token)) return;
  const envio = lerJSON(PREFIXO_ENVIO + token);
  const banner = document.createElement('section');
  banner.className = 'consulta-conexao';
  document.getElementById('main').prepend(banner);
  if (!envioValido(envio, idConsultaAtual())) {
    banner.textContent = 'Este vínculo com a consulta expirou ou pertence a outra consulta. Abra a calculadora novamente pelo atendimento atual.';
    return;
  }
  const moduloDestino = document.getElementById('mod-' + caminho.split('/')[0]);
  const titulo = document.createElement('h3');
  titulo.textContent = 'Dados da consulta disponíveis';
  const nota = document.createElement('p');
  nota.textContent = 'Confira os valores antes de usar. O preenchimento e o retorno ficam neste navegador.';
  const lista = document.createElement('ul');
  const compativeis = Object.entries(envio.campos || {}).map(([id, valor]) => [document.getElementById(id), valor]).filter(([e]) => e && moduloDestino?.contains(e));
  compativeis.forEach(([e, valor]) => {
    const li = document.createElement('li');
    li.textContent = `${e.labels?.[0]?.textContent.trim() || e.id}: ${valor} · consulta atual`;
    lista.appendChild(li);
  });
  const usar = document.createElement('button');
  usar.type = 'button'; usar.className = 'calc'; usar.textContent = 'Usar estes dados'; usar.hidden = !compativeis.length;
  const editados = new Set();
  let preenchendo = false;
  document.addEventListener('input', e => { if (!preenchendo) editados.add(e.target); }, true);
  document.addEventListener('change', e => { if (!preenchendo) editados.add(e.target); }, true);
  usar.onclick = () => {
    if (!envioValido(envio, idConsultaAtual())) { avisoRapido('A consulta mudou. Abra a calculadora pelo atendimento atual.'); return; }
    let n = 0;
    preenchendo = true;
    compativeis.forEach(([e, valor]) => {
      if (editados.has(e)) return;
      if (e.tagName === 'SELECT' && ![...e.options].some(o => o.value === valor)) return;
      e.value = valor;
      e.dispatchEvent(new Event('input', { bubbles: true }));
      e.dispatchEvent(new Event('change', { bubbles: true }));
      e.dataset.origemConsulta = 'true';
      n++;
    });
    preenchendo = false;
    usar.disabled = true;
    usar.textContent = `${n} campo(s) preenchido(s)`;
    nota.textContent = 'Valores recebidos da consulta. Confira antes de calcular; campos que você já editou foram preservados.';
  };
  if (!compativeis.length) nota.textContent = 'Não há campos compatíveis para preencher neste módulo. Você ainda pode calcular e enviar o resultado para revisão na consulta.';
  banner.append(titulo, nota, lista, usar);

  const dialogo = document.createElement('dialog');
  dialogo.className = 'retorno-dialogo';
  dialogo.setAttribute('aria-label', 'Revisar resultado para a consulta');
  dialogo.innerHTML = '<h2>Revisar resultado</h2><p>Confira o texto e escolha onde ele deve entrar. A consulta pedirá sua confirmação antes de incluir no SOAP.</p><label>Texto do resultado<textarea data-texto rows="8"></textarea></label><details><summary>Dados usados no cálculo</summary><pre data-dados></pre></details><label>Bloco do SOAP<select data-bloco><option value="O">Objetivo · resultado</option><option value="A" selected>Avaliação</option><option value="P">Plano</option></select></label><div class="retorno-acoes"><button type="button" data-cancelar>Cancelar</button><button type="button" data-enviar>Enviar para revisão da consulta</button></div><p data-status role="status"></p>';
  document.body.appendChild(dialogo);
  let candidato;
  dialogo.querySelector('[data-cancelar]').onclick = () => dialogo.close();
  dialogo.querySelector('[data-enviar]').onclick = () => {
    if (!envioValido(envio, idConsultaAtual())) { dialogo.querySelector('[data-status]').textContent = 'A consulta mudou ou o vínculo expirou. O resultado não foi enviado.'; return; }
    const texto = dialogo.querySelector('[data-texto]').value.trim();
    if (!texto) { dialogo.querySelector('[data-status]').textContent = 'Escreva o texto que deseja enviar.'; return; }
    const chave = PREFIXO_RETORNO + crypto.randomUUID();
    const retorno = { ...candidato, texto, bloco: dialogo.querySelector('[data-bloco]').value, idConsulta: envio.idConsulta, criado: Date.now() };
    try {
      localStorage.setItem(chave, JSON.stringify(retorno));
      dialogo.close();
      avisoRapido('Resultado disponível para revisar na consulta. Volte à aba do atendimento.');
    } catch { dialogo.querySelector('[data-status]').textContent = 'Não foi possível guardar o resultado neste navegador. Copie o texto manualmente.'; }
  };
  // Qualquer mudança nos dados invalida o botão do resultado anterior.
  ['input', 'change'].forEach(tipo => document.addEventListener(tipo, e => {
    e.target.closest('.module')?.querySelectorAll('[data-retorno]').forEach(b => { b.hidden = true; });
  }, true));
  document.addEventListener('calculadora:resultado', e => {
    const resultado = document.getElementById(e.detail.id);
    const modulo = resultado?.closest('.module');
    const cartao = resultado?.closest('.card');
    if (!modulo || !cartao) return;
    let b = cartao.querySelector(`[data-retorno="${resultado.id}"]`);
    if (!b) {
      b = document.createElement('button'); b.type = 'button'; b.className = 'consulta-retorno'; b.dataset.retorno = resultado.id;
      b.textContent = 'Revisar resultado para a consulta'; resultado.after(b);
    }
    const texto = resultado.innerText.trim();
    b.hidden = !texto || /^(Informe|Selecione|Preencha)\b/.test(texto);
    let assinaturaCalculada = assinatura(modulo);
    queueMicrotask(() => { assinaturaCalculada = assinatura(modulo); });
    b.onclick = () => {
      if (assinatura(modulo) !== assinaturaCalculada) { b.hidden = true; avisoRapido('Os dados mudaram. Calcule novamente antes de enviar.'); return; }
      const nome = cartao.querySelector('h3')?.textContent || 'Calculadora';
      const alertas = [...cartao.querySelectorAll('.alert-box.show')].map(a => a.innerText.trim()).filter(Boolean);
      candidato = { dadosAlterados: compativeis.some(([e, valor]) => e.value !== valor), origem: JSON.stringify(envio.campos || {}), ferramenta: resultado.id, dados: dadosDoModulo(modulo.id === 'mod-dose' ? modulo : cartao) };
      dialogo.querySelector('[data-texto]').value = `${nome}:\n${resultado.innerText.trim()}${alertas.length ? '\n' + alertas.join('\n') : ''}`;
      dialogo.querySelector('[data-dados]').textContent = candidato.dados || 'Sem campos preenchidos.';
      dialogo.querySelector('[data-bloco]').value = modulo.id === 'mod-dose' ? 'P' : 'A';
      dialogo.querySelector('[data-status]').textContent = '';
      dialogo.showModal();
    };
  });
}
