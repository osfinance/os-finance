import { UNI } from './../../constants/index'
import { Currency, CurrencyAmount, ETHER, JSBI, Token, TokenAmount } from '@uniswap/sdk'
import { useMemo } from 'react'
import ERC20_INTERFACE from '../../constants/abis/erc20'
import { useAllCTokens, useAllTokens } from '../../hooks/Tokens'
import { useActiveWeb3React } from '../../hooks'
import { useMulticallContract } from '../../hooks/useContract'
import { isAddress } from '../../utils'
import { useSingleContractMultipleData, useMultipleContractSingleData } from '../multicall/hooks'
import { useUserUnclaimedAmount } from '../claim/hooks'
import { useTotalUniEarned } from '../stake/hooks'
import { CToken } from '../../data/CToken'
import { usePathName } from 'state/lists/hooks'

/**
 * Returns a map of the given addresses to their eventually consistent ETH balances.
 */
export function useETHBalances(
  uncheckedAddresses?: (string | undefined)[]
): { [address: string]: CurrencyAmount | undefined } {
  const multicallContract = useMulticallContract()

  const addresses: string[] = useMemo(
    () =>
      uncheckedAddresses
        ? uncheckedAddresses
            .map(isAddress)
            .filter((a): a is string => a !== false)
            .sort()
        : [],
    [uncheckedAddresses]
  )

  const results = useSingleContractMultipleData(
    multicallContract,
    'getEthBalance',
    addresses.map(address => [address])
  )

  return useMemo(
    () =>
      addresses.reduce<{ [address: string]: CurrencyAmount }>((memo, address, i) => {
        const value = results?.[i]?.result?.[0]
        if (value) memo[address] = CurrencyAmount.ether(JSBI.BigInt(value.toString()))
        return memo
      }, {}),
    [addresses, results]
  )
}

/**
 * Returns a map of token addresses to their eventually consistent token balances for a single account.
 */
export function useTokenBalancesWithLoadingIndicator(
  address?: string,
  tokens?: (Token | undefined)[]
): [{ [tokenAddress: string]: TokenAmount | undefined }, boolean] {
  const validatedTokens: Token[] = useMemo(
    () => tokens?.filter((t?: Token): t is Token => isAddress(t?.address) !== false) ?? [],
    [tokens]
  )

  const validatedTokenAddresses = useMemo(() => validatedTokens.map(vt => vt.address), [validatedTokens])

  const balances = useMultipleContractSingleData(validatedTokenAddresses, ERC20_INTERFACE, 'balanceOf', [address])

  const anyLoading: boolean = useMemo(() => balances.some(callState => callState.loading), [balances])

  return [
    useMemo(
      () =>
        address && validatedTokens.length > 0
          ? validatedTokens.reduce<{ [tokenAddress: string]: TokenAmount | undefined }>((memo, token, i) => {
              const value = balances?.[i]?.result?.[0]
              const amount = value ? JSBI.BigInt(value.toString()) : undefined
              if (amount) {
                memo[token.address] = new TokenAmount(token, amount)
              }
              return memo
            }, {})
          : {},
      [address, validatedTokens, balances]
    ),
    anyLoading
  ]
}

export function useCTokenBalancesWithLoadingIndicator(
  address?: string,
  tokens?: (CToken | undefined)[]
): [{ [tokenAddress: string]: TokenAmount | undefined }, boolean] {
  const multicallContract = useMulticallContract()

  const uncheckedAddresses = address ? [address] : []

  const accounts: string[] = useMemo(
    () =>
      uncheckedAddresses
        ? uncheckedAddresses
            .map(isAddress)
            .filter((a): a is string => a !== false)
            .sort()
        : [],
    [uncheckedAddresses]
  )

  const validatedTokens: CToken[] = useMemo(
    () => tokens?.filter((t?: CToken): t is CToken => isAddress(t?.address) !== false) ?? [],
    [tokens]
  )

  const validatedTokenAddresses = useMemo(() => validatedTokens.map(vt => vt.address), [validatedTokens])

  const ethBalance = useSingleContractMultipleData(
    multicallContract,
    'getEthBalance',
    accounts.map(account => [account])
  )

  const balances = useMultipleContractSingleData(validatedTokenAddresses, ERC20_INTERFACE, 'balanceOf', [address])

  const anyLoading: boolean = useMemo(
    () => ethBalance.some(callState => callState.loading) && balances.some(callState => callState.loading),
    [balances, ethBalance]
  )

  return [
    useMemo(
      () =>
        address && validatedTokens.length > 0
          ? validatedTokens.reduce<{ [tokenAddress: string]: TokenAmount | undefined }>((memo, token, i) => {
              const value = token.isETH() ? ethBalance?.[0]?.result?.[0] : balances?.[i]?.result?.[0]
              const amount = value ? JSBI.BigInt(value.toString()) : undefined
              if (amount) {
                memo[token.address] = new TokenAmount(token, amount)
              }
              return memo
            }, {})
          : {},
      [address, validatedTokens, ethBalance, balances]
    ),
    anyLoading
  ]
}

