import { TokenAmount } from '@uniswap/sdk'
import invariant from 'tiny-invariant'
import JSBI from 'jsbi'
import { pack, keccak256 } from '@ethersproject/solidity'
import { getCreate2Address } from '@ethersproject/address'

import {
  BigintIsh,
  MINIMUM_LIQUIDITY,
  ChainId
} from '@uniswap/sdk'
import { InsufficientInputAmountError } from '@uniswap/sdk'
import { Token } from '@uniswap/sdk'
import { FACTORY_ADDRESS, INIT_CODE_HASH } from 'constants/flashLoan'

export const ZERO = JSBI.BigInt(0)
export const FIVE = JSBI.BigInt(5)
export const _997 = JSBI.BigInt(997)
export const _1000 = JSBI.BigInt(1000)

let POOL_ADDRESS_CACHE: { [tokenAddress: string]: string } = {}

export function parseBigintIsh(bigintIsh: BigintIsh): JSBI {
    return bigintIsh instanceof JSBI
      ? bigintIsh
      : typeof bigintIsh === 'bigint'
      ? JSBI.BigInt(bigintIsh.toString())
      : JSBI.BigInt(bigintIsh)
  }

export class Pool {
  public readonly liquidityToken: Token
  private readonly tokenAmount: TokenAmount

  public static getAddress(token: Token): string {

    if (POOL_ADDRESS_CACHE?.[token.address] === undefined) {
      POOL_ADDRESS_CACHE = {
        ...POOL_ADDRESS_CACHE,
        [token.address]: getCreate2Address(
            FACTORY_ADDRESS,
            keccak256(['bytes'], [pack(['address'], [token.address])]),
            INIT_CODE_HASH
          )
      }
    }

    return POOL_ADDRESS_CACHE[token.address]
  }

  public constructor(tokenAmount: TokenAmount) {
    this.liquidityToken = new Token(
      tokenAmount.token.chainId,
      Pool.getAddress(tokenAmount.token),
      18,
      'FL-V1',
      'FlashLoan V1'
    )
    this.tokenAmount = tokenAmount as TokenAmount
  }

  /**
   * Returns true if the token is either token0 or token1
   * @param token to check
   */
  public involvesToken(token: Token): boolean {
    return token.equals(this.token)
  }

  /**
   * Returns the chain ID of the tokens in the pair.
   */
  public get chainId(): ChainId {
    return this.token.chainId
  }

  public get token(): Token {
    return this.tokenAmount.token
  }

  public get reserve(): TokenAmount {
    return this.tokenAmount
  }

  public getLiquidityMinted(
    totalSupply: TokenAmount,
    tokenAmount: TokenAmount
  ): TokenAmount {
    invariant(totalSupply.token.equals(this.liquidityToken), 'LIQUIDITY')
    invariant(tokenAmount.token.equals(this.token), 'TOKEN')

    let liquidity: JSBI
    if (JSBI.equal(totalSupply.raw, ZERO)) {
      liquidity = JSBI.subtract(tokenAmount.raw, MINIMUM_LIQUIDITY)
    } else {
      const amount = JSBI.divide(JSBI.multiply(tokenAmount.raw, totalSupply.raw), this.reserve.raw)
      liquidity = amount
    }
    if (!JSBI.greaterThan(liquidity, ZERO)) {
      throw new InsufficientInputAmountError()
    }
    return new TokenAmount(this.liquidityToken, liquidity)
  }

  public getLiquidityValue(
    token: Token,
    totalSupply: TokenAmount,
    liquidity: TokenAmount,
    feeOn: boolean = false,
    kLast?: BigintIsh
  ): TokenAmount {
    invariant(this.involvesToken(token), 'TOKEN')
    invariant(totalSupply.token.equals(this.liquidityToken), 'TOTAL_SUPPLY')
    invariant(liquidity.token.equals(this.liquidityToken), 'LIQUIDITY')
    invariant(JSBI.lessThanOrEqual(liquidity.raw, totalSupply.raw), 'LIQUIDITY')

    let totalSupplyAdjusted: TokenAmount
    if (!feeOn) {
      totalSupplyAdjusted = totalSupply
    } else {
      invariant(!!kLast, 'K_LAST')
      const kLastParsed = parseBigintIsh(kLast)
      if (!JSBI.equal(kLastParsed, ZERO)) {
        const k = this.reserve.raw
        if (JSBI.greaterThan(k, kLastParsed)) {
          const numerator = JSBI.multiply(totalSupply.raw, JSBI.subtract(k, kLastParsed))
          const denominator = JSBI.add(JSBI.multiply(k, FIVE), kLastParsed)
          const feeLiquidity = JSBI.divide(numerator, denominator)
          totalSupplyAdjusted = totalSupply.add(new TokenAmount(this.liquidityToken, feeLiquidity))
        } else {
          totalSupplyAdjusted = totalSupply
        }
      } else {
        totalSupplyAdjusted = totalSupply
      }
    }

    return new TokenAmount(
      token,
      JSBI.divide(JSBI.multiply(liquidity.raw, this.reserve.raw), totalSupplyAdjusted.raw)
    )
  }
}
