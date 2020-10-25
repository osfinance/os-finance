import { Contract } from '@ethersproject/contracts'
import { getAddress } from '@ethersproject/address'
import { AddressZero } from '@ethersproject/constants'
import { JsonRpcSigner, Web3Provider } from '@ethersproject/providers'
import { BigNumber } from '@ethersproject/bignumber'
import { abi as IUniswapV2Router02ABI } from '@uniswap/v2-periphery/build/IUniswapV2Router02.json'
import { abi as ICERC20ABI } from '../constants/lend/c_erc20_interface.json'
import { abi as ICEtherABI } from '../constants/lend/c_ether.json'
import { ROUTER_ADDRESS } from '../constants'
import { ChainId, JSBI, Percent, Token, CurrencyAmount, Currency, ETHER, Fraction } from '@uniswap/sdk'
import { TokenAddressMap } from '../state/lists/hooks'
import { COMPTROLLER_ABI, COMPTROLLER_ADDRESSES } from '../constants/lend'
import { CToken } from '../data/CToken'

// returns the checksummed address if the address is valid, otherwise returns false
export function isAddress(value: any): string | false {
  try {
    return getAddress(value)
  } catch {
    return false
  }
}

const ETHERSCAN_PREFIXES: { [chainId in ChainId]: string } = {
  1: '',
  3: 'ropsten.',
  4: 'rinkeby.',
  5: 'goerli.',
  42: 'kovan.'
}

export function getEtherscanLink(
  chainId: ChainId,
  data: string,
  type: 'transaction' | 'token' | 'address' | 'block'
): string {
  const prefix = `https://${ETHERSCAN_PREFIXES[chainId] || ETHERSCAN_PREFIXES[1]}etherscan.io`

  switch (type) {
    case 'transaction': {
      return `${prefix}/tx/${data}`
    }
    case 'token': {
      return `${prefix}/token/${data}`
    }
    case 'block': {
      return `${prefix}/block/${data}`
    }
    case 'address':
    default: {
      return `${prefix}/address/${data}`
    }
  }
}

// shorten the checksummed version of the input address to have 0x + 4 characters at start and end
export function shortenAddress(address: string, chars = 4): string {
  const parsed = isAddress(address)
  if (!parsed) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }
  return `${parsed.substring(0, chars + 2)}...${parsed.substring(42 - chars)}`
}

// add 10%
export function calculateGasMargin(value: BigNumber): BigNumber {
  return value.mul(BigNumber.from(10000).add(BigNumber.from(1000))).div(BigNumber.from(10000))
}

// converts a basis points value to a sdk percent
export function basisPointsToPercent(num: number): Percent {
  return new Percent(JSBI.BigInt(num), JSBI.BigInt(10000))
}

export function calculateSlippageAmount(value: CurrencyAmount, slippage: number): [JSBI, JSBI] {
  if (slippage < 0 || slippage > 10000) {
    throw Error(`Unexpected slippage value: ${slippage}`)
  }
  return [
    JSBI.divide(JSBI.multiply(value.raw, JSBI.BigInt(10000 - slippage)), JSBI.BigInt(10000)),
    JSBI.divide(JSBI.multiply(value.raw, JSBI.BigInt(10000 + slippage)), JSBI.BigInt(10000))
  ]
}

// account is not optional
export function getSigner(library: Web3Provider, account: string): JsonRpcSigner {
  return library.getSigner(account).connectUnchecked()
}

// account is optional
export function getProviderOrSigner(library: Web3Provider, account?: string): Web3Provider | JsonRpcSigner {
  return account ? getSigner(library, account) : library
}

// account is optional
export function getContract(address: string, ABI: any, library: Web3Provider, account?: string): Contract {
  if (!isAddress(address) || address === AddressZero) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }

  return new Contract(address, ABI, getProviderOrSigner(library, account) as any)
}

// account is optional
export function getRouterContract(_: number, library: Web3Provider, account?: string): Contract {
  return getContract(ROUTER_ADDRESS, IUniswapV2Router02ABI, library, account)
}

export function getCERC20Contract(_: number, cTokenAddress: string, library: Web3Provider, account?: string): Contract {
  return getContract(cTokenAddress, ICERC20ABI, library, account)
}

export function getCEtherContract(_: number, cTokenAddress: string, library: Web3Provider, account?: string): Contract {
  return getContract(cTokenAddress, ICEtherABI, library, account)
}

export function getComptrollerContract(chainId: number, library: Web3Provider, account?: string): Contract {
  return getContract(COMPTROLLER_ADDRESSES[chainId as ChainId], COMPTROLLER_ABI, library, account)
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

export function isTokenOnList(defaultTokens: TokenAddressMap, currency?: Currency): boolean {
  if (currency === ETHER) return true
  return Boolean(currency instanceof Token && defaultTokens[currency.chainId]?.[currency.address])
}

export const ETH_MANTISSA = 1e18
export const BLOCKS_PER_DAY = 4 * 60 * 24
export const DAYS_PER_YEAR = 365

export const ONE = JSBI.BigInt(1)
export const EXA_BASE = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18))
export const EXCHANGE_RATE_MANTISSA = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18))
export const COLLATERAL_FACTOR_MANTISSA = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18))
export const LIQUIDITY = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18))

