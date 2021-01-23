import React, { Suspense } from 'react'
import { Route, Switch } from 'react-router-dom'
import styled from 'styled-components'
import GoogleAnalyticsReporter from '../components/analytics/GoogleAnalyticsReporter'
import AddressClaimModal from '../components/claim/AddressClaimModal'
import Header from '../components/Header'
import Polling from '../components/Header/Polling'
import URLWarning from '../components/Header/URLWarning'
import Web3ReactManager from '../components/Web3ReactManager'
import { ApplicationModal } from '../state/application/actions'
import { useModalOpen, useToggleModal } from '../state/application/hooks'
import DarkModeQueryParamReader from '../theme/DarkModeQueryParamReader'
import AddFlashLoanLiquidity from './AddFlashLoanLiquidity'
import { RedirectFlashLoanAddLiquidity, RedirectToAddLiquidity } from './AddFlashLoanLiquidity/redirects'
import DeerEarn from './DeerEarn'
import Manage from './DeerEarn/Manage'
import FlashLoanPool from './FlashLoanPool'
import FlashLoanPoolFinder from './FlashLoanPoolFinder'
import RemoveFlashLoanLiquidity from './RemoveFlashLoanLiquidity'
import DeerVote from './DeerVote'
import VotePage from './Vote/VotePage'
import { RedirectPathToPoolOnly } from './FlashLoanPool/redirects'

import Lend from './Lend'

const AppWrapper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: flex-start;
  overflow-x: hidden;
`

const HeaderWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  justify-content: space-between;
`

const BodyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding-top: 60px;
  align-items: center;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 10;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 16px;
    padding-top: 2rem;
  `};

  z-index: 1;
`

const Marginer = styled.div`
  margin-top: 5rem;
`

function TopLevelModals() {
  const open = useModalOpen(ApplicationModal.ADDRESS_CLAIM)
  const toggle = useToggleModal(ApplicationModal.ADDRESS_CLAIM)
  return <AddressClaimModal isOpen={open} onDismiss={toggle} />
}

export default function App() {
  return (
    <Suspense fallback={null}>
      <Route component={GoogleAnalyticsReporter} />
      <Route component={DarkModeQueryParamReader} />
      <AppWrapper>
        <URLWarning />
        <HeaderWrapper>
          <Header />
        </HeaderWrapper>
        <BodyWrapper>
          <Polling />
          <TopLevelModals />
          <Web3ReactManager>
            <Switch>
              <Route exact strict path="/lending" component={Lend} />
              <Route exact strict path="/find" component={FlashLoanPoolFinder} />
              <Route exact strict path="/pool" component={FlashLoanPool} />
              <Route exact strict path="/deer" component={DeerEarn} />
              <Route exact strict path="/vote" component={DeerVote} />
              <Route exact strict path="/create" component={RedirectToAddLiquidity} />
              <Route exact path="/add" component={AddFlashLoanLiquidity} />
              <Route exact path="/add/:currencyId" component={RedirectFlashLoanAddLiquidity} />
              <Route exact path="/create" component={AddFlashLoanLiquidity} />
              <Route exact path="/create/:currencyId" component={RedirectFlashLoanAddLiquidity} />
              <Route exact strict path="/remove/:currencyId" component={RemoveFlashLoanLiquidity} />
              <Route exact strict path="/deer/:currencyId" component={Manage} />
              <Route exact strict path="/vote/:id" component={VotePage} />
              <Route component={RedirectPathToPoolOnly} />
            </Switch>
          </Web3ReactManager>
          <Marginer />
        </BodyWrapper>
      </AppWrapper>
    </Suspense>
  )
}
