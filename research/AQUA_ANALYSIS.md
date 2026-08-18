# 1inch Aqua — Analysebericht

Datum: 18. August 2026  
Methode: öffentliche Quellen vollständig gelesen, verdächtige Stellen im aktuellen Code gegengeprüft. Es werden nur Funde genannt, die doppelt bestätigt sind. Keine Exploit-Anleitung.

## Was geprüft wurde

| Quelle | URL / Repo |
| --- | --- |
| Registry-Contracts | https://github.com/1inch/aqua (`main`, plus Tags bis `v1.0.0`) |
| Swap-Engine | https://github.com/1inch/swap-vm (`main`, Tags bis `v1.0.2`) |
| TypeScript-SDKs | https://github.com/1inch/sdks (`typescript/aqua`, `typescript/swap-vm`) |
| Audits | https://github.com/1inch/1inch-audits und OpenZeppelin-Bericht |
| Developer-Docs | https://business.1inch.com/portal/documentation/aqua/… |
| Produktseiten | https://1inch.com/aqua und Learn-Seiten |
| Whitepaper | https://1inch.com/assets/1inch-aqua-white-paper.pdf |
| Offene Issues | `1inch/aqua`, `1inch/swap-vm` |
| Bug Bounty | Immunefi „1inch - Aqua Improvement“ |

Produktionsadressen (Docs, 2026-07-29):

- Aqua-Registry: `0x1111113ccf1426a8e30e2bff5e005d929bf6a90a`
- AquaSwapVMRouter v1.0.2: `0x111111338c5091e8440b67b168bae16a668ac0de`
- KycNFT: `0x26FFc7D378E8e49Be2c483295A3e3E511F96a468`

Die Docs sagen ausdrücklich: Verhalten nicht von `swap-vm` `main` ableiten, sondern vom Tag `v1.0.2`. Das wurde so behandelt.

## Kurzfazit

Es gibt **kein neu gefundenes, sicheres Critical**, mit dem fremde Maker-Gelder ohne deren Mitwirkung abgezogen werden. Die acht Audits (OpenZeppelin, Bailsec, Hexens, Nethermind, Theori, Decurity, Hashlock, MixBytes) haben die schweren Funde vor Launch geschlossen.

Es gibt aber **mehrere echte, nachprüfbare Probleme**: Invarianten in `ship`/`dock`, falsche Website-Aussagen, Ketten-/Adress-Chaos, und Risiken, die 1inch bewusst offen gelassen hat.

---

## A. Bestätigte Code-Bugs (Aqua-Registry, aktuell `main`)

### A1. Zweites `ship()` mit anderen Tokens zerlegt die Dock-Invariante

**Sicherheit: mittel (Selbst-DoS / gemischter Zustand), kein Diebstahl fremder Funds.**

`ship()` prüft nur `tokensCount == 0` **pro Token**, nicht ob der `strategyHash` schon existiert. Ein zweiter `ship` mit **disjunkten** Tokens geht durch.

Das steht nicht nur im Code (`src/Aqua.sol`), sondern in ihrem eigenen Test `testShipSameStrategyHashDifferentTokens` in `test/AquaShipDock.t.sol`. Der Test erwartet **kein** Revert und schreibt wörtlich, dass Docking danach unmöglich bzw. inkonsistent wird.

Folgen, die der Code hergibt:

1. Token-Mengen pro Strategie können über 254 wachsen (Limit gilt nur pro Aufruf).
2. `tokensCount` ist dann je Token unterschiedlich.
3. `dock()` prüft `balance.tokensCount == tokens.length` **pro übergebenem Token**. Man kann eine Teilmenge docken, `Docked` emittieren, und andere Tokens aktiv lassen.
4. OpenZeppelin Medium „Strategy Reinitialization via ship“ beschreibt genau das. Status: **Acknowledged, not resolved.** Begründung von 1inch: bewusst, Token-Set soll in der Strategy-Calldata stecken, extra Storage sei zu teuer.

Zusätzlich existiert der ungemergte Branch `fix/aqua-reship` — intern ist das Problem bekannt.

### A2. Nach `dock()` kann derselbe Hash nicht neu geshipped werden

**Sicherheit: niedrig, aber Docs sind falsch.**

`dock()` setzt `tokensCount = 0xff` (`_DOCKED`). Ein späteres `ship()` derselben Bytes trifft `StrategiesMustBeImmutable`, weil `tokensCount != 0`.

