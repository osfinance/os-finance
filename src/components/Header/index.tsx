import { ChainId, TokenAmount } from '@uniswap/sdk'
import React, { useState } from 'react'
import { Text } from 'rebass'
import { NavLink, useLocation } from 'react-router-dom'
import { darken } from 'polished'
import { useTranslation } from 'react-i18next'

import styled from 'styled-components'

import Logo from '../../assets/svg/logo.svg'
import LogoDark from '../../assets/svg/logo_white.svg'
import CompoundIcon from '../../assets/svg/logo_compound.svg'
import { useActiveWeb3React } from '../../hooks'
import { useDarkModeManager } from '../../state/user/hooks'
import { useETHBalances, useAggregateUniBalance } from '../../state/wallet/hooks'
import { CardNoise } from '../earn/styled'
import { CountUp } from 'use-count-up'
import { ExternalLink, TYPE } from '../../theme'

import { YellowCard } from '../Card'
import Settings from '../Settings'
import Menu from '../Menu'

import Row, { RowFixed } from '../Row'
import Web3Status from '../Web3Status'
import ClaimModal from '../claim/ClaimModal'
import { useToggleSelfClaimModal, useShowClaimPopup } from '../../state/application/hooks'
import { useUserHasAvailableClaim } from '../../state/claim/hooks'
import { useUserHasSubmittedClaim } from '../../state/transactions/hooks'
import { Dots } from '../swap/styleds'
import Modal from '../Modal'
import UniBalanceContent from './UniBalanceContent'
import usePrevious from '../../hooks/usePrevious'
import { PageFields } from 'data/Reserves'

const HeaderFrame = styled.div`
  display: grid;
  grid-template-columns: 1fr 120px;
  align-items: center;
  justify-content: space-between;
  align-items: center;
  flex-direction: row;
  width: 100%;
  top: 0;
  position: relative;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding: 1rem;
  z-index: 2;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr;
    padding: 0 1rem;
    width: calc(100%);
    position: relative;
  `};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
        padding: 0.5rem 1rem;
  `}
`

const HeaderControls = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-self: flex-end;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: row;
    justify-content: space-between;
    justify-self: center;
    width: 100%;
    max-width: 960px;
    padding: 1rem;
    position: fixed;
    bottom: 0px;
    left: 0px;
    width: 100%;
    z-index: 99;
    height: 72px;
    border-radius: 12px 12px 0 0;
    background-color: ${({ theme }) => theme.bg1};
  `};
`

const HeaderElement = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
   flex-direction: row-reverse;
    align-items: center;
  `};
`

const HeaderElementWrap = styled.div`
  display: flex;
  align-items: center;
`

const HeaderRow = styled(RowFixed)`
  ${({ theme }) => theme.mediaWidth.upToMedium`
   width: 100%;
  `};
`

const HeaderLinks = styled(Row)`
  justify-content: center;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 1rem 0 1rem 1rem;
    justify-content: flex-end;
`};
`

const AccountElement = styled.div<{ active: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme, active }) => (!active ? theme.bg1 : theme.bg3)};
  border-radius: 12px;
  white-space: nowrap;
  width: 100%;
  cursor: pointer;

  :focus {
    border: 1px solid blue;
  }
`

const UNIAmount = styled(AccountElement)`
  color: white;
  padding: 4px 8px;
  height: 36px;
  font-weight: 500;
  background-color: ${({ theme }) => theme.bg3};
  background: radial-gradient(174.47% 188.91% at 1.84% 0%, #ff007a 0%, #2172e5 100%), #edeef2;
`

const UNIWrapper = styled.span`
  width: fit-content;
  position: relative;
  cursor: pointer;

  :hover {
    opacity: 0.8;
  }

  :active {
    opacity: 0.9;
  }
`

const HideSmall = styled.span`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `};
`

const NetworkCard = styled(YellowCard)`
  border-radius: 12px;
  padding: 8px 12px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin: 0;
    margin-right: 0.5rem;
    width: initial;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 1;
  `};
`

const BalanceText = styled(Text)`
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: none;
  `};
`

const Title = styled.a`
  display: flex;
  align-items: center;
  pointer-events: auto;
  justify-self: flex-start;
  margin-right: 12px;
  text-decoration: none;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    justify-self: center;
  `};
  :hover {
    cursor: pointer;
  }
`

const UniIcon = styled.div`
  transition: transform 0.3s ease;
  :hover {
    transform: rotate(-5deg);
  }
`

const activeClassName = 'ACTIVE'

