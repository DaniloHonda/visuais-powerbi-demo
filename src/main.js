// Página de demonstração: monta cada visual de verdade (o mesmo código que vira .pbiviz)
// sobre uma base fictícia, e mostra o que ele devolve ao relatório.
import "./demo.css";
import { CLASSES } from "../registry.generated";
import { createHost } from "./host";
import { VIEWS, buildDataset, filterRows } from "./data";
import { SlicerDialog } from "../.src/xpSlicer/src/dialog";

const CATALOGO = [
  {
    key: "xpKpiCard", nome: "Card de KPI", versao: "1.2.1", altura: 150,
    resumo: "Número grande com comparação de período, acumulado do ano e meta.",
    tente: ["Passe o olho na comparação: a seta muda de cor conforme sobe ou desce", "Abra o painel de formatação e troque a cor ou ligue o acumulado"]
  },
  {
    key: "xpHighlights", nome: "Lista de destaques", versao: "1.0.0", altura: 190,
    resumo: "Faixas com número grande e cor por status, alimentadas por medidas de texto.",
    tente: ["No painel de formatação, desligue \"ordenar por gravidade\" e veja a ordem mudar"]
  },
  {
    key: "xpFunnel", nome: "Funil", versao: "1.2.0", altura: 230,
    resumo: "Etapas com número, % do total e % da etapa anterior.",
    tente: ["Clique numa etapa para selecioná-la (o resto perde destaque)", "Ctrl+clique para somar etapas", "Clique no fundo para limpar", "Botão direito abre o menu de contexto"]
  },
  {
    key: "xpCompositeBars", nome: "Barras com composição", versao: "1.1.0", altura: 230,
    resumo: "Barras empilhadas por linha, com busca, ordenação e ranking de Pareto.",
    tente: ["Clique numa barra para selecionar a área", "Use a busca e a ordenação na barra de cima"]
  },
  {
    key: "xpStageTable", nome: "Tabela por etapa", versao: "1.1.0", altura: 430, encaixa: true,
    resumo: "Composição, conversão e tempo de cada etapa, com busca e ordenação.",
    tente: ["Clique no título de uma coluna para ordenar", "Clique numa linha para selecioná-la"]
  },
  {
    key: "xpSlaTable", nome: "Tabela de SLA", versao: "1.0.0", altura: 380, encaixa: true,
    resumo: "Tempo típico (mediana) e o P90 por etapa, com a base e os casos acima hoje.",
    tente: ["Compare o típico com o \"90% saem até\": a diferença mostra a cauda longa"]
  },
  {
    key: "xpHeatmap", nome: "Matriz de calor", versao: "1.2.0", altura: 500, encaixa: true,
    resumo: "Linhas × colunas com cor por volume e detalhe por coluna.",
    tente: ["Clique numa célula para selecioná-la", "Passe o mouse no ⓘ do cabeçalho"]
  },
  {
    key: "xpMasterDetail", nome: "Etapa e motivos", versao: "1.0.0", altura: 420, encaixa: true,
    resumo: "Lista à esquerda; ao escolher um item, os mais frequentes aparecem à direita.",
    tente: ["Clique numa etapa da esquerda e veja os motivos mudarem"]
  },
  {
    key: "xpGoalUsage", nome: "Consumo da meta", versao: "1.1.0", altura: 200,
    resumo: "Régua do total contra a meta, repartida por item.",
    tente: ["Veja quanto cada etapa consome dos 45 dias de meta"]
  },
  {
    key: "xpTrend", nome: "Evolução", versao: "1.0.0", altura: 470, encaixa: true,
    resumo: "Linhas no tempo com troca de série e de granularidade.",
    tente: ["Troque entre as séries e entre dia, semana e mês na barra de cima"],
    objetos: {
      textos: {
        serie1: "Aplicações × contratações", serie2: "Rejeições × entradas em etapa",
        nome1a: "Aplicações", nome1b: "Contratações", nome2a: "Rejeições", nome2b: "Entradas em etapa",
        rotuloTaxa: "taxa de contratação"
      }
    }
  },
  {
    key: "xpSlicer", nome: "Segmentação", versao: "2.2.0", altura: 170, livre: true, largura: 400,
    resumo: "Caixa com lista suspensa, janela de seleção ou lista aberta. Filtra o relatório de verdade.",
    tente: ["Abra a caixa e marque uma ou mais áreas", "O filtro vale para todos os outros visuais desta página", "No painel de formatação, troque o modo para \"janela\" ou \"lista\""]
  },
  {
    key: "xpPeriod", nome: "Período", versao: "2.2.0", altura: 170, livre: true, largura: 400,
    resumo: "Calendário suspenso com atalhos, De/Até digitável e intervalo em dois cliques.",
    tente: ["Abra o calendário e escolha um atalho, ou clique em duas datas", "O período filtra os outros visuais desta página"]
  },
  {
    key: "xpOrg", nome: "Organograma", versao: "1.0.0", altura: 170, livre: true, largura: 400,
    resumo: "Segmentação em árvore por níveis, com busca em qualquer nível.",
    tente: ["Abra a árvore e escolha uma diretoria ou um time", "Busque por um nome de qualquer nível"]
  },
  {
    key: "xpNominal", nome: "Tabela nominal", versao: "1.1.0", altura: 620, encaixa: true,
    resumo: "Lista com link, situação, dias com alerta, busca, botões por segmento e \"Mostrar mais\".",
    tente: ["Busque por um nome", "Clique nos botões de situação para filtrar a lista", "Ordene pela coluna de dias", "\"Abrir ↗\" mostraria o registro de origem"]
  },
  {
    key: "xpBaseNominal", nome: "Base nominal", versao: "1.1.0", altura: 640, encaixa: true,
    resumo: "Números clicáveis que trocam a base da lista, com colunas por base e exportação.",
    tente: ["Clique num dos números do topo para trocar a base da lista", "\"⤓ Exportar\" baixa um CSV de verdade"]
  },
  {
    key: "xpDetail", nome: "Detalhe nominal", versao: "1.0.1", altura: 620, encaixa: true,
    resumo: "Página de detalhamento: abas por situação, busca e exportação em CSV.",
    tente: ["Troque de aba", "Busque por um nome ou um motivo", "\"⤓ Exportar CSV\" baixa a aba inteira"]
  }
];

