import React, { useState } from 'react'
// import { darken } from 'polished'
// import { useTranslation } from 'react-i18next'

import styled from 'styled-components'
import Modal from '../Modal'
import { AutoColumn } from '../Column'
import { Text } from 'rebass'
import { AutoRow, RowBetween } from '../Row'
import { X } from 'react-feather'
import { CToken } from '../../data/CToken'
import { ButtonLight } from '../Button'
import CurrencyIcon from '../CurrencyIcon'
import LendInputPanel from '../LendInputPanel'
import { utils } from 'ethers'
import { LendField } from '../../pages/Lend'

const StyledCloseIcon = styled(X)`
  height: 20px;
  width: 20px;
  :hover {
    cursor: pointer;
  }

  > * {
    stroke: ${({ theme }) => theme.text1};
  }
`

const AssetLogo = styled.div`
  display: flex;
  align-items: center;
`

const Break = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${({ theme }) => theme.bg3};
`

const ModalContentWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
  background-color: ${({ theme }) => theme.bg2};
  border-radius: 4px;
  width: 100%;
`

const ApproveWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3.5rem 1.75rem 3.5rem 1.75rem;
`

const TabWrap = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
`

const TabItem = styled.div<{ isActive: boolean }>`
  font-size: 0.85rem;
  text-align: center;
  position: relative;
  cursor: pointer;
  text-transform: uppercase;
  color: ${({ isActive }) => (isActive ? '#ff007a' : '#AAB8C1')};
  padding-bottom: 0.8rem;
  font-weight: 600;
  :after {
    background: ${({ isActive }) => (isActive ? '#ff007a' : 'none')};
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    border-radius: 10px 10px 0 0;
  }
`

const RateWrap = styled.div`
  padding: 1.4rem 1.75rem;
  width: 100%;
`

const RateTitle = styled.div`
  cursor: pointer;
  text-transform: none;
  color: #657786;
  font-weight: 600;
  font-size: 12px;
`

const RatePanel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 1rem 0;
`

const RateCalculation = styled.div`
  font-weight: 500;
  color: #141e27;
`

export interface LendModalProps {
  lendToken: CToken
  showLendConfirmation: boolean
  setShowLendConfirmation: Function
  lendMarket?: LendField
  onMint?: (cToken: CToken, amount: string, isETH: boolean) => void
  onRedeemUnderlying?: (cToken: CToken, amount: string) => void
}

function LendModal({
  lendToken,
  showLendConfirmation,
  setShowLendConfirmation,
  lendMarket = LendField.SUPPLY,
  onMint,
  onRedeemUnderlying
}: LendModalProps) {
  // const { t } = useTranslation()

  // const [isDark] = useDarkModeManager()

  // show confirmation view before turning on
  // const [showLendConfirmation, setShowLendConfirmation] = useState(false)

  // const [lendToken, setLendToken] = useState<CToken>()

  // const [isSuppliedMarkets, setIsSuppliedMarkets] = useState(false)

  const [tabItemActive, setTabItemActive] = useState<LendField>()

  const [lendInputValue, setLendInputValue] = useState('0')

  return (
    <div>
      <Modal isOpen={showLendConfirmation} onDismiss={() => setShowLendConfirmation(false)}>
        <ModalContentWrapper>
          <AutoColumn gap={'0'} style={{ width: '100%' }}>
            <RowBetween style={{ padding: '0 2rem 1.2rem' }}>
              <div />
              <AssetLogo>
                <CurrencyIcon address={lendToken?.address} style={{ marginRight: '10px' }} />
                <Text fontWeight={500} fontSize={'1.1rem'}>
                  {lendToken?.symbol}
                </Text>
              </AssetLogo>
              <StyledCloseIcon onClick={() => setShowLendConfirmation(false)} />
            </RowBetween>
            <Break />
            <AutoColumn gap={'sm'} style={{ backgroundColor: '#f9fafb' }}>
              {lendToken?.canBeCollateral ? (
                <ApproveWrap>
                  <div />
                  <LendInputPanel
                    value={lendInputValue}
                    onUserInput={setLendInputValue}
                    onMax={() => {
                      setLendInputValue(lendToken?.supplyBalance ? utils.formatEther(lendToken?.supplyBalance) : '')
                    }}
                    label={'Amount'}
                    showMaxButton={true}
                    id="lend-input"
                  />
                </ApproveWrap>
              ) : (
                <ApproveWrap>
                  <CurrencyIcon address={lendToken?.address} size={'4.4rem'} style={{ marginBottom: '2rem' }} />
                  <Text fontWeight={400} fontSize={'0.9rem'} color={'#AAB8C1'} textAlign={'center'} lineHeight={'1rem'}>
                    To Supply or Repay Tether to the Compound Protocol, you need to enable it first.
                  </Text>
                </ApproveWrap>
              )}
            </AutoColumn>
            <AutoColumn gap={'0'} style={{ backgroundColor: '#f9fafb' }}>
              <TabWrap>
                <TabItem
                  isActive={
                    lendMarket === LendField.SUPPLY
                      ? LendField.SUPPLY === tabItemActive
                      : LendField.BORROW === tabItemActive
                  }
                  onClick={() => {
                    setTabItemActive(lendMarket === LendField.SUPPLY ? LendField.SUPPLY : LendField.BORROW)
                  }}
                >
                  {lendMarket === LendField.SUPPLY ? LendField.SUPPLY : LendField.BORROW}
                </TabItem>
                <TabItem
                  isActive={
                    lendMarket === LendField.SUPPLY
                      ? LendField.WITHDRAW === tabItemActive
                      : LendField.REPAY === tabItemActive
                  }
                  onClick={() => {
                    setTabItemActive(lendMarket === LendField.SUPPLY ? LendField.WITHDRAW : LendField.REPAY)
                  }}
                >
                  {lendMarket === LendField.SUPPLY ? LendField.WITHDRAW : LendField.REPAY}
                </TabItem>
              </TabWrap>
              <Break />
            </AutoColumn>
            <AutoColumn gap={'0'}>
              <RateWrap>
                <RateTitle>Supply Rates</RateTitle>
                <RatePanel>
                  <AutoRow>
                    <CurrencyIcon address={lendToken?.address} style={{ marginRight: '6px' }} />
                    <Text color={'#AAB8C1;'} lineHeight={'24px'}>
                      {lendToken?.symbol}
                    </Text>
                  </AutoRow>
                  <RateCalculation>10.53%</RateCalculation>
                </RatePanel>
                <Break />
                <RatePanel>
                  <AutoRow>
                    <CurrencyIcon address={lendToken?.address} style={{ marginRight: '6px' }} />
                    <Text color={'#AAB8C1;'} lineHeight={'24px'}>
                      {lendToken?.symbol}
                    </Text>
                  </AutoRow>
                  <RateCalculation>10.53%</RateCalculation>
                </RatePanel>
              </RateWrap>
            </AutoColumn>
            <AutoColumn gap="md" style={{ padding: '1.4rem 2rem 0' }}>
              <ButtonLight
                onClick={() => {
                  if (lendToken && onMint && onRedeemUnderlying) {
                    if (tabItemActive === LendField.SUPPLY) {
                      console.log(onMint, 'onMint')
                      onMint(lendToken, lendInputValue, false)
                    } else if (tabItemActive === LendField.WITHDRAW) {
                      onRedeemUnderlying(lendToken, lendInputValue)
                    }
                  } else {
                    return
                  }
                }}
              >
                {lendMarket}
              </ButtonLight>
            </AutoColumn>
          </AutoColumn>
        </ModalContentWrapper>
      </Modal>
    </div>
  )
}

export default LendModal
