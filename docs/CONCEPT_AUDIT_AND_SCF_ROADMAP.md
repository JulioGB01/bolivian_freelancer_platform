# Auditoría de Concepto, Defensa ante Jurado y Hoja de Ruta SCF ($45k)

**Proyecto:** Bolivia Escrow *(nombre de trabajo; candidato LatAm: Kipu / Pacto)*  
**Evento:** National Startups Hackathon 2026 by Stellar (Bolivia)  
**Alineación con los 4 Pilares del Jurado:** (1) Stellar es el núcleo, no decoración · (2) Integración real del ecosistema Stellar · (3) Problema real de Bolivia · (4) Listo para financiamiento **Stellar Community Fund (SCF)**.

---

## 1. Huecos de concepto detectados y soluciones aplicadas

| # | Hueco / Riesgo detectado | Impacto en el jurado | Solución aplicada en código y estrategia |
|---|---|---|---|
| **1** | **Contradicción de comisión del 5% (`500 bps`)** — Igual de cara que Upwork Direct Contracts (~5%) sin ofrecer adquisición de clientes; incentiva desintermediación tras el primer hito. | Mata la propuesta de valor y la retención. | Bajada a **1.5% fijo (`150 bps`)** por defecto en contrato y app (3× más barato que Upwork Direct, 6× más barato que Upwork marketplace). Tabla comparativa explícita en `/como-funciona`. |
| **2** | **Árbitro centralizado + vulnerabilidad de `update_config`** — `admin` podía cambiar `arbiter` y `fee_recipient` afectando acuerdos ya activos, contradiciendo *"las reglas no cambian"*. | Contradicción de seguridad y narrativa *"trustless"*. | **Snapshot inmutable por acuerdo** de `fee_bps`, `arbiter` y `fee_recipient` en `Agreement` al crearse. Posicionamiento honesto: **"No-Custodial y Reglas Bloqueadas"** (la plataforma nunca toca fondos sin disputa; en SCF se migra a arbitraje multisig 2-de-3). |
| **3** | **Bloqueo permanente si el freelancer desaparece + TTL corto (~6.9h)** — Un hito en `Funded` solo lo movía el freelancer; el almacenamiento expiraba antes del plazo de revisión. | Vulnerabilidad crítica en smart contract. | **Disputa anti-ghosting**: el cliente puede disputar un hito en `Funded` (`Funded → Disputed`) para que el árbitro devuelva hasta el 100%. **TTL de ~30 días** (`518_400` ledgers), ventana de revisión acotada (`1h–30d`), `resolved_freelancer_bps` y `get_next_id()`. |
| **4** | **Integración débil del ecosistema Stellar (Pilar 2)** — Solo usaba Stellar Wallets Kit; sin salida a BOB ni ahorro. | Puntaje bajo en Pilar 2. | Flujo post-liberación integrado en la UI: **Retiro a BOB vía Pollar (QR Simple)** con vista previa a tipo de cambio paralelo, CTA de **ahorro en USDC con Vaquita** y **Comprobante de Pago / Recibo SIAT** descargable. |
| **5** | **Fricción de onboarding para cliente no-crypto** — Exigir a una empresa de EE.UU. instalar Freighter, comprar XLM y activar trustline frena la adopción. | Principal objeción comercial. | **GTM en 2 fases**: (1) Cuña inmediata con clientes tech/Web3 que ya pagan en USDC/USDT y PYMEs bolivianas vía Pollar QR; (2) SCF Hito 1 con **Passkey Smart Wallets + Fee-Bump Sponsorship + On-Ramp fiat**. |
| **6** | **Riesgo regulatorio ASFI (DS 5384 / Res. 540/2025)** — Custodiar fondos de terceros o intermediar pagos en Bolivia exige licencia ETF/PSAV. | Riesgo legal para escalar en Bolivia. | Arquitectura **100% no-custodial en Soroban** (nunca tocamos cuentas bancarias ni custodiamos fondos) + delegación total de rampas fiat y KYC/UIF a **partners regulados (Pollar / anchors SEP-24)**. |
| **7** | **Cero validación documentada y sin TAM/SAM/SOM** — Sin entrevistas registradas ni hoja de ruta SCF. | Debilita Pilares 3 y 4. | Dimensionamiento bottom-up (sección 3), guión de 5 entrevistas ejecutables antes del 22 de nov (sección 4) y plan SCF en 3 hitos por $45k (sección 5). |

---

## 2. Respuestas exactas a las 3 preguntas difíciles del jurado