const TODOS = buildDataset();
const estado = { filtro: null, rows: TODOS, montados: [] };

const $ = (sel, root = document) => root.querySelector(sel);
function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

// ---------- cada visual montado ----------

class Montagem {
  constructor(meta, canvas, registro) {
    this.meta = meta;
    this.registro = registro;
    this.padrao = meta.objetos || {};
    this.objetos = JSON.parse(JSON.stringify(this.padrao));
    this.canvas = canvas;
    this.element = el("div", "pv-host");
    canvas.appendChild(this.element);
    this.host = createHost({
      mount: canvas,
      dialogs: { xpSlicerDialog: SlicerDialog },
      log: (tipo, texto) => this.registro && this.registro(tipo, texto),
      onFilter: (filtro) => {
        estado.filtro = filtro;
        estado.rows = filterRows(TODOS, filtro);
        this.registro && this.registro("filtro", filtro ? `filtrou o relatório (${estado.rows.length} de ${TODOS.length} aplicações)` : "tirou o filtro do relatório");
        atualizarTudo(this);
        barraDeFiltro();
      }
    });
    try {
      this.visual = new CLASSES[meta.key]({ element: this.element, host: this.host });
    } catch (e) {
      canvas.appendChild(el("div", "pv-erro", "Não foi possível montar este visual: " + e.message));
    }
    this.atualizar();
    if (window.ResizeObserver) {
      let largura = 0;
      new ResizeObserver(() => {
        if (Math.abs(this.element.clientWidth - largura) < 2) return;
        largura = this.element.clientWidth;
        this.atualizar();
      }).observe(this.element);
    }
  }

  atualizar() {
    if (!this.visual) return;
    const dv = VIEWS[this.meta.key](estado.rows);
    dv.metadata.objects = this.objetos;
    this.visual.update({
      dataViews: [dv],
      viewport: { width: this.element.clientWidth || 600, height: this.element.clientHeight || this.meta.altura },
      type: 62, viewMode: 1, editMode: 0, isInFocus: false, operationKind: 0, jsonFilters: []
    });
  }

