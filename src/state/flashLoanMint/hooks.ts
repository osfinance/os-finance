import { Currency, CurrencyAmount, JSBI, Percent, TokenAmount } from '@uniswap/sdk'
import { Pool } from 'data/Pool'
import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { PairState, usePool } from '../../data/Reserves'
import { useTotalSupply } from '../../data/TotalSupply'

import { useActiveWeb3React } from '../../hooks'
import { wrappedCurrencyAmount } from '../../utils/wrappedCurrency'
import { AppDispatch, AppState } from '../index'
import { tryParseAmount } from '../swap/hooks'
import { useCurrencyBalances } from '../wallet/hooks'
import { Field, typeInput } from './actions'

const ZERO = JSBI.BigInt(0)

export function useMintState(): AppState['flashLoanMint'] {
  return useSelector<AppState, AppState['flashLoanMint']>(state => state.flashLoanMint)
}

export function useMintActionHandlers(
  noLiquidity: boolean | undefined
): {
  onFieldInput: (typedValue: string) => void
} {
  const dispatch = useDispatch<AppDispatch>()

  const onFieldInput = useCallback(
    (typedValue: string) => {
      dispatch(typeInput({ field: Field.CURRENCY, typedValue, noLiquidity: noLiquidity === true }))
    },
    [dispatch, noLiquidity]
  )

  return {
    onFieldInput
  }
}

export function useDerivedMintInfo(
  currency: Currency | undefined
): {
  currencies: { [field in Field]?: Currency }
  pool?: Pool | null
  pairState: PairState
  currencyBalances: { [field in Field]?: CurrencyAmount }
  parsedAmounts: { [field in Field]?: CurrencyAmount }
  noLiquidity?: boolean
  liquidityMinted?: TokenAmount
  poolTokenPercentage?: Percent
  error?: string
} {
  const { account, chainId } = useActiveWeb3React()

  const { independentField, typedValue } = useMintState()

  // tokens
  const currencies: { [field in Field]?: Currency } = useMemo(
    () => ({
      [Field.CURRENCY]: currency ?? undefined
    }),
    [currency]
  )

  // pool
  const [pairState, pool] = usePool(currencies[Field.CURRENCY])
  const totalSupply = useTotalSupply(pool?.liquidityToken)

  const noLiquidity: boolean =
    pairState === PairState.NOT_EXISTS || Boolean(totalSupply && JSBI.equal(totalSupply.raw, ZERO))

  // balances
  const balances = useCurrencyBalances(account ?? undefined, [currencies[Field.CURRENCY]])
  const currencyBalances: { [field in Field]?: CurrencyAmount } = {
    [Field.CURRENCY]: balances[0]
  }

  // amounts
  const independentAmount: CurrencyAmount | undefined = tryParseAmount(typedValue, currencies[independentField])
  const parsedAmounts: { [field in Field]: CurrencyAmount | undefined } = {
    [Field.CURRENCY]: independentAmount
  }

  // liquidity minted
  const liquidityMinted = useMemo(() => {
    const { [Field.CURRENCY]: currencyAmount } = parsedAmounts
    const tokenAmount = wrappedCurrencyAmount(currencyAmount, chainId)
    if (pool && totalSupply && tokenAmount) {
      return pool.getLiquidityMinted(totalSupply, tokenAmount)
    } else {
      return undefined
    }
  }, [parsedAmounts, chainId, pool, totalSupply])

  const poolTokenPercentage = useMemo(() => {
    if (liquidityMinted && totalSupply) {
      return new Percent(liquidityMinted.raw, totalSupply.add(liquidityMinted).raw)
    } else {
      return undefined
    }
  }, [liquidityMinted, totalSupply])

  let error: string | undefined
  if (!account) {
    error = 'Connect Wallet'
  }

  if (pairState === PairState.INVALID) {
    error = error ?? 'Invalid pair'
  }

  if (!parsedAmounts[Field.CURRENCY]) {
    error = error ?? 'Enter an amount'
  }

  const { [Field.CURRENCY]: currencyAmount } = parsedAmounts

  if (currencyAmount && currencyBalances?.[Field.CURRENCY]?.lessThan(currencyAmount)) {
    error = 'Insufficient ' + currencies[Field.CURRENCY]?.symbol + ' balance'
  }

  return {
    currencies,
    pool: pool,
    pairState,
    currencyBalances,
    parsedAmounts,
    noLiquidity,
    liquidityMinted,
    poolTokenPercentage,
    error
  }
}