const StyledNavLink = styled(NavLink).attrs({
  activeClassName
})`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: left;
  border-radius: 3rem;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.text2};
  font-size: 1rem;
  width: fit-content;
  margin: 0 12px;
  font-weight: 500;

  &.${activeClassName} {
    border-radius: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.text1};
  }

  :hover,
  :focus {
    color: ${({ theme }) => darken(0.1, theme.text1)};
  }
`

const StyledExternalLink = styled(ExternalLink).attrs({
  activeClassName
})<{ isActive?: boolean; smallShow?: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: left;
  border-radius: 3rem;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.text2};
  font-size: 1rem;
  width: fit-content;
  margin: 0 12px;
  font-weight: 500;

  &.${activeClassName} {
    border-radius: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.text1};
  }

  :hover,
  :focus {
    color: ${({ theme }) => darken(0.1, theme.text1)};
  }

  ${({ theme, smallShow }) => theme.mediaWidth.upToExtraSmall`
      display: ${smallShow ? 'block' : 'none'};
  `}
`

const EmojiIcon = styled.div`
  font-size: 26px;
  text-decoration: none;
`

const NETWORK_LABELS: { [chainId in ChainId]?: string } = {
  [ChainId.RINKEBY]: 'Rinkeby',
  [ChainId.ROPSTEN]: 'Ropsten',
  [ChainId.GÖRLI]: 'Görli',
  [ChainId.KOVAN]: 'Kovan'
}

export default function Header() {
  const { account, chainId } = useActiveWeb3React()
  const { t } = useTranslation()

  const location = useLocation()
  const page = location.pathname.split('/')[1]

  const userEthBalance = useETHBalances(account ? [account] : [])?.[account ?? '']
  const [isDark] = useDarkModeManager()

  return (
    <HeaderFrame>
      <HeaderRow>
        <Title href=".">
          {PageFields.HOME === page && (
            <UniIcon>
              <EmojiIcon role="img">{'😋'}</EmojiIcon>
            </UniIcon>
          )}
          {PageFields.UNISWAP === page && (
            <UniIcon>
              <img width={'24px'} src={isDark ? LogoDark : Logo} alt="logo" />
            </UniIcon>
          )}
          {PageFields.COMPOUND === page && (
            <UniIcon>
              <img width={'28px'} src={CompoundIcon} alt="logo" />
            </UniIcon>
          )}
          {PageFields.SUSHISWAP === page && (
            <UniIcon>
              <EmojiIcon>{'🍣'}</EmojiIcon>
            </UniIcon>
          )}
        </Title>
        <HeaderLinks>
          <StyledNavLink id={`swap-nav-link`} to={'/home'}>
            {t('home')}
          </StyledNavLink>
          {PageFields.UNISWAP === page && <UniswapHeaderLinks />}
          {PageFields.SUSHISWAP === page && <SushiswapHeaderLinks />}
          {PageFields.COMPOUND === page && <CompoundHeaderLinks />}
        </HeaderLinks>
      </HeaderRow>
      <HeaderControls>
        <HeaderElement>
          <HideSmall>
            {chainId && NETWORK_LABELS[chainId] && (
              <NetworkCard title={NETWORK_LABELS[chainId]}>{NETWORK_LABELS[chainId]}</NetworkCard>
            )}
          </HideSmall>
          {PageFields.UNISWAP === page && <UniClaimLink />}
          <AccountElement active={!!account} style={{ pointerEvents: 'auto' }}>
            {account && userEthBalance ? (
              <BalanceText style={{ flexShrink: 0 }} pl="0.75rem" pr="0.5rem" fontWeight={500}>
                {userEthBalance?.toSignificant(4)} ETH
              </BalanceText>
            ) : null}
            <Web3Status />
          </AccountElement>
        </HeaderElement>
        <HeaderElementWrap>
          <Settings />
          <Menu />
        </HeaderElementWrap>
      </HeaderControls>
    </HeaderFrame>
  )
}

function UniClaimLink() {
  const { account } = useActiveWeb3React()

  const toggleClaimModal = useToggleSelfClaimModal()

  const availableClaim: boolean = useUserHasAvailableClaim(account)

  const { claimTxn } = useUserHasSubmittedClaim(account ?? undefined)

  const aggregateBalance: TokenAmount | undefined = useAggregateUniBalance()

  const [showUniBalanceModal, setShowUniBalanceModal] = useState(false)
  const showClaimPopup = useShowClaimPopup()

  const countUpValue = aggregateBalance?.toFixed(0) ?? '0'
  const countUpValuePrevious = usePrevious(countUpValue) ?? '0'

  return (
    <>
      <ClaimModal />
      <Modal isOpen={showUniBalanceModal} onDismiss={() => setShowUniBalanceModal(false)}>
        <UniBalanceContent setShowUniBalanceModal={setShowUniBalanceModal} />
      </Modal>
      {availableClaim && !showClaimPopup && (
        <UNIWrapper onClick={toggleClaimModal}>
          <UNIAmount active={!!account && !availableClaim} style={{ pointerEvents: 'auto' }}>
            <TYPE.white padding="0 2px">
              {claimTxn && !claimTxn?.receipt ? <Dots>Claiming UNI</Dots> : 'Claim UNI'}
            </TYPE.white>
          </UNIAmount>
          <CardNoise />
        </UNIWrapper>
      )}
      {!availableClaim && aggregateBalance && (
        <UNIWrapper onClick={() => setShowUniBalanceModal(true)}>
          <UNIAmount active={!!account && !availableClaim} style={{ pointerEvents: 'auto' }}>
            {account && (
              <HideSmall>
                <TYPE.white
                  style={{
                    paddingRight: '.4rem'
                  }}
                >
                  <CountUp
                    key={countUpValue}
                    isCounting
                    start={parseFloat(countUpValuePrevious)}
                    end={parseFloat(countUpValue)}
                    thousandsSeparator={','}
                    duration={1}
                  />
                </TYPE.white>
              </HideSmall>
            )}
            UNI
          </UNIAmount>
          <CardNoise />
        </UNIWrapper>
      )}
    </>
  )
}

function UniswapHeaderLinks() {
  const { t } = useTranslation()

  return (
    <>
      <StyledNavLink id={`swap-nav-link`} to={'/uniswap/swap'}>
        {t('swap')}
      </StyledNavLink>
      <StyledNavLink
        id={`pool-nav-link`}
        to={'/uniswap/pool'}
        isActive={(match, { pathname }) =>
          Boolean(match) ||
          pathname.startsWith('/uniswap/add') ||
          pathname.startsWith('/uniswap/remove') ||
          pathname.startsWith('/uniswap/create') ||
          pathname.startsWith('/uniswap/find')
        }
      >
        {t('pool')}
      </StyledNavLink>
      <StyledNavLink id={`stake-nav-link`} to={'/uniswap/uni'}>
        UNI
      </StyledNavLink>
      <StyledNavLink id={`stake-nav-link`} to={'/uniswap/vote'}>
        Vote
      </StyledNavLink>
      <StyledExternalLink id={`stake-nav-link`} href={'https://uniswap.info'}>
        Charts <span style={{ fontSize: '11px' }}>↗</span>
      </StyledExternalLink>
    </>
  )
}

function CompoundHeaderLinks() {
  const { t } = useTranslation()

  return (
    <>
      <StyledNavLink
        id={`lending-nav-link`}
        to={'/lending'}
        isActive={(match, { pathname }) => Boolean(match) || pathname.startsWith('/compound/lending')}
      >
        {t('lending')}
      </StyledNavLink>
      <StyledExternalLink id={`twitter-nav-link`} href={'https://twitter.com/compoundfinance'}>
        Twitter <span style={{ fontSize: '11px' }}>↗</span>
      </StyledExternalLink>
      <StyledExternalLink id={`discord-nav-link`} href={'https://compound.finance/discord'}>
        Discord <span style={{ fontSize: '11px' }}>↗</span>
      </StyledExternalLink>
      {/* <StyledExternalLink id={`discord-nav-link`} href={'https://defipulse.com/defi-list'}>
        DeFi Pulse <span style={{ fontSize: '11px' }}>↗</span>
      </StyledExternalLink> */}
    </>
  )
}

function SushiswapHeaderLinks() {
  const { t } = useTranslation()

  return (
    <>
      <StyledNavLink id={`swap-nav-link`} to={'/sushiswap/swap'}>
        {t('swap')}
      </StyledNavLink>
      <StyledNavLink
        id={`pool-nav-link`}
        to={'/sushiswap/pool'}
        isActive={(match, { pathname }) =>
          Boolean(match) ||
          pathname.startsWith('/sushiswap/add') ||
          pathname.startsWith('/sushiswap/remove') ||
          pathname.startsWith('/sushiswap/create') ||
          pathname.startsWith('/sushiswap/find')
        }
      >
        {t('pool')}
      </StyledNavLink>
      <StyledExternalLink id={`stake-nav-link`} href={'https://sushiswap.fi/governance'}>
        Vote <span style={{ fontSize: '11px' }}>↗</span>
      </StyledExternalLink>
      <StyledExternalLink id={`stake-nav-link`} href={'https://sushiswap.vision'}>
        Charts <span style={{ fontSize: '11px' }}>↗</span>
      </StyledExternalLink>
    </>
  )
}