  // Painel de formatação: lê o modelo que o próprio visual expõe ao Power BI.
  modelo() {
    try { return this.visual && this.visual.getFormattingModel(); } catch (e) { return null; }
  }

  definir(objectName, propertyName, valor) {
    if (!this.objetos[objectName]) this.objetos[objectName] = {};
    this.objetos[objectName][propertyName] = valor;
    this.atualizar();
  }

  limpar() {
    this.objetos = JSON.parse(JSON.stringify(this.padrao));
    this.atualizar();
  }
}

function atualizarTudo(exceto) {
  for (const m of estado.montados) if (m !== exceto) m.atualizar();
}

// ---------- painel de formatação ----------

function construirPainel(montagem, alvo) {
  alvo.textContent = "";
  const modelo = montagem.modelo();
  if (!modelo || !modelo.cards) {
    alvo.appendChild(el("p", "pv-nota", "Este visual não expõe opções de formatação."));
    return;
  }
  for (const card of modelo.cards) {
    const grupos = card.groups || [card];
    const fatias = grupos.flatMap(g => g.slices || []);
    if (!fatias.length) continue;
    const bloco = el("details", "pv-card");
    const titulo = el("summary", "pv-card__t", card.displayName || card.uid);
    bloco.appendChild(titulo);
    for (const fatia of fatias) {
      const controle = criarControle(montagem, fatia);
      if (controle) bloco.appendChild(controle);
    }
    alvo.appendChild(bloco);
  }
}

function criarControle(montagem, fatia) {
  const c = fatia.control;
  if (!c || !c.properties || !c.properties.descriptor) return null;
  const { objectName, propertyName } = c.properties.descriptor;
  const valor = c.properties.value;
  const linha = el("label", "pv-campo");
  linha.appendChild(el("span", "pv-campo__t", fatia.displayName || propertyName));

  let input;
  if (c.type === "ColorPicker") {
    input = el("input", "pv-campo__c");
    input.type = "color";
    input.value = (valor && valor.value) || "#000000";
    input.addEventListener("input", () => montagem.definir(objectName, propertyName, { solid: { color: input.value } }));
  } else if (c.type === "ToggleSwitch") {
    input = el("input");
    input.type = "checkbox";
    input.checked = !!valor;
    input.addEventListener("change", () => montagem.definir(objectName, propertyName, input.checked));
  } else if (c.type === "NumUpDown") {
    input = el("input", "pv-campo__n");
    input.type = "number";
    input.value = valor === null || valor === undefined ? "" : valor;
    input.addEventListener("input", () => {
      const n = parseFloat(input.value);
      if (isFinite(n)) montagem.definir(objectName, propertyName, n);
    });
  } else if (c.type === "Dropdown") {
    input = el("select", "pv-campo__s");
    for (const item of c.properties.items || []) {
      const o = el("option", null, item.displayName || item.value);
      o.value = item.value;
      input.appendChild(o);
    }
    input.value = (valor && valor.value) !== undefined ? valor.value : valor;
    input.addEventListener("change", () => montagem.definir(objectName, propertyName, input.value));
  } else if (c.type === "TextInput" || c.type === "TextArea") {
    input = el("input", "pv-campo__x");
    input.type = "text";
    input.value = valor || "";
    input.addEventListener("input", () => montagem.definir(objectName, propertyName, input.value));
  } else {
    return null;
  }
  linha.appendChild(input);
  return linha;
}

// ---------- página ----------

const abas = $("#abas");
const painel = $("#painel");
let atual = null;

function barraDeFiltro() {
  const barra = $("#filtro");
  if (!estado.filtro) { barra.hidden = true; return; }
  barra.hidden = false;
  $("#filtro-texto").textContent = `${estado.rows.length} de ${TODOS.length} aplicações`;
}

function registroDe(lista) {
  return (tipo, texto) => {
    const item = el("li", "pv-log__i");
    item.appendChild(el("span", "pv-log__k", tipo));
    item.appendChild(el("span", null, texto));
    lista.insertBefore(item, lista.firstChild);
    while (lista.children.length > 14) lista.removeChild(lista.lastChild);
  };
}