Bestätigt durch `testShipDockShipSameStrategyReverts`.

Die offizielle Doc-Seite „Strategy“ behauptet das Gegenteil:

> Docked: The hash remains known and can be re-shipped with fresh balances.

Das ist falsch. Neu shippen geht nur mit **anderen** Parametern (neuer Hash), nicht mit dem alten Hash.

### A3. Leeres `ship()` / leeres `dock()` emittiert Events ohne State

`ship([], [])` setzt `tokensCount = 0`, schreibt nichts, emittiert aber `Shipped`.  
`dock(..., [])` ändert nichts, emittiert aber `Docked`.

OpenZeppelin Low: bewusst weggelassen (Gas). Indexer, die nur Events lesen, können Geister-Strategien sehen.

### A4. `ship()` prüft nicht `tokens.length == amounts.length`

Fehlt in `Aqua.sol`. Kürzeres `amounts` revertet durch Out-of-Bounds. Längeres `amounts` wird still ignoriert. Kein Fund-Diebstahl, aber eine Falle für Integrationen.

### A5. `pull()` prüft nicht, ob die Strategie aktiv ist

`push()` verlangt aktive Strategie. `pull()` nicht. Betrag > 0 auf inaktiver/gedockter Slot unterflowt (getestet). Betrag 0 geht durch und emittiert `Pulled`. Schwach, aber echt.

---

## B. SwapVM / Aqua-Router — bestätigt, aber oft bewusst offen

Produktion nutzt `AquaOpcodes`. Darin liegen u. a. Controls, XYC, Concentrate, Decay, Fee, Pegged, Extruction, Token-Validatoren. **Nicht** darin: DutchAuction, BaseFeeAdjuster, OraclePriceAdjuster, DynamicBalances.

Deshalb gelten die offenen GitHub-Issues #30–#33 von Mehd1b **nicht** für den Aqua-Produktionsrouter. Sie betreffen andere SwapVM-Router. Nicht als Aqua-Prod-Bugs zählen.

### B1. Fee-on-transfer / Rebasing (Issue #29, OpenZeppelin Trust Assumption)

Settlement prüft Schwellen gegen **berechnete** VM-Beträge, nicht gegen echte Post-Transfer-Balances. `safeTransferFrom` / `AQUA.pull` vergleichen den Empfang nicht.

OpenZeppelin: Protokoll **nimmt an**, solche Tokens werden nicht verwendet. Das ist in der aktuellen `swap()`-Settlement-Strecke immer noch so. Wer solche Tokens shipt, kann weniger liefern/empfangen als `Swapped` meldet.

Kein neuer Fund — aber im Live-Code unverändert.

### B2. `Extruction` kann Quote und Swap entkoppeln (Issue #34)

Opcode ist in `AquaOpcodes` (Path C). Das Target sieht `isStaticContext` und kann in `quote()` andere Register zurückgeben als in `swap()`.

Der Opcode-Kommentar sagt das selbst. Schutz für Taker ist `minOut` / Threshold, nicht Konsistenz des externen Contracts. OpenZeppelin hat das als „use at your own risk“ akzeptiert. Für unvalidierte Path-C-Programme bleibt das ein echtes Taker-Risiko.

### B3. `tx.origin`-KYC sperrt Smart-Contract-Wallets als Taker

Docs: Launch-Strategien nutzen `_onlyTxOriginTokenBalanceNonZero`. Smart Wallets, Multisigs, ERC-4337-Bundler fallen als Taker aus. Erlaubt sind KYB-Resolver.

Das ist Design, kein Implementierungsfehler. Die Marketing-Seite nennt Aqua trotzdem „Permissionless“. Das ist widersprüchlich (siehe D).

---

## C. Docs, Website, SDK, Repo-Hygiene — bestätigt

### C1. Kettenlisten widersprechen sich

Offizielle Contract-Addresses-Seite: **genau 13** Chains, ohne Cronos / Monad / HyperEVM, **mit** Robinhood.

| Ort | Abweichung |
| --- | --- |
| `1inch/aqua` README | extra Cronos, Monad, HyperEVM |
| `1inch/swap-vm` README | extra Cronos, Monad, HyperEVM; **kein** Robinhood |
| `@1inch/swap-vm-sdk` Konstanten | extra Monad, Cronos, HyperEVM; Kommentar: die drei melden EIP-712-Version `1.0` statt `1.0.2` |

