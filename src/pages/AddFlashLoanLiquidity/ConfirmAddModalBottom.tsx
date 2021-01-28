import { Currency, CurrencyAmount, Percent } from '@uniswap/sdk'
import React from 'react'
import { Text } from 'rebass'
import { ButtonPrimary } from '../../components/Button'
import { RowBetween, RowFixed } from '../../components/Row'
import CurrencyLogo from '../../components/CurrencyLogo'
import { Field } from '../../state/flashLoanMint/actions'
import { TYPE } from '../../theme'

export function ConfirmAddModalBottom({
  noLiquidity,
  currencies,
  parsedAmounts,
  poolTokenPercentage,
  onAdd
}: {
  noLiquidity?: boolean
  currencies: { [field in Field]?: Currency }
  parsedAmounts: { [field in Field]?: CurrencyAmount }
  poolTokenPercentage?: Percent
  onAdd: () => void
}) {
  return (
    <>
      <RowBetween>
        <TYPE.body>{currencies[Field.CURRENCY]?.symbol} Deposited</TYPE.body>
        <RowFixed>
          <CurrencyLogo currency={currencies[Field.CURRENCY]} style={{ marginRight: '8px' }} />
          <TYPE.body>{parsedAmounts[Field.CURRENCY]?.toSignificant(6)}</TYPE.body>
        </RowFixed>
      </RowBetween>
      <RowBetween>
        <TYPE.body>Share of Pool:</TYPE.body>
        <TYPE.body>{noLiquidity ? '100' : poolTokenPercentage?.toSignificant(4)}%</TYPE.body>
      </RowBetween>
      <ButtonPrimary style={{ margin: '20px 0 0 0' }} onClick={onAdd}>
        <Text fontWeight={500} fontSize={20}>
          {noLiquidity ? 'Create Pool & Supply' : 'Confirm Supply'}
        </Text>
      </ButtonPrimary>
    </>
  )
}
