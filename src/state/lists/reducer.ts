import { DEFAULT_ACTIVE_LIST_URLS } from './../../constants/lists'
import { createReducer } from '@reduxjs/toolkit'
import { getVersionUpgrade, VersionUpgrade } from '@uniswap/token-lists'
import { TokenList } from '@uniswap/token-lists/dist/types'
import { DEFAULT_LIST_OF_LISTS } from '../../constants/lists'
import { updateVersion } from '../global/actions'
import { acceptListUpdate, addList, fetchTokenList, removeList, enableList, disableList, PathNameType } from './actions'

export interface ListsState {
  readonly byOsUrl: {
    readonly [pathName: string]: {
      readonly [url: string]: {
        readonly current: TokenList | null
        readonly pendingUpdate: TokenList | null
        readonly loadingRequestId: string | null
        readonly error: string | null
      }
    }
  }
  // this contains the default list of lists from the last time the updateVersion was called, i.e. the app was reloaded
  readonly lastInitializedDefaultOsListOfLists?: { uniswap: string[]; sushiswap: string[] }

  // currently active lists
  readonly activeOsListUrls: { uniswap: string[]; sushiswap: string[] } | undefined
}

type ListState = ListsState['byOsUrl'][string][string]

const NEW_LIST_STATE: ListState = {
  error: null,
  current: null,
  loadingRequestId: null,
  pendingUpdate: null
}

type Mutable<T> = { -readonly [P in keyof T]: T[P] extends ReadonlyArray<infer U> ? U[] : T[P] }

const initialState: ListsState = {
  lastInitializedDefaultOsListOfLists: DEFAULT_LIST_OF_LISTS,
  byOsUrl: {
    uniswap: {
      ...DEFAULT_LIST_OF_LISTS.uniswap.reduce<Mutable<ListsState['byOsUrl']['uniswap']>>((memo, listUrl) => {
        memo[listUrl] = NEW_LIST_STATE
        return memo
      }, {})
    },
    sushiswap: {
      ...DEFAULT_LIST_OF_LISTS.sushiswap.reduce<Mutable<ListsState['byOsUrl']['sushiswap']>>((memo, listUrl) => {
        memo[listUrl] = NEW_LIST_STATE
        return memo
      }, {})
    }
  },
  activeOsListUrls: DEFAULT_ACTIVE_LIST_URLS
}

