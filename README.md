# Marqui APS

Ferramentas digitais de apoio à consulta na Atenção Primária à Saúde: consulta única com registro SOAP (você marca os tipos que vai avaliar, como queixas do dia, hipertensão e diabetes, saúde da mulher ou pré-natal), calculadoras clínicas, contracepção, implante subdérmico, requisições (mamografia/citopatológico SISCAN, densitometria e APAC) e receita sem data.

É um **site estático**: HTML, CSS e JavaScript puro (módulos ES), sem framework, sem back-end e sem banco de dados. Todo o processamento acontece no navegador de quem usa.

## Requisitos

- Para **usar**: qualquer navegador atual (Chrome, Edge, Firefox, Safari), no computador ou no celular.
- Para **rodar localmente**: um servidor HTTP estático. Os módulos ES não carregam abrindo o arquivo direto (`file://`).
  - Com Node.js 22 ou mais recente: `npm start`
  - Sem Node: `python3 -m http.server 8080` na pasta do projeto
- Para **testar, verificar o código e formatar**: Node.js 22+ e `npm install`. Para o teste de ponta a ponta, rode também `npx playwright install chromium` uma vez.

## Como rodar

```bash
npm install          # só na primeira vez (ferramentas de teste e formatação)
npm start            # abre em http://localhost:8080
```

Sem instalar nada: `python3 -m http.server 8080`, depois abra `http://localhost:8080`.

## Verificações

| Comando | O que faz |
|---|---|
| `npm test` | Testes unitários das regras clínicas e utilitários (`node:test`, sem navegador) |
| `npm run test:e2e` | Regressão no navegador: abre todas as páginas, preenche formulários, clica nos botões e compara cada resultado com `tests/e2e/referencia/saidas.json`. Também falha com erro de JavaScript ou com rolagem horizontal em 390 px |
| `npm run test:e2e:atualizar` | Regrava a referência. Use **somente** depois de uma mudança intencional de texto ou de regra, e revise a diferença no Git |
| `npm run lint` | ESLint (inclui a proibição de `console.log` no código do site) |
| `npm run format` | Formata o código com Prettier |
| `npm run check` | Lint, formatação e testes unitários de uma vez |

No teste de ponta a ponta o relógio da página fica fixo em 14/10/2026, para que idades e idade gestacional não mudem com o dia. Para usar um Chromium já instalado, defina `CHROMIUM_PATH=/caminho/do/chrome`.

## Como publicar

O site é só arquivos: publique a pasta em qualquer hospedagem estática (GitHub Pages, Netlify, Cloudflare Pages, servidor Apache ou Nginx da instituição).

Envie **apenas** estes itens:

```
index.html calculadoras.html contracepcao.html implante.html
mamografia.html densitometria.html apac.html receita.html
css/  js/  assets/
```

`node_modules/`, `tests/`, `scripts/` e os arquivos de configuração não fazem parte do site.

Não há etapa de compilação: o código-fonte é o próprio site. Use HTTPS, que a API de cópia para a área de transferência exige.

## Estrutura de pastas

