/**
 * Leitura do laudo de APAC gerado pelo e-SUS PEC (PDF com texto).
 * Recebe os trechos de texto com posição (extraídos por js/servicos/leitor-pdf.js)
 * e devolve os dados encontrados. Função pura: o arquivo é lido só neste navegador.
 */
import { agruparEmLinhas } from '../../servicos/leitor-pdf.js';
import { normalizarTexto } from '../../utils/texto.js';
const ROTULOS_LAUDO_PEC = [
  'Nome do cidadão',
  'CPF',
  'CNS',
  'Cartão Nacional de Saúde',
  'Sexo',
  'Idade',
  'Data de nascimento',
  'Telefone',
  'Nome da mãe',
  'Endereço',
  'Código do município',
  'Unidade de saúde solicitante',
  'CNES',
  'Profissional solicitante',
  'CID10',
  'Justificativa do procedimento',
  'Observações',
  'Prontuário',
];
export function lerLaudoPec(items) {
  const isLab = it => ROTULOS_LAUDO_PEC.some(l => normalizarTexto(it.s) === normalizarTexto(l));
  const find = (lab, near) => {
    const c = items.filter(i => normalizarTexto(i.s) === normalizarTexto(lab));
    if (!near) return c[0];
    return c.find(i => Math.abs(i.y - near.y) < 2.5) || null;
  };
  const head = re => items.find(i => re.test(normalizarTexto(i.s)));
  // valores logo abaixo do rótulo, na coluna dele
  const below = (L, { maxLines = 1, until = null, gap = 30 } = {}) => {
    if (!L) return '';
    const sib = items.filter(i => Math.abs(i.y - L.y) < 2.5 && i.x > L.x + 2 && isLab(i)).map(i => i.x);
    const nx = sib.length ? Math.min(...sib) : 1e9;
    const lim = until ? until.y - 1 : L.y + gap * maxLines + 20;
    const c = items.filter(i => i.y > L.y + 2 && i.y < lim && i.x >= L.x - 12 && i.x < nx - 2 && !isLab(i));
    const ls = agruparEmLinhas(c);
    if (!ls.length) return '';
    if (!until) {
      const first = ls[0];
      if (first.y - L.y > gap) return '';
      return ls
        .slice(0, maxLines)
        .map(l => l.s)
        .join('\n');
    }
    return ls.map(l => l.s).join('\n');
  };
  const r = {};
  const nomeL = find('Nome do cidadão');
  r.nome = below(nomeL);
  const cpfL = find('CPF');
  r.cpf = below(cpfL).replace(/\D/g, '');
  const cnsL = find('CNS') || find('Cartão Nacional de Saúde');
  r.cns = cnsL ? below(cnsL).replace(/\D/g, '') : '';
  r.sexo = normalizarTexto(below(find('Sexo')));
  r.nasc = below(find('Data de nascimento'));
  r.tel = below(find('Telefone'));
  r.mae = below(find('Nome da mãe'));
  const endL = find('Endereço'),
    uniL = find('Unidade de saúde solicitante'),
    codL = find('Código do município', endL);
  r.ibge = codL ? below(codL, { maxLines: 3 }).replace(/\D/g, '').slice(0, 7) : '';
  if (endL) {
    const sib = codL ? codL.x : 1e9;
    const ls = agruparEmLinhas(
      items.filter(i => i.y > endL.y + 2 && i.y < (uniL ? uniL.y - 1 : endL.y + 60) && i.x < sib - 5 && !isLab(i)),
    );
    r.endLines = ls.map(l => l.s);
  }
  const pront = find('Prontuário');
  r.pront = pront ? below(pront) : '';
  r.uni = below(uniL);
  r.cnes = below(find('CNES', uniL)).replace(/\D/g, '');
  const profL = find('Profissional solicitante');
  r.prof = below(profL);
  r.profcpf = below(find('CPF', profL)).replace(/\D/g, '');
  const pH = head(/^procedimento(s)? solicitado/),
    jH = head(/^justificativa da solicitacao/);
  r.procs = [];
  if (pH) {
    const txt = agruparEmLinhas(items.filter(i => i.y > pH.y + 2 && (!jH || i.y < jH.y - 1)))
      .map(l => l.s)
      .join(' ');
    let m;
    const re = /(.+?)\s*-\s*(\d{10})\b/g;
    while ((m = re.exec(txt))) r.procs.push({ name: m[1].trim(), code: m[2] });
  }
  const cidL = find('CID10'),
    jusL = find('Justificativa do procedimento'),
    obsL = find('Observações');
  r.cids = [];
  if (cidL) {
    const t = below(cidL, { until: obsL || null, maxLines: 3 });
    t.split('\n').forEach(s => {
      const m = s.match(/^(.*?)\s*-\s*([A-Z]\d{2}[0-9X]?)\b/);
      if (m) r.cids.push({ desc: m[1].trim(), cid: m[2] });
    });
  }
  r.jus = jusL ? below(jusL, { until: obsL || null }) : '';
  const autH = head(/^autorizacao$/);
  const sig = items.filter(i => obsL && i.y > obsL.y && (!autH || i.y < autH.y));
  r.obs = '';
  if (obsL) {
    const ls = agruparEmLinhas(sig.filter(i => i.y < obsL.y + 40 && i.x < obsL.x + 300));
    r.obs = ls.length ? ls[0].s : '';
  }
  if (/^nao informado$/.test(normalizarTexto(r.obs))) r.obs = '';
  const dl = sig.map(i => i.s).find(s => /\d{1,2} de [a-zç]+ de \d{4}/i.test(s));
  if (dl) {
    const m = dl.match(/(\d{1,2}) de ([a-zç]+) de (\d{4})/i);
    const MES = [
      'janeiro',
      'fevereiro',
      'marco',
      'abril',
      'maio',
      'junho',
      'julho',
      'agosto',
      'setembro',
      'outubro',
      'novembro',
      'dezembro',
    ];
    const mi = MES.indexOf(normalizarTexto(m[2]));
    if (mi >= 0) r.dsol = `${m[3]}-${String(mi + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }
  return r;
}
