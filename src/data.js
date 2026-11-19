// Base fictícia de um processo seletivo: pessoas, vagas e datas inventadas.
// Tudo é gerado por uma semente fixa, então a demonstração é sempre a mesma.

export const ETAPAS = ["Triagem", "Entrevista RH", "Teste técnico", "Entrevista gestor", "Proposta"];
const AREAS = ["Dados", "Engenharia", "Produto", "Comercial", "Marketing"];
const VAGAS = {
  Dados: ["Analista de Dados", "Engenheiro de Dados"],
  Engenharia: ["Pessoa Desenvolvedora Back-end", "Pessoa Desenvolvedora Front-end"],
  Produto: ["Product Manager", "Designer de Produto"],
  Comercial: ["Executivo de Contas", "Analista Comercial"],
  Marketing: ["Analista de Marketing", "Social Media"]
};
const PRACAS = ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Porto Alegre", "Recife"];
const RECRUTADORES = ["Ana Prado", "Bruno Teles", "Clara Viana", "Diego Matos"];
const MOTIVOS = [
  "Perfil técnico abaixo do esperado",
  "Pretensão acima da faixa",
  "Sem retorno do candidato",
  "Vaga preenchida por outro candidato",
  "Pouca aderência cultural",
  "Recusou a proposta"
];
const PRIMEIROS = ["Alice", "Caio", "Helena", "Igor", "Júlia", "Lucas", "Mariana", "Nuno", "Olívia", "Paulo", "Renata", "Sérgio", "Tatiana", "Vitor", "Yara", "Bruno", "Camila", "Daniel", "Eduarda", "Felipe", "Gabriela", "Heitor", "Isadora", "João", "Larissa", "Marcos", "Natália", "Otávio", "Priscila", "Rafael"];
const ULTIMOS = ["Almeida", "Barros", "Cardoso", "Duarte", "Esteves", "Freitas", "Gomes", "Henriques", "Innocenti", "Jardim", "Krause", "Lacerda", "Macedo", "Nogueira", "Oliveira", "Pacheco", "Quintela", "Ramalho", "Siqueira", "Tavares"];

const ORG = {
  Dados: ["Diretoria de Tecnologia", "Plataforma de Dados"],
  Engenharia: ["Diretoria de Tecnologia", "Engenharia de Produto"],
  Produto: ["Diretoria de Produto", "Discovery"],
  Comercial: ["Diretoria Comercial", "Vendas Diretas"],
  Marketing: ["Diretoria Comercial", "Growth"]
};

const DIA = 86400000;

// Gerador determinístico: a mesma semente devolve sempre a mesma base.
function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }

export function buildDataset() {
  const rand = rng(20261119);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const hoje = startOfDay(new Date());
  const rows = [];

  for (let i = 0; i < 420; i++) {
    const area = pick(AREAS);
    const vaga = pick(VAGAS[area]);
    const nome = `${pick(PRIMEIROS)} ${pick(ULTIMOS)}`;
    const praca = pick(PRACAS);
    const recrutador = pick(RECRUTADORES);
    const candidatura = new Date(hoje.getTime() - Math.floor(rand() * 170 + 6) * DIA);

    // Quanto mais fundo a etapa, menos gente chega.
    let maxStage = 0;
    while (maxStage < 4 && rand() < [0.62, 0.66, 0.68, 0.74][maxStage]) maxStage++;

    const idade = Math.round((hoje - candidatura) / DIA);
    let resultado;
    if (maxStage === 4 && rand() < 0.55) resultado = "contratada";
    else if (rand() < 0.62 || idade > 70) resultado = "rejeitada";
    else resultado = "andamento";

    // Dias em cada etapa por onde passou.
    const basePorEtapa = [3, 7, 10, 6, 4];
    const dias = [];
    let gasto = 0;
    for (let s = 0; s <= maxStage; s++) {
      const d = Math.max(0, Math.round(basePorEtapa[s] * (0.4 + rand() * 1.9)));
      dias.push(d);
      gasto += d;
    }
    if (gasto > idade) {
      const fator = idade / Math.max(1, gasto);
      for (let s = 0; s < dias.length; s++) dias[s] = Math.floor(dias[s] * fator);
      gasto = dias.reduce((a, b) => a + b, 0);
    }

    const entradaEtapa = new Date(candidatura.getTime() + (gasto - dias[maxStage]) * DIA);
    const diasNaEtapa = resultado === "andamento" ? Math.round((hoje - entradaEtapa) / DIA) : dias[maxStage];
    const saida = resultado === "andamento" ? null : new Date(candidatura.getTime() + gasto * DIA);

    rows.push({
      id: 100000 + i,
      candidato: nome,
      vaga, area, praca, recrutador,
      diretoria: ORG[area][0],
      time: ORG[area][1],
      candidatura,
      maxStage,
      resultado,
      etapa: ETAPAS[maxStage],
      motivo: resultado === "rejeitada" ? (maxStage >= 3 && rand() < 0.4 ? MOTIVOS[5] : pick(MOTIVOS.slice(0, 5))) : "",
      diasEtapa: diasNaEtapa,
      diasTotais: gasto,
      dias,
      entradaEtapa,
      saida
    });
  }
  return rows;
}

