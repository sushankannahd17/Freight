# FreightIQ — Intelligent Freight Forecasting & Vessel Chartering Platform

> **Smart India Hackathon 2026 Project**  
> **Problem Statement:** Development of an Intelligent Freight Forecasting Model for Optimized Vessel Chartering and Bulk Cargo Procurement from Overseas to East Coast of India.  
> **Ministry:** Ministry of Steel, Government of India.  
> **Category:** Software — Transportation & Logistics.

---

## 🚀 Product Vision

FreightIQ moves bulk cargo procurement and vessel chartering decisions from reactive daily spot-market exploration toward proactive short-term and medium-term multiple-voyage chartering.

Procurement managers for Indian steel plants can use FreightIQ to:
1. **Validate Physical Port Compatibility:** Check draft, length overall (LOA), and beam constraints across overseas loading ports and Indian East Coast discharge terminals (e.g., Paradip, Visakhapatnam, Gangavaram, Dhamra, Haldia).
2. **Estimate Transparent Voyage Costs:** Itemize freight cost, daily hire rate, VLSFO bunker fuel costs, and port dues across spot, short-term (3–6 mo), and medium-term (12 mo COA) charter contracts.
3. **Receive Explainable Recommendations:** Deterministically rank candidate vessel classes (Handysize, Supramax, Panamax, Capesize) with step-by-step reasoning ("Why FreightIQ recommends this option").
4. **Forecast Freight Trends & Risk:** Analyze 33-month historical rate series and project 6-month trend models with 80% & 95% confidence bounds.

---

## 🛠 Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, React Router v7, Recharts, Lucide React icons.
- **Backend API:** Node.js, Express, TypeScript REST endpoints (`/api/ports`, `/api/vessels`, `/api/routes`, `/api/forecast`, `/api/recommend`).
- **Testing:** Vitest, Testing Library.
- **Data Engine:** Modular TypeScript data layer with `Prototype Dataset — Synthetic Values` status indicators.

---

## 📊 Prototype Data Dictionary

> [!IMPORTANT]
> **Label:** `"Prototype Dataset — Synthetic Values"`  
> All values in this release are simulated for prototype demonstration and hackathon validation.

| Entity | Attributes | Description / Notes |
| :--- | :--- | :--- |
| **Ports** | `maxDraftM`, `maxLOAM`, `maxBeamM`, `cargoHandlingRateTPH` | Includes overseas origins (Australia, USA, Mozambique, Russia, Indonesia) and East Coast India destinations. Highlights Haldia's 8.5m riverine draft bottleneck. |
| **Vessel Classes** | `capacityMin/MaxMT`, `typicalDraftM`, `LOA`, `Beam`, `hireRateUSD` | Handysize (15-35k MT), Supramax (50-60k MT), Panamax (65-80k MT), Capesize (120-200k MT). |
| **Routes** | `distanceNM`, `baselineFreightUSDPerMT` | Precalculated nautical mile distances and freight baselines. |
| **Rate Records** | `date`, `rateUSDPerMT` | 33-month historical observation series (2024–2026). |

---

## 🏃 Running the Application

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Frontend Dev Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Start Backend REST API Server (Optional)
```bash
npm run server
```
Runs the Express API server at `http://localhost:3001`.

### 4. Run Unit Tests
```bash
npm test
```

### 5. Build Production Bundle
```bash
npm run build
```

---

## 🧪 Testing Verification

The project includes Vitest unit tests covering:
- Draft, LOA, beam, and cargo capacity constraint enforcement (`vesselCompatibility.test.ts`).
- Voyage fuel, port dues, hire cost, and multi-voyage contract math (`voyageCostCalculator.test.ts`).
- Deterministic vessel ranking and explanation generation (`recommendationEngine.test.ts`).
