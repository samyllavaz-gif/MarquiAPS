/**
 * Roteiros executados dentro da página pelo teste de regressão (tests/e2e/regressao.js).
 * São strings/funções serializadas para page.evaluate — não importam nada do site.
 */

/**
 * Preenche genericamente todos os campos visíveis de uma área e clica nos botões de ação.
 * pass 1 e 2 geram combinações diferentes de valores.
 */
export const EXERCITAR = `(root,pass)=>{
  const skip=b=>/copiar|limpar|nova consulta|nova paciente|salvar dados|imprimir|baixar pdf|gerar anamnese|regenerar|clique de novo|confirmar/i.test(b.textContent)||b.closest('header')||b.closest('.tipos')||b.hasAttribute('data-mcopy')||b.closest('.mbar');
  const vis=e=>!!(e.offsetWidth||e.offsetHeight||e.getClientRects().length);
  let n=0;
  const bs=[...root.querySelectorAll('button')];
  bs.forEach((b,i)=>{ if(!b.isConnected||skip(b)||!vis(b)||b.disabled) return; if(pass===2&&i%2===0) return; b.click(); n++; });
  const ins=[...root.querySelectorAll('input,textarea,select')].filter(vis);
  ins.forEach((e,i)=>{
    const ph=(e.placeholder||'')+' '+(e.id||'')+' '+(e.getAttribute('data-f')||'');
    if(e.tagName==='SELECT'){ if(e.options.length>1){ e.selectedIndex=Math.min(e.options.length-1,1+((i+pass)%Math.max(1,e.options.length-1))); e.dispatchEvent(new Event('change',{bubbles:true})); } return; }
    if(e.type==='checkbox'||e.type==='radio'){ if((i+pass)%2===0&&!e.checked){ e.click(); } return; }
    if(e.type==='file'||e.readOnly) return;
    let v;
    if(e.type==='date') v=pass===1?'2026-03-15':'1958-07-02';
    else if(/dd\\/mm|data|nasc|dum|\\bdn\\b|_dn|-dn/i.test(ph)) v=pass===1?'15/03/2026':'02/07/2025';
    else if(e.type==='number'||/numeric|decimal/.test(e.inputMode||'')||/^\\d|kg|mg|mmhg|cm|anos|meses|ex\\.: \\d/i.test(e.placeholder||'')) v=String(pass===1?(7+i%40):(12+(i*7)%90));
    else v='Teste '+pass+'-'+i;
    e.value=v; e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true}));
  });
  return n;
}`;

/** Fuzz das calculadoras: entradas pseudoaleatórias (semente fixa) em cada cartão, N vezes. */
export function fuzzCalculadoras(N) {
  let seed = 12345;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const pick = a => a[Math.floor(rnd() * a.length)];
  // prettier-ignore
  const nums = [
    '', '0', '1', '2', '3', '5', '7', '9', '10', '12', '14', '15', '20', '25', '28', '30', '37', '40', '45', '54',
    '60', '65', '69', '70', '80', '85', '90', '92', '100', '110', '120', '126', '130', '140', '153', '160', '170',
    '180', '200', '0,8', '1,2', '2,5', '6,5', '7,5', '8,5', '18', '24', '36', '48', '75', '82', '-1', 'abc',
  ];
  const res = [];
  for (const sec of document.querySelectorAll('[id^="mod-"]')) {
    for (const card of sec.querySelectorAll('.card')) {
      const btn = card.querySelector('button.calc');
      if (!btn) continue;
      for (let i = 0; i < N; i++) {
        card.querySelectorAll('input').forEach(e => {
          if (e.type === 'checkbox') e.checked = rnd() < 0.35;
          else if (e.type === 'radio') e.checked = false;
          else if (e.type === 'date')
            e.value =
              rnd() < 0.15 ? '' : `202${Math.floor(rnd() * 6)}-0${1 + Math.floor(rnd() * 9)}-1${Math.floor(rnd() * 9)}`;
          else e.value = pick(nums);
        });
        const radios = {};
        card.querySelectorAll('input[type=radio]').forEach(r => (radios[r.name] = radios[r.name] || []).push(r));
        Object.values(radios).forEach(g => {
          if (rnd() < 0.92) pick(g).checked = true;
        });
        card.querySelectorAll('select').forEach(s => {
          s.selectedIndex = Math.floor(rnd() * s.options.length);
        });
        card.querySelectorAll('.result,.alert-box').forEach(r => {
          r.innerHTML = '';
          r.className = r.className.split(' ')[0];
        });
        btn.click();
        const saida = [...card.querySelectorAll('.result,.alert-box')]
          .map(r => r.className + '|' + r.innerHTML.replace(/\s+/g, ' '))
          .join('||');
        res.push([sec.id + '#' + i, saida]);
      }
    }
  }
  return res;
}