```
marqui-aps/
├── index.html              Início e consulta única (SOAP)
├── calculadoras.html       Calculadoras clínicas
├── contracepcao.html       Escolha de método contraceptivo
├── implante.html           Inserção do implante subdérmico
├── mamografia.html         Requisição SISCAN (mamografia e citopatológico)
├── densitometria.html      Requisição de densitometria óssea
├── apac.html               Laudo de APAC (exames de alto custo)
├── receita.html            Receita sem data (tira a data da receita do PEC)
│
├── css/
│   ├── base/
│   │   ├── marca.css       Cores, fontes e medidas da marca (variáveis --mq-*)
│   │   ├── fontes.css      @font-face das fontes locais
│   │   ├── estrutura.css   Cabeçalho, rodapé, avisos, impressão
│   │   └── sistemas.css    Estilo comum das páginas de sistema
│   └── paginas/            Estilo próprio de cada página
│       ├── consultas/      inicio, consulta, hiperdia, queixas, modelos, painel, unica (tipos e módulos)
│       ├── requisicoes/    comum + mamografia, densitometria, apac
│       └── calculadoras.css, contracepcao.css, implante.css, receita.css
│
├── js/
│   ├── config.js           Nome do site, menu, chaves locais, bibliotecas
│   ├── componentes/        Cabeçalho, rodapé e avisos (toast) de todas as páginas
│   ├── utils/              Datas, números e texto, DOM, área de transferência, armazenamento local
│   ├── servicos/           Exportar PDF (requisições) e ler PDF (PDFs do e-SUS PEC)
│   ├── dados/              Tabelas de referência (curvas LMS da OMS)
│   ├── regras/             Regras clínicas compartilhadas, funções puras sem acesso à página:
│   │                       cardiovascular (PREVENT, SBC 2025), renal (CKD-EPI 2021, KDIGO),
│   │                       crescimento-oms, findrisc, dengue, pe-diabetico,
│   │                       exames-gestante, dose-pediatrica/
│   ├── consultas/          Página inicial e consulta única
│   │   ├── app.js          Entrada da página e rotas (#inicio, #consulta, #mulher, #prenatal…)
│   │   ├── tipos.js        Lista dos tipos de consulta (botões do topo) e tipos iniciais
│   │   ├── consulta.js     Junta base e módulos: tipos marcados, SOAP único, rascunho, Nova consulta
│   │   ├── modulos.js      Monta os módulos a partir dos modelos (tira o que a base já tem, ids únicos)
│   │   ├── base/           Dados comuns + queixas do dia + HiperDia: dados, estado, cálculos, telas, SOAP
│   │   ├── motor/          Motor dos módulos: campos, cálculos, telas, SOAP, sífilis, crescimento…
│   │   └── modelos/        Um arquivo por tipo (saúde da mulher, pré-natal, puericultura…)
│   ├── calculadoras/
│   │   ├── app.js          Lista de calculadoras e navegação
│   │   ├── ui.js           Construção de campos e resultados
│   │   ├── modulos/        Uma calculadora por arquivo (tela e eventos)
│   │   └── regras/         Regras de cada calculadora (classificações e condutas)
│   ├── contracepcao/       metodos.js (catálogo SUS), regras.js (critérios), app.js (tela)
│   ├── implante/           regras.js (riscos, alertas, SOAP), app.js (tela)
│   ├── receita/            regras.js (onde está a data), processar.js (PDF), app.js (tela)
│   └── requisicoes/
│       ├── comum.js        Unidade salva, nova paciente, impressão e PDF, pendências
│       ├── importar-cidadao-pec.js  Lê a solicitação de exame e o cadastro do cidadão do PEC
│       ├── mamografia/     mapa.js (posição dos campos), regras.js, formulario.js, app.js
│       ├── densitometria/  mapa.js, regras.js, app.js
│       └── apac/           catalogo.js (SIGTAP), regras.js, importar-pec.js, folha.js, app.js
│
├── assets/
│   ├── fonts/              TAN Whistling, Caviar Dreams, Calling Code
│   ├── img/                Logotipos e ícones
│   ├── formularios/        Imagens oficiais das folhas de requisição
│   └── vendor/             pdf.js 3.11.174 (Mozilla, Apache 2.0) e pdf-lib 1.17.1 (MIT)
│
├── scripts/servidor.js     Servidor local de desenvolvimento
├── tests/
│   ├── unit/               Testes das regras (npm test)
│   └── e2e/                Regressão no navegador e referência gravada
├── package.json, eslint.config.js, .prettierrc.json
└── README.md
```

Cada página HTML carrega um único módulo de entrada (`js/<funcionalidade>/app.js`), que importa o resto. Não há atributos `onclick` no HTML: os eventos são ligados em JavaScript.

## Onde editar

**Aparência**
- Cores, fontes e medidas da marca: `css/base/marca.css` (variáveis `--mq-*`). Todas as páginas usam essas variáveis.
- Cabeçalho, rodapé, avisos e impressão: `css/base/estrutura.css`.
- Estilo de uma página específica: `css/paginas/…`.
- Logotipos e ícones: `assets/img/`.