export default createReducer(initialState, builder =>
  builder
    .addCase(fetchTokenList.pending, (state, { payload: { requestId, pathName, url } }) => {
      state.byOsUrl[pathName][url] = {
        current: null,
        pendingUpdate: null,
        ...state.byOsUrl[pathName][url],
        loadingRequestId: requestId,
        error: null
      }
    })
    .addCase(fetchTokenList.fulfilled, (state, { payload: { requestId, tokenList, pathName, url } }) => {
      const current = state.byOsUrl[pathName][url]?.current
      const loadingRequestId = state.byOsUrl[pathName][url]?.loadingRequestId

      // no-op if update does nothing
      if (current) {
        const upgradeType = getVersionUpgrade(current.version, tokenList.version)

        if (upgradeType === VersionUpgrade.NONE) return
        if (loadingRequestId === null || loadingRequestId === requestId) {
          state.byOsUrl[pathName][url] = {
            ...state.byOsUrl[pathName][url],
            loadingRequestId: null,
            error: null,
            current: current,
            pendingUpdate: tokenList
          }
        }
      } else {
        state.byOsUrl[pathName][url] = {
          ...state.byOsUrl[pathName][url],
          loadingRequestId: null,
          error: null,
          current: tokenList,
          pendingUpdate: null
        }
      }
    })
    .addCase(fetchTokenList.rejected, (state, { payload: { url, pathName, requestId, errorMessage } }) => {
      if (state.byOsUrl[pathName][url]?.loadingRequestId !== requestId) {
        // no-op since it's not the latest request
        return
      }

      state.byOsUrl[pathName][url] = {
        ...state.byOsUrl[pathName][url],
        loadingRequestId: null,
        error: errorMessage,
        current: null,
        pendingUpdate: null
      }
    })
    .addCase(addList, (state, { payload: { url, pathName } }) => {
      if (!state.byOsUrl[pathName][url]) {
        state.byOsUrl[pathName][url] = NEW_LIST_STATE
      }
    })
    .addCase(removeList, (state, { payload: { url, pathName } }) => {
      if (state.byOsUrl[pathName][url]) {
        delete state.byOsUrl[pathName][url]
      }
      // remove list from active urls if needed
      if (state.activeOsListUrls?.[pathName] && state.activeOsListUrls[pathName].includes(url)) {
        state.activeOsListUrls[pathName] = state.activeOsListUrls[pathName].filter(u => u !== url)
      }
    })
    .addCase(enableList, (state, { payload: { url, pathName } }) => {
      if (!state.byOsUrl[pathName][url]) {
        state.byOsUrl[pathName][url] = NEW_LIST_STATE
      }

      if (state.activeOsListUrls && !state.activeOsListUrls[pathName].includes(url)) {
        state.activeOsListUrls[pathName].push(url)
      }

      if (!state.activeOsListUrls) {
        if (pathName === 'uniswap') {
          state.activeOsListUrls = {
            uniswap: [url],
            sushiswap: [...DEFAULT_ACTIVE_LIST_URLS.sushiswap]
          }
        } else {
          state.activeOsListUrls = {
            uniswap: [...DEFAULT_ACTIVE_LIST_URLS.uniswap],
            sushiswap: [url]
          }
        }
      }
    })
    .addCase(disableList, (state, { payload: { url, pathName } }) => {
      if (state.activeOsListUrls && state.activeOsListUrls[pathName].includes(url)) {
        state.activeOsListUrls[pathName] = state.activeOsListUrls[pathName].filter(u => u !== url)
      }
    })
    .addCase(acceptListUpdate, (state, { payload: { url, pathName } }) => {
      if (!state.byOsUrl[pathName][url]?.pendingUpdate) {
        throw new Error('accept list update called without pending update')
      }
      state.byOsUrl[pathName][url] = {
        ...state.byOsUrl[pathName][url],
        pendingUpdate: null,
        current: state.byOsUrl[pathName][url].pendingUpdate
      }
    })
    .addCase(updateVersion, state => {
      // state loaded from localStorage, but new lists have never been initialized
      if (!state.lastInitializedDefaultOsListOfLists) {
        state.byOsUrl = initialState.byOsUrl
        state.activeOsListUrls = initialState.activeOsListUrls
      } else if (state.lastInitializedDefaultOsListOfLists) {
        let lastInitializedSet: Set<string> = new Set()
        Object.keys(state.lastInitializedDefaultOsListOfLists).forEach(listKey => {
          const list = state.lastInitializedDefaultOsListOfLists?.[listKey as PathNameType].reduce<Set<string>>(
            (s, l) => s.add(l),
            new Set()
          )
          if (list) {
            lastInitializedSet = new Set([...lastInitializedSet, ...list])
          }
        })

        let newListOfListsSet: Set<string> = new Set()
        Object.keys(DEFAULT_LIST_OF_LISTS).forEach(listKey => {
          const list = DEFAULT_LIST_OF_LISTS?.[listKey as PathNameType].reduce<Set<string>>(
            (s, l) => s.add(l),
            new Set()
          )
          if (list) {
            newListOfListsSet = new Set([...newListOfListsSet, ...list])
          }
        })

        Object.keys(DEFAULT_LIST_OF_LISTS).map(listKey =>
          DEFAULT_LIST_OF_LISTS[listKey as PathNameType].forEach(listUrl => {
            if (!lastInitializedSet.has(listUrl)) {
              state.byOsUrl[listKey][listUrl] = NEW_LIST_STATE
            }
          })
        )

        Object.keys(state.lastInitializedDefaultOsListOfLists).forEach(listKey => {
          state.lastInitializedDefaultOsListOfLists?.[listKey as PathNameType].forEach(listUrl => {
            if (!newListOfListsSet.has(listUrl)) {
              delete state.byOsUrl[listKey][listUrl]
            }
          })
        })
      }

      state.lastInitializedDefaultOsListOfLists = DEFAULT_LIST_OF_LISTS

      // if no active lists, activate defaults
      if (!state.activeOsListUrls) {
        state.activeOsListUrls = DEFAULT_ACTIVE_LIST_URLS

        // for each list on default list, initialize if needed
        Object.keys(DEFAULT_ACTIVE_LIST_URLS).forEach(listKey => {
          DEFAULT_ACTIVE_LIST_URLS[listKey as PathNameType].forEach((listUrl: string) => {
            if (!state.byOsUrl[listKey][listUrl]) {
              state.byOsUrl[listKey][listUrl] = NEW_LIST_STATE
            }
            return true
          })
        })
      }
    })
)
