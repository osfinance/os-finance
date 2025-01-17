import { ChainId, JSBI, Token } from '@uniswap/sdk'
import { useMemo } from 'react'
import { useActiveWeb3React } from '../hooks'
import { useMultipleContractSingleData, useSingleContractMultipleData } from '../state/multicall/hooks'
import { abi as ICTokenABI } from '../constants/abis/ctoken.json'
import { Interface } from '@ethersproject/abi'
import { useComptrollerContract, useOracleContract } from '../hooks/useContract'
import { CTOKEN_LISTS } from '../constants/lend'
import { EXA_BASE } from '../utils'
import { BigNumber } from 'ethers'

const CTOKEN_INTERFACE = new Interface(ICTokenABI)

export enum CTokenState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID
}

export const ETH_MANTISSA = 1e18
export const BLOCKS_PER_DAY = 5760 // 4 * 60 * 24
export const DAYS_PER_YEAR = 365

export const ONE = JSBI.BigInt(1)
export const EIGHT = JSBI.BigInt(8)
export const EXCHANGE_RATE_MANTISSA = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18))
export const COLLATERAL_FACTOR_MANTISSA = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18))
export const UNDERLYING_PRICE_BASE = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18))
export const LIQUIDITY = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18))
export const ZERO_POINT_EIGHT = JSBI.multiply(EIGHT, JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(17)))
export const APY_BASE_NUMBER = Math.pow(10, 38)

export class CToken extends Token {
  public readonly cAddress: string
  public readonly cDecimals: number
  public readonly cSymbol?: string
  public readonly cName?: string
  public readonly supplyRatePerBlock?: number | BigNumber
  public readonly borrowRatePerBlock?: number | BigNumber
  public readonly balanceUnderlying?: number | BigNumber
  public readonly supplyBalance?: number | BigNumber
  public readonly borrowBalance?: number | BigNumber
  public readonly exchangeRateMantissa?: number | BigNumber
  public readonly totalSupply?: number | BigNumber
  public readonly liquidity?: number | BigNumber
  public readonly canBeCollateral?: boolean
  public readonly underlyingPrice?: number | BigNumber
  public readonly isListed?: boolean
  public readonly collateralFactorMantissa?: number | BigNumber
  public readonly logo0?: string
  public readonly logo1?: string

  constructor(
    chainId: ChainId,
    cAddress: string,
    address: string,
    decimals: number,
    cSymbol?: string,
    cName?: string,
    symbol?: string,
    name?: string,
    supplyRatePerBlock?: number | BigNumber,
    borrowRatePerBlock?: number | BigNumber,
    balanceUnderlying?: number | BigNumber,
    supplyBalance?: number | BigNumber,
    borrowBalance?: number | BigNumber,
    exchangeRateMantissa?: number | BigNumber,
    totalSupply?: number | BigNumber,
    liquidity?: number | BigNumber,
    canBeCollateral?: boolean,
    underlyingPrice?: number | BigNumber,
    isListed?: boolean,
    collateralFactorMantissa?: number | BigNumber,
    logo0?: string,
    logo1?: string
  ) {
    super(chainId, address, decimals, symbol, name)

    this.cAddress = cAddress
    this.cDecimals = 8
    this.cSymbol = cSymbol
    this.cName = cName
    this.supplyRatePerBlock = supplyRatePerBlock
    this.borrowRatePerBlock = borrowRatePerBlock
    this.balanceUnderlying = balanceUnderlying
    this.supplyBalance = supplyBalance
    this.borrowBalance = borrowBalance
    this.exchangeRateMantissa = exchangeRateMantissa
    this.totalSupply = totalSupply
    this.liquidity = liquidity
    this.canBeCollateral = canBeCollateral
    this.underlyingPrice = underlyingPrice
    this.isListed = isListed
    this.collateralFactorMantissa = collateralFactorMantissa
    this.logo0 = logo0
    this.logo1 = logo1
  }

  public equals(other: CToken): boolean {
    if (this === other) {
      return true
    }
    return this.chainId === other.chainId && this.cAddress === other.cAddress
  }

  public isETH(): boolean {
    return this.chainId && this.symbol === 'ETH'
  }

  public getBorrowBalanceAmount() {
    return JSBI.BigInt(this.borrowBalance ?? 0)
  }

  public getSupplyApy(): JSBI {
    const totalRate = Math.floor(
      Math.pow((((this.supplyRatePerBlock as number) ?? 0) / ETH_MANTISSA) * BLOCKS_PER_DAY + 1, DAYS_PER_YEAR - 1) *
        ETH_MANTISSA
    )

    return JSBI.subtract(JSBI.BigInt(totalRate), EXA_BASE)
  }