**Textos**
- Nome do site, subtítulo, rodapé e itens do menu: `js/config.js` (`SITE`, `MENU`).
- Nome e ordem dos tipos de consulta (botões do topo da consulta, atalhos e menu “Abrir consulta com…”): `js/consultas/tipos.js`.
- Textos fixos de cada página (títulos, instruções, rótulos): no próprio `.html`.
- Dados comuns da consulta (identificação, motivo, antecedentes, medicamentos, alergias, sinais vitais, exame, avaliação e plano), queixas do dia e HiperDia: `js/consultas/base/dados.js`, `soap.js` e o próprio `index.html`.
- Campos, opções e textos de cada tipo de consulta: `js/consultas/modelos/<tipo>.js`. Campos que a base já tem (alergias, medicamentos, sinais vitais, exame, avaliação e plano) não aparecem no tipo: a lista está em `js/consultas/modulos.js`.
- Rótulos e textos de resultado das calculadoras: `js/calculadoras/modulos/<calculadora>.js` (tela) e `js/calculadoras/regras/<calculadora>.js` (classificações e condutas).

**Regras clínicas**
- Compartilhadas entre páginas: `js/regras/` (PREVENT e SBC, CKD-EPI, curvas da OMS, FINDRISC, dengue, pé diabético, exames da gestante, doses pediátricas). A consulta (base e HiperDia) e as calculadoras usam os mesmos arquivos, então uma correção vale para todos.
- Medicamentos, doses e apresentações da calculadora de dose: `js/regras/dose-pediatrica/medicamentos.js`.
- Critérios de contracepção: `js/contracepcao/regras.js`; catálogo de métodos do SUS: `js/contracepcao/metodos.js`.
- Implante (risco de gravidez, alertas, SOAP): `js/implante/regras.js`.
- Campos obrigatórios e avisos das requisições: `js/requisicoes/<tipo>/regras.js`. Procedimentos SIGTAP da APAC: `js/requisicoes/apac/catalogo.js`.

Ao mudar uma regra, rode `npm test` e `npm run test:e2e`. Se a mudança foi intencional, atualize a referência com `npm run test:e2e:atualizar` e acrescente um teste em `tests/unit/`.

**Cada funcionalidade**

| Funcionalidade | Tela e eventos | Regras e dados |
|---|---|---|
| Início e menu | `index.html`, `js/consultas/app.js` | `js/config.js` |
| Consulta única (tipos, SOAP único, rascunho) | `js/consultas/consulta.js`, `tipos.js` | `js/consultas/modulos.js` |
| Dados comuns, queixas do dia, HiperDia | `js/consultas/base/render.js`, `app.js` | `base/calculos.js`, `dados.js`, `soap.js`, `js/regras/` |
| Tipos de consulta (módulos) | `js/consultas/motor/render.js` | `js/consultas/modelos/*.js`, `motor/calculos.js`, `motor/soap.js` |
| Calculadoras | `js/calculadoras/modulos/*.js` | `js/calculadoras/regras/*.js`, `js/regras/` |
| Dose pediátrica | `js/calculadoras/modulos/dose-pediatrica.js` | `js/regras/dose-pediatrica/` |
| Contracepção | `contracepcao.html`, `js/contracepcao/app.js` | `regras.js`, `metodos.js` |
| Implante | `implante.html`, `js/implante/app.js` | `js/implante/regras.js` |
| Mamografia e citopatológico | `js/requisicoes/mamografia/app.js`, `formulario.js` | `regras.js`; posição dos campos na folha: `mapa.js`; importação do PEC: `js/requisicoes/importar-cidadao-pec.js` |
| Densitometria | `js/requisicoes/densitometria/app.js` | `regras.js`, `mapa.js` |
| APAC | `js/requisicoes/apac/app.js`, `folha.js` | `regras.js`, `catalogo.js`, `importar-pec.js` |
| Receita sem data | `receita.html`, `js/receita/app.js` | `js/receita/regras.js`, `processar.js` |
| PDF das requisições | `js/servicos/exportar-pdf.js` | bibliotecas em `js/config.js` |

