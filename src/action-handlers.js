/*
 * 文书动作层：把“生成/核对文书”从 DOM 事件委托中抽出来。
 *
 * 这里不直接读写 DOM，只接收 app.js 注入的依赖。这样动作逻辑可以在
 * 保留同一份病历状态的前提下独立验证，也为后续拆分导航、查体和导出动作
 * 留出稳定边界。
 */
const ACTION_HANDLERS = (() => {
  function create(deps) {
    const {
      getRecord,
      generator,
      saveCurrent,
      render,
      toast,
      snapshot,
      ensureSoap,
      ensureDischarge,
      soapSegDraft,
      setPath,
      markDocumentGenerated,
      markDocumentReviewed
    } = deps;

    function handle(act, el) {
      const R = getRecord();
      switch (act) {
        case 'draftHpi':
          R.hpi = generator.draftHPI(R);
          saveCurrent();
          render();
          toast('已生成现病史初稿，请补充修改');
          return true;
        case 'draftSummary': {
          snapshot('生成摘要');
          R.summary = '';
          R.summary = generator.draftSummary(R);
          markDocumentGenerated(R, 'summary');
          saveCurrent();
          render();
          toast('已生成摘要初稿，请核对');
          return true;
        }
        case 'updateSummary':
          snapshot('更新摘要');
          R.summary = generator.draftSummary(R);
          markDocumentGenerated(R, 'summary');
          saveCurrent();
          render();
          toast('已采用最新草稿；旧摘要仍可通过撤销恢复');
          return true;
        case 'keepSummary':
          markDocumentReviewed(R, 'summary');
          saveCurrent();
          render();
          toast('已按当前文字标记核对；资料再变化时会重新提示');
          return true;
        case 'draftSoap': {
          snapshot('生成首次病程录');
          const soap = ensureSoap();
          const fillSeg = (seg, key, text) => {
            if (String(soap[key] || '').trim() || !text) return;
            soap[key] = text;
            markDocumentGenerated(R, 'firstCourse', seg);
          };
          fillSeg('s', 'summary', generator.draftCaseSummary(R) || '');
          fillSeg('oPe', 'pe', generator.draftObjectivePE(R) || '');
          fillSeg('oAux', 'aux', generator.draftObjectiveAux(R) || '');
          fillSeg('basis', 'basis', generator.buildBasisSection(R) || '');
          if (!soap.a.basisDetail.length && typeof generator.draftBasisDetail === 'function') {
            soap.a.basisDetail = generator.draftBasisDetail(R) || [];
          }
          saveCurrent();
          render();
          toast('已补全空白段落，已有手写内容未改动');
          return true;
        }
        case 'updateSoapSeg': {
          const seg = String(el && el.dataset && el.dataset.seg || '');
          if (!soapSegDraft[seg]) return true;
          const soap = ensureSoap();
          snapshot('更新 SOAP ' + seg);
          if (seg === 'basis') {
            soap.a.basisDetail = generator.draftBasisDetail(R, { fresh: true });
            soap.a.basis = '';
          } else {
            const path = { s: 'soap.s.summary', oPe: 'soap.o.pe', oAux: 'soap.o.aux' }[seg];
            setPath(R, path, soapSegDraft[seg](R) || '');
          }
          markDocumentGenerated(R, 'firstCourse', seg);
          saveCurrent();
          render();
          toast('已更新该段，其他段落未改动');
          return true;
        }
        case 'reviewSoapSeg': {
          const seg = String(el && el.dataset && el.dataset.seg || '');
          markDocumentReviewed(R, 'firstCourse', seg);
          saveCurrent();
          render();
          toast('已按当前文字标记核对');
          return true;
        }
        case 'updateAdmitCondition':
          snapshot('更新入院情况');
          R.discharge.admitCondition = generator.draftAdmitCondition(R) || '';
          markDocumentGenerated(R, 'discharge', 'admitCondition');
          saveCurrent();
          render();
          toast('已按当前资料重写入院情况；旧文字可通过撤销恢复');
          return true;
        case 'confirmDischargeDx': {
          const d = ensureDischarge();
          const list = (d.diagnoses || []).map(x => String(x || '').trim()).filter(Boolean);
          if (!list.length) { toast('出院诊断还没有内容'); return true; }
          d.diagnosesConfirmed = true;
          markDocumentReviewed(R, 'discharge', 'diagnoses');
          saveCurrent();
          render();
          toast('出院诊断已确认；初步诊断再变化时会提示差异');
          return true;
        }
        default:
          return false;
      }
    }

    return { handle };
  }

  return { create };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ACTION_HANDLERS;
}
