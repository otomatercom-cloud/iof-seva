/**
 * Odoo 19 integration contract (NOT wired yet – prototype uses src/lib/store.ts).
 *
 * Suggested models (otm. prefix, OPL-1):
 *   otm.iof.case            ← Case            (all Excel columns + workflow fields)
 *   otm.iof.province        ← Province        (Excel dropdown "Resposible IOF")
 *   otm.iof.issue.type      ← IssueType       (dynamic master, replaces hard-coded list)
 *   otm.iof.case.timeline   ← TimelineEvent
 *   otm.iof.case.transfer   ← Transfer
 *   otm.iof.case.assignment ← AssignmentRecord
 *   otm.iof.case.finance    ← FinanceEntry
 *   ir.attachment           ← CaseDocument
 *
 * Every store action maps to one controller route (auth='user', type='json'):
 *   registerCase   POST /iof/api/case/create          { values, submit }
 *   updateStatus   POST /iof/api/case/<id>/status     { status, note }
 *   addTimeline    POST /iof/api/case/<id>/timeline   { type, text, internal }
 *   assignCase     POST /iof/api/case/<id>/assign     { user_id, note }
 *   transferCase   POST /iof/api/case/<id>/transfer   { to_province, reason }
 *   decideTransfer POST /iof/api/transfer/<id>/decide { accept, note }
 *   list/search    POST /iof/api/case/search          { domain, order, limit, offset }
 * Record rules (ir.rule) must enforce the visibility in src/lib/permissions.ts – the UI is not a security layer.
 */
export interface IofApi {
  baseUrl: string;
  searchCases(params: { domain?: unknown[]; order?: string; limit?: number; offset?: number }): Promise<unknown>;
}
