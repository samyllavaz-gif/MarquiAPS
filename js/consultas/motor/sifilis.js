/**
 * Seguimento de sífilis (gestante, criança e mulher): tratamento, datas e VDRL conforme o PCDT.
 */
import { isNR, nrm } from '../../regras/exames-gestante.js';
import {
  diferencaEmDias,
  formatarDataBr,
  hojeSemHora,
  idadeDetalhada,
  lerDataBr,
  somarDias,
} from '../../utils/datas.js';
import { finalizarTexto, listaEmMinusculas, minusculaInicial } from '../../utils/texto.js';
import { gv, st } from './estado.js';

const tit = x => {
  const t = nrm(x);
  if (!t.trim()) return null;
  if (isNR(t)) return 0;
  const m = t.match(/1\s*[:/]\s*(\d+)/);
  if (m) return +m[1];
  if (/reag|positiv/.test(t)) return 1;
  return null;
};
const titTx = n => (n === 0 ? 'não reagente' : n == null ? '—' : '1:' + n);
const dil = (a, b) => Math.round(Math.log2(a / b));
const addM = (d, m) => {
  const x = new Date(d);
  x.setMonth(x.getMonth() + m);
  return x;
};
export function sifCalc(f) {
  const o = (st.v[f.id] = st.v[f.id] || {});
  const ser = (o.ser || [])
    .map(r => ({ d: lerDataBr(r.d), dt: r.d, n: tit(r.t) }))
    .filter(r => r.d && r.n != null)
    .sort((a, b) => a.d - b.d);
  const out = { html: [], A: [], P: [] };
  const H = (c, t) => out.html.push(`<p class="${c}" style="margin:0">${t}</p>`);
  if (f.mode === 'crianca') {
    const dn = lerDataBr(gv('nasc', 'dn'));
    const vm = tit(o.vdrlMae),
      vr = tit(o.vdrlRN);
    if (vm && vr && vr >= vm * 4)
      H(
        'badmsg',
        `VDRL do RN (${titTx(vr)}) 2 ou mais diluições acima do materno (${titTx(vm)}): critério de sífilis congênita.`,
      );
    if (o.mae && o.mae !== 'Adequado')
      H(
        'warnmsg',
        'Mãe sem tratamento adequado: a criança é caso de sífilis congênita para notificação e investigação.',
      );
    if (o.cls === 'Sífilis congênita')
      H(
        'note',
        'Seguimento: VDRL com 1, 3, 6, 12 e 18 meses; avaliações oftalmológica, audiológica e neurológica semestrais até 2 anos; se líquor alterado, repetir a cada 6 meses.',
      );
    if (dn) {
      const sch = [1, 3, 6, 12, 18].map(m => {
        const d = addM(dn, m);
        const done = ser.some(r => Math.abs(diferencaEmDias(d, r.d)) <= 45);
        return { m, d, done };
      });
      const nx = sch.find(s => !s.done && s.d >= somarDias(hojeSemHora(), -45));
      out.html.push(
        `<p style="margin:0">Calendário do VDRL: ${sch.map(s => `${s.m} m – ${formatarDataBr(s.d)}${s.done ? ' ✓' : ''}`).join(' · ')}</p>`,
      );
      const rows = ser.map(r => {
        const a = idadeDetalhada(dn, r.d);
        return `${r.dt} (${a.mo} m): ${titTx(r.n)}`;
      });
      if (rows.length) out.P.push(`VDRL de seguimento: ${rows.join('; ')}.`);
      if (nx)
        out.P.push(
          `Próximo VDRL: ${formatarDataBr(nx.d)} (${nx.m} meses)${nx.d < hojeSemHora() ? ' – atrasado' : ''}.`,
        );
      if (nx && nx.d < hojeSemHora())
        H('warnmsg', `VDRL de ${nx.m} meses (${formatarDataBr(nx.d)}) ainda não registrado: está atrasado.`);
      const last = ser[ser.length - 1];
      if (ser.length >= 2 && ser[ser.length - 1].n === 0 && ser[ser.length - 2].n === 0)
        H(
          'okmsg',
          'Dois testes não reagentes consecutivos: o seguimento com VDRL pode ser encerrado (realizar teste treponêmico aos 18 meses).',
        );
      for (let i = 1; i < ser.length; i++)
        if (ser[i].n && ser[i - 1].n && ser[i].n >= ser[i - 1].n * 4) {
          H(
            'badmsg',
            `Aumento de 2 ou mais diluições (${titTx(ser[i - 1].n)} → ${titTx(ser[i].n)}): reinvestigar e retratar.`,
          );
          break;
        }
      if (last && last.n > 0) {
        const a = idadeDetalhada(dn, last.d).mo;
        if (a >= 18)
          H(
            'badmsg',
            'Teste não treponêmico reagente aos 18 meses: investigar sífilis congênita e retratar conforme protocolo.',
          );
        else if (a >= 6)
          H(
            'warnmsg',
            'Ainda reagente após 6 meses de idade: reavaliar a criança, investigar sífilis congênita e considerar tratamento.',
          );
      }
    } else H('note', 'Informe a data de nascimento para montar o calendário de VDRL (1, 3, 6, 12 e 18 meses).');
    const a = [
      o.cls || 'Seguimento de sífilis',
      o.mae ? `tratamento materno ${minusculaInicial(o.mae)}` : '',
      vm != null || vr != null ? `VDRL do RN ${titTx(vr)} (materno ${titTx(vm)})` : '',
    ].filter(Boolean);
    if (o.cls === 'Sífilis congênita' && o.trat)
      a.push(`tratamento: ${minusculaInicial(o.trat)}${o.tratData ? ' em ' + o.tratData : ''}`);
    if ((o.av || []).length) a.push(`avaliações: ${listaEmMinusculas(o.av)}`);
    if (o.cls || o.mae || vm != null || vr != null) out.A.push(finalizarTexto(a.join('; ')));
    return out;
  }
  const gest = f.mode === 'gestante',
    need = o.cls && o.cls.startsWith('Sífilis tardia') ? 3 : o.cls && o.cls.startsWith('Sífilis recente') ? 1 : null,
    lim = gest ? 7 : 14;
  if (o.cls === 'Neurossífilis')
    H('badmsg', 'Neurossífilis: benzilpenicilina potássica/cristalina endovenosa em ambiente hospitalar. Encaminhar.');
  else if (need)
    H(
      'note',
      need === 1
        ? 'Esquema: benzilpenicilina benzatina 2,4 milhões UI IM, dose única (1,2 milhão UI em cada glúteo).'
        : 'Esquema: benzilpenicilina benzatina 2,4 milhões UI IM, 1 vez por semana, por 3 semanas (total 7,2 milhões UI).',
    );
  const doses = (o.doses || [])
    .map(r => ({ d: lerDataBr(r.d), dt: r.d, lote: (r.lote || '').trim() }))
    .filter(r => r.d)
    .sort((a, b) => a.d - b.d);
  let ok = true;
  for (let i = 1; i < doses.length; i++) {
    const g = diferencaEmDias(doses[i - 1].d, doses[i].d);
    if (g > lim) {
      ok = false;
      H(
        'badmsg',
        `Intervalo de ${g} dias entre a ${i}ª e a ${i + 1}ª dose (limite de ${lim} dias${gest ? ' na gestante' : ''}): o esquema deve ser reiniciado.`,
      );
    }
  }
  let T = null,
    status = '';
  if (need && doses.length) {
    if (doses.length >= need && ok) {
      T = doses[need - 1].d;
      status = `tratamento completo em ${formatarDataBr(T)}`;
      H('okmsg', `Tratamento completo (${need} dose${need > 1 ? 's' : ''}) em ${formatarDataBr(T)}.`);
    } else if (ok) {
      const nx = somarDias(doses[doses.length - 1].d, 7);
      status = `em tratamento (${doses.length} de ${need} doses)`;
      H(
        'warnmsg',
        `Faltam ${need - doses.length} dose(s). Próxima dose: ${formatarDataBr(nx)} (no máximo até ${formatarDataBr(somarDias(doses[doses.length - 1].d, lim))}).`,
      );
    } else status = 'esquema interrompido – reiniciar';
  }
  if (gest && doses.length && st._dpp) {
    const lim30 = somarDias(st._dpp, -30);
    if (doses[0].d > lim30)
      H(
        'warnmsg',
        `Tratamento iniciado a menos de 30 dias da DPP (${formatarDataBr(st._dpp)}): não é considerado adequado para a prevenção da sífilis congênita.`,
      );
  }
  if (gest)
    H(
      'note',
      'Tratamento adequado na gestação: penicilina benzatina, esquema completo para o estágio e iniciado até 30 dias antes do parto.',
    );
  // VDRL
  let base = null,
    ev = '';
  if (ser.length) {
    const b = T || (doses[0] && doses[0].d);
    const pre = b ? ser.filter(r => r.d <= b) : [];
    base = pre.length ? pre[pre.length - 1] : ser[0];
    const last = ser[ser.length - 1];
    for (const r of ser)
      if (r !== base && r.d > base.d && base.n && r.n >= base.n * 4) {
        ev = `aumento de 2 ou mais diluições (${titTx(base.n)} → ${titTx(r.n)})`;
        H(
          'badmsg',
          `Aumento de ${dil(r.n, base.n)} diluições em relação ao basal: possível reinfecção ou reativação. Retratar, investigar neurossífilis se indicado e reavaliar a parceria.`,
        );
        break;
      }
    if (!ev && last !== base && base.n) {
      const q = last.n === 0 ? 99 : dil(base.n, last.n),
        m = T ? diferencaEmDias(T, last.d) / 30.4 : null,
        prazo = need === 3 ? 12 : 6;
      if (q >= 2) {
        ev =
          last.n === 0
            ? 'VDRL não reagente após o tratamento'
            : `queda de ${q} diluições (${titTx(base.n)} → ${titTx(last.n)})`;
        H('okmsg', `Resposta adequada: ${ev}.`);
        if (last.n && last.n <= 4)
          H('note', 'Títulos baixos persistentes após resposta adequada podem representar cicatriz sorológica.');
      } else if (m != null && m >= prazo) {
        ev = `sem queda de 2 diluições em ${prazo} meses`;
        H(
          'warnmsg',
          `Sem queda de 2 diluições em ${prazo} meses após o tratamento: avaliar reinfecção, falha terapêutica ou neurossífilis e considerar retratamento.`,
        );
      } else
        H(
          'note',
          `Resposta esperada: queda de 2 diluições em até ${prazo} meses (${need === 3 ? 'sífilis tardia' : 'sífilis recente'}).`,
        );
    }
    out.P.push(`VDRL seriado: ${ser.map(r => `${r.dt} ${titTx(r.n)}`).join('; ')}.`);
  }
  const lastV = ser.length ? ser[ser.length - 1].d : null;
  if (gest) {
    const nx = lastV ? somarDias(lastV, 30) : null;
    if (nx) {
      out.P.push(`Próximo VDRL: ${formatarDataBr(nx)} (mensal até o parto; depois, trimestral até 12 meses).`);
      H('note', `Seguimento na gestação: VDRL mensal. Próximo: ${formatarDataBr(nx)}.`);
    }
  } else if (T) {
    const sch = [3, 6, 9, 12].map(m => ({
      m,
      d: addM(T, m),
      done: ser.some(r => Math.abs(diferencaEmDias(addM(T, m), r.d)) <= 30),
    }));
    const nx = sch.find(s => !s.done && s.d >= somarDias(hojeSemHora(), -30));
    out.html.push(
      `<p style="margin:0">Calendário do VDRL (trimestral até 12 meses): ${sch.map(s => `${s.m} m – ${formatarDataBr(s.d)}${s.done ? ' ✓' : ''}`).join(' · ')}</p>`,
    );
    if (nx)
      out.P.push(
        `Próximo VDRL: ${formatarDataBr(nx.d)} (${nx.m} meses após o tratamento)${nx.d < hojeSemHora() ? ' – atrasado' : ''}.`,
      );
  }
  if (doses.length)
    out.P.push(
      `Penicilina benzatina: ${doses.map((d, i) => `${i + 1}ª dose ${d.dt}${d.lote ? ' (lote ' + d.lote + ')' : ''}`).join('; ')}.`,
    );
  const a = [
    o.cls || 'Sífilis',
    status,
    o.trep ? `teste treponêmico ${o.trep.trim()}` : '',
    ev,
    o.parc ? `parceria ${minusculaInicial(o.parc)}${o.parcTxt ? ' (' + o.parcTxt.trim() + ')' : ''}` : '',
    o.notif ? `notificação ${minusculaInicial(o.notif)}` : '',
  ].filter(Boolean);
  if (o.cls || doses.length || ser.length) out.A.push(finalizarTexto(a.join('; ')));
  return out;
}
