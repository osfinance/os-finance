import React, { useContext, useMemo } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { JSBI } from '@uniswap/sdk'
import { Pool as FlashLoanPool } from 'data/Pool'
import { Link } from 'react-router-dom'
import { SwapPoolTabs } from '../../components/NavigationTabs'

import FullPositionCard from '../../components/FlashLoanPositionCard'
import { useUserHasLiquidityInAllTokens } from '../../data/V1'
import { useTokenBalancesWithLoadingIndicator } from '../../state/wallet/hooks'
import { StyledInternalLink, ExternalLink, TYPE, HideSmall } from '../../theme'
import { Text } from 'rebass'
import Card from '../../components/Card'
import { RowBetween, RowFixed } from '../../components/Row'
import { ButtonPrimary, ButtonSecondary } from '../../components/Button'
import { AutoColumn } from '../../components/Column'

import { useActiveWeb3React } from '../../hooks'
import { usePools } from '../../data/Reserves'
import { toFlashLoanV1LiquidityToken, useTrackedTokenPools } from '../../state/user/hooks'
import { Dots } from '../../components/swap/styleds'
import { CardSection, DataCard, CardNoise, CardBGImage } from '../../components/earn/styled'
import { useFlashLoanStakingInfo } from '../../state/stake/hooks'
import { BIG_INT_ZERO } from '../../constants'

const PageWrapper = styled(AutoColumn)`
  max-width: 640px;
  width: 100%;
`

const VoteCard = styled(DataCard)`
  background: radial-gradient(76.02% 75.41% at 1.84% 0%, #27ae60 0%, #000000 100%);
  overflow: hidden;
`

const TitleRow = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-wrap: wrap;
    gap: 12px;
    width: 100%;
    flex-direction: column-reverse;
  `};
`

const ButtonRow = styled(RowFixed)`
  gap: 8px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    flex-direction: row-reverse;
    justify-content: space-between;
  `};
`

const ResponsiveButtonPrimary = styled(ButtonPrimary)`
  width: fit-content;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 48%;
  `};
`

const ResponsiveButtonSecondary = styled(ButtonSecondary)`
  width: fit-content;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 48%;
  `};
`

const EmptyProposals = styled.div`
  border: 1px solid ${({ theme }) => theme.text4};
  padding: 16px 12px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

