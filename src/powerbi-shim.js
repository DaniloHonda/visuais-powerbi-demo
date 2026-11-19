// No Power BI, "powerbi-visuals-api" é resolvido para o objeto global que o host injeta.
// Aqui ele só precisa entregar os enums que o código usa em tempo de execução.
const powerbi = {
  FilterAction: { merge: 0, remove: 1 },
  DialogAction: { Close: 0, OK: 1, Cancel: 2, Continue: 3, No: 4, Yes: 5 },
  VisualDialogPositionType: { Center: 0, RelativeToVisual: 1 },
  VisualEnumerationInstanceKinds: { Constant: 1, Rule: 2, ConstantOrRule: 3 },
  VisualUpdateType: { Data: 2, Resize: 4, ViewMode: 8, Style: 16, All: 62 },
  ViewMode: { View: 0, Edit: 1, InFocusEdit: 2 },
  EditMode: { Default: 0, Advanced: 1 }
};

export default powerbi;
