import { ActionCreatorWithPayload, createAction } from '@reduxjs/toolkit'
import { TokenList, Version } from '@uniswap/token-lists'

export type PathNameType = 'uniswap' | 'sushiswap'

export const fetchTokenList: Readonly<{
  pending: ActionCreatorWithPayload<{ url: string; requestId: string; pathName: PathNameType }>
  fulfilled: ActionCreatorWithPayload<{ url: string; tokenList: TokenList; requestId: string; pathName: PathNameType }>
  rejected: ActionCreatorWithPayload<{ url: string; errorMessage: string; requestId: string; pathName: PathNameType }>
}> = {
  pending: createAction('lists/fetchTokenList/pending'),
  fulfilled: createAction('lists/fetchTokenList/fulfilled'),
  rejected: createAction('lists/fetchTokenList/rejected')
}
// add and remove from list options
export const addList = createAction<{ url: string; pathName: PathNameType }>('lists/addList')
export const removeList = createAction<{ url: string; pathName: PathNameType }>('lists/removeList')

// select which lists to search across from loaded lists
export const enableList = createAction<{ url: string; pathName: PathNameType }>('lists/enableList')
export const disableList = createAction<{ url: string; pathName: PathNameType }>('lists/disableList')

// versioning
export const acceptListUpdate = createAction<{ url: string; pathName: PathNameType }>('lists/acceptListUpdate')
export const rejectVersionUpdate = createAction<Version>('lists/rejectVersionUpdate')