export function balanceFormat(digits: number): JSBI {
  return JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(digits))
}

export function underlyingPriceFormat(digits: number): JSBI {
  return JSBI.exponentiate(
    JSBI.BigInt(10),
    JSBI.add(JSBI.subtract(JSBI.BigInt(18), JSBI.BigInt(digits)), JSBI.BigInt(18))
  )
}

export function getSupplyTotalBalance(allMarketsAsset: CToken[]) {
  let supplyTotalBalance = 0
  for (let i = 0; i < allMarketsAsset.length; i++) {
    supplyTotalBalance += parseFloat(
      allMarketsAsset[i]?.exchangeRateMantissa &&
        allMarketsAsset[i]?.supplyBalance &&
        allMarketsAsset[i]?.decimals &&
        allMarketsAsset[i]?.underlyingPrice
        ? new Fraction(
            JSBI.multiply(
              JSBI.multiply(
                JSBI.BigInt(allMarketsAsset[i].supplyBalance ?? 0),
                JSBI.BigInt(allMarketsAsset[i].exchangeRateMantissa ?? 0)
              ),
              JSBI.BigInt(allMarketsAsset[i]?.underlyingPrice ?? 0)
            ),
            JSBI.multiply(
              JSBI.multiply(balanceFormat(allMarketsAsset[i]?.decimals), EXCHANGE_RATE_MANTISSA),
              underlyingPriceFormat(allMarketsAsset[i]?.decimals)
            )
          ).toSignificant(18)
        : JSBI.BigInt('0').toString()
    )
  }
  return supplyTotalBalance
}

// export function getSupplyTotalBalance(allMarketsAsset: CToken[]) {
//   let supplyTotalBalance = JSBI.BigInt(0)
//   for (let i = 0; i < allMarketsAsset.length; i++) {
//     supplyTotalBalance = JSBI.add(
//       supplyTotalBalance,
//       JSBI.divide(
//         JSBI.multiply(JSBI.BigInt(allMarketsAsset[i].getSuppliedValue1()), EXA_BASE),
//         balanceFormat(allMarketsAsset[i].decimals)
//       )
//     )
//   }
//   return new Fraction(supplyTotalBalance, EXA_BASE)
// }

// public getSuppliedValue() {
//   return parseFloat(
//     this.exchangeRateMantissa &&
//       this.supplyBalance &&
//       this.decimals &&
//       this.underlyingPrice &&
//       this.collateralFactorMantissa
//       ? new Fraction(
//           JSBI.multiply(
//             JSBI.multiply(JSBI.BigInt(this.supplyBalance ?? 0), JSBI.BigInt(this.exchangeRateMantissa ?? 0)),
//             JSBI.multiply(JSBI.BigInt(this.underlyingPrice ?? 0), JSBI.BigInt(this.collateralFactorMantissa ?? 0))
//           ),
//           JSBI.multiply(
//             JSBI.multiply(balanceFormat(this.decimals), EXCHANGE_RATE_MANTISSA),
//             JSBI.multiply(underlyingPriceFormat(this.decimals), COLLATERAL_FACTOR_MANTISSA)
//           )
//         ).toSignificant(18)
//       : JSBI.BigInt('0').toString()
//   )
// }

export function getBorrowTotalBalance(allMarketsAsset: CToken[]) {
  let borrowTotalBalance = 0
  for (let i = 0; i < allMarketsAsset.length; i++) {
    borrowTotalBalance += parseFloat(
      allMarketsAsset[i]?.borrowBalance && allMarketsAsset[i]?.decimals && allMarketsAsset[i]?.underlyingPrice
        ? new Fraction(
            JSBI.multiply(
              JSBI.BigInt(allMarketsAsset[i].borrowBalance ?? 0),
              JSBI.BigInt(allMarketsAsset[i]?.underlyingPrice ?? 0)
            ),
            JSBI.multiply(
              balanceFormat(allMarketsAsset[i]?.decimals),
              underlyingPriceFormat(allMarketsAsset[i]?.decimals)
            )
          ).toSignificant(18)
        : JSBI.BigInt('0').toString()
    )
  }
  return borrowTotalBalance
}