export function useTokenBalances(
  address?: string,
  tokens?: (Token | undefined)[]
): { [tokenAddress: string]: TokenAmount | undefined } {
  return useTokenBalancesWithLoadingIndicator(address, tokens)[0]
}

export function useCTokenBalances(
  address?: string,
  tokens?: (CToken | undefined)[]
): { [tokenAddress: string]: TokenAmount | undefined } {
  return useCTokenBalancesWithLoadingIndicator(address, tokens)[0]
}

// get the balance for a single token/account combo
export function useTokenBalance(account?: string, token?: Token): TokenAmount | undefined {
  const tokenBalances = useTokenBalances(account, [token])
  if (!token) return undefined
  return tokenBalances[token.address]
}

export function useCurrencyBalances(
  account?: string,
  currencies?: (Currency | undefined)[]
): (CurrencyAmount | undefined)[] {
  const tokens = useMemo(() => currencies?.filter((currency): currency is Token => currency instanceof Token) ?? [], [
    currencies
  ])

  const tokenBalances = useTokenBalances(account, tokens)
  const containsETH: boolean = useMemo(() => currencies?.some(currency => currency === ETHER) ?? false, [currencies])
  const ethBalance = useETHBalances(containsETH ? [account] : [])

  return useMemo(
    () =>
      currencies?.map(currency => {
        if (!account || !currency) return undefined
        if (currency instanceof Token) return tokenBalances[currency.address]
        if (currency === ETHER) return ethBalance[account]
        return undefined
      }) ?? [],
    [account, currencies, ethBalance, tokenBalances]
  )
}

export function useCurrencyBalance(account?: string, currency?: Currency): CurrencyAmount | undefined {
  return useCurrencyBalances(account, [currency])[0]
}

// mimics useAllBalances
export function useAllTokenBalances(): { [tokenAddress: string]: TokenAmount | undefined } {
  const { account } = useActiveWeb3React()
  const pathName = usePathName()
  const allTokens = useAllTokens(pathName)
  const allTokensArray = useMemo(() => Object.values(allTokens ?? {}), [allTokens])
  const balances = useTokenBalances(account ?? undefined, allTokensArray)
  return balances ?? {}
}

export function useAllCTokenBalances(cTokens?: (CToken | undefined)[]): (CurrencyAmount | undefined)[] {
  const { account } = useActiveWeb3React()

  const notETHctokens = useMemo(() => cTokens?.filter((ctoken): ctoken is CToken => !ctoken?.isETH() ?? false) ?? [], [
    cTokens
  ])

  const tokenBalances = useTokenBalances(account ?? undefined, notETHctokens)
  const containsETH: boolean = useMemo(() => cTokens?.some(item => item?.isETH()) ?? false, [cTokens])
  const ethBalance = useETHBalances(containsETH ? [account ?? undefined] : [])

  return useMemo(
    () =>
      cTokens?.map(cToken => {
        if (!account || !cToken) return undefined
        if (cToken.isETH()) return ethBalance[account]
        if (cToken instanceof CToken) return tokenBalances[cToken.address]
        return undefined
      }) ?? [],
    [account, cTokens, ethBalance, tokenBalances]
  )
}

export function useCTokenBalance(ctoken?: CToken): CurrencyAmount | undefined {
  return useAllCTokenBalances([ctoken])[0]
}

// get the total owned, unclaimed, and unharvested UNI for account
export function useAggregateUniBalance(): TokenAmount | undefined {
  const { account, chainId } = useActiveWeb3React()

  const uni = chainId ? UNI[chainId] : undefined

  const uniBalance: TokenAmount | undefined = useTokenBalance(account ?? undefined, uni)
  const uniUnclaimed: TokenAmount | undefined = useUserUnclaimedAmount(account)
  const uniUnHarvested: TokenAmount | undefined = useTotalUniEarned()

  if (!uni) return undefined

  return new TokenAmount(
    uni,
    JSBI.add(
      JSBI.add(uniBalance?.raw ?? JSBI.BigInt(0), uniUnclaimed?.raw ?? JSBI.BigInt(0)),
      uniUnHarvested?.raw ?? JSBI.BigInt(0)
    )
  )
}
