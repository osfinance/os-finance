import { createStore, Store } from 'redux'

import { Field, typeInput } from './actions'
import reducer, { MintState } from './reducer'

describe('mint reducer', () => {
  let store: Store<MintState>

  beforeEach(() => {
    store = createStore(reducer, {
      independentField: Field.CURRENCY,
      typedValue: ''
    })
  })

  describe('typeInput', () => {
    it('sets typed value', () => {
      store.dispatch(typeInput({ field: Field.CURRENCY, typedValue: '1.0', noLiquidity: false }))
      expect(store.getState()).toEqual({ independentField: Field.CURRENCY, typedValue: '1.0' })
    })
  })
})