Wer SDK-Konstanten auf den Extra-Chains blind vertraut, kann die falsche Domain-Version signieren.

### C2. Alte SDK-Versionen zeigen tote Adressen

Docs selbst: `@1inch/aqua-sdk` &lt; 0.3.0 und `@1inch/swap-vm-sdk` &lt; 0.4.0 enthalten **superseded** Registry/Router-Adressen. Es gab mehrere Redeploys (u. a. `0x4a055a…`, `0xe8026b…`, `0x1111113db0…`). Strategien auf alten Deployments bleiben dort aktiv, bis der Maker dockt.

Aktuelle Releases 0.3.0 / 0.4.0 haben die Vanity-Adressen. Pin exact, kein `^`.

### C3. README-Badge und Whitepaper-Pfad sind kaputt

`1inch/aqua` README verlinkt `whitepaper/aqua-dev-preview.md` — Datei existiert auf `main` nicht (liegt auf Branch `feature/whitepaper-1.0`). Coverage-Badge 61,54 % ist niedrig für ein Live-DeFi-Protokoll.

### C4. CI läuft auf `master`, Default-Branch ist `main`

`.github/workflows/ci.yml`: `push.branches: [master]`. Remote-HEAD ist `main`. Es gibt **keinen** `master`-Branch. Pushes auf `main` triggern CI nicht (PRs schon, weil `pull_request` ohne Filter). `actions/checkout@v2` ist veraltet.

### C5. Deploy-Config ist für Mainnet unbrauchbar

`config/constants.json` setzt Owner für Chain 1 auf `0x000…000`. `Config.sol` reverted bei Owner 0. `DEPLOY.md` im Aqua-Repo heißt „SwapVM Deployment Guide“ (Copy-Paste). Produktion lief über Vanity-Factory, nicht über dieses Script.

### C6. GitHub-Issues sind zugespammt

`1inch/aqua` hat Dutzende offene Issues mit Titeln wie „g“. Issue #114 ist ein AI-Scanner-Teaser, keine verifizierte Lücke. Echte Diskussion ertrinkt.

### C7. Beispiel-App `examples/apps/XYCSwap.sol`

Kein Check `feeBps < 10_000`. Bei `feeBps >= 10000` Division durch 0 bzw. Underflow in ExactOut. Nur Beispiel, nicht der Live-Router — trotzdem offizieller Sample-Code.

### C8. README empfiehlt `approve(..., type(uint256).max)`

Widerspricht der Learn-Seite „one capped, revocable allowance“. Unlimited Approve ist die riskantere Variante.

### C9. Lizenz ist nicht Open Source im OSI-Sinn

User-Annahme „komplett öffentlich als Open Source“: Source ist öffentlich, Lizenz ist **LicenseRef-Degensoft-Aqua-Source-1.1** (Copyleft + kommerzielle Trigger ab u. a. 100k USD Fees / 10M USD Liquidity Under Control, widerrufbarer Waiver für Volume Activities). Kein MIT/GPL.

### C10. `main` ≠ deployed Router

Docs: `main` nach PR-154 ändert die Opcode-Tabelle (keine reserved gaps). Live ist `v1.0.2`. Integratoren, die `main` kompilieren, bauen **nicht** den Live-Router.

---

## D. Website vs. Realität

| Aussage | Befund |
| --- | --- |
| „Permissionless“ (1inch.com/aqua) | Taker brauchen KycNFT + `tx.origin`. Keine Smart-Wallet-Taker. |
| „Developer access now live UI launching in 2026“ | Learn/Docs sind live; die Formulierung ist veraltet bzw. unklar. |
| „Open architecture“ / öffentlicher Source | Source-available, nicht OSI-Open-Source. |
| „The hash … can be re-shipped with fresh balances“ | Falsch, siehe A2. |
| „pull() checks the maker's actual wallet balance“ | Es gibt kein `balanceOf` in `pull()`. Es ist `safeTransferFrom`; bei Standard-ERC20 reicht das, bei Fee-on-transfer nicht. |
| Security-Seite: Safe/MPC als Maker | Für **Maker** korrekt. Für **Taker** durch `tx.origin` falsch. |
| „Audited by eight firms“ | Wahr. OZ: 53 Findings, Crit/High gefixt, ein Teil Medium/Low bewusst offen. |
| Aqua README: „Unlimited strategies“, max approve | Marketing; Approval-Risiko bleibt. |

