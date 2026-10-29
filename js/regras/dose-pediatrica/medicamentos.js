/**
 * Medicamentos pediátricos da rede municipal de São Manuel e regras de dose.
 * Cada medicamento: apresentações disponíveis (ap) e indicações (ind) com a função de cálculo.
 * Tipos de apresentação: liq (mg/mL), gotas (mg/mL + gotas/mL), comp (mg + menor fração), jato (mcg), inj (unidade/mL).
 * Lista conferida com a tabela de medicamentos do município (atualizada em 01/10/2026).
 * Para incluir um medicamento, copie um bloco existente e ajuste as doses e apresentações.
 */
import { formatarNumeroArredondado } from '../../utils/texto.js';

const limitarAoMaximo = (v, max) => (max && v > max ? [max, true] : [v, false]);
/* helpers de cálculo */
function dosePorKg(c, mgkg, maxDose, unit) {
  const [mg, cap] = limitarAoMaximo(c.kg * mgkg, maxDose);
  return { mg, cap };
}
function dosePorDia(c, mgkgDia, n, maxDose, maxDia) {
  let dia = c.kg * mgkgDia,
    capDia = false;
  if (maxDia && dia > maxDia) {
    dia = maxDia;
    capDia = true;
  }
  let [mg, cap] = limitarAoMaximo(dia / n, maxDose);
  return { mg, cap: cap || capDia };
}
const avisoDeLimite = (r, txt) => (r.cap ? [`Dose limitada pelo máximo (${txt}).`] : []);

