/**
 * FINDRISC: risco de diabetes tipo 2 em 10 anos. Função pura.
 */
/**
 * @param {object} d idade, imc, cintura (números), sexo ('F'|'M'), diabetes ('1' = já tem),
 *   antiHipertensivo ('1'|'0'|''), ativ, frutas, glic ('1'|'0'), fam ('0'|'3'|'5')
 * @returns {{dm:true}|{miss:string[]}|{p:number, c:string[]}} c = [risco, chance, classe visual]
 */
export function calcularFindrisc(d) {
  if (d.diabetes === '1') return { dm: true };
  const faltando = [];
  if (isNaN(d.idade)) faltando.push('idade');
  if (!d.sexo) faltando.push('sexo');
  if (isNaN(d.imc)) faltando.push('IMC (peso e altura)');
  if (isNaN(d.cintura)) faltando.push('circunferência abdominal');
  [
    ['ativ', 'atividade física'],
    ['frutas', 'frutas e verduras'],
    ['glic', 'glicose alta prévia'],
    ['fam', 'familiar com diabetes'],
  ].forEach(([k, l]) => {
    if (d[k] == null || d[k] === '') faltando.push(l);
  });
  if (d.antiHipertensivo === '') faltando.push('remédio para pressão');
  if (faltando.length) return { miss: faltando };
  let p = 0;
  p += d.idade < 45 ? 0 : d.idade < 55 ? 2 : d.idade < 65 ? 3 : 4;
  p += d.imc < 25 ? 0 : d.imc <= 30 ? 1 : 3;
  p += d.sexo === 'M' ? (d.cintura < 94 ? 0 : d.cintura <= 102 ? 3 : 4) : d.cintura < 80 ? 0 : d.cintura <= 88 ? 3 : 4;
  p += d.ativ === '1' ? 0 : 2;
  p += d.frutas === '1' ? 0 : 1;
  p += d.antiHipertensivo === '1' ? 2 : 0;
  p += d.glic === '1' ? 5 : 0;
  p += +d.fam;
  const c =
    p < 7
      ? ['Baixo', 'cerca de 1 em 100', 'k-ok']
      : p <= 11
        ? ['Levemente elevado', 'cerca de 1 em 25', 'k-ok']
        : p <= 14
          ? ['Moderado', 'cerca de 1 em 6', 'k-warn']
          : p <= 20
            ? ['Alto', 'cerca de 1 em 3', 'k-mid']
            : ['Muito alto', 'cerca de 1 em 2', 'k-bad'];
  return { p, c };
}