// ---------- agregações ----------

export const agg = {
  participantes: (rows, i) => rows.filter(r => r.maxStage >= i).length,
  aprovados: (rows, i) => rows.filter(r => r.maxStage > i || (r.maxStage === i && r.resultado === "contratada")).length,
  rejeitados: (rows, i) => rows.filter(r => r.maxStage === i && r.resultado === "rejeitada").length,
  andamento: (rows, i) => rows.filter(r => r.maxStage === i && r.resultado === "andamento").length
};

function mediana(list) {
  if (!list.length) return null;
  const s = list.slice().sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}
function percentil(list, p) {
  if (!list.length) return null;
  const s = list.slice().sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p * s.length))];
}
function media(list) { return list.length ? Math.round((list.reduce((a, b) => a + b, 0) / list.length) * 10) / 10 : null; }

// Dias já concluídos em cada etapa (quem ainda está nela não entra).
function diasConcluidos(rows, i) {
  return rows.filter(r => r.maxStage > i || (r.maxStage === i && r.resultado !== "andamento")).map(r => r.dias[i]).filter(d => d !== undefined);
}

// ---------- montagem dos dataViews ----------

const TEXT = { text: true };
const NUM = { numeric: true };
const DATE = { dateTime: true };

function source(role, displayName, type, format, queryName) {
  return { displayName, queryName: queryName || `Aplicacoes.${displayName}`, roles: { [role]: true }, type, format };
}

function categorical(cats, vals, objects) {
  const columns = [];
  const categories = cats.map(c => {
    const src = Object.assign({}, c.source, { index: columns.length });
    columns.push(src);
    return { source: src, values: c.values, identity: c.values.map((v, j) => ({ key: `${src.displayName}=${v}`, j })) };
  });
  const values = vals.map(v => {
    const src = Object.assign({}, v.source, { index: columns.length });
    columns.push(src);
    return { source: src, values: v.values };
  });
  values.grouped = () => [{ values }];
  return { metadata: { columns, objects }, categorical: { categories, values } };
}

function tabular(cols, rows, objects) {
  const columns = cols.map((c, i) => Object.assign({}, c, { index: i }));
  return { metadata: { columns, objects }, table: { columns, rows, identity: rows.map((r, i) => ({ key: "r" + i })) } };
}

const porEtapa = (rows, fn) => ETAPAS.map((_, i) => fn(rows, i));

function contagemPor(rows, campo, ordem) {
  const mapa = new Map();
  for (const r of rows) mapa.set(r[campo], (mapa.get(r[campo]) || 0) + 1);
  const chaves = ordem || Array.from(mapa.keys()).sort();
  return chaves.map(k => [k, mapa.get(k) || 0]);
}

