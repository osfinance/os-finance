import { TokenAmount, Pair, Currency } from '@uniswap/sdk'
import { Pool } from './Pool'
import { useMemo } from 'react'
import { abi as IUniswapV2PairABI } from '@uniswap/v2-core/build/IUniswapV2Pair.json'
import { abi as IFlashLoanV1PoolABI } from '../constants/flashLoan/IFlashLoanV1Pool.json'
import { Interface } from '@ethersproject/abi'
import { useActiveWeb3React } from '../hooks'

import { useMultipleContractSingleData } from '../state/multicall/hooks'
import { wrappedCurrency } from '../utils/wrappedCurrency'

const PAIR_INTERFACE = new Interface(IUniswapV2PairABI)
const POOL_INTERFACE = new Interface(IFlashLoanV1PoolABI)

export enum PairState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID
}

export function usePairs(currencies: [Currency | undefined, Currency | undefined][]): [PairState, Pair | null][] {
  const { chainId } = useActiveWeb3React()

  const tokens = useMemo(
    () =>
      currencies.map(([currencyA, currencyB]) => [
        wrappedCurrency(currencyA, chainId),
        wrappedCurrency(currencyB, chainId)
      ]),
    [chainId, currencies]
  )

  const pairAddresses = useMemo(
    () =>
      tokens.map(([tokenA, tokenB]) => {
        return tokenA && tokenB && !tokenA.equals(tokenB) ? Pair.getAddress(tokenA, tokenB) : undefined
      }),
    [tokens]
  )

  const results = useMultipleContractSingleData(pairAddresses, PAIR_INTERFACE, 'getReserves')

  return useMemo(() => {
    return results.map((result, i) => {
      const { result: reserves, loading } = result
      const tokenA = tokens[i][0]
      const tokenB = tokens[i][1]

      if (loading) return [PairState.LOADING, null]
      if (!tokenA || !tokenB || tokenA.equals(tokenB)) return [PairState.INVALID, null]
      if (!reserves) return [PairState.NOT_EXISTS, null]
      const { reserve0, reserve1 } = reserves
      const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
      return [
        PairState.EXISTS,
        new Pair(new TokenAmount(token0, reserve0.toString()), new TokenAmount(token1, reserve1.toString()))
      ]
    })
  }, [results, tokens])
}

export function usePair(tokenA?: Currency, tokenB?: Currency): [PairState, Pair | null] {
  return usePairs([[tokenA, tokenB]])[0]
}

export function usePools(currencies: (Currency | undefined)[]): [PairState, Pool | null][] {
  const { chainId } = useActiveWeb3React()

  const tokens = useMemo(
    () =>
      currencies.map((currency) => wrappedCurrency(currency, chainId)),
    [chainId, currencies]
  )

  const poolAddresses = useMemo(
    () =>
      tokens.map((token) => {
        return token ? Pool.getAddress(token) : undefined
      }),
    [tokens]
  )

  const results = useMultipleContractSingleData(poolAddresses, POOL_INTERFACE, 'reserve')

  return useMemo(() => {
    return results.map((result, i) => {
      const { result: reserve, loading } = result
      const token = tokens[i]

      if (loading) return [PairState.LOADING, null]
      if (!token) return [PairState.INVALID, null]
      if (!reserve) return [PairState.NOT_EXISTS, null]
      return [
        PairState.EXISTS,
        new Pool(new TokenAmount(token, reserve.toString()))
      ]
    })
  }, [results, tokens])
}

export function usePool(token?: Currency): [PairState, Pool | null] {
  return usePools([token])[0]
}
