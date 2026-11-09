# Excel → Portal field mapping (IOF_Seva_Register_2026.xlsx)

Sheet **IOF CASE 2026** (header on row 2, data from row 3). No Excel column is dropped; new workflow fields are marked NEW.

| # | Excel column | Case field | Notes |
|---|---|---|---|
| A | SL | `sl` | global serial |
| B | CASE NO | `caseNo` | Excel formula `LEFT(F,6)&"-"&A`; portal uses the same rule and freezes it at registration (stable after transfers) |
| C | Case Name | `name` | + NEW `summary` |
| D | Contact Details | `contactDetails` | + NEW `reportingPerson`, `reportingCoordinatorId` |
| E | Case report form | `reportedFrom` / `originalReportingProvince` | list = committees + Matur Sangathan, Embassy committed, Relatives of the Victims, Local Community |
| F | Case Handeling committee | `handlingCommittee` | = **Responsible Province** |
| G | Handelled by | `handledById` | = assigned coordinator / handler |
| H | Date of Case Register In IOF | `registeredOn` | |
| I | Issue Type | `issueTypeId` | dynamic master (`IssueType`), seeded with the 7 sheet values |
| J | Case in details | `details` | |
| K | Location Region KSA | `regionKSA` | + NEW `country` |
| L / M / N | State / District / Village | `stateIndia` / `districtIndia` / `village` | cascading dropdowns; NEW `fullAddress` |
| O | Local ID or Passport Details | `localIdPassport` | |
| P | Contact det of Victim or Depended | `victimContact` | + NEW `victimName`, `alternateContact`, `dependents` |
| Q | Case Reference By Name and Details | `referenceBy` | + NEW `referenceDetails` |
| R | Sponsor details Mob No | `sponsorDetails` | + NEW `sponsorName`, `sponsorMobile` |
| S | IOF Involvements | `iofInvolvement` | |
| T | Initial Status | `initialStatus` | |
| U | Others organization involvements | `othersInvolvement` | |
| V | If any Financial Expenses or Seva | `financialExpenses` | + NEW structured `finance[]`, `sevaSupport` |
| W | Remarks | `remarks` | |
| X | OLD | `oldStatus` | auto-filled with the previous status on each change |
| Y | Status New | `status` | 9 values from sheet **DND-Dropdown_list** col B (`STATUSES[].excel`) |

Sheet **DND-Dropdown_list**: A→`PROVINCES`, B→`STATUSES`, C→`SEED_ISSUE_TYPES`, D→`IOF_REPRESENTATIVES`, E→`REPORT_SOURCES` (all in `src/lib/reference-data.ts`).

Export CSV uses the same 25 headers/order, so exports can be pasted back into the register.

NEW workflow fields: `priority`, `assignment` (draft / awaiting_assignment / assigned / transfer_pending), `timeline[]`, `documents[]`, `assignments[]`, transfers.

Row 3 of the real file (SL 1, IOF-NC → IOF-EP-Dammam, Anil, 2026-10-09, *Jailed - financial issue*) is preserved as case **IOF-EP-1**.
