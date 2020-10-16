import { utils } from 'ethers'
import React from 'react'
// import { darken } from 'polished'
// import { useTranslation } from 'react-i18next'

import styled from 'styled-components'
import { CToken } from '../../data/CToken'
import CurrencyIcon from '../CurrencyIcon'
import { blocksPerDay, daysPerYear, ethMantissa } from '../Summary'

const MarketsCard = styled.div`
  background: #ffffff;
  box-shadow: 0px 2px 4px rgba(16, 21, 24, 0.05);
  border-radius: 4px;
`

const MarketsCardHeader = styled.div`
  display: flex;
  flex-flow: inherit;
  font-weight: 600;
  justify-content: space-between;
  font-size: 1.1rem;
  padding: 1rem 1.75rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
`

const AssetWrap = styled.div`
  cursor: pointer;
  font-size: 1rem;
`

const AssetWrapLabels = styled.div`
  display: grid;
  padding: 1rem 1.75rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  align-items: center;
  grid-template-columns: 4fr 3fr 3fr 2fr;
`

const AssetLabel = styled.div<{ textAlign?: string }>`
  font-size: 12px;
  font-weight: 500;
  color: #aab8c1;
  text-align: ${({ textAlign }) => (textAlign ? textAlign : 'center')};
`

const AssetItemWrap = styled.div`
  font-size: 1rem;
`

const AssetItem = styled.div<{ justifyItems?: string }>`
  display: grid;
  justify-items: ${({ justifyItems }) => (justifyItems ? justifyItems : 'end')};
  grid-template-columns: 4fr 3fr 3fr 2fr;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 1.25rem 1.75rem;
  border-left: 2px solid transparent;
  padding-left: 1.625rem;
  height: 82px;
  text-transform: none;
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 0;
  transition: none;
  :hover {
    border-left: 2px solid #1de9b6;
    background: rgba(4, 169, 245, 0.05);
  }
`

const AssetLogo = styled.div`
  display: flex;
  align-items: center;
  justify-self: start;
`

const ItemWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: right;
  align-self: center;
  text-align: right;
`

const ItemBottomWrap = styled.div`
  color: #aab8c1;
  font-size: 0.9em;
