// Host de mentira: faz o papel do Power BI para os visuais rodarem fora dele.
// Cada chamada que o visual faz (selecionar, filtrar, exportar, abrir link) vira um evento
// que a página mostra no registro lateral.

let seq = 0;

function makeId(key) {
  return {
    key,
    equals(other) { return !!other && other.key === key; },
    getKey() { return key; },
    getSelector() { return { data: [key] }; },
    includes() { return false; },
    toString() { return key; }
  };
}

function idBuilder() {
  const parts = [];
  const builder = {
    withCategory(column, index) {
      const name = column && column.source ? column.source.displayName : "cat";
      const value = column && column.values ? column.values[index] : index;
      parts.push(`${name}=${value}`);
      return builder;
    },
    withSeries(values, series) {
      const name = series && series.source ? series.source.displayName : (series && series.name) || "serie";
      parts.push(`serie=${name}`);
      return builder;
    },
    withMeasure(measureId) { parts.push(`medida=${measureId}`); return builder; },
    withTable(table, rowIndex) { parts.push(`linha=${rowIndex}`); return builder; },
    withMatrixNode() { return builder; },
    createSelectionId() { return makeId(parts.join("|") || `id${seq++}`); }
  };
  return builder;
}

function selectionManager(log) {
  let ids = [];
  const callbacks = [];
  const notify = () => callbacks.forEach(cb => cb(ids.slice()));
  return {
    select(id, multi) {
      const list = Array.isArray(id) ? id : [id];
      if (multi) {
        for (const one of list) {
          const at = ids.findIndex(x => x.equals(one));
          if (at >= 0) ids.splice(at, 1); else ids.push(one);
        }
      } else {
        const only = ids.length === 1 && list.length === 1 && ids[0].equals(list[0]);
        ids = only ? [] : list.slice();
      }
      log("selecao", ids.length ? ids.map(i => i.key).join(" · ") : "seleção limpa");
      notify();
      return Promise.resolve(ids.slice());
    },
    clear() { if (ids.length) log("selecao", "seleção limpa"); ids = []; notify(); return Promise.resolve(); },
    getSelectionIds() { return ids.slice(); },
    hasSelection() { return ids.length > 0; },
    registerOnSelectCallback(cb) { callbacks.push(cb); },
    showContextMenu(id, position) { log("menu", "menu de contexto (botão direito)"); return Promise.resolve(); },
    toggleExpandCollapse() { return Promise.resolve(); },
    applySelectionFilter() {}
  };
}

// Janela modal do visual de segmentação: abre um painel flutuante sobre a página.
function modalDialog(mount, dialogs, log) {
  return function openModalDialog(dialogId, options, initialState) {
    const Dialog = dialogs[dialogId];
    if (!Dialog) return Promise.reject(new Error("diálogo desconhecido"));
    log("dialogo", `abriu a janela "${(options && options.title) || dialogId}"`);
    return new Promise((resolve) => {
      const back = document.createElement("div");
      back.className = "pv-modal";
      const box = document.createElement("div");
      box.className = "pv-modal__box";
      const size = (options && options.size) || {};
      box.style.width = Math.min(size.width || 360, 420) + "px";
      const body = document.createElement("div");
      body.className = "pv-modal__body";
      body.style.maxHeight = Math.min(size.height || 420, 420) + "px";
      const foot = document.createElement("div");
      foot.className = "pv-modal__foot";
      box.append(body, foot);
      back.appendChild(box);
      mount.appendChild(back);

      let result = null;
      const close = (actionId) => {
        back.remove();
        resolve({ actionId, resultState: result });
      };
      new Dialog({ element: body, host: { setResult(r) { result = r; }, close: () => close(1) } }, initialState);

      for (const [label, action, primary] of [["Cancelar", 2, false], ["OK", 1, true]]) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "pv-modal__btn" + (primary ? " pv-modal__btn--on" : "");
        b.textContent = label;
        b.addEventListener("click", () => close(action));
        foot.appendChild(b);
      }
      back.addEventListener("click", e => { if (e.target === back) close(2); });
    });
  };
}

export function createHost({ log, onFilter, mount, dialogs = {} }) {
  const palette = {
    isHighContrast: false,
    foreground: { value: "#121212" },
    background: { value: "#ffffff" },
    foregroundSelected: { value: "#ffffff" },
    hyperlink: { value: "#1a6fd4" },
    getColor(key) { return { value: "#067D84" }; },
    reset() { return palette; }
  };

  return {
    locale: "pt-BR",
    instanceId: "demo",
    colorPalette: palette,
    eventService: {
      renderingStarted() {},
      renderingFinished() {},
      renderingFailed(options, reason) { log("erro", String(reason)); }
    },
    tooltipService: {
      enabled: () => false, show() {}, move() {}, hide() {}
    },
    storageService: { get: () => Promise.reject(), set: () => Promise.reject(), remove() {} },
    downloadService: {
      exportVisualsContent(content, filename, type, description) {
        const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        log("exportar", `baixou ${filename}`);
        return Promise.resolve(true);
      },
      exportStatus() { return Promise.resolve(1); }
    },
    createSelectionIdBuilder: idBuilder,
    createSelectionManager: () => selectionManager(log),
    createLocalizationManager: () => ({ getDisplayName: (k) => k }),
    applyJsonFilter(filter, objectName, propertyName, action) {
      onFilter(action === 1 ? null : filter);
    },
    launchUrl(url) { log("link", `abriria ${url}`); },
    fetchMoreData() { return false; },
    refreshHostData() {},
    displayWarningIcon() {},
    openModalDialog: modalDialog(mount, dialogs, log),
    hostCapabilities: { allowInteractions: true, allowModalDialog: true },
    switchFocusModeState() {},
    telemetry: { trace() {} },
    licenseManager: { getAvailableServicePlans: () => Promise.resolve({ plans: [], isLicenseUnsupportedEnv: false }), notifyFeatureBlocked() {}, clearLicenseNotification() {} },
    webAccessService: { webAccessStatus: () => 1 },
    acquireAADTokenService: { acquireAADToken: () => Promise.resolve({}), acquireAADTokenstatus: () => 1 },
    drill() {},
    applyCustomSort() {},
    createOpaqueUtils: () => ({ isOpaque: () => false })
  };
}