// Um construtor por visual. Todos recebem as linhas já filtradas.
export const VIEWS = {
  xpFunnel: (rows) => categorical(
    [{ source: source("etapa", "Etapa", TEXT), values: ETAPAS },
     { source: source("grupo", "Grupo", TEXT), values: ["Entrada", "Entrevistas", "Entrevistas", "Entrevistas", "Fechamento"] }],
    [{ source: source("valor", "Aplicações", NUM, "#,0"), values: porEtapa(rows, agg.participantes) }]
  ),

  xpKpiCard: (rows) => {
    const contratadas = rows.filter(r => r.resultado === "contratada");
    const metade = rows.filter(r => r.candidatura.getTime() > Date.now() - 85 * DIA);
    const anterior = rows.filter(r => r.candidatura.getTime() <= Date.now() - 85 * DIA);
    return categorical([], [
      { source: source("valor", "Aplicações", NUM, "#,0"), values: [rows.length] },
      { source: source("cmpAtual", "Últimos 85 dias", NUM, "#,0"), values: [metade.length] },
      { source: source("cmpAnterior", "85 dias anteriores", NUM, "#,0"), values: [anterior.length] },
      { source: source("ytd", "No ano", NUM, "#,0"), values: [rows.length] },
      { source: source("meta", "Meta", NUM, "#,0"), values: [450] },
      { source: source("contexto", "Contexto", TEXT), values: [`${contratadas.length} contratações`] },
      { source: source("rotCmp", "Rótulo da comparação", TEXT), values: ["vs. período anterior"] },
      { source: source("rotYtd", "Rótulo do acumulado", TEXT), values: ["no ano"] }
    ]);
  },

  xpHighlights: (rows) => {
    const paradas = rows.filter(r => r.resultado === "andamento" && r.diasEtapa > 45).length;
    const contratadas = rows.filter(r => r.resultado === "contratada").length;
    const andamento = rows.filter(r => r.resultado === "andamento").length;
    const slas = rows.filter(r => r.resultado === "contratada").map(r => r.diasTotais);
    // O visual lê medidas de texto no formato "número || título || texto || status".
    const linha = (n, titulo, texto, status) => `${n} || ${titulo} || ${texto} || ${status}`;
    return categorical([], [
      { source: source("destaques", "Contratações", TEXT), values: [linha(contratadas, "Contratações", "fechadas no período", "bom")] },
      { source: source("destaques", "Em andamento", TEXT), values: [linha(andamento, "Em andamento", "aplicações ainda em processo", "info")] },
      { source: source("destaques", "Paradas", TEXT), values: [linha(paradas, "Paradas", "há mais de 45 dias na mesma etapa", "ruim")] },
      { source: source("destaques", "Tempo", TEXT), values: [linha(mediana(slas) || 0, "Dias até a contratação", "mediana do período", "atencao")] }
    ]);
  },

  xpStageTable: (rows) => categorical(
    [{ source: source("etapa", "Etapa", TEXT), values: ETAPAS }],
    [
      { source: source("participantes", "Participantes", NUM, "#,0"), values: porEtapa(rows, agg.participantes) },
      { source: source("aprovados", "Aprovados", NUM, "#,0"), values: porEtapa(rows, agg.aprovados) },
      { source: source("rejeitados", "Rejeitados", NUM, "#,0"), values: porEtapa(rows, agg.rejeitados) },
      { source: source("andamento", "Em andamento", NUM, "#,0"), values: porEtapa(rows, agg.andamento) },
      { source: source("media", "Média de dias", NUM, "#,0.0"), values: ETAPAS.map((_, i) => media(diasConcluidos(rows, i))) },
      { source: source("mediana", "Mediana de dias", NUM, "#,0"), values: ETAPAS.map((_, i) => mediana(diasConcluidos(rows, i))) }
    ]
  ),

  xpSlaTable: (rows) => categorical(
    [{ source: source("etapa", "Etapa", TEXT), values: ETAPAS }],
    [
      { source: source("tipico", "Típico", NUM, "#,0"), values: ETAPAS.map((_, i) => mediana(diasConcluidos(rows, i))) },
      { source: source("p90", "90% saem até", NUM, "#,0"), values: ETAPAS.map((_, i) => percentil(diasConcluidos(rows, i), 0.9)) },
      { source: source("base", "Base", NUM, "#,0"), values: ETAPAS.map((_, i) => diasConcluidos(rows, i).length) },
      {
        source: source("acima", "Acima hoje", NUM, "#,0"),
        values: ETAPAS.map((_, i) => {
          const p90 = percentil(diasConcluidos(rows, i), 0.9) || 0;
          return rows.filter(r => r.resultado === "andamento" && r.maxStage === i && r.diasEtapa > p90).length;
        })
      }
    ]
  ),

  xpCompositeBars: (rows) => {
    const sub = (a) => rows.filter(r => r.area === a);
    const conta = (a, fn) => sub(a).filter(fn).length;
    const total = AREAS.map(a => sub(a).length);
    return categorical(
      [{ source: source("categoria", "Área", TEXT), values: AREAS }],
      [
        { source: source("partes", "Contratadas", NUM, "#,0"), values: AREAS.map(a => conta(a, r => r.resultado === "contratada")) },
        { source: source("partes", "Rejeitadas", NUM, "#,0"), values: AREAS.map(a => conta(a, r => r.resultado === "rejeitada")) },
        { source: source("partes", "Em andamento", NUM, "#,0"), values: AREAS.map(a => conta(a, r => r.resultado === "andamento")) },
        { source: source("total", "Aplicações", NUM, "#,0"), values: total },
        {
          source: source("indicador", "Taxa de contratação", NUM, "0.0%"),
          values: AREAS.map(a => (sub(a).length ? conta(a, r => r.resultado === "contratada") / sub(a).length : null))
        }
      ]
    );
  },

  xpGoalUsage: (rows) => {
    const tipicos = ETAPAS.map((_, i) => mediana(diasConcluidos(rows, i)) || 0);
    const soma = tipicos.reduce((a, b) => a + b, 0);
    return categorical(
      [{ source: source("item", "Etapa", TEXT), values: ETAPAS }],
      [
        { source: source("peso", "Dias típicos", NUM, "#,0"), values: tipicos },
        { source: source("total", "Dias usados", NUM, "#,0"), values: [soma, null, null, null, null] },
        { source: source("meta", "Meta (dias)", NUM, "#,0"), values: [45, null, null, null, null] }
      ]
    );
  },

  // O visual espera uma medida por coluna (o "grupo" do Power BI), não pares linha/coluna.
  xpHeatmap: (rows) => {
    const vagas = Array.from(new Set(rows.map(r => r.vaga))).sort();
    const colunas = ETAPAS.map(e => ({
      source: Object.assign(source("valor", e, NUM, "#,0"), { groupName: e }),
      values: vagas.map(v => rows.filter(r => r.vaga === v && r.resultado === "andamento" && r.etapa === e).length)
    }));
    return categorical([{ source: source("linhas", "Vaga", TEXT), values: vagas }], colunas);
  },

  xpMasterDetail: (rows) => {
    const rejeitadas = rows.filter(r => r.resultado === "rejeitada");
    const pares = [];
    for (const e of ETAPAS) {
      for (const m of MOTIVOS) {
        const n = rejeitadas.filter(r => r.etapa === e && r.motivo === m).length;
        if (n) pares.push({ e, m, n });
      }
    }
    return categorical(
      [{ source: source("grupo", "Etapa", TEXT), values: pares.map(p => p.e) },
       { source: source("item", "Motivo", TEXT), values: pares.map(p => p.m) }],
      [{ source: source("valor", "Rejeições", NUM, "#,0"), values: pares.map(p => p.n) }]
    );
  },

  xpTrend: (rows) => {
    const dias = [];
    for (let k = 180; k >= 0; k -= 1) dias.push(startOfDay(new Date(Date.now() - k * DIA)));
    const porDia = (filtro, campo) => dias.map(d => rows.filter(r => filtro(r) && startOfDay(r[campo]).getTime() === d.getTime()).length);
    return categorical(
      [{ source: source("data", "Data", DATE), values: dias }],
      [
        { source: source("s1a", "Aplicações", NUM, "#,0"), values: porDia(() => true, "candidatura") },
        { source: source("s1b", "Contratações", NUM, "#,0"), values: porDia(r => r.resultado === "contratada", "saida") },
        { source: source("s2a", "Rejeições", NUM, "#,0"), values: porDia(r => r.resultado === "rejeitada", "saida") },
        { source: source("s2b", "Entradas em etapa", NUM, "#,0"), values: porDia(() => true, "entradaEtapa") }
      ]
    );
  },

  xpSlicer: (rows) => {
    const pares = contagemPor(rows, "area", AREAS);
    return categorical(
      [{ source: source("campo", "Área", TEXT, undefined, "Aplicacoes.Área"), values: pares.map(p => p[0]) }],
      [{ source: source("contagem", "Aplicações", NUM, "#,0"), values: pares.map(p => p[1]) }]
    );
  },

  xpPeriod: (rows) => categorical(
    [{ source: source("data", "Candidatura", DATE, undefined, "Aplicacoes.Candidatura"), values: rows.map(r => r.candidatura) }],
    [{ source: source("referencia", "Aplicações", NUM, "#,0"), values: rows.map(() => 1) }]
  ),

  xpOrg: (rows) => {
    const chaves = [];
    const vistos = new Set();
    for (const r of rows) {
      const k = `${r.diretoria}|${r.time}|${r.area}`;
      if (!vistos.has(k)) { vistos.add(k); chaves.push([r.diretoria, r.time, r.area]); }
    }
    chaves.sort((a, b) => a.join().localeCompare(b.join()));
    return categorical(
      [
        { source: source("niveis", "Diretoria", TEXT, undefined, "Estrutura.Diretoria"), values: chaves.map(c => c[0]) },
        { source: source("niveis", "Time", TEXT, undefined, "Estrutura.Time"), values: chaves.map(c => c[1]) },
        { source: source("niveis", "Área", TEXT, undefined, "Estrutura.Área"), values: chaves.map(c => c[2]) }
      ],
      [{ source: source("contagem", "Aplicações", NUM, "#,0"), values: chaves.map(c => rows.filter(r => r.area === c[2]).length) }]
    );
  },

  xpNominal: (rows) => {
    const lista = rows.slice(0, 220);
    return tabular(
      [
        source("link", "Link", TEXT),
        source("colunas", "Candidato", TEXT),
        source("colunas", "Vaga", TEXT),
        source("colunas", "Recrutador", TEXT),
        source("segmento", "Situação", TEXT),
        source("situacao", "Status", TEXT),
        source("colunas", "Etapa", TEXT),
        source("colunas", "Candidatura", DATE),
        source("dias", "Dias na etapa", NUM, "#,0")
      ],
      lista.map(r => [
        `https://exemplo.invalid/aplicacao/${r.id}`,
        r.candidato, r.vaga, r.recrutador,
        r.resultado === "contratada" ? "Contratadas" : r.resultado === "rejeitada" ? "Rejeitadas" : "Em andamento",
        r.resultado === "andamento" && r.diasEtapa > 45 ? "alerta" : r.resultado === "contratada" ? "bom" : "neutro",
        r.etapa, r.candidatura, r.diasEtapa
      ])
    );
  },

  xpDetail: (rows) => {
    const lista = rows.filter(r => r.resultado !== "contratada").slice(0, 160);
    return tabular(
      [
        source("link", "Link", TEXT),
        source("candidato", "Candidato", TEXT),
        source("vaga", "Vaga", TEXT),
        source("recrutador", "Recrutador", TEXT),
        source("extras", "Motivo", TEXT),
        source("extras", "Etapa", TEXT),
        source("linha", "Dias na etapa", NUM, "#,0"),
        source("contexto", "Contexto", TEXT)
      ],
      lista.map(r => [
        `https://exemplo.invalid/aplicacao/${r.id}`,
        r.candidato, r.vaga, r.recrutador,
        r.motivo || "—", r.etapa, r.diasEtapa,
        "aba=todas||modo=aplicacao"
      ])
    );
  },

  xpBaseNominal: (rows) => {
    const lista = rows.slice(0, 220);
    return tabular(
      [
        source("link", "Link", TEXT),
        source("candidato", "Candidato", TEXT),
        source("vaga", "Vaga", TEXT),
        source("recrutador", "Recrutador", TEXT),
        source("situacao", "Situação", TEXT),
        source("etapa", "Etapa", TEXT),
        source("dias", "Dias na etapa", NUM, "#,0"),
        source("motivo", "Motivo", TEXT),
        source("candidatura", "Candidatura", DATE),
        source("sla", "Dias até o fim", NUM, "#,0")
      ],
      lista.map(r => [
        `https://exemplo.invalid/aplicacao/${r.id}`,
        r.candidato, r.vaga, r.recrutador,
        r.resultado === "contratada" ? "Contratada" : r.resultado === "rejeitada" ? "Rejeitada" : "Em andamento",
        r.etapa, r.diasEtapa, r.motivo || "—", r.candidatura,
        r.resultado === "andamento" ? null : r.diasTotais
      ])
    );
  }
};

