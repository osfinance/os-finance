import { createReducer } from '@reduxjs/toolkit'
import { Field, resetMintState, typeInput } from './actions'

export interface MintState {
  readonly independentField: Field
  readonly typedValue: string
}

const initialState: MintState = {
  independentField: Field.CURRENCY,
  typedValue: ''
}

export default createReducer<MintState>(initialState, builder =>
  builder
    .addCase(resetMintState, () => initialState)
    .addCase(typeInput, (state, { payload: { field, typedValue, noLiquidity } }) => {
      return {
        ...state,
        independentField: field,
        typedValue
      }
    })
)