`

function BorrowMarkets({
  allMarkets = [],
  onEnterMarkets,
  onExitMarkets
}: {
  allMarkets: any
  onEnterMarkets: (cToken: CToken) => void
  onExitMarkets: (cToken: CToken) => void
}) {
  // const { t } = useTranslation()

  // const [isDark] = useDarkModeManager()

  const borrowList = allMarkets.map((item: any) => {
    return item?.[1]
  })

  function getLimit() {
    let collateralFactorMantissa = 0
    borrowList.forEach((val: any, idx: any, borrowList: any) => {
      collateralFactorMantissa +=
        parseFloat(utils.formatEther(val?.supplyBalance ? val?.supplyBalance : 0)) *
        parseFloat(utils.formatEther(val?.exchangeRateMantissa ? val?.exchangeRateMantissa : 0)) *
        parseFloat(utils.formatEther(val?.underlyingPrice ? val?.underlyingPrice : 0)) *
        parseFloat(utils.formatEther(val?.collateralFactorMantissa ? val?.collateralFactorMantissa : 0))
    }, collateralFactorMantissa)
    return collateralFactorMantissa
  }

  const borrowedAsset = borrowList.filter((item: any) => {
    return item && item?.borrowBalance?.toString() > 0
  })

  const borrowAsset = borrowList.filter((item: any) => {
    return item && item?.borrowBalance?.toString() == 0 && item?.supplyBalance?.toString() == 0
  })

  console.log('supplyMarkets: ', allMarkets)

  return (
    <div>
      {!!borrowedAsset.length && (
        <MarketsCard style={{ marginBottom: '1rem' }}>
          <MarketsCardHeader>Borrow</MarketsCardHeader>
          <AssetWrap>
            <AssetWrapLabels>
              <AssetLabel textAlign={'left'}>Asset</AssetLabel>
              <AssetLabel textAlign={'right'}>APY / Accrued</AssetLabel>
              <AssetLabel textAlign={'right'}>Balance</AssetLabel>
              <AssetLabel textAlign={'right'}>% Of Limit</AssetLabel>
            </AssetWrapLabels>
            <AssetItemWrap>
              {borrowedAsset.map((item: any) => (
                <AssetItem key={item?.symbol}>
                  <AssetLogo>
                    <CurrencyIcon address={item?.address} style={{ marginRight: '10px' }} />
                    {item?.symbol}
                  </AssetLogo>
                  <ItemWrap>
                    <div>
                      {(
                        (Math.pow((item?.borrowRatePerBlock / ethMantissa) * blocksPerDay + 1, daysPerYear - 1) - 1) *
                        100
                      ).toFixed(2)}
                      %
                    </div>
                    <ItemBottomWrap>
                      {item?.borrowBalance && item?.symbol
                        ? parseFloat(utils.formatEther(item?.borrowBalance)).toFixed(4)
                        : ''}
                      {' ' + item?.symbol}
                    </ItemBottomWrap>
                  </ItemWrap>
                  <ItemWrap>
                    <div>
                      $
                      {item?.borrowBalance && item?.underlyingPrice
                        ? (
                            parseFloat(utils.formatEther(item?.borrowBalance)) *
                            parseFloat(utils.formatEther(item?.underlyingPrice))
                          ).toFixed(3)
                        : ''}
                    </div>
                    <ItemBottomWrap>
                      {item?.borrowBalance && item?.symbol && item?.cAddress
                        ? (item?.cAddress.toLowerCase() === '0x4a92e71227d294f041bd82dd8f78591b75140d63'
                            ? parseFloat(item?.borrowBalance) / (10 * Math.pow(10, 5))
                            : parseFloat(utils.formatEther(item?.borrowBalance))
                          ).toFixed(4)
                        : ''}
                      {' ' + item?.symbol}
                    </ItemBottomWrap>
                  </ItemWrap>
                  <ItemWrap>
                    {item?.liquidity && item?.underlyingPrice
                      ? (
                          ((parseFloat(utils.formatEther(item?.borrowBalance)) *
                            parseFloat(utils.formatEther(item?.underlyingPrice))) /
                            getLimit()) *
                          100
                        ).toFixed(1)
                      : ''}
                    %
                  </ItemWrap>
                </AssetItem>
              ))}
            </AssetItemWrap>
          </AssetWrap>
        </MarketsCard>
      )}
      <MarketsCard>
        <AssetWrap>
          <MarketsCardHeader>Borrow Markets</MarketsCardHeader>
          <AssetWrapLabels>
            <AssetLabel textAlign={'left'}>Asset</AssetLabel>
            <AssetLabel textAlign={'right'}>APY</AssetLabel>
            <AssetLabel textAlign={'right'}>Wallet</AssetLabel>
            <AssetLabel textAlign={'right'}>Liquidity</AssetLabel>
          </AssetWrapLabels>
          <AssetItemWrap>
            {!!borrowAsset.length
              ? borrowAsset.map((item: any) => (
                  <AssetItem key={item?.symbol}>
                    <AssetLogo>
                      <CurrencyIcon address={item?.address} style={{ marginRight: '10px' }} />
                      {item?.symbol}
                    </AssetLogo>
                    <ItemWrap>
                      {(
                        (Math.pow((item?.borrowRatePerBlock / ethMantissa) * blocksPerDay + 1, daysPerYear - 1) - 1) *
                        100
                      ).toFixed(2)}
                      %
                    </ItemWrap>
                    <ItemWrap>
                      $
                      {item?.borrowBalance && item?.underlyingPrice
                        ? (
                            parseFloat(utils.formatEther(item?.borrowBalance)) *
                            parseFloat(utils.formatEther(item?.underlyingPrice))
                          ).toFixed(2)
                        : ''}
                    </ItemWrap>
                    <ItemWrap>
                      {item?.liquidity && item?.underlyingPrice
                        ? (parseFloat(utils.formatEther(item?.liquidity)) *
                            parseFloat(utils.formatEther(item?.underlyingPrice))) /
                            1000 <
                          100
                          ? (
                              (parseFloat(utils.formatEther(item?.liquidity)) *
                                parseFloat(utils.formatEther(item?.underlyingPrice))) /
                              1000
                            ).toFixed(1)
                          : '< 0.1'
                        : ''}
                      K
                    </ItemWrap>
                  </AssetItem>
                ))
              : ''}
          </AssetItemWrap>
        </AssetWrap>
      </MarketsCard>
    </div>
  )
}

export default BorrowMarkets