// Traduz o filtro que o visual mandou para o host numa função que corta a base.
export function filterRows(rows, filter) {
  if (!filter) return rows;
  const alvo = (t) => (t && t.column ? String(t.column) : "").toLowerCase();
  if (filter.conditions) {
    const campo = alvo(filter.target);
    if (campo.indexOf("candidatura") < 0) return rows;
    return rows.filter(r => filter.conditions.every(c => {
      const v = r.candidatura.getTime();
      const alvoData = new Date(c.value).getTime();
      if (c.operator === "GreaterThanOrEqual") return v >= alvoData;
      if (c.operator === "LessThan") return v < alvoData;
      if (c.operator === "GreaterThan") return v > alvoData;
      if (c.operator === "LessThanOrEqual") return v <= alvoData;
      return true;
    }));
  }
  if (Array.isArray(filter.target)) {
    const campos = filter.target.map(t => alvo(t));
    const chaves = new Set((filter.values || []).map(tupla => tupla.map(x => String(x.value)).join("|")));
    return rows.filter(r => chaves.has(campos.map(c => String(valorDe(r, c))).join("|")));
  }
  const campo = alvo(filter.target);
  const valores = new Set((filter.values || []).map(String));
  return rows.filter(r => valores.has(String(valorDe(r, campo))));
}

function valorDe(r, campo) {
  if (campo.indexOf("área") >= 0 || campo.indexOf("area") >= 0) return r.area;
  if (campo.indexOf("diretoria") >= 0) return r.diretoria;
  if (campo.indexOf("time") >= 0) return r.time;
  if (campo.indexOf("vaga") >= 0) return r.vaga;
  if (campo.indexOf("praça") >= 0 || campo.indexOf("praca") >= 0) return r.praca;
  if (campo.indexOf("recrutador") >= 0) return r.recrutador;
  return "";
}