Para **acrescentar uma calculadora**: crie `js/calculadoras/modulos/nova.js` (tela), `js/calculadoras/regras/nova.js` (regras puras) e registre o módulo em `MODULOS_CALCULADORA` (`js/calculadoras/app.js`). Para **um novo tipo de consulta**: crie `js/consultas/modelos/novo.js`, registre-o em `MODELOS` (`js/consultas/modelos/index.js`) e acrescente `{ id: 'novo', rotulo: '…', modelo: 'novo' }` em `TIPOS_DE_CONSULTA` (`js/consultas/tipos.js`). Ele aparece sozinho nos botões da consulta e no menu; o atalho da página inicial é um link `<a href="#novo">` em `index.html`. Se dois tipos usarem o mesmo id de campo, o segundo ganha um prefixo automaticamente; `npm test` confere que nenhum id se repete.

## Privacidade e dados sensíveis

- Nenhum dado clínico é enviado a servidores. Não há telemetria, análise de uso, cookies nem registros (logs) de conteúdo. Os únicos acessos externos são as bibliotecas html2canvas e jsPDF (cdnjs), baixadas sob demanda para montar o PDF das requisições. Elas não recebem dados.
- Os PDFs das requisições, a leitura dos PDFs do e-SUS PEC e a receita sem data são feitos no próprio navegador.
- O **rascunho da consulta** (tipos marcados e o que foi preenchido) fica apenas no armazenamento local deste navegador (`localStorage`), para não se perder ao recarregar. **Nova consulta** (dois cliques, para confirmar) limpa a consulta e substitui o rascunho salvo por uma ficha em branco. Em computador compartilhado, use Nova consulta ao terminar ou uma janela anônima.
- As requisições guardam só os dados da **unidade de saúde** (botão Salvar dados da unidade), nunca os da paciente. **Nova paciente** limpa o formulário.
- Os textos copiados vão para a área de transferência do sistema. Ao terminar o atendimento, copie outra coisa por cima se o computador for compartilhado.
- O código não contém credenciais, chaves de API nem segredos, e o ESLint bloqueia `console.log` no código do site.
- O servidor de desenvolvimento (`npm start`) escuta só em `127.0.0.1` e não registra requisições.

## Aviso

Ferramenta de apoio: não substitui o julgamento clínico nem os protocolos e diretrizes vigentes.


## Consulta aprimorada (versão local)

A consulta agora abre uma etapa por vez: História, Exame, Avaliação e Plano. “Ver tudo” recupera a visualização completa. Os roteiros complementares ficam recolhidos e mostram a quantidade de registros; recolher um roteiro não exclui seus dados nem os retira do SOAP.

Antecedentes e hábitos dos módulos foram centralizados nos dados comuns, com migração dos rascunhos anteriores. Opções específicas continuam em “Mais opções”. Divergências entre “Nega” e condições assinaladas geram um lembrete para revisão.

Ao combinar Saúde da mulher e Pré-natal, uma DUM compatível passa a ser preenchida no pré-natal e reaproveitada. Datas divergentes são preservadas com aviso, sem escolha automática.

O painel de revisão permite ir diretamente a campos incompletos. O texto SOAP elimina somente linhas completas repetidas; itens de listas e prescrições são preservados. Os atalhos de exame físico não inserem duas vezes a mesma descrição. Não há interpretação automática nem resumo por IA.

Novos arquivos: `js/consultas/fluxo.js` e `js/consultas/texto-inteligente.js`. Os testes novos cobrem migração de dados, compartilhamento da DUM e preservação do texto clínico.


### Sugestões por categoria

O painel “Ferramentas para esta consulta” acompanha os tipos selecionados. Ferramentas integradas aparecem primeiro e abrem a etapa e os detalhes correspondentes sem responder perguntas clínicas. Quando a ferramenta está em outro módulo, o link abre uma nova aba diretamente no cartão escolhido. As abas externas não recebem dados da consulta automaticamente.

O catálogo e os vínculos por categoria ficam em `js/consultas/sugestoes.js`; a apresentação, em `sugestoes-ui.js`. Combinar categorias reúne as sugestões sem repetir a mesma ferramenta. O painel exibe três atalhos e recolhe os demais em “Ver mais”. Categorias organizam a navegação; não determinam indicação de aplicação, respostas ou resultados.


### Objetivo, história reunida e revisão final