/* apresentações: liq (mg/mL), gotas (mg/mL + gotas/mL), comp (mg + menor fração), jato (mcg), inj (unidade/mL) */
export const MEDICAMENTOS_PEDIATRICOS = [
  {
    id: 'paracetamol',
    nome: 'Paracetamol',
    grupo: 'Analgésicos e antitérmicos',
    un: 'mg',
    ap: [
      { id: 'g', tipo: 'gotas', conc: 200, gpm: 20, rx: 'Paracetamol 200 mg/mL gotas', frasco: 15 },
      { id: 'c5', tipo: 'comp', mg: 500, frac: 0.5, rx: 'Paracetamol 500 mg comprimido' },
      { id: 'c7', tipo: 'comp', mg: 750, frac: 0.5, rx: 'Paracetamol 750 mg comprimido' },
    ],
    ind: [
      {
        id: 'f',
        l: 'Febre ou dor',
        calc: c => {
          const r = dosePorKg(c, 10, c.kg >= 40 ? 750 : 700);
          const hi = Math.min(c.kg * 15, 1000);
          return {
            doses: [{ mg: r.mg, freq: 'de 6/6 horas, se febre ou dor (máximo 5 doses em 24 h)', sos: true }],
            faixa: `10 a 15 mg/kg/dose (até ${formatarNumeroArredondado(hi, 0)} mg); máximo 75 mg/kg/dia (até 4 g/dia)`,
            notes: [
              'Bula das gotas: 1 gota/kg/dose (10 mg/kg), máximo 35 gotas por dose em menores de 12 anos.',
              'Pode-se usar até 15 mg/kg/dose (1,5 gota/kg) respeitando o máximo diário.',
            ],
            warn: avisoDeLimite(r, '35 gotas / 700 mg por dose'),
          };
        },
      },
    ],
  },
  {
    id: 'dipirona',
    nome: 'Dipirona',
    grupo: 'Analgésicos e antitérmicos',
    un: 'mg',
    minMo: 3,
    minKg: 5,
    minTx: 'Não usar em menores de 3 meses ou com menos de 5 kg.',
    ap: [
      { id: 'g', tipo: 'gotas', conc: 500, gpm: 20, rx: 'Dipirona 500 mg/mL gotas', frasco: 10 },
      { id: 'c', tipo: 'comp', mg: 500, frac: 0.5, rx: 'Dipirona 500 mg comprimido' },
    ],
    ind: [
      {
        id: 'f',
        l: 'Febre ou dor',
        calc: c => {
          const r = dosePorKg(c, 15, 1000);
          return {
            doses: [{ mg: r.mg, freq: 'de 6/6 horas, se febre ou dor (máximo 4 doses em 24 h)', sos: true }],
            faixa: '10 a 25 mg/kg/dose, até 4 vezes ao dia; máximo 1 g por dose',
            notes: [
              'Na solução gotas, 1 gota = 25 mg (20 gotas/mL).',
              'Risco raro de agranulocitose e hipotensão; evitar em suspeita de dengue com sinais de alarme.',
            ],
            warn: avisoDeLimite(r, '1 g por dose'),
          };
        },
      },
    ],
  },
  {
    id: 'ibuprofeno',
    nome: 'Ibuprofeno',
    grupo: 'Analgésicos e antitérmicos',
    un: 'mg',
    minMo: 6,
    minTx: 'Não recomendado abaixo de 6 meses.',
    ap: [
      {
        id: 'g',
        tipo: 'gotas',
        conc: 100,
        gpm: 10,
        rx: 'Ibuprofeno 100 mg/mL suspensão gotas',
        frasco: 20,
        gotaNota: '1 mL = 10 gotas (1 gota = 10 mg) — confira no frasco do fabricante dispensado.',
      },
      { id: 'c3', tipo: 'comp', mg: 300, frac: 1, rx: 'Ibuprofeno 300 mg comprimido' },
      { id: 'c6', tipo: 'comp', mg: 600, frac: 1, rx: 'Ibuprofeno 600 mg comprimido' },
    ],
    ind: [
      {
        id: 'f',
        l: 'Febre ou dor',
        calc: c => {
          const r = dosePorKg(c, 10, 400);
          return {
            doses: [{ mg: r.mg, freq: 'de 6/6 a 8/8 horas, se febre ou dor (máximo 4 doses em 24 h)', sos: true }],
            faixa: '5 a 10 mg/kg/dose; máximo 40 mg/kg/dia; até 400 mg por dose',
            notes: ['Bula das gotas 100 mg/mL: 1 gota/kg/dose, máximo 40 gotas.'],
            warn: avisoDeLimite(r, '400 mg por dose').concat([
              'Não usar em suspeita de dengue, desidratação, varicela ou doença renal.',
            ]),
          };
        },
      },
    ],
  },

  {
    id: 'amox',
    nome: 'Amoxicilina',
    grupo: 'Antibióticos',
    un: 'mg',
    ap: [
      { id: 's', tipo: 'liq', conc: 50, rx: 'Amoxicilina 250 mg/5 mL suspensão oral', frasco: 150 },
      { id: 'c', tipo: 'comp', mg: 500, frac: 1, cap: true, rx: 'Amoxicilina 500 mg cápsula' },
    ],
    ind: [
      {
        id: 'p',
        l: 'Faringoamigdalite, sinusite, pele, ITU (50 mg/kg/dia)',
        calc: c => {
          const r = dosePorDia(c, 50, 3, 500);
          return {
            doses: [
              { mg: r.mg, freq: 'de 8/8 horas', nDia: 3, dias: 10, dur: 'por 10 dias (faringite) ou 7 a 10 dias' },
            ],
            faixa: '50 mg/kg/dia divididos de 8/8 h; máximo 500 mg por dose',
            warn: avisoDeLimite(r, '500 mg por dose'),
          };
        },
      },
      {
        id: 'pn',
        l: 'Pneumonia adquirida na comunidade (50 mg/kg/dia)',
        calc: c => {
          const r = dosePorDia(c, 50, 3, 500);
          return {
            doses: [{ mg: r.mg, freq: 'de 8/8 horas', nDia: 3, dias: 7, dur: 'por 5 a 7 dias' }],
            faixa: '50 mg/kg/dia de 8/8 h (AIDPI/MS); máximo 500 mg por dose',
            notes: [
              'Reavaliar em 48 a 72 horas. Sinais de gravidade (tiragem, saturação < 92%, recusa alimentar): encaminhar.',
            ],
            warn: avisoDeLimite(r, '500 mg por dose'),
          };
        },
      },
      {
        id: 'o',
        l: 'Otite média aguda — dose alta (80 a 90 mg/kg/dia)',
        calc: c => {
          const r = dosePorDia(c, 90, 2, 2000, 4000);
          const d = c.mo != null && c.mo < 24 ? 10 : 7;
          return {
            doses: [
              {
                mg: r.mg,
                freq: 'de 12/12 horas',
                nDia: 2,
                dias: d,
                dur: c.mo != null && c.mo < 24 ? 'por 10 dias' : 'por 5 a 7 dias',
              },
            ],
            faixa: '80 a 90 mg/kg/dia divididos de 12/12 h; máximo 4 g/dia',
            notes: ['Menores de 2 anos: 10 dias; 2 anos ou mais: 5 a 7 dias.'],
            warn: avisoDeLimite(r, '4 g por dia'),
          };
        },
      },
    ],
  },
  {
    id: 'amoxclav',
    nome: 'Amoxicilina + clavulanato',
    grupo: 'Antibióticos',
    un: 'mg de amoxicilina',
    ap: [
      {
        id: 's',
        tipo: 'liq',
        conc: 50,
        rx: 'Amoxicilina + clavulanato 250 mg + 62,5 mg/5 mL suspensão oral',
        frasco: 75,
      },
      { id: 'c', tipo: 'comp', mg: 500, frac: 1, rx: 'Amoxicilina + clavulanato 500 mg + 125 mg comprimido' },
    ],
    ind: [
      {
        id: 'p',
        l: 'Infecções (falha à amoxicilina, mordedura, sinusite, OMA recorrente)',
        calc: c => {
          const r = dosePorDia(c, 40, 3, 500);
          return {
            doses: [{ mg: r.mg, freq: 'de 8/8 horas', nDia: 3, dias: 10, dur: 'por 7 a 10 dias' }],
            faixa: '40 mg/kg/dia de amoxicilina divididos de 8/8 h (formulação 4:1); máximo 500 mg por dose',
            notes: [
              'Na formulação 4:1, não ultrapassar 10 mg/kg/dia de clavulanato (diarreia).',
              'Para dose alta de amoxicilina (OMA), associar amoxicilina simples mantendo o clavulanato em até 10 mg/kg/dia.',
            ],
            warn: avisoDeLimite(r, '500 mg por dose'),
          };
        },
      },
    ],
  },
  {
    id: 'azitro',
    nome: 'Azitromicina',
    grupo: 'Antibióticos',
    un: 'mg',
    ap: [
      {
        id: 's',
        tipo: 'liq',
        conc: 40,
        rx: 'Azitromicina 200 mg/5 mL suspensão oral',
        frascos: [
          [15, 'frasco de 600 mg (15 mL)'],
          [22.5, 'frasco de 900 mg (22,5 mL)'],
        ],
      },
      { id: 'c', tipo: 'comp', mg: 500, frac: 0.5, rx: 'Azitromicina 500 mg comprimido' },
    ],
    ind: [
      {
        id: 'p',
        l: 'OMA, sinusite, pneumonia atípica (3 dias)',
        calc: c => {
          const r = dosePorKg(c, 10, 500);
          return {
            doses: [{ mg: r.mg, freq: '1 vez ao dia', nDia: 1, dias: 3, dur: 'por 3 dias' }],
            faixa: '10 mg/kg 1 vez ao dia por 3 dias; máximo 500 mg/dia',
            warn: avisoDeLimite(r, '500 mg/dia'),
          };
        },
      },
      {
        id: 'f',
        l: 'Faringoamigdalite em alérgico à penicilina (5 dias)',
        calc: c => {
          const r = dosePorKg(c, 12, 500);
          return {
            doses: [{ mg: r.mg, freq: '1 vez ao dia', nDia: 1, dias: 5, dur: 'por 5 dias' }],
            faixa: '12 mg/kg 1 vez ao dia por 5 dias; máximo 500 mg/dia',
            warn: avisoDeLimite(r, '500 mg/dia'),
          };
        },
      },
      {
        id: 'q',
        l: 'Coqueluche (tratamento ou profilaxia de contatos)',
        calc: c => {
          if (c.mo != null && c.mo < 6) {
            const r = dosePorKg(c, 10, 500);
            return {
              doses: [{ mg: r.mg, freq: '1 vez ao dia', nDia: 1, dias: 5, dur: 'por 5 dias' }],
              faixa: 'Menores de 6 meses: 10 mg/kg/dia por 5 dias',
              notes: ['Menores de 1 mês: risco de estenose hipertrófica de piloro — acompanhar.'],
            };
          }
          const a = dosePorKg(c, 10, 500),
            b = dosePorKg(c, 5, 250);
          return {
            doses: [
              { rot: '1º dia', mg: a.mg, freq: 'em dose única', nDia: 1, dias: 1, dur: '' },
              { rot: '2º ao 5º dia', mg: b.mg, freq: '1 vez ao dia', nDia: 1, dias: 4, dur: '' },
            ],
            faixa: '10 mg/kg no 1º dia (máx. 500 mg) e 5 mg/kg/dia do 2º ao 5º dia (máx. 250 mg)',
            notes: ['Notificar o caso.'],
          };
        },
      },
    ],
  },
  {
    id: 'cefalexina',
    nome: 'Cefalexina',
    grupo: 'Antibióticos',
    un: 'mg',
    ap: [
      { id: 's', tipo: 'liq', conc: 50, rx: 'Cefalexina 250 mg/5 mL suspensão oral', frasco: 60 },
      { id: 'c', tipo: 'comp', mg: 500, frac: 1, cap: true, rx: 'Cefalexina 500 mg cápsula' },
    ],
    ind: [
      {
        id: 'p',
        l: 'Pele e partes moles, faringite, ITU (50 mg/kg/dia)',
        calc: c => {
          const r = dosePorDia(c, 50, 4, 500);
          return {
            doses: [{ mg: r.mg, freq: 'de 6/6 horas', nDia: 4, dias: 7, dur: 'por 7 a 10 dias (faringite: 10 dias)' }],
            faixa:
              '25 a 50 mg/kg/dia divididos de 6/6 h (até 100 mg/kg/dia em infecções graves); máximo 500 mg por dose na APS',
            warn: avisoDeLimite(r, '500 mg por dose'),
          };
        },
      },
    ],
  },
  {
    id: 'smxtmp',
    nome: 'Sulfametoxazol + trimetoprima',
    grupo: 'Antibióticos',
    un: 'mg de trimetoprima',
    minMo: 2,
    minTx: 'Contraindicado em menores de 2 meses (kernicterus).',
    ap: [
      { id: 's', tipo: 'liq', conc: 8, rx: 'Sulfametoxazol + trimetoprima 200 mg + 40 mg/5 mL suspensão oral' },
      { id: 'c', tipo: 'comp', mg: 80, frac: 0.5, rx: 'Sulfametoxazol + trimetoprima 400 mg + 80 mg comprimido' },
    ],
    ind: [
      {
        id: 'i',
        l: 'Infecção urinária (cistite)',
        calc: c => {
          const r = dosePorDia(c, 8, 2, 160);
          return {
            doses: [{ mg: r.mg, freq: 'de 12/12 horas', nDia: 2, dias: 7, dur: 'por 7 a 10 dias' }],
            faixa:
              '8 mg/kg/dia de trimetoprima (40 mg/kg/dia de sulfametoxazol) de 12/12 h; máximo 160 mg de TMP por dose',
            notes: [
              'Colher urocultura antes de iniciar, quando possível. Febre alta ou lactente pequeno: considerar pielonefrite.',
            ],
            warn: avisoDeLimite(r, '160 mg de TMP por dose'),
          };
        },
      },
    ],
  },
  {
    id: 'metro',
    nome: 'Metronidazol',
    grupo: 'Antiparasitários',
    un: 'mg',
    ap: [
      { id: 's', tipo: 'liq', conc: 40, rx: 'Metronidazol (benzoilmetronidazol) 40 mg/mL suspensão oral', frasco: 100 },
      { id: 'c', tipo: 'comp', mg: 250, frac: 0.5, rx: 'Metronidazol 250 mg comprimido' },
    ],
    ind: [
      {
        id: 'g',
        l: 'Giardíase',
        calc: c => {
          const r = dosePorDia(c, 15, 3, 250);
          return {
            doses: [{ mg: r.mg, freq: 'de 8/8 horas', nDia: 3, dias: 7, dur: 'por 5 a 7 dias' }],
            faixa: '15 mg/kg/dia divididos de 8/8 h; máximo 250 mg por dose',
            warn: avisoDeLimite(r, '250 mg por dose'),
          };
        },
      },
      {
        id: 'a',
        l: 'Amebíase',
        calc: c => {
          const r = dosePorDia(c, 35, 3, 750);
          return {
            doses: [{ mg: r.mg, freq: 'de 8/8 horas', nDia: 3, dias: 10, dur: 'por 7 a 10 dias' }],
            faixa: '35 a 50 mg/kg/dia divididos de 8/8 h; máximo 750 mg por dose',
            warn: avisoDeLimite(r, '750 mg por dose'),
          };
        },
      },
    ],
    notas: ['Orientar não ingerir com álcool (inclusive xaropes com álcool); gosto metálico é esperado.'],
  },
  {
    id: 'albendazol',
    nome: 'Albendazol',
    grupo: 'Antiparasitários',
    un: 'mg',
    minMo: 12,
    minTx: 'Não indicado abaixo de 1 ano.',
    ap: [
      { id: 's', tipo: 'liq', conc: 40, rx: 'Albendazol 40 mg/mL suspensão oral', frasco: 10 },
      { id: 'c', tipo: 'comp', mg: 400, frac: 0.5, rx: 'Albendazol 400 mg comprimido mastigável' },
    ],
    ind: [
      {
        id: 'u',
        l: 'Ascaridíase, ancilostomíase, tricuríase, enterobíase',
        calc: c => {
          const mg = c.mo != null && c.mo < 24 ? 200 : 400;
          return {
            doses: [{ mg, freq: 'dose única', nDia: 1, dias: 1, dur: '' }],
            faixa: '1 a 2 anos: 200 mg; 2 anos ou mais: 400 mg, dose única (dose fixa, não depende do peso)',
            notes: ['Enterobíase: repetir a dose após 2 semanas e tratar os contactantes.'],
          };
        },
      },
      {
        id: 'e',
        l: 'Estrongiloidíase, teníase, larva migrans cutânea (3 dias)',
        calc: c => {
          const mg = c.mo != null && c.mo < 24 ? 200 : 400;
          return {
            doses: [{ mg, freq: '1 vez ao dia', nDia: 1, dias: 3, dur: 'por 3 dias' }],
            faixa: '400 mg (200 mg entre 1 e 2 anos) 1 vez ao dia por 3 dias',
          };
        },
      },
    ],
  },
  {
    id: 'ivermectina',
    nome: 'Ivermectina',
    grupo: 'Antiparasitários',
    un: 'mg',
    minKg: 15,
    minTx: 'Não usar em crianças com menos de 15 kg.',
    ap: [{ id: 'c', tipo: 'comp', mg: 6, frac: 0.5, rx: 'Ivermectina 6 mg comprimido' }],
    ind: [
      {
        id: 's',
        l: 'Escabiose ou pediculose',
        calc: c =>
          c.kg < 15
            ? { doses: [], faixa: '200 mcg/kg; não usar abaixo de 15 kg' }
            : {
                doses: [
                  {
                    mg: doseIvermectina(c.kg),
                    freq: 'dose única, repetir após 7 a 14 dias',
                    nDia: 1,
                    dias: 2,
                    dur: '',
                  },
                ],
                faixa: '200 mcg/kg em dose única, repetida em 7 a 14 dias',
                notes: ['Tratar contactantes simultaneamente; lavar roupas de cama e de uso em água quente.'],
              },
      },
      {
        id: 'e',
        l: 'Estrongiloidíase',
        calc: c =>
          c.kg < 15
            ? { doses: [], faixa: '200 mcg/kg; não usar abaixo de 15 kg' }
            : {
                doses: [{ mg: doseIvermectina(c.kg), freq: 'dose única', nDia: 1, dias: 1, dur: '' }],
                faixa: '200 mcg/kg em dose única (tabela de bula por faixa de peso)',
              },
      },
    ],
  },

  {
    id: 'pred',
    nome: 'Prednisolona / prednisona',
    grupo: 'Respiratório e alergia',
    un: 'mg',
    ap: [
      { id: 's', tipo: 'liq', conc: 3, rx: 'Prednisolona 3 mg/mL solução oral', frasco: 100 },
      { id: 'c5', tipo: 'comp', mg: 5, frac: 0.5, rx: 'Prednisona 5 mg comprimido' },
      { id: 'c20', tipo: 'comp', mg: 20, frac: 0.5, rx: 'Prednisona 20 mg comprimido' },
    ],
    ind: [
      {
        id: 'a',
        l: 'Crise de asma / sibilância moderada',
        calc: c => {
          const mx = c.mo == null ? 40 : c.mo < 24 ? 20 : c.mo < 72 ? 30 : 40;
          const r = dosePorKg(c, 1, mx);
          return {
            doses: [{ mg: r.mg, freq: '1 vez ao dia, pela manhã', nDia: 1, dias: 5, dur: 'por 3 a 5 dias' }],
            faixa: `1 a 2 mg/kg/dia 1 vez ao dia por 3 a 5 dias; máximo ${mx} mg/dia para a idade (GINA)`,
            warn: avisoDeLimite(r, mx + ' mg/dia'),
          };
        },
      },
    ],
  },
  {
    id: 'dexa',
    nome: 'Dexametasona',
    grupo: 'Respiratório e alergia',
    un: 'mg',
    ap: [
      { id: 's', tipo: 'liq', conc: 0.1, rx: 'Dexametasona 0,1 mg/mL elixir', frasco: 120 },
      { id: 'c', tipo: 'comp', mg: 4, frac: 0.25, rx: 'Dexametasona 4 mg comprimido (macerado)' },
    ],
    ind: [
      {
        id: 'l',
        l: 'Crupe (laringite viral) leve',
        calc: c => {
          const r = dosePorKg(c, 0.15, 10);
          return {
            doses: [{ mg: r.mg, freq: 'dose única', nDia: 1, dias: 1, dur: '' }],
            faixa: '0,15 mg/kg VO em dose única',
            notes: [
              'O elixir 0,1 mg/mL exige volume grande; o comprimido de 4 mg macerado em água costuma ser mais prático.',
            ],
          };
        },
      },
      {
        id: 'm',
        l: 'Crupe moderado a grave (antes da transferência)',
        aps: ['c', 's'],
        calc: c => {
          const r = dosePorKg(c, 0.6, 10);
          return {
            doses: [{ mg: r.mg, freq: 'dose única', nDia: 1, dias: 1, dur: '' }],
            faixa: '0,6 mg/kg VO em dose única; máximo 10 mg',
            notes: [
              'Estridor em repouso, tiragem ou agitação: estabilizar e encaminhar.',
              'O elixir 0,1 mg/mL exige volume grande; preferir o comprimido de 4 mg macerado.',
            ],
            warn: avisoDeLimite(r, '10 mg'),
          };
        },
      },
    ],
  },
  {
    id: 'salb',
    nome: 'Salbutamol',
    grupo: 'Respiratório e alergia',
    un: 'mg',
    ap: [
      { id: 'sp', tipo: 'jato', mcg: 100, rx: 'Salbutamol 100 mcg/jato aerossol (Farmácia Popular) com espaçador' },
      { id: 'x', tipo: 'liq', conc: 0.4, rx: 'Salbutamol 0,4 mg/mL xarope', frasco: 120 },
    ],
    ind: [
      {
        id: 'c',
        l: 'Crise de broncoespasmo (spray com espaçador)',
        aps: ['sp'],
        calc: c => {
          const j = Math.min(10, Math.max(2, Math.round(c.kg / 2)));
          return {
            doses: [
              {
                mg: j * 0.1,
                freq: 'a cada 20 minutos, até 3 vezes na 1ª hora; depois de 4/4 horas se necessário',
                nDia: 6,
                dias: 1,
                dur: '',
              },
            ],
            faixa: '1 jato para cada 2 kg (50 mcg/kg), mínimo 2 e máximo 10 jatos, com espaçador',
            notes: ['Use a apresentação spray. Sem melhora após 3 séries ou SpO₂ < 92%: encaminhar.'],
            prefer: 'sp',
          };
        },
      },
      {
        id: 'x',
        l: 'Xarope (uso oral — não indicado para crise)',
        aps: ['x'],
        calc: c => {
          const mx = c.mo != null && c.mo < 72 ? 2 : c.mo != null && c.mo < 144 ? 2 : 4;
          const r = dosePorKg(c, 0.1, mx);
          return {
            doses: [{ mg: r.mg, freq: 'de 8/8 horas', nDia: 3, dias: 5, dur: 'por até 5 dias' }],
            faixa: `0,1 a 0,15 mg/kg/dose de 8/8 h; máximo ${mx} mg por dose`,
            warn: [
              'Via oral tem mais efeitos adversos (tremor, taquicardia) e menor eficácia: prefira o spray com espaçador.',
            ].concat(avisoDeLimite(r, mx + ' mg por dose')),
            prefer: 'x',
          };
        },
      },
    ],
  },
  {
    id: 'lorat',
    nome: 'Loratadina',
    grupo: 'Respiratório e alergia',
    un: 'mg',
    minMo: 24,
    minTx: 'Bula: uso a partir de 2 anos.',
    ap: [
      { id: 's', tipo: 'liq', conc: 1, rx: 'Loratadina 1 mg/mL xarope', frasco: 100 },
      { id: 'c', tipo: 'comp', mg: 10, frac: 0.5, rx: 'Loratadina 10 mg comprimido' },
    ],
    ind: [
      {
        id: 'a',
        l: 'Rinite alérgica, urticária',
        calc: c => ({
          doses: [{ mg: c.kg > 30 ? 10 : 5, freq: '1 vez ao dia', nDia: 1, dias: 0, dur: 'pelo tempo necessário' }],
          faixa: 'Até 30 kg: 5 mg 1 vez ao dia; acima de 30 kg: 10 mg 1 vez ao dia',
        }),
      },
    ],
  },
  {
    id: 'dexclor',
    nome: 'Dexclorfeniramina',
    grupo: 'Respiratório e alergia',
    un: 'mg',
    minMo: 24,
    minTx: 'Contraindicada em menores de 2 anos.',
    ap: [
      { id: 's', tipo: 'liq', conc: 0.4, rx: 'Dexclorfeniramina 0,4 mg/mL solução oral', frasco: 100 },
      { id: 'c', tipo: 'comp', mg: 2, frac: 0.5, rx: 'Dexclorfeniramina 2 mg comprimido' },
    ],
    ind: [
      {
        id: 'a',
        l: 'Reações alérgicas, prurido',
        calc: c => {
          const y = c.mo == null ? 6 : c.mo / 12;
          const mg = y < 6 ? 0.5 : y < 12 ? 1 : 2;
          return {
            doses: [
              { mg, freq: y < 12 ? 'de 8/8 horas' : 'de 6/6 a 8/8 horas', nDia: 3, dias: 0, dur: 'por até 5 dias' },
            ],
            faixa:
              '2 a 5 anos: 0,5 mg (máx. 3 mg/dia); 6 a 11 anos: 1 mg (máx. 6 mg/dia); 12 anos ou mais: 2 mg (máx. 12 mg/dia)',
            notes: ['Causa sonolência; preferir loratadina quando não houver necessidade de efeito sedativo.'],
          };
        },
      },
    ],
  },
  {
    id: 'ambroxol',
    nome: 'Ambroxol',
    grupo: 'Respiratório e alergia',
    un: 'mg',
    ap: [
      { id: 'i', tipo: 'liq', conc: 3, rx: 'Ambroxol 3 mg/mL xarope infantil', frasco: 120 },
      { id: 'a', tipo: 'liq', conc: 6, rx: 'Ambroxol 6 mg/mL xarope adulto', frasco: 120 },
    ],
    ind: [
      {
        id: 'a',
        l: 'Tosse produtiva (bula)',
        calc: c => {
          const y = c.mo == null ? 6 : c.mo / 12;
          const [mg, n] = y < 2 ? [7.5, 2] : y < 6 ? [7.5, 3] : y < 12 ? [15, 3] : [30, 3];
          return {
            doses: [{ mg, freq: n === 2 ? 'de 12/12 horas' : 'de 8/8 horas', nDia: n, dias: 0, dur: 'por até 7 dias' }],
            faixa:
              '< 2 anos: 7,5 mg 2x/dia; 2 a 5 anos: 7,5 mg 3x/dia; 6 a 11 anos: 15 mg 3x/dia; 12 anos ou mais: 30 mg 3x/dia',
            warn: y < 2 ? ['Menores de 2 anos: somente com avaliação médica; benefício clínico limitado.'] : [],
            notes: ['Evidência de benefício pequena; priorizar hidratação e lavagem nasal com soro fisiológico.'],
          };
        },
      },
    ],
  },

  {
    id: 'sro',
    nome: 'Sais para reidratação oral',
    grupo: 'Gastrointestinal',
    un: 'mL',
    ap: [{ id: 'e', tipo: 'none', rx: 'Sais para reidratação oral (envelope)' }],
    ind: [
      {
        id: 'a',
        l: 'Plano A — diarreia sem desidratação',
        calc: c => {
          const y = c.mo == null ? 5 : c.mo / 12;
          const v = y < 1 ? '50 a 100 mL' : y < 10 ? '100 a 200 mL' : 'à vontade';
          return {
            doses: [],
            faixa:
              'Volume após cada evacuação líquida: < 1 ano 50 a 100 mL; 1 a 10 anos 100 a 200 mL; > 10 anos à vontade',
            rx: `Sais para reidratação oral — diluir 1 envelope em 1 litro de água filtrada ou fervida (já fria). Oferecer ${v} após cada evacuação líquida, em pequenos goles. Usar o preparo em até 24 horas.`,
            notes: [
              'Manter a alimentação habitual e o aleitamento materno. Retornar se sangue nas fezes, vômitos repetidos, sede intensa ou piora.',
            ],
          };
        },
      },
      {
        id: 'b',
        l: 'Plano B — desidratação (na unidade)',
        calc: c => {
          const lo = Math.round(c.kg * 50),
            hi = Math.round(c.kg * 100);
          return {
            doses: [],
            faixa: '50 a 100 mL/kg em 4 a 6 horas, na unidade de saúde',
            rx: `Sais para reidratação oral — ${lo} a ${hi} mL em 4 a 6 horas na unidade (50 a 100 mL/kg), em pequenas quantidades e com frequência. Reavaliar a criança periodicamente.`,
            notes: [
              `Para ${formatarNumeroArredondado(c.kg)} kg: ${lo} a ${hi} mL no total (cerca de ${Math.round(lo / 5)} a ${Math.round(hi / 4)} mL por hora).`,
              'Se vomitar, aguardar 10 minutos e recomeçar mais devagar. Sem melhora ou piora: Plano C (hidratação venosa) com encaminhamento.',
            ],
          };
        },
      },
    ],
  },
  {
    id: 'ondan',
    nome: 'Ondansetrona',
    grupo: 'Gastrointestinal',
    un: 'mg',
    minMo: 6,
    minTx: 'Não indicado abaixo de 6 meses na APS.',
    ap: [{ id: 'c', tipo: 'comp', mg: 4, frac: 0.5, rx: 'Ondansetrona 4 mg comprimido' }],
    ind: [
      {
        id: 'v',
        l: 'Vômitos na gastroenterite (facilitar a TRO)',
        calc: c => {
          const mg = c.kg < 8 ? null : c.kg < 15 ? 2 : c.kg <= 30 ? 4 : 8;
          return mg == null
            ? {
                doses: [],
                faixa: 'Faixa de peso abaixo de 8 kg: sem dose de referência oral na APS.',
                warn: ['Peso abaixo de 8 kg: não usar na APS.'],
              }
            : {
                doses: [{ mg, freq: 'dose única; pode repetir após 8 horas se necessário', nDia: 1, dias: 1, dur: '' }],
                faixa: '8 a 15 kg: 2 mg; 15 a 30 kg: 4 mg; acima de 30 kg: 8 mg (dose única)',
                notes: ['Iniciar a TRO 15 a 30 minutos após a dose.'],
              };
        },
      },
    ],
  },
  {
    id: 'dompe',
    nome: 'Domperidona',
    grupo: 'Gastrointestinal',
    un: 'mg',
    ap: [{ id: 's', tipo: 'liq', conc: 1, rx: 'Domperidona 1 mg/mL suspensão oral', frasco: 100 }],
    ind: [
      {
        id: 'n',
        l: 'Náuseas e vômitos',
        calc: c => {
          const r = dosePorKg(c, 0.25, 10);
          return {
            doses: [
              {
                mg: r.mg,
                freq: 'até 3 vezes ao dia, 15 a 30 minutos antes das refeições',
                nDia: 3,
                dias: 3,
                dur: 'por no máximo 7 dias',
              },
            ],
            faixa: '0,25 mg/kg/dose até 3 vezes ao dia; máximo 0,75 mg/kg/dia (até 30 mg/dia)',
            warn: ['Risco de arritmia (QT longo): uso curto, evitar associação com macrolídeos.'].concat(
              avisoDeLimite(r, '10 mg por dose'),
            ),
          };
        },
      },
    ],
  },
  {
    id: 'metoclo',
    nome: 'Metoclopramida',
    grupo: 'Gastrointestinal',
    un: 'mg',
    minMo: 12,
    minTx: 'Contraindicada em menores de 1 ano.',
    ap: [{ id: 's', tipo: 'liq', conc: 4, rx: 'Metoclopramida 4 mg/mL solução oral', frasco: 10 }],
    ind: [
      {
        id: 'n',
        l: 'Náuseas e vômitos (2ª linha)',
        calc: c => {
          const r = dosePorKg(c, 0.1, 10);
          return {
            doses: [{ mg: r.mg, freq: 'até 3 vezes ao dia', nDia: 3, dias: 3, dur: 'por no máximo 5 dias' }],
            faixa: '0,1 a 0,15 mg/kg/dose até 3 vezes ao dia; máximo 0,5 mg/kg/dia',
            warn: ['Risco de reações extrapiramidais em crianças: preferir ondansetrona.'],
          };
        },
      },
    ],
  },
  {
    id: 'dimen',
    nome: 'Dimenidrato + piridoxina',
    grupo: 'Gastrointestinal',
    un: 'mg de dimenidrato',
    minMo: 24,
    minTx: 'Não usar em menores de 2 anos.',
    ap: [
      {
        id: 'g',
        tipo: 'gotas',
        conc: 25,
        gpm: 20,
        rx: 'Dimenidrato + piridoxina 25 mg + 5 mg/mL solução oral gotas',
        frasco: 20,
        gotaNota: '1 gota = 1,25 mg (20 gotas/mL) — confira no frasco.',
      },
      { id: 'c', tipo: 'comp', mg: 50, frac: 0.5, rx: 'Dimenidrato + piridoxina 50 mg + 10 mg comprimido' },
    ],
    ind: [
      {
        id: 'n',
        l: 'Náuseas, vômitos, cinetose',
        calc: c => {
          const y = c.mo == null ? 6 : c.mo / 12;
          const r = dosePorKg(c, 1.25, y < 6 ? 18.75 : 37.5);
          return {
            doses: [{ mg: r.mg, freq: 'de 6/6 horas, se necessário', nDia: 4, dias: 0, dur: '', sos: true }],
            faixa: `1,25 mg/kg/dose de 6/6 h; máximo ${y < 6 ? '75' : '150'} mg/dia`,
            notes: ['Causa sonolência.'],
          };
        },
      },
    ],
  },
  {
    id: 'simet',
    nome: 'Simeticona',
    grupo: 'Gastrointestinal',
    un: 'mg',
    ap: [{ id: 'g', tipo: 'gotas', conc: 75, gpm: 30, rx: 'Simeticona 75 mg/mL gotas', frasco: 15 }],
    ind: [
      {
        id: 'c',
        l: 'Gases / cólica (bula)',
        calc: c => {
          const y = c.mo == null ? 1 : c.mo / 12;
          const mg = y < 1 ? 10 : y < 12 ? 15 : 32.5;
          return {
            doses: [{ mg, freq: 'até 3 vezes ao dia', nDia: 3, dias: 0, dur: '' }],
            faixa:
              'Lactentes: 4 gotas (10 mg); até 12 anos: 6 gotas (15 mg); acima de 12 anos: 13 gotas, até 3 vezes ao dia',
            notes: ['Benefício na cólica do lactente é incerto; orientar técnicas de acalmar e pega correta.'],
          };
        },
      },
    ],
  },
  {
    id: 'lactulose',
    nome: 'Lactulose',
    grupo: 'Gastrointestinal',
    un: 'mL',
    ap: [{ id: 's', tipo: 'liq', conc: 1, rx: 'Lactulose 667 mg/mL xarope', frasco: 120 }],
    ind: [
      {
        id: 'c',
        l: 'Constipação intestinal',
        calc: c => {
          const y = c.mo == null ? 3 : c.mo / 12;
          const ml = y < 1 ? 5 : y < 7 ? Math.min(10, Math.max(5, Math.round(c.kg * 0.5))) : 15;
          return {
            doses: [{ mg: ml, freq: '1 vez ao dia (ajustar até fezes pastosas)', nDia: 1, dias: 0, dur: '' }],
            faixa:
              'Dose inicial: lactentes 5 mL/dia; 1 a 6 anos 5 a 10 mL/dia; 7 a 14 anos 15 mL/dia — ajustar pela resposta',
            notes: [
              'Associar fibras, água e treino de toalete. Investigar sinais de alarme (início no período neonatal, distensão, déficit de crescimento).',
            ],
          };
        },
      },
    ],
  },

  {
    id: 'ferro',
    nome: 'Sulfato ferroso',
    grupo: 'Suplementos',
    un: 'mg de ferro elementar',
    ap: [
      {
        id: 'g',
        tipo: 'gotas',
        conc: 25,
        gpm: 20,
        rx: 'Sulfato ferroso 25 mg/mL de ferro elementar gotas',
        frasco: 30,
        gotaNota: '1 gota = 1,25 mg de ferro elementar (20 gotas/mL).',
      },
      { id: 'c', tipo: 'comp', mg: 40, frac: 0.5, rx: 'Sulfato ferroso 40 mg de ferro elementar comprimido' },
    ],
    ind: [
      {
        id: 'p',
        l: 'Profilaxia — termo e peso adequado (6 a 24 meses)',
        calc: c => {
          const r = dosePorKg(c, 1, 15);
          return {
            doses: [
              {
                mg: r.mg,
                freq: '1 vez ao dia, longe das refeições lácteas',
                nDia: 1,
                dias: 0,
                dur: 'dos 6 aos 24 meses',
              },
            ],
            faixa: '1 mg/kg/dia de ferro elementar (Programa Nacional de Suplementação de Ferro)',
            notes: ['Oferecer com suco de fruta cítrica; pode escurecer as fezes e os dentes (escovar após).'],
          };
        },
      },
      {
        id: 'pp',
        l: 'Profilaxia — prematuro ou baixo peso ao nascer',
        calc: c => {
          const r = dosePorKg(c, 2, 15);
          return {
            doses: [
              {
                mg: r.mg,
                freq: '1 vez ao dia',
                nDia: 1,
                dias: 0,
                dur: 'a partir de 30 dias de vida, por 1 ano; depois 1 mg/kg/dia até 24 meses',
              },
            ],
            faixa: '2 mg/kg/dia (SBP), máximo 15 mg/dia',
          };
        },
      },
      {
        id: 't',
        l: 'Tratamento de anemia ferropriva',
        calc: c => {
          const r = dosePorKg(c, 3, 60);
          return {
            doses: [
              {
                mg: r.mg,
                freq: '1 vez ao dia (ou dividido em 2 tomadas)',
                nDia: 1,
                dias: 0,
                dur: 'até normalizar a hemoglobina e por mais 2 a 3 meses para repor estoques',
              },
            ],
            faixa: '3 a 5 mg/kg/dia de ferro elementar; máximo 60 mg/dia',
            notes: ['Repetir o hemograma em 30 a 60 dias (esperado aumento ≥ 1 g/dL de Hb).'],
            warn: avisoDeLimite(r, '60 mg/dia'),
          };
        },
      },
    ],
  },
  {
    id: 'nistatina',
    nome: 'Nistatina',
    grupo: 'Antifúngicos e antivirais',
    un: 'UI',
    ap: [{ id: 's', tipo: 'liq', conc: 100000, rx: 'Nistatina 100.000 UI/mL suspensão oral', frasco: 50 }],
    ind: [
      {
        id: 'm',
        l: 'Candidíase oral (monilíase)',
        calc: c => {
          const y = c.mo == null ? 1 : c.mo / 12;
          const ml = y < 1 ? 1 : 4;
          return {
            doses: [
              {
                mg: ml * 100000,
                freq: 'de 6/6 horas, metade em cada lado da boca',
                nDia: 4,
                dias: 7,
                dur: 'por 7 a 14 dias e até 48 horas após o desaparecimento das lesões',
              },
            ],
            faixa: 'Lactentes: 1 a 2 mL 4x/dia; crianças: 4 a 6 mL 4x/dia',
            notes: ['Tratar também os mamilos da mãe que amamenta (candidíase mamária) e ferver bicos e chupetas.'],
          };
        },
      },
    ],
  },
  {
    id: 'aciclovir',
    nome: 'Aciclovir',
    grupo: 'Antifúngicos e antivirais',
    un: 'mg',
    ap: [{ id: 'c', tipo: 'comp', mg: 200, frac: 0.5, rx: 'Aciclovir 200 mg comprimido (pode ser disperso em água)' }],
    ind: [
      {
        id: 'v',
        l: 'Varicela (iniciar em até 24 h do exantema)',
        calc: c => {
          const r = dosePorKg(c, 20, 800);
          return {
            doses: [{ mg: r.mg, freq: 'de 6/6 horas (4 vezes ao dia)', nDia: 4, dias: 5, dur: 'por 5 dias' }],
            faixa: '20 mg/kg/dose 4 vezes ao dia por 5 dias; máximo 800 mg por dose',
            notes: [
              'Indicado sobretudo para ≥ 12 anos, doença de pele ou pulmonar crônica, uso de corticoide ou caso secundário domiciliar.',
              'Não usar AAS (síndrome de Reye) nem ibuprofeno.',
            ],
            warn: avisoDeLimite(r, '800 mg por dose'),
          };
        },
      },
      {
        id: 'h',
        l: 'Gengivoestomatite herpética',
        calc: c => {
          const r = dosePorKg(c, 15, 200);
          return {
            doses: [{ mg: r.mg, freq: '5 vezes ao dia', nDia: 5, dias: 7, dur: 'por 7 dias' }],
            faixa: '15 mg/kg/dose 5 vezes ao dia por 7 dias; máximo 200 mg por dose',
            notes: ['Mais eficaz se iniciado nas primeiras 72 horas. Atenção à hidratação.'],
          };
        },
      },
    ],
  },

  {
    id: 'penbz',
    nome: 'Benzilpenicilina benzatina',
    grupo: 'Injetáveis (aplicação na unidade)',
    un: 'UI',
    ap: [
      {
        id: 'i',
        tipo: 'inj',
        conc: 300000,
        u: 'UI',
        rx: 'Benzilpenicilina benzatina 1.200.000 UI (reconstituída em 4 mL)',
      },
    ],
    ind: [
      {
        id: 'f',
        l: 'Faringoamigdalite estreptocócica',
        calc: c => {
          const ui = c.kg < 27 ? 600000 : 1200000;
          return {
            doses: [{ mg: ui, freq: 'IM, dose única', nDia: 1, dias: 1, dur: '' }],
            faixa: '< 27 kg: 600.000 UI; ≥ 27 kg: 1.200.000 UI IM, dose única',
          };
        },
      },
      {
        id: 'r',
        l: 'Profilaxia secundária de febre reumática',
        calc: c => {
          const ui = c.kg < 27 ? 600000 : 1200000;
          return {
            doses: [{ mg: ui, freq: 'IM a cada 21 dias', nDia: 1, dias: 0, dur: '' }],
            faixa: '< 27 kg: 600.000 UI; ≥ 27 kg: 1.200.000 UI IM a cada 21 dias',
          };
        },
      },
      {
        id: 's',
        l: 'Sífilis adquirida (criança)',
        calc: c => {
          const r = dosePorKg(c, 50000, 2400000);
          return {
            doses: [
              {
                mg: r.mg,
                freq: 'IM, dose única (sífilis recente) ou 1 vez por semana por 3 semanas (tardia ou de duração ignorada)',
                nDia: 1,
                dias: 1,
                dur: '',
              },
            ],
            faixa: '50.000 UI/kg IM; máximo 2.400.000 UI por dose',
            notes: [
              'Investigar abuso sexual em criança com sífilis adquirida. Para sífilis congênita, seguir o PCDT (tratamento hospitalar na maioria dos casos).',
            ],
          };
        },
      },
    ],
    notas: ['Aplicar na unidade com material de suporte para anafilaxia; observar por 30 minutos.'],
  },
  {
    id: 'ceftri',
    nome: 'Ceftriaxona',
    grupo: 'Injetáveis (aplicação na unidade)',
    un: 'mg',
    minMo: 1,
    minTx: 'Evitar em menores de 28 dias (hiperbilirrubinemia, interação com cálcio).',
    ap: [
      {
        id: 'i',
        tipo: 'inj',
        conc: 250,
        u: 'mg',
        rx: 'Ceftriaxona 1 g IM (reconstituída com o diluente de 3,5 mL com lidocaína; ≈ 250 mg/mL)',
      },
    ],
    ind: [
      {
        id: 'o',
        l: 'Otite média aguda (falha ou impossibilidade de VO)',
        calc: c => {
          const r = dosePorKg(c, 50, 1000);
          return {
            doses: [{ mg: r.mg, freq: 'IM 1 vez ao dia', nDia: 1, dias: 3, dur: 'por 1 a 3 dias' }],
            faixa: '50 mg/kg IM 1 vez ao dia por 1 a 3 dias; máximo 1 g',
            warn: avisoDeLimite(r, '1 g'),
          };
        },
      },
      {
        id: 'g',
        l: 'Infecção grave — dose antes da transferência',
        calc: c => {
          const r = dosePorKg(c, 100, 2000);
          return {
            doses: [{ mg: r.mg, freq: 'IM, dose única antes do encaminhamento', nDia: 1, dias: 1, dur: '' }],
            faixa: '100 mg/kg IM em dose única (máximo 2 g); acima de 1 g, dividir em dois sítios',
            warn: ['O diluente com lidocaína é exclusivo para uso IM — nunca IV.'].concat(avisoDeLimite(r, '2 g')),
          };
        },
      },
    ],
  },
  {
    id: 'dipinj',
    nome: 'Dipirona injetável',
    grupo: 'Injetáveis (aplicação na unidade)',
    un: 'mg',
    minMo: 3,
    minKg: 5,
    minTx: 'Não usar em menores de 3 meses ou com menos de 5 kg.',
    ap: [{ id: 'i', tipo: 'inj', conc: 500, u: 'mg', rx: 'Dipirona 500 mg/mL injetável (ampola 2 mL)' }],
    ind: [
      {
        id: 'f',
        l: 'Febre ou dor sem via oral possível',
        calc: c => {
          const r = dosePorKg(c, 15, 1000);
          return {
            doses: [{ mg: r.mg, freq: 'IM, dose única', nDia: 1, dias: 1, dur: '' }],
            faixa: '10 a 20 mg/kg/dose IM; máximo 1 g',
            warn: ['Preferir a via oral sempre que possível; IV apenas com monitorização (hipotensão).'],
          };
        },
      },
    ],
  },
];

function doseIvermectina(kg) {
  return kg < 15
    ? 0
    : kg < 25
      ? 3
      : kg < 36
        ? 6
        : kg < 51
          ? 9
          : kg < 66
            ? 12
            : kg < 80
              ? 15
              : Math.round((kg * 0.2) / 3) * 3;
}

export const GRUPOS_MEDICAMENTOS = [...new Set(MEDICAMENTOS_PEDIATRICOS.map(m => m.grupo))];
