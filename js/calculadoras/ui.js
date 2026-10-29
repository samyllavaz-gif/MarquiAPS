/**
 * Componentes de interface das calculadoras: criação de elementos, campos,
 * leitura de valores, caixas de resultado e questionários de pontuação.
 */
/** Cria um elemento com atributos (class, html ou atributos comuns) e filhos. */
export function criarElemento(tag, atributos = {}, filhos = []) {
  const e = document.createElement(tag);
  for (const k in atributos) {
    if (k === 'html') e.innerHTML = atributos[k];
    else if (k === 'class') e.className = atributos[k];
    else e.setAttribute(k, atributos[k]);
  }
  filhos.forEach(filho => {
    if (filho) e.appendChild(filho);
  });
  return e;
}

/** Campo com rótulo (padrão: numérico). */
export function campo(rotulo, id, tipo = 'number', extra = {}) {
  const caixa = criarElemento('div', { class: 'field' });
  caixa.appendChild(criarElemento('label', { for: id }, [document.createTextNode(rotulo)]));
  caixa.appendChild(criarElemento('input', Object.assign({ id, type: tipo }, extra)));
  return caixa;
}

/** Lista de seleção com rótulo. `opcoes` = [{ value, label }]. */
export function campoSelecao(rotulo, id, opcoes) {
  const caixa = criarElemento('div', { class: 'field' });
  caixa.appendChild(criarElemento('label', { for: id }, [document.createTextNode(rotulo)]));
  const lista = criarElemento('select', { id });
  opcoes.forEach(o => {
    const op = criarElemento('option', { value: o.value });
    op.textContent = o.label;
    lista.appendChild(op);
  });
  caixa.appendChild(lista);
  return caixa;
}

/** Valor do campo (texto) ou '' se não existir. */
export function valorDe(id) {
  const e = document.getElementById(id);
  return e ? e.value : '';
}

/** Valor numérico do campo ou null quando vazio/inválido. */
export function numeroDe(id) {
  const x = parseFloat(valorDe(id));
  return isNaN(x) ? null : x;
}

/** Caixa de marcar marcada? */
export function estaMarcado(id) {
  const e = document.getElementById(id);
  return e && e.checked;
}

/** Mostra o resultado na caixa, com a classe de risco (risk-low, risk-mod, risk-high, risk-vhigh, risk-info). */
export function mostrarResultado(idCaixa, html, classeRisco) {
  const caixa = document.getElementById(idCaixa);
  caixa.className = 'result show ' + (classeRisco || '');
  caixa.innerHTML = html;
  document.dispatchEvent(new CustomEvent('calculadora:resultado', { detail: { id: idCaixa } }));
}

/** Mostra (ou esconde, se html vazio) a caixa de alerta. `soAviso` usa o estilo amarelo. */
export function mostrarAlerta(idCaixa, html, soAviso) {
  const caixa = document.getElementById(idCaixa);
  if (!html) {
    caixa.className = 'alert-box';
    caixa.innerHTML = '';
    return;
  }
  caixa.className = 'alert-box show' + (soAviso ? ' warn' : '');
  caixa.innerHTML = html;
}

/** Monta perguntas de múltipla escolha (rádios) a partir de itens { label, options:[{label,value}] }. */
export function montarQuestionario(container, itens, prefixo) {
  itens.forEach((item, idx) => {
    const pergunta = criarElemento('div', { class: 'q-item' });
    pergunta.appendChild(
      criarElemento('div', { class: 'qlabel' }, [document.createTextNode(idx + 1 + '. ' + item.label)]),
    );
    const linha = criarElemento('div', { class: 'opt-row' });
    item.options.forEach(opcao => {
      const rotulo = criarElemento('label', { class: 'opt' });
      const entrada = criarElemento('input', { type: 'radio', name: prefixo + '_' + idx, value: opcao.value });
      rotulo.appendChild(entrada);
      rotulo.appendChild(document.createTextNode(opcao.label));
      entrada.addEventListener('change', () => {
        linha.querySelectorAll('.opt').forEach(o => o.classList.remove('checked'));
        rotulo.classList.add('checked');
      });
      linha.appendChild(rotulo);
    });
    pergunta.appendChild(linha);
    container.appendChild(pergunta);
  });
}

/** Soma das respostas marcadas: { total, answered, complete }. */
export function pontuarQuestionario(prefixo, quantidade) {
  let total = 0,
    answered = 0;
  for (let i = 0; i < quantidade; i++) {
    const marcada = document.querySelector(`input[name="${prefixo}_${i}"]:checked`);
    if (marcada) {
      total += parseFloat(marcada.value);
      answered++;
    }
  }
  return { total, answered, complete: answered === quantidade };
}

/** Cartão com caixas de marcar a partir de [[id, rótulo]]. */
export function listaDeMarcacao(itens) {
  const lista = criarElemento('div', { class: 'chk-list' });
  itens.forEach(([id, rotulo]) => {
    const c = criarElemento('label', { class: 'chk' });
    c.appendChild(criarElemento('input', { type: 'checkbox', id }));
    c.appendChild(document.createTextNode(rotulo));
    lista.appendChild(c);
  });
  return lista;
}