O objetivo do atendimento (queixa nova, acompanhamento ou prevenção) fica salvo no rascunho. “Começar por aqui” leva ao campo correspondente. Em acompanhamento, a evolução desde a última consulta aparece antes do complemento da história. Mudar o objetivo preserva os dados e categorias.

“Ver a história reunida até aqui” mostra as respostas das queixas e o complemento livre. Quando motivo e HDA têm exatamente o mesmo relato, com diferenças apenas de espaços, maiúsculas e pontuação final, o texto é registrado uma vez. Complementos diferentes são preservados.

“Revisar e editar SOAP” abre uma revisão por bloco, com comparação dos campos de origem. Aplicar a revisão altera o texto usado pelos botões de cópia e preserva os campos. Revisões são salvas no rascunho. Se a origem de um bloco mudar, sua edição anterior é mantida para comparação, mas a prévia e a cópia passam a usar o registro atual até nova revisão. “Restaurar texto dos campos” remove as edições manuais. “Nova consulta” também limpa objetivo e revisões.


### Consulta e calculadoras conectadas

Abrir uma calculadora pelos atalhos da consulta prepara um vínculo local com o atendimento. Na calculadora, o painel “Dados da consulta disponíveis” lista os campos compatíveis e suas unidades; “Usar estes dados” preenche os valores, preservando campos já editados. O reaproveitamento inicial inclui idade, sexo quando informado, peso, altura (convertida de metros para centímetros), alguns valores numéricos do HiperDia e DUM compatível. Não extrai exames de texto livre nem deduz respostas negativas a partir de campos vazios.

Após calcular, “Revisar resultado para a consulta” mostra texto, dados usados e o bloco de destino (O, A ou P). O envio deixa o resultado pendente na consulta; “Adicionar ao SOAP” confirma a inclusão. Repetir o mesmo resultado não duplica o registro; uma nova versão da mesma ferramenta oferece substituir a anterior. Resultados incluídos podem ser removidos e ficam salvos no rascunho. Alterar dados na calculadora esconde o atalho do cálculo anterior até recalcular.

Os vínculos são específicos da consulta, expiram para uso após duas horas e usam somente armazenamento local do navegador. Não há dados clínicos no endereço: apenas um identificador aleatório. “Nova consulta” limpa os vínculos e resultados associados; abas antigas não podem devolver resultados para o atendimento novo. O uso direto da página de calculadoras continua independente. As regras e fórmulas clínicas existentes não foram modificadas.

### Aparência: interface contemporânea

`css/base/visual.css` é a camada visual compartilhada, carregada por último nas páginas do site. Ela mantém a marca rosa e vinho, usa fonte de sistema nos formulários e reserva a fonte decorativa para o nome da marca. Fundo neutro, superfícies brancas, botões de ação retangulares, categorias em cápsula, menor uso de sombras e divisórias leves criam uma hierarquia consistente.

O cabeçalho e os menus foram compactados no celular. A navegação das etapas fica acessível durante a rolagem, e as ações das janelas de revisão permanecem visíveis. O SOAP usa tipografia de documento em vez de aparência de código. As regras visuais novas são restritas à tela; os estilos de impressão das ferramentas permanecem nas folhas originais.


### Solicitação de dieta enteral e medicações — Bauru

`ses-bauru.html` integra o arquivo Kit_Solicitacao_SES.html fornecido, acessível no início em “Requisições e solicitações”. Mantém os modos Medicamento (Anexo IV) e Dieta enteral (Anexo V), a importação de PDFs do PEC, a seleção dos documentos e a geração de PDFs. Os modelos PDF e o gerador originais foram preservados. Bibliotecas de leitura e geração de PDF e suas dependências são servidas pelos arquivos locais já existentes no projeto, sem CDN ou fontes externas nesta ferramenta.

A navegação compartilhada é montada por `js/requisicoes/ses-bauru/app.js`, e a adaptação visual fica em `css/paginas/requisicoes/ses-bauru.css`. Os dados profissionais e institucionais padrão do arquivo fornecido foram mantidos e podem ser editados no formulário. Os dados do paciente não são salvos pelo kit; somente os dados profissionais ficam no armazenamento local, conforme o comportamento original.
