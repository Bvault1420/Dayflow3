# Zweite Analyse — 1inch (Aqua + SwapVM + restliche Org)

Datum: 25. August 2026  
Auftrag: komplette zweite Runde, **nur neue, wirklich meldbare** Funde. Der `ship`/`dock`-Invariantenfund aus Pass 1 ist hier absichtlich ausgeschlossen.

## Was diesmal geprüft wurde

| Bereich | Version / Quelle |
| --- | --- |
| Aqua Registry | `1inch/aqua` `main` — `Aqua.sol`, `AquaApp.sol`, `AquaRouter.sol`, `Balance.sol` |
| Live-Router | `1inch/swap-vm` **Tag `v1.0.2`** (deployed AquaSwapVMRouter) |
| Undeployed Engine | `1inch/swap-vm` `main` (nur zum Vergleich, nicht als Live-Verhalten) |
| SDK | `1inch/sdks` — nur Abgleich, **HackenProof: out of scope** |
| Docs / Learn | Contract addresses, opcode-Warnung `main` ≠ live |
| Weitere 1inch-Repos | Offene Issues: limit-order-protocol, fusion-protocol, cross-chain-swap |

Bounty-Filter (sonst nicht meldbar):

- Schon in [1inch-audits](https://github.com/1inch/1inch-audits) / OpenZeppelin
- Schon als GitHub-Issue offen
- SDK, `examples/`, Docs-only
- Fee-on-transfer (explizit out of scope)
- `src/strategies/AquaAMM.sol`
- Kein First-Reporter, kein Fund-Diebstahl nachgewiesen

## Ergebnis

**Kein neuer, belastbarer Report für HackenProof/Immunefi.**  
Kein zweites Issue, das du als Erstmelder mit Impact einreichen kannst, ohne Duplicate/Known/Out-of-scope zu werden.

---

## Geprüft und verworfen (warum nicht melden)

### 1. `ProtocolFeeSkipped` (v1.0.2 live)

Aqua-Protocol-Fee ist **best-effort**. Kann der Maker die Fee nicht zahlen, läuft der Swap weiter, Event `ProtocolFeeSkipped`, Fee bleibt beim Maker.

Steht wörtlich im Code als **ACCEPTED RISK**, mit Verweis auf OpenZeppelin M-09 und Theori #10. 1inch kennt das. Nicht neu.

### 2. Taker übergibt `tokenIn`/`tokenOut` selbst (v1.0.2)

Live-`quote`/`swap` haben 5 Argumente. `MakerTraits.validate` prüft nur „Tokens verschieden“ und „amountIn > 0“.

Auf dem Aqua-Pfad stoppt `safeBalances(...)`: nur Tokens, die in der Strategy **geshipt** sind. Bei einem normalen 2-Token-Pair ist das nur die Richtung. Kein Drain fremder Tokens außerhalb der Strategy.

### 3. `unwrapWeth` ohne `token == WETH` (v1.0.2)

`_transferFrom` ruft `IWETH(token).safeWithdrawTo` immer, wenn das Unwrap-Flag gesetzt ist. Falsches Token → in der Regel Revert (Taker schadet sich selbst). Auf `main` ist der Check `token == address(WETH)` schon drin. Hardening, kein Diebstahl, kein First-Discovery-Critical.

### 4. Reservierte Opcodes sind auf v1.0.2 No-Ops

Unbekannte/reserved Slots tun nichts statt zu revertieren. `main` macht `UnknownOpcode`. Docs sagen: Opcode-Tabelle nicht von `main` ableiten. 1inch hat das intern schon umgebaut.

### 5. PeggedSwap Achsen

`parseRatesAndBalances` tauscht `x0`/`y0` und Rates je nach `tokenIn < tokenOut`. Das ist der OpenZeppelin-Fix (Critical Axis Mismatch). Nicht neu.

### 6. Quote/Swap-Divergenz bei Extruction / Fee-Transfers

Issue #34 bzw. dokumentiert in `Fee.sol` NatSpec. Nicht neu. Taker-Schutz: Threshold/`minOut`.

### 7. Beispiel-App Quoting (`examples/apps/XYCSwap.sol`, PR #137)

Präzisionsverlust ExactIn / Rounding ExactOut. Datei ist **nicht** in HackenProof-Scope (nur `Aqua.sol` / `AquaRouter.sol` / `Balance.sol`). Außerdem schon ein öffentlicher PR.

### 8. SDK-Fee `1e9` vs `main` `FeeFlatIn` `1e7`

Live v1.0.2 nutzt `BPS = 1e9`. Aktuelles SDK-FlatFee auch `1e9`. `main`-Solidity hat umgestellt — Integratoren sollen Tag `v1.0.2` + SDK 0.4.0 pinnen. SDK ist auf HackenProof **out of scope**.

### 9. ERC777-Callback während `pull`

Aqua selbst hat keinen Reentrancy-Guard. `pull` ist nur durch `msg.sender == App` geschützt. Nested Swap auf **anderer** Strategy = Shared-Liquidity-Modell (erstes `pull` gewinnt). Kein Weg gefunden, tokenOut zu behalten ohne tokenIn zu zahlen (ganze Tx reverted).

### 10. Restliche 1inch-Org (nicht Aqua)

Öffentlich schon gemeldet, also **nicht** als deine First Report verwendbar:

- `limit-order-protocol` #439 — Chainlink oracle zero answer
- `fusion-protocol` #231 — Whitelist bypass via flash loan
- `fusion-protocol` #230 — surplus fee bypass via inflated estimatedTakingAmount

Die als eigene Immunefi-Meldung zu bringen wäre Duplicate.

---

## Was weiterhin gilt (Pass 1, hier nicht nochmal als „neu“)

- `ship()` mit disjunkten Tokens / Dock-Invariante — OpenZeppelin Medium, unpatched
- Docs „re-ship same hash after dock“ — falsch, und Docs-only oft out of scope
- Fee-on-transfer — out of scope
- Extruction Quote≠Swap — Issue #34

---

## Fazit fürs Melden

Es gibt **aktuell nichts Zweites**, das die Filter übersteht:

meldungswürdig = neu + in-scope + nicht im Audit + nicht schon Issue + echter Impact.

Das hat diese Runde nicht ergeben. Ein Forced Report aus den Punkten 1–10 wird Duplicate, Known Issue, Out of scope oder Informative — typisch 0 USD und verbrannte Reputation.
