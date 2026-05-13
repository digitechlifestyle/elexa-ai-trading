/**
 * Black-Scholes-Merton — European call & put pricing + greeks.
 * No dividend yield branch — q = 0 assumed (extend later if needed).
 */

// Cumulative normal — Abramowitz & Stegun 7.1.26 polynomial approximation
function normCdf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + p * ax);
  const y =
    1 -
    (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return 0.5 * (1 + sign * y);
}

// Normal PDF
function normPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

export interface OptionInputs {
  spot: number; // S
  strike: number; // K
  rate: number; // r — annual, decimal (e.g. 0.04)
  vol: number; // sigma — annual, decimal (e.g. 0.20)
  days: number; // T in calendar days
}

export interface OptionResult {
  call_price: number;
  put_price: number;
  delta_call: number;
  delta_put: number;
  gamma: number;
  vega: number; // per 1% vol change
  theta_call: number; // per calendar day
  theta_put: number;
  rho_call: number; // per 1% rate change
  rho_put: number;
}

export function blackScholes(inputs: OptionInputs): OptionResult {
  const { spot: S, strike: K, rate: r, vol: sigma, days } = inputs;
  const T = days / 365;
  if (T <= 0 || sigma <= 0 || S <= 0 || K <= 0) {
    return {
      call_price: Math.max(0, S - K),
      put_price: Math.max(0, K - S),
      delta_call: S >= K ? 1 : 0,
      delta_put: S < K ? -1 : 0,
      gamma: 0,
      vega: 0,
      theta_call: 0,
      theta_put: 0,
      rho_call: 0,
      rho_put: 0,
    };
  }
  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  const Nd1 = normCdf(d1);
  const Nd2 = normCdf(d2);
  const nNeg_d1 = normCdf(-d1);
  const nNeg_d2 = normCdf(-d2);
  const eRT = Math.exp(-r * T);
  const callPrice = S * Nd1 - K * eRT * Nd2;
  const putPrice = K * eRT * nNeg_d2 - S * nNeg_d1;
  const phi_d1 = normPdf(d1);
  const gamma = phi_d1 / (S * sigma * sqrtT);
  const vega = S * phi_d1 * sqrtT * 0.01; // per 1% vol change
  const thetaCallAnnual =
    -(S * phi_d1 * sigma) / (2 * sqrtT) - r * K * eRT * Nd2;
  const thetaPutAnnual =
    -(S * phi_d1 * sigma) / (2 * sqrtT) + r * K * eRT * nNeg_d2;
  const rhoCall = K * T * eRT * Nd2 * 0.01;
  const rhoPut = -K * T * eRT * nNeg_d2 * 0.01;
  return {
    call_price: callPrice,
    put_price: putPrice,
    delta_call: Nd1,
    delta_put: Nd1 - 1,
    gamma,
    vega,
    theta_call: thetaCallAnnual / 365,
    theta_put: thetaPutAnnual / 365,
    rho_call: rhoCall,
    rho_put: rhoPut,
  };
}
