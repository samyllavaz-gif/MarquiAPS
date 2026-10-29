/**
 * Interpretação dos exames do pré-natal: o que está alterado e a orientação correspondente.
 * LABCHK[campo](texto digitado) → [nível, achado, orientação] ou lista disso; null quando normal.
 * Também traz leitores de resultados (reagente/não reagente, números, títulos). Funções puras.
 */
import { formatarNumero } from '../utils/texto.js';

export const nrm = x =>
  String(x || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
export const isNR = x => /nao[ -]?reag|\bnr\b|negativ|ausente/.test(nrm(x));
const isR = x => !isNR(x) && /reag|positiv|\b1\s*[:/]\s*\d+/.test(nrm(x));
const nums = x =>
  (String(x || '').match(/\d+(?:[.,]\d+)?/g) || []).map(n =>
    parseFloat(n.replace(/\.(?=\d{3}\b)/g, '').replace(',', '.')),
  );
const n1 = x => nums(x)[0];
const after = (x, key) => {
  const t = nrm(x);
  const i = t.indexOf(key);
  if (i < 0) return '';
  const r = t.slice(i + key.length);
  const j = r.search(/ig[gm]/);
  return j < 0 ? r : r.slice(0, j);
};
const sero =
  (nome, orient, lvl = 'bad') =>
  v =>
    isR(v) ? [lvl, `${nome} reagente`, orient] : null;
export const LABCHK = {
  ts: v =>
    /-|neg/.test(nrm(v))
      ? ['info', 'Rh negativo', 'Solicitar Coombs indireto e programar imunoglobulina anti-D conforme protocolo.']
      : null,
  tsh: v => {
    const n = n1(v);
    if (n == null) return null;
    if (n > 4)
      return [
        'bad',
        `TSH elevado (${formatarNumero(n, 2)})`,
        'Hipotireoidismo provável: solicitar T4 livre e anti-TPO e avaliar levotiroxina.',
      ];
    if (n > 2.5)
      return [
        'info',
        `TSH ${formatarNumero(n, 2)} (acima de 2,5)`,
        'Alguns protocolos consideram alterado no 1º trimestre: avaliar com anti-TPO e a referência do laboratório.',
      ];
    if (n < 0.1)
      return [
        'warn',
        `TSH suprimido (${formatarNumero(n, 2)})`,
        'Avaliar T4 livre: hipertireoidismo ou tireotoxicose transitória da gestação.',
      ];
    return null;
  },
  t4l: v =>
    /baix|diminu/.test(nrm(v))
      ? ['warn', 'T4 livre baixo', 'Avaliar hipotireoidismo.']
      : /alt|elev|aument/.test(nrm(v))
        ? ['warn', 'T4 livre elevado', 'Avaliar hipertireoidismo.']
        : null,
  glic: v => {
    const n = n1(v);
    if (n == null) return null;
    if (n >= 126)
      return [
        'bad',
        `Glicemia de jejum ${n} mg/dL`,
        'Diabetes diagnosticado na gestação (≥ 126): pré-natal de alto risco.',
      ];
    if (n >= 92)
      return [
        'warn',
        `Glicemia de jejum ${n} mg/dL`,
        'Diabetes gestacional (92 a 125): orientar dieta, monitorar glicemia e seguir protocolo.',
      ];
    return null;
  },
  a1c: v => {
    const n = n1(v);
    return n != null && n >= 6.5
      ? ['bad', `HbA1c ${formatarNumero(n)}%`, 'Diabetes prévio à gestação (≥ 6,5%): pré-natal de alto risco.']
      : null;
  },
  totg: v => {
    const a = nums(v);
    if (a.length < 2) return null;
    const [j, h1, h2] = a.length === 2 ? [a[0], null, a[1]] : a;
    if (j >= 126 || (h2 != null && h2 >= 200))
      return ['bad', `TOTG ${a.join('/')}`, 'Diabetes franco (jejum ≥ 126 ou 2 h ≥ 200): pré-natal de alto risco.'];
    if (j >= 92 || (h1 != null && h1 >= 180) || (h2 != null && h2 >= 153))
      return ['warn', `TOTG ${a.join('/')}`, 'Diabetes gestacional (jejum ≥ 92, 1 h ≥ 180 ou 2 h ≥ 153).'];
    return null;
  },
  hmg: v => {
    const t = nrm(v);
    let hb = (t.match(/hb\s*[:=]?\s*(\d+(?:[.,]\d+)?)/) || [])[1];
    if (hb == null && /^\s*\d/.test(t)) hb = t.match(/\d+(?:[.,]\d+)?/)[0];
    const r = [];
    if (hb != null) {
      const n = parseFloat(String(hb).replace(',', '.'));
      if (n < 8)
        r.push([
          'bad',
          `Anemia grave (Hb ${formatarNumero(n)})`,
          'Hb < 8 g/dL: encaminhar ao pré-natal de alto risco.',
        ]);
      else if (n < 11)
        r.push([
          'warn',
          `Anemia (Hb ${formatarNumero(n)})`,
          'Hb < 11 g/dL: sulfato ferroso em dose de tratamento e repetir hemograma.',
        ]);
    }
    let pl = (t.match(/plaq\w*\s*[:=]?\s*(\d[\d.]*)/) || [])[1];
    if (pl != null) {
      let n = parseFloat(pl.replace(/\./g, ''));
      if (n < 1000) n *= 1000;
      if (n < 100000)
        r.push([
          'bad',
          `Plaquetopenia (${n.toLocaleString('pt-BR')})`,
          'Plaquetas < 100.000: investigar (pré-eclâmpsia/HELLP, outras causas).',
        ]);
      else if (n < 150000)
        r.push(['warn', `Plaquetas ${n.toLocaleString('pt-BR')}`, 'Plaquetopenia leve: repetir e acompanhar.']);
    }
    return r.length ? r : null;
  },
  eas: v => {
    const t = nrm(v);
    if (/sem altera|normal/.test(t) && !/nitrito pos|leuc.*aument/.test(t)) return null;
    const f = [];
    if (/nitrito\s*(\+|pos)/.test(t)) f.push('nitrito positivo');
    if (/leucocit|piuria|leuc[oó]citos?\s*(aument|\d{2,})/.test(t)) f.push('leucocitúria');
    if (/hematuria|hemacias?\s*(aument|\d{2,})/.test(t)) f.push('hematúria');
    if (/proteinuria|proteinas?\s*(\+|pos)/.test(t)) f.push('proteinúria');
    if (/glicosuria|glicose\s*(\+|pos)/.test(t)) f.push('glicosúria');
    if (/bacteri/.test(t) && !/bacterias?\s*(ausent|raras)/.test(t)) f.push('bacteriúria');
    return f.length
      ? [
          'warn',
          `EAS com ${f.join(', ')}`,
          'Correlacionar com urocultura e clínica; proteinúria com PA elevada sugere pré-eclâmpsia.',
        ]
      : null;
  },
  uro: v => {
    const t = nrm(v);
    if (/negativ|sem cresc|esteril/.test(t)) return null;
    return /positiv|10\s*\^?\s*5|100[.\s]?000|>\s*100|ufc/.test(t)
      ? [
          'bad',
          'Urocultura positiva',
          'Bacteriúria/ITU: tratar mesmo assintomática, conforme antibiograma, e repetir urocultura após o tratamento.',
        ]
      : null;
  },
  toxo: v => {
    const m = after(v, 'igm'),
      g = after(v, 'igg');
    const mR = m && isR(m),
      mN = m && isNR(m),
      gR = g && isR(g),
      gN = g && isNR(g);
    if (mR)
      return [
        'bad',
        'Toxoplasmose IgM reagente',
        'Possível infecção aguda: solicitar avidez de IgG (se até 16 semanas), iniciar espiramicina e seguir protocolo.',
      ];
    if (gR && mN) return ['info', 'Toxoplasmose: imune (IgG reagente, IgM não reagente)', ''];
    if (gN && mN)
      return [
        'info',
        'Toxoplasmose: suscetível',
        'Repetir sorologia a cada trimestre e orientar medidas de prevenção.',
      ];
    return null;
  },
  coombs: sero('Coombs indireto', 'Titular anticorpos e encaminhar ao pré-natal de alto risco.'),
  hiv: sero('HIV', 'Confirmar conforme fluxograma, iniciar TARV e encaminhar ao serviço especializado.'),
  hbv: sero(
    'Hepatite B (HBsAg)',
    'Solicitar carga viral e marcadores; avaliar profilaxia antiviral e imunoprofilaxia do recém-nascido.',
  ),
  hbsag: sero(
    'HBsAg',
    'Solicitar carga viral e marcadores; avaliar profilaxia antiviral e imunoprofilaxia do recém-nascido.',
  ),
  hcv: sero('Anti-HCV', 'Solicitar HCV-RNA e encaminhar para tratamento.'),
  sif: sero(
    'Sífilis',
    'Tratar com penicilina benzatina conforme o estágio, tratar a parceria, notificar e abrir o seguimento de sífilis.',
  ),
  vdrl: sero(
    'VDRL',
    'Tratar com penicilina benzatina conforme o estágio, tratar a parceria, notificar e abrir o seguimento de sífilis.',
  ),
  gbs: v =>
    isR(v) || /positiv/.test(nrm(v))
      ? [
          'warn',
          'Estreptococo do grupo B positivo',
          'Indicar profilaxia antibiótica intraparto e registrar no cartão da gestante.',
        ]
      : null,
  htlv: sero('HTLV', 'Confirmar o resultado e orientar a contraindicação da amamentação.', 'warn'),
};