function abrir(indice) {
  const meta = CATALOGO[indice];
  Array.from(abas.children).forEach((b, i) => {
    b.setAttribute("aria-selected", String(i === indice));
    b.tabIndex = i === indice ? 0 : -1;
  });

  painel.textContent = "";
  estado.montados = [];

  const cabecalho = el("header", "pv-cab");
  const titulo = el("div");
  titulo.appendChild(el("h2", null, meta.nome));
  titulo.appendChild(el("p", "pv-cab__r", meta.resumo));
  cabecalho.appendChild(titulo);
  cabecalho.appendChild(el("span", "pv-tag", "v" + meta.versao));
  painel.appendChild(cabecalho);

  // O visual ocupa a largura inteira: é ele o assunto da página.
  const canvas = el("div", "pv-canvas" + (meta.livre ? " pv-canvas--livre" : ""));
  if (meta.encaixa) canvas.style.height = meta.altura + "px";
  else canvas.style.minHeight = meta.altura + "px";
  if (meta.largura) canvas.style.maxWidth = meta.largura + "px";
  painel.appendChild(canvas);
  const legenda = el("p", "pv-legenda", "Dados fictícios: pessoas, vagas, datas e números inventados.");
  if (meta.largura) legenda.style.maxWidth = meta.largura + "px";
  painel.appendChild(legenda);

  const sob = el("div", "pv-sob");
  const esquerda = el("div", "pv-esq");
  const direita = el("aside", "pv-dir");
  sob.append(esquerda, direita);
  painel.appendChild(sob);

  esquerda.appendChild(el("h3", "pv-h3", "Experimente"));
  const dicas = el("ul", "pv-dicas");
  for (const t of meta.tente) dicas.appendChild(el("li", null, t));
  esquerda.appendChild(dicas);

  esquerda.appendChild(el("h3", "pv-h3", "O que o visual devolve ao relatório"));
  const log = el("ul", "pv-log");
  const vazio = el("li", "pv-log__v", "Interaja com o visual acima.");
  log.appendChild(vazio);
  esquerda.appendChild(log);

  const registro = (tipo, texto) => { if (vazio.parentNode) vazio.remove(); registroDe(log)(tipo, texto); };

  const montagem = new Montagem(meta, canvas, registro);
  estado.montados.push(montagem);
  atual = montagem;

  direita.appendChild(el("h3", "pv-h3", "Painel de formatação"));
  direita.appendChild(el("p", "pv-nota", "As mesmas opções que aparecem no Power BI, lidas do próprio visual."));
  const formatacao = el("div", "pv-fmt");
  direita.appendChild(formatacao);

  const acoes = el("div", "pv-acoes");
  const reset = el("button", "pv-btn", "Voltar ao padrão");
  reset.type = "button";
  reset.addEventListener("click", () => { montagem.limpar(); construirPainel(montagem, formatacao); });
  acoes.appendChild(reset);
  direita.appendChild(acoes);
  construirPainel(montagem, formatacao);

  barraDeFiltro();
}

CATALOGO.forEach((meta, i) => {
  const b = el("button", "pv-aba", meta.nome);
  b.type = "button";
  b.setAttribute("role", "tab");
  b.addEventListener("click", () => abrir(i));
  abas.appendChild(b);
});

abas.addEventListener("keydown", (e) => {
  const i = Array.from(abas.children).findIndex(b => b.getAttribute("aria-selected") === "true");
  let n = null;
  if (e.key === "ArrowDown" || e.key === "ArrowRight") n = (i + 1) % CATALOGO.length;
  if (e.key === "ArrowUp" || e.key === "ArrowLeft") n = (i - 1 + CATALOGO.length) % CATALOGO.length;
  if (n !== null) { e.preventDefault(); abrir(n); abas.children[n].focus(); }
});

$("#filtro-limpar").addEventListener("click", () => {
  estado.filtro = null;
  estado.rows = TODOS;
  atualizarTudo(null);
  barraDeFiltro();
});

abrir(2);
