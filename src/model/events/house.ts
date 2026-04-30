import type { LifeEvent, YearImpact, SimContext } from '../types'
import { getBaselineCost } from '../types'
import { defaultHousePrice } from '../../data/defaults'
import { moneyToExp } from '../../data/money-exp'

interface HouseParams extends Record<string, number | string | boolean> {
  buyAge: number
  totalPrice: number
  downPaymentRatio: number
  loanYears: number
  interestRate: number
}

export function makeHouse(
  p: Partial<HouseParams> = {},
  ctxBaseline?: number,
): LifeEvent {
  const defaultPrice = ctxBaseline ? defaultHousePrice(ctxBaseline) : 3_500_000
  const params: HouseParams = {
    buyAge: p.buyAge ?? 35,
    totalPrice: p.totalPrice ?? defaultPrice,
    downPaymentRatio: p.downPaymentRatio ?? 0.3,
    loanYears: p.loanYears ?? 30,
    interestRate: p.interestRate ?? 0.04,
  }
  return {
    id: 'house',
    type: 'house',
    name: '买房',
    startAge: params.buyAge,
    endAge: params.buyAge + params.loanYears,
    removable: true,
    params,
    impactAt(age: number, ctx: SimContext): YearImpact {
      if (age < params.buyAge) return zero()
      const baseline = getBaselineCost(ctx)
      const yearSince = age - params.buyAge

      let moneyFlow = 0
      let consumption = 0

      if (yearSince === 0) {
        const down = params.totalPrice * params.downPaymentRatio
        moneyFlow -= down
        consumption += down
      }
      if (yearSince >= 0 && yearSince < params.loanYears) {
        const principal = params.totalPrice * (1 - params.downPaymentRatio)
        const r = params.interestRate
        const n = params.loanYears
        const annualPayment = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
        moneyFlow -= annualPayment
        consumption += annualPayment
      }

      // 当年花在房上的钱 → 饱和体验加成
      const expFromConsumption =
        consumption > 0 ? moneyToExp(consumption + baseline, baseline) : 0
      // 拥有自住房 → 终身一点点稳定感（小常数，独立于花的钱）
      const ownershipBonus = age >= params.buyAge ? 0.05 : 0
      const expDelta = expFromConsumption + ownershipBonus
      // 终身乘性"安全感"
      const expMult = 1.03

      return { timeHours: 0, moneyFlow, consumptionFlow: consumption, expDelta, expMult }
    },
  }
}

function zero(): YearImpact {
  return { timeHours: 0, moneyFlow: 0, expDelta: 0, expMult: 1 }
}
