import { Currency, CurrencyAmount, JSBI, Percent, TokenAmount } from '@uniswap/sdk'
import { Pool } from 'data/Pool'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { usePool } from '../../data/Reserves'
import { useTotalSupply } from '../../data/TotalSupply'

import { useActiveWeb3React } from '../../hooks'
import { wrappedCurrency } from '../../utils/wrappedCurrency'
import { AppDispatch, AppState } from '../index'
import { tryParseAmount } from '../swap/hooks'
import { useTokenBalances } from '../wallet/hooks'
import { Field, typeInput } from './actions'

export function useBurnState(): AppState['flashLoanBurn'] {
  return useSelector<AppState, AppState['flashLoanBurn']>(state => state.flashLoanBurn)
}

export function useDerivedBurnInfo(
  currency: Currency | undefined
): {
  pool?: Pool | null
  parsedAmounts: {
    [Field.LIQUIDITY_PERCENT]: Percent
    [Field.LIQUIDITY]?: TokenAmount
    [Field.CURRENCY]?: CurrencyAmount
  }
  error?: string
} {
  const { account, chainId } = useActiveWeb3React()

  const { independentField, typedValue } = useBurnState()

  // pair + totalsupply
  const [, pool] = usePool(currency)

  // balances
  const relevantTokenBalances = useTokenBalances(account ?? undefined, [pool?.liquidityToken])
  const userLiquidity: undefined | TokenAmount = relevantTokenBalances?.[pool?.liquidityToken?.address ?? '']

  const token = wrappedCurrency(currency, chainId)
  const tokens = {
    [Field.CURRENCY]: token,
    [Field.LIQUIDITY]: pool?.liquidityToken
  }

  // liquidity values
  const totalSupply = useTotalSupply(pool?.liquidityToken)
  const liquidityValue =
    pool &&
    totalSupply &&
    userLiquidity &&
    token &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalSupply.raw, userLiquidity.raw)
      ? new TokenAmount(token, pool.getLiquidityValue(token, totalSupply, userLiquidity, false).raw)
      : undefined
  const liquidityValues: { [Field.CURRENCY]?: TokenAmount } = {
    [Field.CURRENCY]: liquidityValue
  }

  let percentToRemove: Percent = new Percent('0', '100')
  // user specified a %
  if (independentField === Field.LIQUIDITY_PERCENT) {
    percentToRemove = new Percent(typedValue, '100')
  }
  // user specified a specific amount of liquidity tokens
  else if (independentField === Field.LIQUIDITY) {
    if (pool?.liquidityToken) {
      const independentAmount = tryParseAmount(typedValue, pool.liquidityToken)
      if (independentAmount && userLiquidity && !independentAmount.greaterThan(userLiquidity)) {
        percentToRemove = new Percent(independentAmount.raw, userLiquidity.raw)
      }
    }
  }
  // user specified a specific amount of token
  else {
    if (tokens[independentField]) {
      const independentAmount = tryParseAmount(typedValue, tokens[independentField])
      const liquidityValue = liquidityValues[independentField]
      if (independentAmount && liquidityValue && !independentAmount.greaterThan(liquidityValue)) {
        percentToRemove = new Percent(independentAmount.raw, liquidityValue.raw)
      }
    }
  }

  const parsedAmounts: {
    [Field.LIQUIDITY_PERCENT]: Percent
    [Field.LIQUIDITY]?: TokenAmount
    [Field.CURRENCY]?: TokenAmount
  } = {
    [Field.LIQUIDITY_PERCENT]: percentToRemove,
    [Field.LIQUIDITY]:
      userLiquidity && percentToRemove && percentToRemove.greaterThan('0')
        ? new TokenAmount(userLiquidity.token, percentToRemove.multiply(userLiquidity.raw).quotient)
        : undefined,
    [Field.CURRENCY]:
      token && percentToRemove && percentToRemove.greaterThan('0') && liquidityValue
        ? new TokenAmount(token, percentToRemove.multiply(liquidityValue.raw).quotient)
        : undefined
  }

  let error: string | undefined
  if (!account) {
    error = 'Connect Wallet'
  }

  if (!parsedAmounts[Field.LIQUIDITY] || !parsedAmounts[Field.CURRENCY]) {
    error = error ?? 'Enter an amount'
  }

  return { pool: pool, parsedAmounts, error }
}

export function useBurnActionHandlers(): {
  onUserInput: (field: Field, typedValue: string) => void
} {
  const dispatch = useDispatch<AppDispatch>()

  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      dispatch(typeInput({ field, typedValue }))
    },
    [dispatch]
  )

  return {
    onUserInput
  }
}
