import { createAction } from '@reduxjs/toolkit'

export enum Field {
  CURRENCY = 'CURRENCY'
}

export const typeInput = createAction<{ field: Field; typedValue: string; noLiquidity: boolean }>(
  'flashLoanMint/typeInputMint'
)
export const resetMintState = createAction<void>('flashLoanMint/resetMintState')