export default function Pool() {
  const theme = useContext(ThemeContext)
  const { account } = useActiveWeb3React()

  // fetch the user's balances of all tracked V2 LP tokens
  const trackedTokenPools = useTrackedTokenPools()
  const tokenPoolsWithLiquidityTokens = useMemo(
    () => trackedTokenPools.map(tokens => ({ liquidityToken: toFlashLoanV1LiquidityToken(tokens), tokens })),
    [trackedTokenPools]
  )
  const liquidityTokens = useMemo(() => tokenPoolsWithLiquidityTokens.map(tpwlt => tpwlt.liquidityToken), [
    tokenPoolsWithLiquidityTokens
  ])
  const [v1PoolsBalances, fetchingV1PoolBalances] = useTokenBalancesWithLoadingIndicator(
    account ?? undefined,
    liquidityTokens
  )

  // fetch the reserves for all V2 pools in which the user has a balance
  const liquidityTokensWithBalances = useMemo(
    () =>
      tokenPoolsWithLiquidityTokens.filter(({ liquidityToken }) =>
        v1PoolsBalances[liquidityToken.address]?.greaterThan('0')
      ),
    [tokenPoolsWithLiquidityTokens, v1PoolsBalances]
  )

  const v1Pools = usePools(liquidityTokensWithBalances.map(({ tokens }) => tokens))
  const v1IsLoading =
    fetchingV1PoolBalances || v1Pools?.length < liquidityTokensWithBalances.length || v1Pools?.some(V1Pool => !V1Pool)

  const allV1PoolsWithLiquidity = v1Pools
    .map(([, pool]) => pool)
    .filter((v1Pool): v1Pool is FlashLoanPool => Boolean(v1Pool))

  const hasV1Liquidity = useUserHasLiquidityInAllTokens()

  // show liquidity even if its deposited in rewards contract
  const stakingInfo = useFlashLoanStakingInfo()
  const stakingInfosWithBalance = stakingInfo?.filter(pool => JSBI.greaterThan(pool.stakedAmount.raw, BIG_INT_ZERO))
  const stakingPools = usePools(stakingInfosWithBalance?.map(stakingInfo => stakingInfo.token))

  // remove any pools that also are included in pools with stake in mining pool
  const v1PoolsWithoutStakedAmount = allV1PoolsWithLiquidity.filter(v1Pool => {
    return (
      stakingPools
        ?.map(stakingPool => stakingPool[1])
        .filter(stakingPool => stakingPool?.liquidityToken.address === v1Pool.liquidityToken.address).length === 0
    )
  })

  return (
    <>
      <PageWrapper>
        <SwapPoolTabs active={'pool'} />
        <VoteCard>
          <CardBGImage />
          <CardNoise />
          <CardSection>
            <AutoColumn gap="md">
              <RowBetween>
                <TYPE.white fontWeight={600}>Liquidity provider rewards</TYPE.white>
              </RowBetween>
              <RowBetween>
                <TYPE.white fontSize={14}>
                  {`FlashLoan liquidity providers earn a 0.05% fee on all trades proportional to their share of the pool. Fees are added to the pool, accrue in real time and can be claimed by withdrawing your liquidity.`}
                </TYPE.white>
              </RowBetween>
            </AutoColumn>
          </CardSection>
          <CardBGImage />
          <CardNoise />
        </VoteCard>

        <AutoColumn gap="lg" justify="center">
          <AutoColumn gap="lg" style={{ width: '100%' }}>
            <TitleRow style={{ marginTop: '1rem' }} padding={'0'}>
              <HideSmall>
                <TYPE.mediumHeader style={{ marginTop: '0.5rem', justifySelf: 'flex-start' }}>
                  Your liquidity
                </TYPE.mediumHeader>
              </HideSmall>
              <ButtonRow>
                <ResponsiveButtonSecondary as={Link} padding="6px 8px" to="/create/ETH">
                  Create a pool
                </ResponsiveButtonSecondary>
                <ResponsiveButtonPrimary
                  id="join-pool-button"
                  as={Link}
                  padding="6px 8px"
                  borderRadius="12px"
                  to="/add/ETH"
                >
                  <Text fontWeight={500} fontSize={16}>
                    Add Liquidity
                  </Text>
                </ResponsiveButtonPrimary>
              </ButtonRow>
            </TitleRow>

            {!account ? (
              <Card padding="40px">
                <TYPE.body color={theme.text3} textAlign="center">
                  Connect to a wallet to view your liquidity.
                </TYPE.body>
              </Card>
            ) : v1IsLoading ? (
              <EmptyProposals>
                <TYPE.body color={theme.text3} textAlign="center">
                  <Dots>Loading</Dots>
                </TYPE.body>
              </EmptyProposals>
            ) : allV1PoolsWithLiquidity?.length > 0 || stakingPools?.length > 0 ? (
              <>
                <ButtonSecondary>
                  <RowBetween>
                    <ExternalLink href={'https://info.deerfi.com/account/' + account}>
                      Account analytics and accrued fees
                    </ExternalLink>
                    <span> ↗</span>
                  </RowBetween>
                </ButtonSecondary>
                {v1PoolsWithoutStakedAmount.map(v1Pool => (
                  <FullPositionCard key={v1Pool.liquidityToken.address} pool={v1Pool} />
                ))}
                {stakingPools.map(
                  (stakingPool, i) =>
                    stakingPool[1] && ( // skip pools that arent loaded
                      <FullPositionCard
                        key={stakingInfosWithBalance[i].stakingRewardAddress}
                        pool={stakingPool[1]}
                        stakedBalance={stakingInfosWithBalance[i].stakedAmount}
                      />
                    )
                )}
              </>
            ) : (
              <EmptyProposals>
                <TYPE.body color={theme.text3} textAlign="center">
                  No liquidity found.
                </TYPE.body>
              </EmptyProposals>
            )}

            <AutoColumn justify={'center'} gap="md">
              <Text textAlign="center" fontSize={14} style={{ padding: '.5rem 0 .5rem 0' }}>
                {hasV1Liquidity ? 'Uniswap V1 liquidity found!' : "Don't see a pool you joined?"}{' '}
                <StyledInternalLink id="import-pool-link" to={hasV1Liquidity ? '/migrate/v1' : '/find'}>
                  {hasV1Liquidity ? 'Migrate now.' : 'Import it.'}
                </StyledInternalLink>
              </Text>
            </AutoColumn>
          </AutoColumn>
        </AutoColumn>
      </PageWrapper>
    </>
  )
}