### Pregunta 1: *"¿Por qué no usaron simplemente Trustless Work?"*
> *"Estudiamos Trustless Work a fondo: es una excelente infraestructura general de Escrow-as-a-Service (0.3% de comisión). Para el hackathon construimos un contrato Soroban dedicado porque el flujo de freelancers bolivianos exige **protecciones opinadas de fábrica**: (1) **auto-claim por vencimiento de plazo** para que el silencio del cliente no congele el alquiler del freelancer, (2) **reembolso exclusivo del freelancer + disputa anti-ghosting desde `Funded`** para evitar contracargos abusivos y bloqueos eternos, y (3) **prueba pública verificable (`/verificar/[id]`) + historial on-chain (`/perfil/[address]`)**. De cara a Mainnet en SCF, nuestra arquitectura es modular: podemos auditar nuestro contrato mínimo o conectar el motor auditado de Trustless Work como capa de liquidación, enfocando el 100% de nuestra diferenciación en la **UX boliviana, rampas Pollar en BOB y recibos fiscales SIAT**."*

### Pregunta 2: *"¿Cómo paga un cliente no-crypto (EE.UU./UE) sin instalar Freighter?"*
> *"No atacamos a todos los segmentos a la vez; ejecutamos un **GTM en dos fases**:*
> 1. ***Hoy (Fase 1 — cero fricción):*** *empezamos con las dos cuñas donde la adopción es inmediata: clientes remotos tech/Web3 que ya pagan en USDC/USDT, y empresas/PYMEs bolivianas que fondean directamente en bolivianos vía **Pollar QR Simple → USDC**.*
> 2. ***SCF Hito 1 (Fase 2 — sin Freighter):*** *eliminamos la billetera cripto para clientes tradicionales de EE.UU./UE combinando **Passkey Smart Wallets (WebAuthn en Stellar) + Fee-Bump Transactions (gas XLM patrocinado) + On-Ramp fiat (SEP-24 / MoneyGram / Coinbase Onramp)**. El cliente abre el enlace, paga con tarjeta o ACH y, por debajo, el USDC queda bloqueado en Soroban en 5 segundos sin ver jamás una frase semilla ni comprar XLM."*

### Pregunta 3: *"¿Cómo pasa el freelancer a BOB en su banco (Pollar) y cuál es el encuadre legal ante ASFI (DS 5384 / Res. 540/2025)?"*
> *"Por la realidad cambiaria de Bolivia (fin de la paridad Bs 6.96, tipo de cambio flexible/paralelo sobre Bs 11+), el freelancer quiere **cobrar y ahorrar en USDC**, y convertir a BOB solo lo que gasta cada semana. Apenas se libera un hito, hace clic en **'Retirar a BOB vía Pollar'** para recibir bolivianos en su banco mediante **QR Simple a tasa de mercado** en minutos, sin riesgo de estafa o triangulación P2P ni bloqueos UIF; el excedente puede quedar en USDC o rendir vía **Vaquita**.*
>
> *En lo regulatorio (**DS 5384** y **Resolución ASFI 540/2025** sobre ETFs/PSAVs), Soroban es justamente lo que resuelve la trampa legal: un escrow tradicional que recibe BOB en su cuenta bancaria incurre en intermediación financiera no autorizada. Nosotros somos **software no-custodial**: nunca tocamos ni custodiamos fondos de terceros, y delegamos el 100% de la conversión fiat BOB↔USDC y el cumplimiento KYC/UIF a **partners regulados (Pollar / anchors licenciados)**. Además, emitimos un **Comprobante de Pago On-Chain / Recibo para SIAT** (exportación de servicios con IVA 0%) para que el freelancer respalde sus ingresos ante su banco y el SIN."*

---

## 3. Dimensionamiento de mercado Bottom-Up (Bolivia → LatAm)

### Bolivia (Mercado inicial)
- **TAM (Bolivia):** ~**20,000 freelancers digitales remotos activos** (desarrolladores, diseñadores, marketers, asistentes virtuales exportando servicios desde Santa Cruz, La Paz y Cochabamba) × **$15,000 USD** facturación anual promedio = **$300M USD/año** en volumen bruto de pagos *(rango conservador: 15k–30k freelancers → $180M–$500M)*.
- **SAM (Bolivia):** ~**30% trabajan con clientes directos** fuera de marketplaces tradicionales usando cobros informales/cripto (Binance P2P, Airtm, Payoneer, transferencias con fricción) = **6,000 freelancers** → **$90M USD/año** en volumen direccionable *(rango: $50M–$150M)*.
- **SOM (Meta a 18 meses post-SCF):** Capturar **500 freelancers activos** (8.3% del SAM boliviano) con un promedio conservador de **$10,000 USD/año** pasados por escrow = **$5.0M USD GMV/año** → **$75,000 USD ARR** a nuestra comisión fija del **1.5%**.

### Expansión LatAm (Post-Hito 3)
Replicando el mismo dolor cambiario y de confianza en **Argentina, Venezuela, Colombia y Perú** (>1.5M freelancers remotos de servicios digitales), el SAM regional supera los **$4,500M USD/año** en pagos directos en stablecoins, usando exactamente el mismo contrato Soroban y cambiando únicamente el anchor local SEP-24 por país.

---

## 4. Guión rápido de 5 entrevistas de validación (Ejecutar antes del 22 de nov)

