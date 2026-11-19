# Visuais para Power BI — demonstração

Página interativa de uma biblioteca de 16 visuais personalizados para Power BI,
escritos em TypeScript (API 5.11, `powerbi-visuals-tools` 7).

**Demonstração:** https://danilohonda.github.io/visuais-powerbi-demo/

## O que esta página é

Não é um conjunto de capturas de tela. O código dos visuais — o mesmo que é
empacotado em arquivos `.pbiviz` e importado no Power BI Desktop — roda aqui no
navegador. Para isso, a página traz um *host* de mentira que faz o papel do
Power BI:

- monta um `dataView` (categórico ou tabular, com papéis e formatos de medida)
  a partir de uma base fictícia;
- implementa `IVisualHost`: gerenciador de seleção, construtor de `selectionId`,
  paleta, serviço de eventos, exportação de arquivos, `launchUrl` e janelas modais;
- recebe o `applyJsonFilter` que os visuais de segmentação, período e organograma
  emitem e **filtra a base de verdade**, refazendo todos os outros visuais;
- lê o modelo de formatação que cada visual expõe (`getFormattingModel()`) e
  desenha um painel de formatação equivalente ao do Power BI. Mexer num controle
  grava em `dataView.metadata.objects` e manda o visual renderizar de novo.

Por isso tudo funciona: clique para selecionar, Ctrl+clique, menu de contexto,
busca, ordenação, abas, "mostrar mais" e exportação de CSV.

## Os visuais

| Visual | O que faz |
|---|---|
| Card de KPI | Número grande com comparação de período, acumulado e meta |
| Lista de destaques | Faixas com número e cor por status, vindas de medidas de texto |
| Funil | Etapas com número, % do total e % da etapa anterior |
| Barras com composição | Barras empilhadas com busca, ordenação, indicador e Pareto |
| Tabela por etapa | Composição, conversão e tempo por etapa |
| Tabela de SLA | Mediana e P90 por etapa, com base e casos acima hoje |
| Matriz de calor | Linhas × colunas com cor por volume e coluna de alerta |
| Etapa e motivos | Lista mestre à esquerda, detalhe à direita |
| Consumo da meta | Régua do total contra a meta, repartida por item |
| Evolução | Linhas no tempo com troca de série e granularidade |
| Segmentação | Lista suspensa, janela de seleção ou lista aberta |
| Período | Calendário com atalhos, De/Até digitável e intervalo em dois cliques |
| Organograma | Segmentação em árvore por níveis, com busca |
| Tabela nominal | Lista com link, situação, busca, segmentos e CSV |
| Base nominal | Números clicáveis que trocam a base da lista |
| Detalhe nominal | Página de detalhamento com abas, busca e CSV |

## Estrutura

```
index.html        página
assets/           bundle gerado (JS + CSS)
src/              código da demonstração (host de mentira, base fictícia, página)
```

O `src/build.mjs` copia o código dos visuais do repositório da biblioteca,
compila o LESS de cada um e empacota tudo com esbuild.

## Dados

Pessoas, vagas, datas e números são inventados e gerados por uma semente fixa.
Nenhum dado real.
