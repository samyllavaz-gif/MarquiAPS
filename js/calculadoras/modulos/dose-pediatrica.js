/**
 * Calculadora 12. DOSE PEDIÁTRICA (Marqui)
 */
import { medianaDePesoParaIdade } from '../../regras/crescimento-oms.js';
import {
  apresentacoesPermitidas,
  calcularDosePediatrica,
  textoDaQuantidade,
  textoIdadeEmMeses,
} from '../../regras/dose-pediatrica/calculo.js';
import { GRUPOS_MEDICAMENTOS, MEDICAMENTOS_PEDIATRICOS } from '../../regras/dose-pediatrica/medicamentos.js';
import { copiarComAviso } from '../../utils/area-transferencia.js';
import { formatarNumeroArredondado } from '../../utils/texto.js';
import { campo, criarElemento, mostrarAlerta, mostrarResultado, valorDe } from '../ui.js';

export const moduloDosePediatrica = {
  id: 'dose',
  rotulo: 'Dose pediátrica',
  numero: '12',
  montar(sec) {
    sec.appendChild(criarElemento('h2', {}, [document.createTextNode('Dose pediátrica')]));
    sec.appendChild(
      criarElemento('p', { class: 'desc' }, [
        document.createTextNode(
          'Doses por peso e idade com as apresentações disponíveis na rede municipal de São Manuel. Mostra o volume, as gotas ou a fração de comprimido, e gera a linha da receita.',
        ),
      ]),
    );

    const cDados = criarElemento('div', { class: 'card' });
    cDados.appendChild(criarElemento('h3', {}, [document.createTextNode('Dados da criança')]));
    const rD = criarElemento('div', { class: 'row' });
    rD.appendChild(campo('Peso (kg)', 'dz_peso', 'text', { inputmode: 'decimal', placeholder: 'ex.: 12,5' }));
    rD.appendChild(campo('Idade — anos', 'dz_anos', 'number', { min: '0', max: '18', placeholder: '0' }));
    rD.appendChild(campo('Idade — meses', 'dz_meses', 'number', { min: '0', max: '11', placeholder: '0' }));
    cDados.appendChild(rD);
    cDados.appendChild(criarElemento('div', { class: 'alert-box', id: 'dz_chk' }));
    sec.appendChild(cDados);

    const cAnt = criarElemento('div', { class: 'card' });
    cAnt.appendChild(
      criarElemento('h3', {}, [document.createTextNode('Antitérmicos — referência rápida para este peso')]),
    );
    cAnt.appendChild(
      criarElemento('div', {
        class: 'result show risk-info',
        id: 'dz_quick',
        html: '<div class="note">Informe o peso para ver as doses.</div>',
      }),
    );
    sec.appendChild(cAnt);

    const cMed = criarElemento('div', { class: 'card' });
    cMed.appendChild(criarElemento('h3', {}, [document.createTextNode('Medicamento')]));
    const rM = criarElemento('div', { class: 'row dz-sel' });
    const fMed = criarElemento('div', { class: 'field' });
    fMed.appendChild(
      criarElemento('label', { for: 'dz_med' }, [document.createTextNode('Medicamento (rede municipal)')]),
    );
    const sMed = criarElemento('select', { id: 'dz_med' });
    sMed.appendChild(criarElemento('option', { value: '' }, [document.createTextNode('Selecione…')]));
    GRUPOS_MEDICAMENTOS.forEach(g => {
      const og = criarElemento('optgroup', { label: g });
      MEDICAMENTOS_PEDIATRICOS.filter(m => m.grupo === g).forEach(m =>
        og.appendChild(criarElemento('option', { value: m.id }, [document.createTextNode(m.nome)])),
      );
      sMed.appendChild(og);
    });
    fMed.appendChild(sMed);
    rM.appendChild(fMed);
    const fInd = criarElemento('div', { class: 'field' });
    fInd.appendChild(criarElemento('label', { for: 'dz_ind' }, [document.createTextNode('Indicação')]));
    const sInd = criarElemento('select', { id: 'dz_ind' });
    fInd.appendChild(sInd);
    rM.appendChild(fInd);
    const fAp = criarElemento('div', { class: 'field' });
    fAp.appendChild(criarElemento('label', { for: 'dz_ap' }, [document.createTextNode('Apresentação')]));
    const sAp = criarElemento('select', { id: 'dz_ap' });
    fAp.appendChild(sAp);
    rM.appendChild(fAp);
    cMed.appendChild(rM);
    cMed.appendChild(criarElemento('div', { class: 'result', id: 'dz_result' }));
    cMed.appendChild(criarElemento('div', { class: 'alert-box', id: 'dz_alert' }));
    const rxWrap = criarElemento('div', { class: 'dz-rx', id: 'dz_rxwrap', hidden: 'hidden' });
    rxWrap.appendChild(
      criarElemento('label', { for: 'dz_rx' }, [document.createTextNode('Linha da receita (editável)')]),
    );
    rxWrap.appendChild(criarElemento('textarea', { id: 'dz_rx', rows: '3' }));
    const bRx = criarElemento('button', { class: 'calc', type: 'button' }, [document.createTextNode('Copiar receita')]);
    rxWrap.appendChild(bRx);
    cMed.appendChild(rxWrap);
    cMed.appendChild(
      criarElemento('div', { class: 'foot-disclaimer' }, [
        document.createTextNode(
          'Lista de medicamentos da rede municipal de São Manuel (atualizada em 01/10/2026). Doses de referência: bulas, Sociedade Brasileira de Pediatria, AIDPI/Ministério da Saúde e GINA. Anticonvulsivantes e psicotrópicos não estão incluídos (dose definida pelo especialista). Confira sempre a dose, a concentração do frasco dispensado, alergias e função renal antes de prescrever.',
        ),
      ]),
    );
    sec.appendChild(cMed);

    const ctx = () => {
      const kg = parseFloat(String(valorDe('dz_peso')).replace(',', '.'));
      const a = valorDe('dz_anos'),
        m = valorDe('dz_meses');
      const mo = a === '' && m === '' ? null : parseInt(a || '0', 10) * 12 + parseInt(m || '0', 10);
      return { kg: kg > 0 ? kg : null, mo };
    };
    const fillSel = (s, items) => {
      s.innerHTML = '';
      items.forEach(([val, lab]) => {
        const o = criarElemento('option', { value: val });
        o.textContent = lab;
        s.appendChild(o);
      });
    };
    const esc = t => String(t).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[ch]);
    let lastMed = '',
      lastInd = null;

    function quick(c) {
      if (!c.kg) {
        mostrarResultado('dz_quick', '<div class="note">Informe o peso para ver as doses.</div>', 'risk-info');
        return;
      }
      const rows = ['paracetamol', 'dipirona', 'ibuprofeno']
        .map(id => {
          const r = calcularDosePediatrica(id, 'f', 'g', c);
          const d = r.doses[0];
          const bloq =
            (r.m.minMo && c.mo != null && c.mo < r.m.minMo) || (r.m.minKg && c.kg < r.m.minKg) ? r.m.minTx : null;
          return `<tr><th>${r.m.nome} <span class="tag-pill">${esc(r.ap.rx.replace(r.m.nome + ' ', ''))}</span></th><td>${bloq ? `<b>${esc(bloq)}</b>` : `<b>${d.c.tx}</b> (${textoDaQuantidade(d.c.real, 'mg')}) ${esc(d.freq)}`}</td></tr>`;
        })
        .join('');
      mostrarResultado(
        'dz_quick',
        `<table class="mini-table">${rows}</table><div class="note">Doses de bula por peso. Na suspeita de dengue, usar paracetamol ou dipirona e não usar ibuprofeno.</div>`,
        'risk-info',
      );
    }

    function update() {
      const c = ctx();
      const chk = [];
      if (c.kg && c.mo != null) {
        const med = medianaDePesoParaIdade(c.mo);
        if (med && (c.kg < med * 0.6 || c.kg > med * 1.8))
          chk.push(
            `Peso de ${formatarNumeroArredondado(c.kg)} kg é muito diferente do esperado para ${textoIdadeEmMeses(c.mo)} (mediana OMS ≈ ${formatarNumeroArredondado(med)} kg). Confira o peso digitado.`,
          );
      }
      if (c.mo != null && c.mo < 1)
        chk.push(
          'Recém-nascido: muitas doses e intervalos diferem no período neonatal — confirme antes de prescrever.',
        );
      if (c.kg && c.kg >= 40)
        chk.push('Peso ≥ 40 kg: geralmente se usa a dose de adulto (as doses abaixo já respeitam os máximos).');
      mostrarAlerta('dz_chk', chk.join('<br>'), true);
      quick(c);

      const id = sMed.value;
      const m = MEDICAMENTOS_PEDIATRICOS.find(x => x.id === id);
      if (id !== lastMed) {
        lastMed = id;
        lastInd = null;
        fillSel(sInd, m ? m.ind.map(i => [i.id, i.l]) : []);
      }
      if (m && sInd.value !== lastInd) {
        lastInd = sInd.value;
        const keep = sAp.value;
        fillSel(
          sAp,
          apresentacoesPermitidas(id, sInd.value).map(a => [a.id, a.rx]),
        );
        if ([...sAp.options].some(o => o.value === keep)) sAp.value = keep;
      }
      const rxw = document.getElementById('dz_rxwrap');
      if (!m) {
        mostrarResultado('dz_result', '', '');
        document.getElementById('dz_result').className = 'result';
        mostrarAlerta('dz_alert', '');
        rxw.hidden = true;
        return;
      }
      if (!c.kg) {
        mostrarResultado('dz_result', '<div class="note">Informe o peso da criança.</div>', 'risk-info');
        mostrarAlerta('dz_alert', '');
        rxw.hidden = true;
        return;
      }
      const r = calcularDosePediatrica(id, sInd.value, sAp.value, c);
      if (r.ap.id !== sAp.value) sAp.value = r.ap.id;
      const blk = r.doses
        .map(d => {
          if (!d.c) return '';
          const per =
            r.m.un === 'mL' || r.m.un === 'UI' || !c.kg
              ? ''
              : ` · ${formatarNumeroArredondado(d.c.real / c.kg, d.c.real / c.kg < 1 ? 2 : 1)} mg/kg/dose`;
          return `<div class="dz-dose">${d.rot ? `<div class="label">${esc(d.rot)}</div>` : ''}<div class="big">${esc(d.c.tx)}</div><div class="note">${d.c.sub ? esc(d.c.sub) + ' · ' : ''}${d.c.bad ? '' : textoDaQuantidade(d.c.real, r.m.un) + per + ' · '}${esc(d.freq)}${d.dur ? ' ' + esc(d.dur) : ''}</div></div>`;
        })
        .join('');
      const tb = `<table class="mini-table"><tr><th>Referência</th><td>${esc(r.faixa || '')}</td></tr>${r.fr ? `<tr><th>Quantidade</th><td>${esc(r.fr)}</td></tr>` : ''}${r.notes.length ? `<tr><th>Observações</th><td>${r.notes.map(esc).join('<br>')}</td></tr>` : ''}</table>`;
      const hard = r.warn.some(w => w === r.m.minTx);
      mostrarResultado('dz_result', blk + tb, hard ? 'risk-high' : r.warn.length ? 'risk-mod' : 'risk-low');
      mostrarAlerta(
        'dz_alert',
        r.warn.length ? '<strong>Atenção:</strong><br>' + r.warn.map(esc).join('<br>') : '',
        !hard,
      );
      rxw.hidden = !r.rx || hard;
      document.getElementById('dz_rx').value = r.rx;
    }
    ['dz_peso', 'dz_anos', 'dz_meses'].forEach(i => document.getElementById(i).addEventListener('input', update));
    [sMed, sInd, sAp].forEach(s => s.addEventListener('change', update));
    bRx.addEventListener('click', () => copiarComAviso(document.getElementById('dz_rx').value));
    setTimeout(update, 0);
  },
};