---

## E. Bewusst offene Audit-Reste (keine neuen Bugs)

OpenZeppelin Medium/Low, Status acknowledged:

- Disjoint `ship` (A1)
- Unrestricted `push` (Donation / Maker kann eigene Balances verzerren; kein Extract von Dritten)
- `Calldata.slice` ohne `begin <= end` (Gas; Taker sollen nur validierte Strategien nehmen)
- Leere Arrays bei ship/dock
- Fee-Komposition nicht additiv (eigenes Testfile `FeeOutAdditivityViolation.t.sol`)
- PeggedSwap nur pair-scoped
- Decay/Integer-Math-Kanten

Das sind keine „heimlichen“ Lücken. 1inch hat sie stehen gelassen.

Crit/High aus OZ (PeggedSwap Solver, Concentrate Multi-Token Arbitrage, Axis-Mismatch, Concentrate+Fee Accounting) sind in späteren PRs als resolved markiert. Nicht als offen führen.

---

## F. Was bewusst kein Bug ist

- Shared Liquidity Ratio &gt; 1: erstes `pull` gewinnt, Rest reverted. Dokumentiertes Modell, keine Hebel-Schuld.
- Beliebiges AquaApp, das der Maker shipt, darf bis zur Virtual Balance + Allowance pullen. Maker vertraut der App.
- `push` von jedermann: Donation an den Maker.
- Strategien immutable: Parameteränderung braucht neuen Hash.
- Kein on-chain Pause: unterfunded = fills revert.

---

## G. Verbesserungen (sicher sinnvoll, kein Exploit)

1. `ship()`: einmaliges Flag pro `(maker, app, strategyHash)` — schließt A1. Branch `fix/aqua-reship` deutet in die Richtung.
2. Docs A2 korrigieren: nach Dock kein Re-Ship desselben Hash.
3. `tokens.length == amounts.length` und Reject leerer Arrays.
4. CI auf `main`, Checkout v4, Issues moderieren.
5. README-Kettenliste = 13 Prod-Chains; SDK Extra-Chains nur mit korrekter EIP-712-Version oder gar nicht.
6. Whitepaper-Link reparieren; Coverage erhöhen (Badge 61,54 %).
7. Sample `XYCSwap`: `feeBps < 10_000` erzwingen; `forceApprove` statt `approve`.
8. Integratoren: SDK 0.3.0 / 0.4.0 pinnen, Router-Verhalten von Tag `v1.0.2`, nicht `main`.
9. Keine Fee-on-transfer/Rebasing-Tokens.
10. Path C (`Extruction`) nur mit unveränderlichem, deterministischem Target und hartem Taker-`minOut`.

---

## H. Was ich nicht als sicher ausgebe

- Kein vollständiges formales Audit der gesamten Opcode-Math auf `main` nach v1.0.2.
- Keine On-Chain-Verifikation aller 13 Chains Bytecode-gleich (Docs sagen: Vanity-Adresse beweist das nicht; Ethereum+Base wurden von 1inch gespottet).
- SwapVM-Issues #30–#33 nicht als Aqua-Prod gewertet (Opcodes fehlen im Aqua-Router).
- Spam-Issue #114 ignoriert.

---

## Quellen (Auswahl)

- https://github.com/1inch/aqua/blob/main/src/Aqua.sol
- https://github.com/1inch/aqua/blob/main/test/AquaShipDock.t.sol
- https://github.com/1inch/swap-vm/blob/main/src/opcodes/AquaOpcodes.sol
- https://github.com/1inch/swap-vm/blob/main/src/SwapVM.sol
- https://github.com/1inch/swap-vm/blob/main/src/instructions/Extruction.sol
- https://business.1inch.com/portal/documentation/aqua/overview
- https://business.1inch.com/portal/documentation/aqua/reference/contract-addresses
- https://business.1inch.com/portal/documentation/aqua/liquidity-layer/strategy
- https://www.openzeppelin.com/news/1inch-aqua-and-swapvm-mvp-v1.0-audit
- https://github.com/1inch/1inch-audits
- https://1inch.com/aqua
- https://1inch.com/aqua/learn/security
- https://github.com/1inch/swap-vm/issues/29
- https://github.com/1inch/swap-vm/issues/34