  public getBorrowApy(): JSBI {
    const totalRate = Math.floor(
      Math.pow((((this.borrowRatePerBlock as number) ?? 0) / ETH_MANTISSA) * BLOCKS_PER_DAY + 1, DAYS_PER_YEAR - 1) *
        ETH_MANTISSA
    )

    return JSBI.subtract(JSBI.BigInt(totalRate), EXA_BASE)
  }

  public getSupplyBalanceAmount(): JSBI {
    return JSBI.divide(
      JSBI.multiply(JSBI.BigInt(this.supplyBalance ?? 0), JSBI.BigInt(this.exchangeRateMantissa ?? 0)),
      EXA_BASE
    )
  }

  public getSupplyBalanceJSBI(): JSBI {
    return JSBI.divide(
      JSBI.multiply(this.getSupplyBalanceAmount(), JSBI.BigInt(this.underlyingPrice ?? 0)),
      UNDERLYING_PRICE_BASE
    )
  }

  public getTotalSupplyBalanceAmount(): JSBI {
    return JSBI.divide(
      JSBI.multiply(JSBI.BigInt(this.totalSupply ?? 0), JSBI.BigInt(this.exchangeRateMantissa ?? 0)),
      EXA_BASE
    )
  }

  public getMarketSize(): JSBI {
    return JSBI.divide(
      JSBI.multiply(this.getTotalSupplyBalanceAmount(), JSBI.BigInt(this.underlyingPrice ?? 0)),
      UNDERLYING_PRICE_BASE
    )
  }

  public getSuppliedValue(): JSBI {
    return JSBI.divide(
      JSBI.multiply(this.getSupplyBalanceJSBI(), JSBI.BigInt(this.collateralFactorMantissa ?? 0)),
      COLLATERAL_FACTOR_MANTISSA
    )
  }

  public getBorrowBalanceJSBI(): JSBI {
    return JSBI.divide(
      JSBI.multiply(JSBI.BigInt(this.borrowBalance ?? 0), JSBI.BigInt(this.underlyingPrice ?? 0)),
      UNDERLYING_PRICE_BASE
    )
  }

  public getLiquidity(): JSBI {
    return JSBI.BigInt(this.liquidity ?? 0)
  }

  public getLiquidityValue(): JSBI {
    return JSBI.divide(
      JSBI.multiply(JSBI.BigInt(this.liquidity ?? 0), JSBI.BigInt(this.underlyingPrice ?? 0)),
      EXA_BASE
    )
  }

  public getUnderlyingPrice(): JSBI {
    return JSBI.BigInt(this.underlyingPrice ?? 0)
  }

  public getCollateralFactorMantissa(): JSBI {
    return JSBI.BigInt(this.collateralFactorMantissa ?? 0)
  }
}