**Objetivo:** 5–8 llamadas o notas de voz de **10 minutos** con freelancers bolivianos reales (devs, diseñadores, editores de video, marketers) vía WhatsApp/Discord/LinkedIn (red de Buidlers Bolivia y contactos del equipo) para llevar citas y porcentajes reales al pitch deck.

### Preguntas (máx. 10 min)
1. **Contexto:** *¿Qué servicios vendes y dónde están tus clientes (Bolivia o exterior)?*
2. **Cobro actual y costo real:** *¿Por qué medio cobras hoy (Payoneer, Airtm, Binance P2P, Wise, QR banco) y qué porcentaje pierdes entre comisiones y tipo de cambio hasta tener BOB en tu mano?*
3. **Dolor de impago / confianza:** *¿Alguna vez empezaste un proyecto y el cliente tardó semanas en pagar, cambió las reglas o no pagó? ¿Cuánto perdiste?*
4. **Reacción al escrow (mostrar `/verificar/[id]`):** *Si pudieras mandarle un link a tu cliente para que bloquee el USDC antes de que empieces, y si no responde en 3 días el contrato te paga solo, ¿lo usarías en tu próximo cliente nuevo?*
5. **Precio (1.5%):** *¿Pagarías 1.5% ($15 en un proyecto de $1,000) por esa garantía + retiro a BOB por QR Simple + recibo para justificar ingresos en el banco/SIAT?*
6. **Fricción del cliente:** *¿Tu cliente actual aceptaría fondear con USDC o necesitaría pagar con tarjeta/transferencia/QR?*

### Tabla de registro para el Pitch Deck

| # | Perfil (Rol / Ciudad) | Método actual y % perdido | ¿Sufrió impago/retraso? | ¿Pagaría 1.5%? | Cita textual destacada |
|---|---|---|---|---|---|
| 1 | *(Completar)* | | | | |
| 2 | *(Completar)* | | | | |
| 3 | *(Completar)* | | | | |
| 4 | *(Completar)* | | | | |
| 5 | *(Completar)* | | | | |

---

## 5. Hoja de Ruta y Presupuesto — Stellar Community Fund (SCF): $45,000 USD

Propuesta estructurada en **3 hitos verificables de 2 meses cada uno (6 meses totales)**, diseñada para cumplir los criterios de tracción, seguridad y adopción de SCF.

| Hito | Plazo | Presupuesto | Entregables técnicos y de producto | KPIs verificables (Definition of Done) |
|---|---|---|---|---|
| **Hito 1: Seguridad y Onboarding sin Fricción** | Meses 1–2 | **$15,000** | • Auditoría externa de seguridad del contrato `bfe-escrow` (o integración modular con motor auditado).<br>• **Passkey Smart Wallets (WebAuthn)** + **Fee-Bump Gas Sponsorship** para eliminar Freighter y XLM en clientes.<br>• Integración productiva de **Pollar (BOB QR Simple ↔ USDC)** + opinión legal formal ASFI (DS 5384 / Res. 540/2025). | • Reporte de auditoría pública con 0 hallazgos críticos/altos abiertos.<br>• Flujo E2E donde un cliente sin billetera fondea un hito en <60 segundos.<br>• Memorándum legal no-custodial firmado. |
| **Hito 2: Lanzamiento Mainnet y Cuña Boliviana** | Meses 3–4 | **$15,000** | • Despliegue en **Stellar Mainnet** con **Circle USDC**.<br>• Integración en vivo de **Vaquita** (ahorro USDC post-liberación) y generador automático de **Comprobantes SIAT / exportación de servicios**.<br>• Programa piloto con comunidades tech de Santa Cruz, La Paz y Cochabamba (Buidlers Bolivia, agencias y freelancers). | • **≥150 freelancers bolivianos activos** en Mainnet.<br>• **≥$300,000 USD** en volumen acumulado liquidado en Soroban (run-rate $1.2M/año).<br>• Tasa de disputas <5% y retención >60% al segundo acuerdo. |
| **Hito 3: Escala, Gobernanza de Arbitraje y LatAm** | Meses 5–6 | **$15,000** | • Evolución del árbitro a **panel descentralizado multisig 2-de-3** con árbitros verificados legal-tech en Bolivia.<br>• Integración de **On-Ramp internacional (SEP-24 / MoneyGram / Coinbase Onramp)** para clientes de EE.UU. y UE.<br>• Apertura de rampas locales en el primer país de expansión (Argentina o Colombia). | • **≥500 freelancers activos** y **$5M USD GMV anualizado** ($75k ARR al 1.5%).<br>• ≥20% de clientes fondeando vía on-ramp fiat sin billetera previa.<br>• Arquitectura multi-país operativa en Mainnet. |
| **Total SCF** | **6 meses** | **$45,000** | **Desglose estimado:** Ingeniería Soroban/Web ($21k) · Auditoría & Legal ASFI ($12k) · Integraciones Pollar/SEP-24/Vaquita ($6k) · Crecimiento, pilotos y liquidez de gas patrocinado ($6k). | **Autonomía financiera progresiva** vía comisión del 1.5% sobre GMV en Stellar Mainnet. |