// export function getBorrowTotalBalance(allMarketsAsset: CToken[]) {
//   let borrowTotalBalance = JSBI.BigInt(0)
//   for (let i = 0; i < allMarketsAsset.length; i++) {
//     borrowTotalBalance = JSBI.add(
//       borrowTotalBalance,
//       JSBI.multiply(
//         JSBI.divide(
//           JSBI.multiply(JSBI.BigInt(allMarketsAsset[i].borrowBalance ?? 0), EXA_BASE),
//           balanceFormat(allMarketsAsset[i]?.decimals)
//         ),
//         JSBI.divide(
//           JSBI.multiply(JSBI.BigInt(allMarketsAsset[i]?.underlyingPrice ?? 0), EXA_BASE),
//           underlyingPriceFormat(allMarketsAsset[i]?.decimals)
//         )
//       )
//     )
//   }

//   return new Fraction(borrowTotalBalance, EXA_BASE)
// }

export function getLimit(allMarketsAsset: CToken[]) {
  let borrowLimit = 0
  for (let i = 0; i < allMarketsAsset.length; i++) {
    borrowLimit +=
      allMarketsAsset[i]?.exchangeRateMantissa &&
      allMarketsAsset[i]?.supplyBalance &&
      allMarketsAsset[i]?.decimals &&
      allMarketsAsset[i]?.underlyingPrice &&
      allMarketsAsset[1]?.collateralFactorMantissa &&
      allMarketsAsset[i]?.canBeCollateral
        ? parseFloat(
            new Fraction(
              JSBI.multiply(
                JSBI.multiply(
                  JSBI.BigInt(allMarketsAsset[i].supplyBalance ?? 0),
                  JSBI.BigInt(allMarketsAsset[i].exchangeRateMantissa ?? 0)
                ),
                JSBI.multiply(
                  JSBI.BigInt(allMarketsAsset[i].underlyingPrice ?? 0),
                  JSBI.BigInt(allMarketsAsset[i].collateralFactorMantissa ?? 0)
                )
              ),
              JSBI.multiply(
                JSBI.multiply(balanceFormat(allMarketsAsset[i]?.decimals), EXCHANGE_RATE_MANTISSA),
                JSBI.multiply(underlyingPriceFormat(allMarketsAsset[i]?.decimals), COLLATERAL_FACTOR_MANTISSA)
              )
            ).toSignificant(18)
          )
        : 0
  }
  return borrowLimit
}

export function withLimit(ctoken: CToken, value: JSBI) {
  return JSBI.divide(
    JSBI.multiply(JSBI.BigInt(ctoken.collateralFactorMantissa ?? 0), value ?? 0),
    COLLATERAL_FACTOR_MANTISSA
  )
}

// export function getLimit(allMarketsAsset: CToken[]): Fraction {
//   let totalLimit = JSBI.BigInt(0)

//   for (let i = 0; i < allMarketsAsset.length; i++) {
//     if (allMarketsAsset[i].canBeCollateral) {
//       totalLimit = JSBI.add(
//         totalLimit,
//         JSBI.divide(
//           JSBI.multiply(withLimit(allMarketsAsset[i], allMarketsAsset[i].getSuppliedValue()), EXA_BASE),
//           balanceFormat(allMarketsAsset[i].decimals)
//         )
//       )
//     }
//   }

//   return new Fraction(totalLimit, EXA_BASE)
// }

export function sumUnderlyingAssets(allMarketsAsset: CToken[]) {
  let sumUnderlyingAssets = 0
  for (let i = 0; i < allMarketsAsset.length; i++) {
    sumUnderlyingAssets += allMarketsAsset[i]
      ? allMarketsAsset[i].getSupplyBalance() * allMarketsAsset[i].getSupplyApy() -
        allMarketsAsset[i].getBorrowBalance() * allMarketsAsset[i].getBorrowApy()
      : 0
  }
  return sumUnderlyingAssets
}

export function getNetApy(allMarketsAsset: CToken[]) {
  let allBorrowUnderlyingAssets = 0
  for (let i = 0; i < allMarketsAsset.length; i++) {
    allBorrowUnderlyingAssets += parseFloat(
      allMarketsAsset[i]?.borrowBalance && allMarketsAsset[i]?.decimals && allMarketsAsset[i]?.underlyingPrice
        ? new Fraction(
            JSBI.multiply(
              JSBI.BigInt(allMarketsAsset[i].borrowBalance ?? 0),
              JSBI.BigInt(allMarketsAsset[i]?.underlyingPrice ?? 0)
            ),
            JSBI.multiply(
              balanceFormat(allMarketsAsset[i]?.decimals),
              underlyingPriceFormat(allMarketsAsset[i]?.decimals)
            )
          ).toSignificant(18)
        : JSBI.BigInt('0').toString()
    )
  }

  const sumAssets = sumUnderlyingAssets(allMarketsAsset)
  const supplyTotalBalance = getSupplyTotalBalance(allMarketsAsset)
  if (sumAssets && sumAssets > 0 && supplyTotalBalance) {
    return sumAssets / supplyTotalBalance
  } else if (allBorrowUnderlyingAssets && sumAssets && sumAssets < 0) {
    return sumAssets / allBorrowUnderlyingAssets
  } else {
    return 0
  }
}