export function useCTokens(): [CTokenState, CToken | null][] {
  const { chainId, account } = useActiveWeb3React()

  const cTokenList = CTOKEN_LISTS[chainId ?? ChainId.MAINNET]

  const accountArg = useMemo(() => [account ?? undefined], [account])

  const accountSnapshotaccountArg = useMemo(() => [account ?? '0x0000000000000000000000000000000000000000'], [account])

  const cTokenAddresses = useMemo(
    () =>
      cTokenList.map(cTokenInfo => {
        return cTokenInfo[0]
      }),
    [cTokenList]
  )

  const hasAccountMembershipArgs = useMemo(
    () =>
      cTokenAddresses.map(cTokenAddress => {
        return [account ?? undefined, cTokenAddress]
      }),
    [cTokenAddresses, account]
  )

  const membershipArgs = useMemo(() => (account ? hasAccountMembershipArgs : []), [account, hasAccountMembershipArgs])
  const comptroller = useComptrollerContract()
  const oracle = useOracleContract()

  const supplyRatePerBlockResults = useMultipleContractSingleData(
    cTokenAddresses,
    CTOKEN_INTERFACE,
    'supplyRatePerBlock'
  )
  const borrowRatePerBlockResults = useMultipleContractSingleData(
    cTokenAddresses,
    CTOKEN_INTERFACE,
    'borrowRatePerBlock'
  )
  const balanceOfUnderlyingResults = useMultipleContractSingleData(
    cTokenAddresses,
    CTOKEN_INTERFACE,
    'balanceOfUnderlying',
    accountArg
  )
  const borrowBalanceCurrentResults = useMultipleContractSingleData(
    cTokenAddresses,
    CTOKEN_INTERFACE,
    'borrowBalanceCurrent',
    accountArg
  )
  const accountSnapshotResults = useMultipleContractSingleData(
    cTokenAddresses,
    CTOKEN_INTERFACE,
    'getAccountSnapshot',
    accountSnapshotaccountArg
  )
  const totalSupplyResults = useMultipleContractSingleData(cTokenAddresses, CTOKEN_INTERFACE, 'totalSupply')
  const cashResults = useMultipleContractSingleData(cTokenAddresses, CTOKEN_INTERFACE, 'getCash')
  const membershipResults = useSingleContractMultipleData(comptroller, 'checkMembership', membershipArgs)
  const underlyingPriceResults = useSingleContractMultipleData(
    oracle,
    'getUnderlyingPrice',
    cTokenAddresses.map(cTokenAddress => [cTokenAddress])
  )
  const marketsResults = useSingleContractMultipleData(
    comptroller,
    'markets',
    cTokenAddresses.map(cTokenAddress => [cTokenAddress])
  )

  return useMemo(() => {
    return supplyRatePerBlockResults.map((supplyRatePerBlockResult, i) => {
      const { result: supplyRatePerBlockValue, loading: supplyRatePerBlockResultLoading } = supplyRatePerBlockResult
      const { result: borrowRatePerBlockValue, loading: borrowRatePerBlockResultLoading } = borrowRatePerBlockResults[i]
      const { result: balanceUnderlyingValue, loading: balanceUnderlyingResultLoading } =
        balanceOfUnderlyingResults.length !== 0 ? balanceOfUnderlyingResults[i] : { result: [0], loading: false }
      const { result: borrowBalanceValue, loading: borrowBalanceResultLoading } =
        borrowBalanceCurrentResults.length !== 0 ? borrowBalanceCurrentResults[i] : { result: [0], loading: false }
      const { result: accountSnapshotValue, loading: accountSnapshotResultLoading } =
        accountSnapshotResults.length !== 0 ? accountSnapshotResults[i] : { result: [0, 0, 0, 0], loading: false }
      const { result: totalSupplyValue, loading: totalSupplyResultLoading } = totalSupplyResults[i]
      const { result: cashValue, loading: cashResultLoading } = cashResults[i]
      const { result: membershipValue, loading: membershipLoading } =
        membershipResults.length !== 0 ? membershipResults[i] : { result: [0], loading: false }
      const { result: underlyingPriceValue, loading: underlyingPriceLoading } = underlyingPriceResults[i]
      const { result: marketsValue, loading: marketsResultLoading } =
        marketsResults.length !== 0 ? marketsResults[i] : { result: [0, 0, 0], loading: false }

      if (supplyRatePerBlockResultLoading) return [CTokenState.LOADING, null]
      if (borrowRatePerBlockResultLoading) return [CTokenState.LOADING, null]
      if (balanceUnderlyingResultLoading) return [CTokenState.LOADING, null]
      if (borrowBalanceResultLoading) return [CTokenState.LOADING, null]
      if (accountSnapshotResultLoading) return [CTokenState.LOADING, null]
      if (cashResultLoading) return [CTokenState.LOADING, null]
      if (totalSupplyResultLoading) return [CTokenState.LOADING, null]
      if (membershipLoading) return [CTokenState.LOADING, null]
      if (underlyingPriceLoading) return [CTokenState.LOADING, null]
      if (marketsResultLoading) return [CTokenState.LOADING, null]

      if (!supplyRatePerBlockValue) return [CTokenState.NOT_EXISTS, null]
      if (!borrowRatePerBlockValue) return [CTokenState.NOT_EXISTS, null]
      if (!balanceUnderlyingValue) return [CTokenState.NOT_EXISTS, null]
      if (!borrowBalanceValue) return [CTokenState.NOT_EXISTS, null]
      if (!accountSnapshotValue) return [CTokenState.NOT_EXISTS, null]
      if (!totalSupplyValue) return [CTokenState.NOT_EXISTS, null]
      if (!cashValue) return [CTokenState.NOT_EXISTS, null]
      if (!membershipValue) return [CTokenState.NOT_EXISTS, null]
      if (!underlyingPriceValue) return [CTokenState.NOT_EXISTS, null]
      if (!marketsValue) return [CTokenState.NOT_EXISTS, null]

      return [
        CTokenState.EXISTS,
        new CToken(
          chainId ?? ChainId.MAINNET,
          cTokenList[i][0],
          cTokenList[i][1],
          cTokenList[i][2],
          cTokenList[i][3],
          cTokenList[i][4],
          cTokenList[i][5],
          cTokenList[i][6],
          supplyRatePerBlockValue[0],
          borrowRatePerBlockValue[0],
          balanceUnderlyingValue[0],
          accountSnapshotValue[1],
          borrowBalanceValue[0],
          accountSnapshotValue[3],
          totalSupplyValue[0],
          cashValue[0],
          membershipValue[0],
          underlyingPriceValue[0],
          marketsValue[0],
          marketsValue[1],
          cTokenList[i][7],
          cTokenList[i][8]
        )
      ]
    })
  }, [
    supplyRatePerBlockResults,
    borrowRatePerBlockResults,
    balanceOfUnderlyingResults,
    borrowBalanceCurrentResults,
    accountSnapshotResults,
    totalSupplyResults,
    cashResults,
    membershipResults,
    underlyingPriceResults,
    marketsResults,
    chainId,
    cTokenList
  ])
}
