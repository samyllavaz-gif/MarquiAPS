/**
 * Cálculos exibidos dentro dos modelos (CALC): puerpério, idade gestacional, prazos dos exames,
 * retorno do pré-natal, ganho de peso, idade da criança, exames sugeridos, ACR/EULAR, resumo para a regulação e rastreamentos.
 * Cada função lê a consulta aberta e devolve { html, lines } (texto que entra no SOAP).
 */
import { LABCHK } from '../../regras/exames-gestante.js';
import {
  diferencaEmDias,
  formatarDataBr,
  hojeSemHora,
  idadeDetalhada,
  lerDataBr,
  somarDias,
  textoSemanasEDias,
} from '../../utils/datas.js';
import {
  escaparHtml,
  finalizarTexto,
  formatarNumero,
  lerNumero,
  listaEmMinusculas,
  minusculaInicial,
} from '../../utils/texto.js';
import { ageTx } from './crescimento.js';
import { estado, gv, S_, st, V } from './estado.js';
import { jointSum } from './reumatologia.js';

export const CALCS = {
  puerp() {
    const d = lerDataBr(S_('dataparto'));
    if (!d) return { html: '<p class="note">Informe a data do parto para calcular os dias de puerpério.</p>' };
    const n = diferencaEmDias(d, hojeSemHora());
    if (n < 0) return { html: '<p class="warnmsg">A data do parto está no futuro.</p>' };
    const fase =
      n <= 10
        ? 'puerpério imediato/precoce (até 10 dias)'
        : n <= 45
          ? 'puerpério tardio (11 a 45 dias)'
          : 'puerpério remoto (após 45 dias)';
    return {
      html: `<div class="big">${n}<small>dias de puerpério</small></div><p class="note">${fase[0].toUpperCase() + fase.slice(1)}.</p>`,
      lines: [['S', `Puerpério: ${n} dias – ${fase}.`]],
    };
  },
  ig() {
    const dum = lerDataBr(gv('dt', 'dum')),
      ud = lerDataBr(gv('dt', 'usgdata')),
      us = lerNumero(gv('dt', 'usgsem')),
      ui = lerNumero(gv('dt', 'usgdia')) || 0,
      t = hojeSemHora(),
      out = [],
      h = [];
    let best = null;
    st._dpp = null;
    if (dum) {
      const n = diferencaEmDias(dum, t),
        dpp = somarDias(dum, 280);
      if (n >= 0 && n < 320) {
        out.push(`IG (DUM ${formatarDataBr(dum)}): ${textoSemanasEDias(n)}; DPP: ${formatarDataBr(dpp)}`);
        st._dpp = dpp;
        h.push(
          `<div class="risk"><span class="rl">Pela DUM</span><span class="rv">${Math.floor(n / 7)}s${n % 7}d</span></div><p class="note">DPP ${formatarDataBr(dpp)}</p>`,
        );
        best = n;
      }
    }
    if (ud && !isNaN(us)) {
      const at = us * 7 + ui,
        n = at + diferencaEmDias(ud, t),
        dpp = somarDias(ud, 280 - at);
      if (n >= 0 && n < 320) {
        out.push(
          `IG (USG de ${formatarDataBr(ud)} com ${us}s${ui}d): ${textoSemanasEDias(n)}; DPP (USG): ${formatarDataBr(dpp)}`,
        );
        st._dpp = dpp;
        h.push(
          `<div class="risk"><span class="rl">Pela USG</span><span class="rv">${Math.floor(n / 7)}s${n % 7}d</span></div><p class="note">DPP ${formatarDataBr(dpp)}</p>`,
        );
        best = n;
      }
    }
    if (!out.length)
      return { html: '<p class="note">Informe a DUM e/ou a data e a IG da primeira USG (dd/mm/aaaa).</p>' };
    st._ig = best;
    st._igsrc = ud && !isNaN(us) ? 'da USG' : 'da DUM';
    return { html: h.join(''), lines: [['S', out.join('. ') + '.']] };
  },
  prazos() {
    const n = st._ig;
    if (n == null)
      return { html: '<p class="note">Os prazos dos exames aparecem quando a IG estiver calculada (DUM ou USG).</p>' };
    const r0 = somarDias(hojeSemHora(), -n),
      w = Math.floor(n / 7),
      tri = w < 14 ? '1º trimestre' : w < 28 ? '2º trimestre' : '3º trimestre';
    const done = (g, k) => {
      const o = V(g) || {};
      return !!String(o[k] || '').trim();
    };
    const L = [
      ['Exames do 1º trimestre', null, 97, done('l1', 'real')],
      ['TOTG 75 g (24 a 28 semanas)', 168, 196, done('l2', 'totg')],
      ['Exames do 3º trimestre', 196, null, done('l3', 'real')],
      ['Estreptococo do grupo B (35 a 37 semanas)', 245, 259, done('l3', 'gbs')],
    ];
    const row = ([t, a, b, ok]) => {
      let c, x;
      if (ok) {
        c = 'k-ok';
        x = 'registrado';
      } else if (a != null && n < a) {
        c = 'k-mid';
        x = `a partir de ${formatarDataBr(somarDias(r0, a))}`;
      } else if (b != null && n > b) {
        c = 'k-bad';
        x = `prazo vencido em ${formatarDataBr(somarDias(r0, b))}`;
      } else {
        c = 'k-warn';
        x = b != null ? `agora · até ${formatarDataBr(somarDias(r0, b))}` : 'agora';
      }
      return `<div class="chk"><span class="cat ${c}">${x}</span><span>${t}</span></div>`;
    };
    return {
      html: `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><h4>Prazos dos exames</h4><span class="cat k-mid">${w} semanas · ${tri}</span></div><div class="chk-list">${L.map(row).join('')}</div><p class="note">Pela IG ${st._igsrc || ''}. O prazo conta como registrado quando há data de realização (ou resultado do TOTG e do estreptococo B).</p>`,
    };
  },
  retpn() {
    const n = st._ig;
    if (n == null)
      return { html: '<p class="note">A periodicidade de retorno aparece quando a IG estiver calculada.</p>' };
    const w = Math.floor(n / 7),
      r =
        w < 28
          ? 'consultas mensais (até 28 semanas)'
          : w < 37
            ? 'consultas quinzenais (28 a 36 semanas)'
            : 'consultas semanais (a partir de 37 semanas, até o parto)';
    return {
      html: `<p style="margin:0">Com ${w} semanas: <b>${r}</b>.</p><p class="note">Até 28 sem: mensais · 28 a 36 sem: quinzenais · a partir de 37 sem: semanais.</p>`,
    };
  },
  ganho() {
    const pp = lerNumero(gv('pg', 'pprev'));
    let a = lerNumero(gv('pg', 'alt'));
    if (a > 3) a /= 100;
    if (!(pp > 0 && a > 0)) return { html: '<p class="note">Informe peso prévio e altura.</p>' };
    const imc = pp / (a * a),
      c =
        imc < 18.5
          ? ['baixo peso', '9,7 a 12,2']
          : imc < 25
            ? ['eutrofia', '8,0 a 12,0']
            : imc < 30
              ? ['sobrepeso', '7,0 a 9,0']
              : ['obesidade', '5,0 a 7,2'];
    const rws = (V('pesos') || []).filter(r => lerNumero(r.p) > 0);
    let pa = lerNumero(gv('sv', 'peso'));
    if (!(pa > 0) && rws.length) pa = lerNumero(rws[rws.length - 1].p);
    const g = pa > 0 ? pa - pp : null;
    const tb = rws.length
      ? `<div class="chk-list">${rws.map(r => `<div class="chk"><span class="cat k-mid">${escaparHtml(r.d || '—')}${r.ig ? ' · ' + escaparHtml(r.ig) : ''}</span><span>${formatarNumero(lerNumero(r.p))} kg · ganho ${(lerNumero(r.p) - pp >= 0 ? '+' : '') + formatarNumero(lerNumero(r.p) - pp)} kg</span></div>`).join('')}</div>`
      : '';
    return {
      html: `<div class="big">${formatarNumero(imc)}<small>kg/m² (IMC prévio · ${c[0]})</small></div><p style="margin:0">Ganho de peso recomendado na gestação: <b>${c[1]} kg</b>${g != null ? ` · ganho atual: <b>${formatarNumero(g)} kg</b>` : ''}.</p>${tb}<p class="note">Recomendações da Caderneta da Gestante (Ministério da Saúde). O peso atual vem do exame ou do último peso registrado.</p>`,
      lines: [
        [
          'S',
          `Peso prévio: ${formatarNumero(pp)} kg; altura ${formatarNumero(a, 2)} m; IMC prévio ${formatarNumero(imc)} kg/m² (${c[0]}); ganho de peso recomendado: ${c[1]} kg${g != null ? `; ganho atual: ${formatarNumero(g)} kg` : ''}.`,
        ],
      ],
    };
  },
  idade() {
    const dn = lerDataBr(gv('nasc', 'dn'));
    if (!dn) return { html: '<p class="note">Informe a data de nascimento (dd/mm/aaaa).</p>' };
    const a = idadeDetalhada(dn, hojeSemHora());
    if (a.y < 0) return { html: '<p class="warnmsg">A data de nascimento está no futuro.</p>' };
    const tx = a.y
      ? `${a.y} ano${a.y > 1 ? 's' : ''}${a.m ? ` e ${a.m} ${a.m > 1 ? 'meses' : 'mês'}` : ''}`
      : a.m
        ? `${a.m} ${a.m > 1 ? 'meses' : 'mês'} e ${a.d} dia${a.d === 1 ? '' : 's'}`
        : `${a.d} dia${a.d === 1 ? '' : 's'}`;
    st._mo = a.mo;
    const igs = lerNumero(gv('nasc', 'igs')),
      igd = lerNumero(gv('nasc', 'igd')) || 0,
      ga = isNaN(igs) ? null : igs * 7 + igd;
    let ct = '',
      ln = `Idade: ${tx} (DN ${formatarDataBr(dn)}).`;
    if (ga != null && ga < 259) {
      const c = diferencaEmDias(dn, hojeSemHora()) - (280 - ga);
      ct =
        c < 0
          ? `${Math.round(-c / 7)} semanas antes do termo (IG corrigida ${Math.floor((ga + diferencaEmDias(dn, hojeSemHora())) / 7)} semanas)`
          : ageTx(c);
      if (c < 730) {
        ln = `Idade: ${tx} (DN ${formatarDataBr(dn)}); prematuro de ${igs}s${igd}d – idade corrigida: ${ct}.`;
        st._moc = c < 0 ? 0 : Math.floor(c / 30.4375);
      } else ct += ' (correção não é mais necessária após 2 anos)';
    }
    return {
      html: `<div class="big">${tx}</div><p class="note">Nascido(a) em ${formatarDataBr(dn)}.</p>${ct ? `<p style="margin:0">Idade corrigida: <b>${ct}</b></p><p class="note">Usada nas curvas da OMS até 2 anos de idade corrigida.</p>` : ''}`,
      lines: [['S', ln]],
    };
  },
  exsug() {
    const k = estado.modelo._k || {},
      on = x => k[x] && st.v[k[x]] === 'Sim',
      r = [];
    if (on('poli') || on('pso') || on('sist') || on('cint'))
      r.push(
        'Inflamatório/sistêmico: hemograma, PCR/VHS, creatinina e TGO/TGP conforme o contexto; EAS se suspeita sistêmica.',
      );
    if (on('poli'))
      r.push(
        'Sinovite sugestiva de artrite reumatoide: fator reumatoide e anti-CCP; radiografia de mãos e pés quando pertinente.',
      );
    if (on('sist'))
      r.push(
        'Lúpus/conectivopatia: FAN com título e padrão; hemograma, função renal, EAS e proteinúria; anti-dsDNA, complementos e outros anticorpos conforme quadro.',
      );
    if (on('fraq')) r.push('Fraqueza objetiva: CK e investigação de causas musculares, metabólicas e medicamentosas.');
    if (on('mono'))
      r.push('Gota: ácido úrico e função renal; líquido sinovial se houver dúvida ou possibilidade de infecção.');
    if (on('axial')) r.push('Axial inflamatória: imagem de sacroilíacas e, conforme hipótese e acesso, HLA-B27.');
    if (on('cint')) r.push('Cinturas após 50 anos: PCR/VHS; investigar arterite de células gigantes se houver sinais.');
    if (on('mec') || on('gen'))
      r.push(
        'Dor mecânica ou generalizada: exames só com indicação clínica ou hipótese alternativa; evitar sorologias indiscriminadas.',
      );
    return {
      html: r.length
        ? '<h4>Exames a considerar pelo padrão</h4>' +
          r.map(x => `<p style="margin:0">${x}</p>`).join('') +
          '<p class="note">Sem painel reumatológico automático.</p>'
        : '<p class="note">Os exames sugeridos aparecem quando você abre um dos padrões na seção S.</p>',
    };
  },
  acr() {
    const J = jointSum(),
      s = S_('acr_sero'),
      a = S_('acr_apr'),
      d = S_('acr_dur');
    const tot = J.inv.filter(x => x[2] !== 'X').length;
    const js = tot > 10 && J.S >= 1 ? 5 : J.S >= 4 ? 3 : J.S >= 1 ? 2 : J.L >= 2 ? 1 : 0;
    const ss = s.startsWith('Positivo alto') ? 3 : s.startsWith('Positivo baixo') ? 2 : s ? 0 : null,
      as = a === 'Alterados' ? 1 : a ? 0 : null,
      ds = d === '6 semanas ou mais' ? 1 : d ? 0 : null;
    const parts =
      `Articulações ${js} (${J.L} grandes, ${J.S} pequenas)` +
      (ss != null ? ` · sorologia ${ss}` : '') +
      (as != null ? ` · PCR/VHS ${as}` : '') +
      (ds != null ? ` · duração ${ds}` : '');
    if (ss == null || as == null || ds == null)
      return {
        html: `<p style="margin:0">${parts}</p><p class="note">Preencha sorologia, PCR/VHS e duração para o total.</p>`,
      };
    const t = js + ss + as + ds;
    return {
      html: `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><div class="big">${t}<small>de 10 pontos</small></div><span class="cat ${t >= 6 ? 'k-bad' : 'k-ok'}">${t >= 6 ? 'Preenche critério (≥ 6)' : 'Não preenche (< 6)'}</span></div><p class="note">${parts}.</p>`,
      lines: [
        [
          'A',
          `Critérios ACR/EULAR 2010: ${t} pontos (${parts.replace('Articulações', 'articulações')})${t >= 6 ? ' – preenche critério de classificação de artrite reumatoide' : ' – não preenche critério de classificação'}.`,
        ],
      ],
    };
  },
  regul() {
    const J = jointSum(),
      parts = [];
    const ini = [S_('dist').replace(/ \(.*\)/, ''), S_('evol').toLowerCase(), S_('inicio')].filter(Boolean);
    if (ini.length)
      parts.push(
        `Quadro ${ini.join(', ')}`
          .replace('Quadro Mono', 'Quadro mono')
          .replace('Quadro Oligo', 'Quadro oligo')
          .replace('Quadro Poli', 'Quadro poli')
          .replace('Quadro Axial', 'Quadro axial'),
      );
    if (J.inv.length)
      parts.push(
        J.i.length
          ? `sinovite ao exame em ${J.grpI}${J.grpDo ? `; dor sem sinovite em ${J.grpDo}` : ''}`
          : `dor em ${J.grpD}, sem sinovite objetiva`,
      );
    if (S_('rig')) parts.push(`rigidez: ${S_('rig')}`);
    const sis = [];
    [
      'x_const',
      'x_pele',
      'x_vasc',
      'x_olho',
      'x_resp',
      'x_renal',
      'x_musc',
      'x_neuro',
      'x_int',
      'x_obst',
      'x_inf',
    ].forEach(id => {
      const o = V(id) || {};
      Object.keys(o)
        .filter(k => o[k] === '+')
        .forEach(k => sis.push(minusculaInicial(k)));
    });
    if (sis.length) parts.push(`manifestações sistêmicas: ${sis.join(', ')}`);
    const imp = V('impacto') || [];
    if (imp.length) parts.push(`perda funcional: dificuldade para ${listaEmMinusculas(imp)}`);
    const lb = V('lab') || {};
    const ex = [
      ['fr', 'FR'],
      ['accp', 'anti-CCP'],
      ['pcr', 'PCR'],
      ['vhs', 'VHS'],
      ['fan', 'FAN'],
      ['au', 'ácido úrico'],
      ['ck', 'CK'],
      ['hmg', 'hemograma'],
      ['cr', 'creatinina'],
      ['b27', 'HLA-B27'],
      ['img', 'imagem'],
    ]
      .filter(([k]) => String(lb[k] || '').trim())
      .map(([k, l]) => `${l} ${String(lb[k]).trim()}`);
    if (ex.length) parts.push(`exames: ${ex.join('; ')}`);
    const tr = (V('rmed') || [])
      .filter(r => r.med)
      .map(r => [r.med, r.esq, r.resp ? 'resposta: ' + r.resp : ''].filter(Boolean).join(' '));
    if (tr.length) parts.push(`tratamentos: ${tr.join('; ')}`);
    else if (S_('trat')) parts.push(`tratamentos: ${S_('trat')}`);
    if (S_('hip')) parts.push(`hipótese: ${S_('hip')}`);
    if (S_('prior')) parts.push(`justificativa: ${S_('prior')}`);
    const enc = S_('enc_tipo');
    if (enc) parts.push(`necessidade: ${minusculaInicial(enc)}`);
    if (!parts.length)
      return { html: '<p class="note">O resumo para a regulação é montado conforme você preenche a consulta.</p>' };
    const txt = finalizarTexto(parts.join('; ').replace(/^./, c => c.toUpperCase()));
    st._reg = txt;
    return {
      html: `<h4>Resumo para a regulação</h4><p style="margin:0">${escaparHtml(txt)}</p><div><button type="button" class="btn small" data-copyreg>Copiar resumo</button></div><p class="note">Início e evolução, articulações, sinovite, rigidez, manifestações sistêmicas, perda funcional, exames, tratamentos e justificativa.</p>`,
      lines: [['P', 'Resumo para a regulação: ' + txt]],
    };
  },
  rastreio() {
    const id = lerNumero(gv('ident', 'idade')),
      colo = S_('colo');
    if (isNaN(id)) return { html: '<p class="note">Informe a idade no topo para ver os rastreamentos indicados.</p>' };
    const r = [];
    if (colo !== 'Não (histerectomia total)' && id >= 25 && id <= 64)
      r.push(
        'Colo do útero: elegível (DNA-HPV dos 25 aos 64 anos, a cada 5 anos após resultado negativo; se citologia, seguir a regra do método).',
      );
    if (id >= 50 && id <= 74) r.push('Mama: elegível à mamografia de rastreamento a cada 2 anos (50 a 74 anos).');
    if (!r.length)
      r.push(
        'Fora das faixas etárias de rastreamento populacional de colo e mama. Queixas seguem investigação diagnóstica.',
      );
    return {
      html:
        r.map(x => `<p style="margin:0">${x}</p>`).join('') +
        '<p class="note">Histórico de lesões e imunossupressão seguem fluxos próprios.</p>',
    };
  },
};

/** Alterações encontradas nos exames digitados numa grade (GRID com chk). */
export function gridChecks(f) {
  const o = V(f.id) || {},
    r = [];
  f.f.forEach(([k, l]) => {
    const fn = f.chk && LABCHK[k];
    const v = String(o[k] || '').trim();
    if (!fn || !v) return;
    let x = fn(v);
    if (!x) return;
    if (!Array.isArray(x[0])) x = [x];
    x.forEach(y => r.push({ k, lvl: y[0], t: y[1], o: y[2] }));
  });
  return r;
}
