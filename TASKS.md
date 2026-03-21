# Tareas Pendientes — hiero-enterprise-react

> Generado: 20 de marzo, 2026
> Deadline: 23 de marzo, 2026 — 11:59 PM ET

---

## Ehime (Tests core + CI)

### 1. Crear `token.test.ts`
**Archivo:** `packages/core/__tests__/token.test.ts`
**Prioridad:** Alta
**Motivo:** TokenService no tiene tests. Los jueces evalúan test coverage.

Cubrir:
- `getInfo(tokenId)` — retorna info correcta del token
- `createToken(params)` — crea token fungible y retorna tokenId
- `createToken()` con parámetros inválidos — manejo de error
- `associateToken()` — asocia token a cuenta

Usar el mismo patrón de mocks que `account.test.ts` (vi.mock de `@hashgraph/sdk`).

---

### 2. Crear `nft.test.ts`
**Archivo:** `packages/core/__tests__/nft.test.ts`
**Prioridad:** Alta
**Motivo:** NftService no tiene tests.

Cubrir:
- `createCollection(params)` — crea colección y retorna tokenId
- `mint(tokenId, metadata, supplyKey)` — mintea NFTs y retorna serial numbers
- `mint()` con metadata vacío — debe manejar error
- `transfer(tokenId, serialNumber, from, to)` — transfiere NFT

---

### 3. Completar tests de `account.test.ts`
**Archivo:** `packages/core/__tests__/account.test.ts`
**Prioridad:** Media
**Motivo:** Faltan tests para `transferHbar()` y `createAccount()`.

Agregar:
- `transferHbar(toAccountId, amount)` — retorna receipt
- `transferHbar()` con balance insuficiente — manejo de error
- `createAccount(initialBalance)` — retorna accountId
- `createAccount()` sin balance inicial — usa default

---

### 4. Corregir acceso a `_map` en `account.ts`
**Archivo:** `packages/core/src/account.ts`
**Prioridad:** Media
**Motivo:** `response.tokens._map` accede a una propiedad interna del SDK que puede cambiar en futuras versiones.

Buscar la API pública del SDK para iterar tokens del balance (ej: `response.tokens.toString()` o un método oficial).

---

## Emmanuel (Hooks + Docs)

### 5. Agregar AbortController a `useBalance`
**Archivo:** `packages/react/src/useBalance.ts`
**Prioridad:** Alta
**Motivo:** Si el usuario cambia `accountId` rápido, requests anteriores pueden sobreescribir el estado con datos del accountId anterior (race condition).

```tsx
useEffect(() => {
  let cancelled = false;
  const fetchBalance = async () => {
    // ... fetch logic
    if (!cancelled) {
      setBalance(result);
    }
  };
  fetchBalance();
  return () => { cancelled = true; };
}, [accountId]);
```

Aplicar el mismo patrón en:
- `packages/react/src/useTokenInfo.ts`
- `packages/react/src/useAccountInfo.ts`

---

### 6. Agregar cleanup a `useMirrorQuery`
**Archivo:** `packages/react/src/useMirrorQuery.ts`
**Prioridad:** Alta
**Motivo:** Misma race condition que useBalance. Además, `fetchNextPage()` puede ejecutarse después de unmount.

Agregar flag `cancelled` en el useEffect y verificar antes de cada `setState`.

---

### 7. Agregar JSDoc faltante en hooks y servicios
**Prioridad:** Media
**Motivo:** El plan del día 3 requiere JSDoc en todas las funciones exportadas.

Archivos que necesitan JSDoc:
- `packages/core/src/nft.ts` — clase `NftService` sin JSDoc, métodos `mint()` y `transfer()` sin documentar formato de metadata
- `packages/core/src/mirror.ts` — constructor de `MirrorNodeClient` sin documentar parámetro `baseUrl`
- `packages/react/src/useTransfer.ts` — agregar nota de que requiere operador configurado
- `packages/react/src/useMirrorQuery.ts` — documentar opción `enabled`

---

## Rafiz (Sample app + Validación)

### 8. Validar inputs en página de Transfer
**Archivo:** `packages/sample-app/app/transfer/page.tsx`
**Prioridad:** Alta
**Motivo:** Sin validación, la demo puede romperse durante el video. `parseFloat(amount)` puede retornar NaN.

Implementar:
- Validar formato de Account ID (patrón: `0.0.XXXXX`)
- Validar que amount sea número positivo
- Deshabilitar botón "Send" si inputs son inválidos
- Agregar confirmación antes de enviar HBAR

---

### 9. Validar inputs en página de Tokens
**Archivo:** `packages/sample-app/app/tokens/page.tsx`
**Prioridad:** Media
**Motivo:** Permite hacer query con Account ID vacío.

Implementar:
- No ejecutar query si el campo está vacío
- Validar formato de Account ID antes de buscar
- Mostrar mensaje si no se ha ingresado un ID

---

### 10. Validar inputs en página de Mirror
**Archivo:** `packages/sample-app/app/mirror/page.tsx`
**Prioridad:** Media
**Motivo:** Parsing de timestamp puede fallar con datos inesperados.

Implementar:
- Validar formato de timestamp antes de `parseInt()`
- Manejar caso donde `seconds` es undefined o vacío

---

### 11. Mejorar UX del sample app
**Prioridad:** Baja
**Motivo:** Pulir la app para que se vea bien en el video demo.

Sugerencias:
- Agregar loading skeletons/placeholders en vez de estados vacíos
- Agregar un banner visible que diga "Demo — Testnet only" en el header
- Usar un Account ID default de testnet (ej: `0.0.100`) como placeholder en los inputs

---

## Resumen rápido

| #  | Tarea                              | Asignado  | Prioridad |
|----|------------------------------------|-----------|-----------|
| 1  | Crear `token.test.ts`              | Ehime     | Alta      |
| 2  | Crear `nft.test.ts`                | Ehime     | Alta      |
| 3  | Completar `account.test.ts`        | Ehime     | Media     |
| 4  | Corregir `_map` en account.ts      | Ehime     | Media     |
| 5  | AbortController en useBalance      | Emmanuel  | Alta      |
| 6  | Cleanup en useMirrorQuery          | Emmanuel  | Alta      |
| 7  | JSDoc faltante                     | Emmanuel  | Media     |
| 8  | Validar inputs en Transfer         | Rafiz     | Alta      |
| 9  | Validar inputs en Tokens           | Rafiz     | Media     |
| 10 | Validar inputs en Mirror           | Rafiz     | Media     |
| 11 | Mejorar UX del sample app          | Rafiz     | Baja      |
