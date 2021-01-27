import { DEFAULT_ACTIVE_LIST_URLS } from './../../constants/lists'
import { createStore, Store } from 'redux'
import { DEFAULT_LIST_OF_LISTS } from '../../constants/lists'
import { updateVersion } from '../global/actions'
import { fetchTokenList, acceptListUpdate, addList, removeList, enableList } from './actions'
import reducer, { ListsState } from './reducer'

const STUB_TOKEN_LIST = {
  name: '',
  timestamp: '',
  version: { major: 1, minor: 1, patch: 1 },
  tokens: []
}

const PATCHED_STUB_LIST = {
  ...STUB_TOKEN_LIST,
  version: { ...STUB_TOKEN_LIST.version, patch: STUB_TOKEN_LIST.version.patch + 1 }
}
const MINOR_UPDATED_STUB_LIST = {
  ...STUB_TOKEN_LIST,
  version: { ...STUB_TOKEN_LIST.version, minor: STUB_TOKEN_LIST.version.minor + 1 }
}
const MAJOR_UPDATED_STUB_LIST = {
  ...STUB_TOKEN_LIST,
  version: { ...STUB_TOKEN_LIST.version, major: STUB_TOKEN_LIST.version.major + 1 }
}

describe('list reducer', () => {
  let store: Store<ListsState>

  beforeEach(() => {
    store = createStore(reducer, {
      byOsUrl: { uniswap: {}, sushiswap: {} },
      activeOsListUrls: undefined
    })
  })

  describe('fetchTokenList', () => {
    describe('pending', () => {
      it('sets pending', () => {
        store.dispatch(fetchTokenList.pending({ requestId: 'request-id', pathName: 'uniswap', url: 'fake-url' }))
        expect(store.getState()).toEqual({
          byOsUrl: {
            uniswap: {
              'fake-url': {
                error: null,
                loadingRequestId: 'request-id',
                current: null,
                pendingUpdate: null
              }
            },
            sushiswap: {}
          },
          selectedOsListUrl: undefined
        })
      })

      it('does not clear current list', () => {
        store = createStore(reducer, {
          byOsUrl: {
            uniswap: {
              'fake-url': {
                error: null,
                current: STUB_TOKEN_LIST,
                pendingUpdate: null,
                loadingRequestId: null
              }
            }
          },
          activeOsListUrls: undefined
        })

        store.dispatch(fetchTokenList.pending({ requestId: 'request-id', pathName: 'uniswap', url: 'fake-url' }))
        expect(store.getState()).toEqual({
          byOsUrl: {
            uniswap: {
              'fake-url': {
                error: null,
                current: STUB_TOKEN_LIST,
                loadingRequestId: 'request-id',
                pendingUpdate: null
              }
            }
          },
          activeOsListUrls: undefined
        })
      })
    })

    describe('fulfilled', () => {
      it('saves the list', () => {
        store.dispatch(
          fetchTokenList.fulfilled({
            tokenList: STUB_TOKEN_LIST,
            requestId: 'request-id',
            pathName: 'uniswap',
            url: 'fake-url'
          })
        )
        expect(store.getState()).toEqual({
          byOsUrl: {
            uniswap: {
              'fake-url': {
                error: null,
                current: STUB_TOKEN_LIST,
                loadingRequestId: null,
                pendingUpdate: null
              }
            },
            sushiswap: {}
          },
          activeOsListUrls: undefined
        })
      })

      it('does not save the list in pending if current is same', () => {
        store.dispatch(
          fetchTokenList.fulfilled({
            tokenList: STUB_TOKEN_LIST,
            requestId: 'request-id',
            pathName: 'uniswap',
            url: 'fake-url'
          })
        )
        store.dispatch(
          fetchTokenList.fulfilled({
            tokenList: STUB_TOKEN_LIST,
            requestId: 'request-id',
            pathName: 'uniswap',
            url: 'fake-url'
          })
        )
        expect(store.getState()).toEqual({
          byOsUrl: {
            uniswap: {
              'fake-url': {
                error: null,
                current: STUB_TOKEN_LIST,
                loadingRequestId: null,
                pendingUpdate: null
              }
            },
            sushiswap: {}
          },
          activeOsListUrls: undefined
        })
      })

      it('does not save to current if list is newer patch version', () => {
        store.dispatch(
          fetchTokenList.fulfilled({
            tokenList: STUB_TOKEN_LIST,
            requestId: 'request-id',
            pathName: 'uniswap',
            url: 'fake-url'
          })
        )

        store.dispatch(
          fetchTokenList.fulfilled({
            tokenList: PATCHED_STUB_LIST,
            requestId: 'request-id',
            pathName: 'uniswap',
            url: 'fake-url'
          })
        )
        expect(store.getState()).toEqual({
          byOsUrl: {
            uniswap: {
              'fake-url': {
                error: null,
                current: STUB_TOKEN_LIST,
                loadingRequestId: null,
                pendingUpdate: PATCHED_STUB_LIST
              }
            },
            sushiswap: {}
          },
          activeOsListUrls: undefined
        })
      })
      it('does not save to current if list is newer minor version', () => {
        store.dispatch(
          fetchTokenList.fulfilled({
            tokenList: STUB_TOKEN_LIST,
            requestId: 'request-id',
            pathName: 'uniswap',
            url: 'fake-url'
          })
        )

        store.dispatch(
          fetchTokenList.fulfilled({
            tokenList: MINOR_UPDATED_STUB_LIST,
            requestId: 'request-id',
            pathName: 'uniswap',
            url: 'fake-url'
          })
        )
        expect(store.getState()).toEqual({
          byOsUrl: {
            uniswap: {
              'fake-url': {
                error: null,
                current: STUB_TOKEN_LIST,
                loadingRequestId: null,
                pendingUpdate: MINOR_UPDATED_STUB_LIST
              }
            },
            sushiswap: {}
          },
          activeOsListUrls: undefined
        })
      })
      it('does not save to pending if list is newer major version', () => {
        store.dispatch(
          fetchTokenList.fulfilled({
            tokenList: STUB_TOKEN_LIST,
            requestId: 'request-id',
            pathName: 'uniswap',
            url: 'fake-url'
          })
        )

        store.dispatch(
          fetchTokenList.fulfilled({
            tokenList: MAJOR_UPDATED_STUB_LIST,
            requestId: 'request-id',
            pathName: 'uniswap',
            url: 'fake-url'
          })
        )
        expect(store.getState()).toEqual({
          byOsUrl: {
            uniswap: {
              'fake-url': {
                error: null,
                current: STUB_TOKEN_LIST,
                loadingRequestId: null,
                pendingUpdate: MAJOR_UPDATED_STUB_LIST
              }
            },
            sushiswap: {}
          },
          activeOsListUrls: undefined
        })
      })
    })

    describe('rejected', () => {
      it('no-op if not loading', () => {
        store.dispatch(
          fetchTokenList.rejected({
            requestId: 'request-id',
            errorMessage: 'abcd',
            pathName: 'uniswap',
            url: 'fake-url'
          })
        )
        expect(store.getState()).toEqual({
          byOsUrl: { uniswap: {}, sushiswap: {} },
          activeOsListUrls: undefined
        })
      })

      it('sets the error if loading', () => {
        store = createStore(reducer, {
          byOsUrl: {
            uniswap: {
              'fake-url': {
                error: null,
                current: null,
                loadingRequestId: 'request-id',
                pendingUpdate: null
              }
            },
            sushiswap: {}
          },
          activeOsListUrls: undefined
        })
        store.dispatch(
          fetchTokenList.rejected({
            requestId: 'request-id',
            errorMessage: 'abcd',
            pathName: 'uniswap',
            url: 'fake-url'
          })
        )
        expect(store.getState()).toEqual({
          byOsUrl: {
            uniswap: {
              'fake-url': {
                error: 'abcd',
                current: null,
                loadingRequestId: null,
                pendingUpdate: null
              }
            },
            sushiswap: {}
          },
          activeOsListUrls: undefined
        })
      })
    })
  })

  describe('addList', () => {
    it('adds the list key to byOsUrl', () => {
      store.dispatch(addList({ url: 'list-id', pathName: 'uniswap' }))
      expect(store.getState()).toEqual({
        byOsUrl: {
          uniswap: {
            'list-id': {
              error: null,
              current: null,
              loadingRequestId: null,
              pendingUpdate: null
            }
          },
          sushiswap: {}
        },
        activeOsListUrls: undefined
      })
    })
    it('no op for existing list', () => {
      store = createStore(reducer, {
        byOsUrl: {
          uniswap: {
            'fake-url': {
              error: null,
              current: STUB_TOKEN_LIST,
              loadingRequestId: null,
              pendingUpdate: null
            }
          },
          sushiswap: {}
        },
        activeOsListUrls: undefined
      })
      store.dispatch(addList({ url: 'fake-url', pathName: 'uniswap' }))
      expect(store.getState()).toEqual({
        byOsUrl: {
          uniswap: {
            'fake-url': {
              error: null,
              current: STUB_TOKEN_LIST,
              loadingRequestId: null,
              pendingUpdate: null
            }
          },
          sushiswap: {}
        },
        activeOsListUrls: undefined
      })
    })
  })

  describe('acceptListUpdate', () => {
    it('swaps pending update into current', () => {
      store = createStore(reducer, {
        byOsUrl: {
          uniswap: {
            'fake-url': {
              error: null,
              current: STUB_TOKEN_LIST,
              loadingRequestId: null,
              pendingUpdate: PATCHED_STUB_LIST
            }
          },
          sushiswap: {}
        },
        activeOsListUrls: undefined
      })
      store.dispatch(acceptListUpdate({ url: 'fake-url', pathName: 'uniswap' }))
      expect(store.getState()).toEqual({
        byOsUrl: {
          uniswap: {
            'fake-url': {
              error: null,
              current: PATCHED_STUB_LIST,
              loadingRequestId: null,
              pendingUpdate: null
            }
          },
          sushiswap: {}
        },
        activeOsListUrls: undefined
      })
    })
  })

  describe('removeList', () => {
    it('deletes the list key', () => {
      store = createStore(reducer, {
        byOsUrl: {
          uniswap: {
            'fake-url': {
              error: null,
              current: STUB_TOKEN_LIST,
              loadingRequestId: null,
              pendingUpdate: PATCHED_STUB_LIST
            }
          },
          sushiswap: {}
        },
        activeOsListUrls: undefined
      })
      store.dispatch(removeList({ url: 'fake-url', pathName: 'uniswap' }))
      expect(store.getState()).toEqual({
        byOsUrl: { uniswap: {}, sushiswap: {} },
        activeOsListUrls: undefined
      })
    })
    it('Removes from active lists if active list is removed', () => {
      store = createStore(reducer, {
        byOsUrl: {
          uniswap: {
            'fake-url': {
              error: null,
              current: STUB_TOKEN_LIST,
              loadingRequestId: null,
              pendingUpdate: PATCHED_STUB_LIST
            }
          },
          sushiswap: {}
        },
        activeOsListUrls: { uniswap: ['fake-url'], sushiswap: [] }
      })
      store.dispatch(removeList({ url: 'fake-url', pathName: 'uniswap' }))
      expect(store.getState()).toEqual({
        byOsUrl: { uniswap: {}, sushiswap: {} },
        activeOsListUrls: { uniswap: [], sushiswap: [] }
      })
    })
  })

  describe('enableList', () => {
    it('enables a list url', () => {
      store = createStore(reducer, {
        byOsUrl: {
          uniswap: {
            'fake-url': {
              error: null,
              current: STUB_TOKEN_LIST,
              loadingRequestId: null,
              pendingUpdate: PATCHED_STUB_LIST
            }
          },
          sushiswap: {}
        },
        activeOsListUrls: undefined
      })
      store.dispatch(enableList({ url: 'fake-url', pathName: 'uniswap' }))
      expect(store.getState()).toEqual({
        byOsUrl: {
          uniswap: {
            'fake-url': {
              error: null,
              current: STUB_TOKEN_LIST,
              loadingRequestId: null,
              pendingUpdate: PATCHED_STUB_LIST
            }
          },
          sushiswap: {}
        },
        activeOsListUrls: { uniswap: ['fake-url'], sushiswap: [DEFAULT_TOKEN_LIST_URL['sushiswap']] }
      })
    })
    it('adds to url keys if not present already on enable', () => {
      store = createStore(reducer, {
        byOsUrl: {
          uniswap: {
            'fake-url': {
              error: null,
              current: STUB_TOKEN_LIST,
              loadingRequestId: null,
              pendingUpdate: PATCHED_STUB_LIST
            }
          },
          sushiswap: {}
        },
        activeOsListUrls: undefined
      })
      store.dispatch(enableList({ url: 'fake-url-invalid', pathName: 'uniswap' }))
      expect(store.getState()).toEqual({
        byOsUrl: {
          uniswap: {
            'fake-url': {
              error: null,
              current: STUB_TOKEN_LIST,
              loadingRequestId: null,
              pendingUpdate: PATCHED_STUB_LIST
            },
            'fake-url-invalid': {
              error: null,
              current: null,
              loadingRequestId: null,
              pendingUpdate: null
            }
          },
          sushiswap: {}
        },
        activeOsListUrls: { uniswap: ['fake-url-invalid'], sushiswap: [DEFAULT_TOKEN_LIST_URL['sushiswap']] }
      })
    })
    it('enable works if list already added', () => {
      store = createStore(reducer, {
        byOsUrl: {
          uniswap: {
            'fake-url': {
              error: null,
              current: null,
              loadingRequestId: null,
              pendingUpdate: null
            }
          },
          sushiswap: {}
        },
        activeOsListUrls: undefined
      })
      store.dispatch(enableList({ url: 'fake-url', pathName: 'uniswap' }))
      expect(store.getState()).toEqual({
        byOsUrl: {
          uniswap: {
            'fake-url': {
              error: null,
              current: null,
              loadingRequestId: null,
              pendingUpdate: null
            }
          },
          sushiswap: {}
        },
        activeOsListUrls: { uniswap: ['fake-url'], sushiswap: [DEFAULT_TOKEN_LIST_URL['sushiswap']] }
      })
    })
  })

  describe('updateVersion', () => {
    describe('never initialized', () => {
      beforeEach(() => {
        store = createStore(reducer, {
          byOsUrl: {
            uniswap: {
              'https://unpkg.com/@uniswap/default-token-list@latest/uniswap-default.tokenlist.json': {
                error: null,
                current: STUB_TOKEN_LIST,
                loadingRequestId: null,
                pendingUpdate: null
              },
              'https://unpkg.com/@uniswap/default-token-list@latest': {
                error: null,
                current: STUB_TOKEN_LIST,
                loadingRequestId: null,
                pendingUpdate: null
              }
            },
            sushiswap: {}
          },
          activeOsListUrls: undefined
        })
        store.dispatch(updateVersion())
      })

      it('clears the current lists', () => {
        expect(
          store.getState().byOsUrl[
            'https://unpkg.com/@uniswap/default-token-list@latest/uniswap-default.tokenlist.json'
          ]
        ).toBeUndefined()
        expect(store.getState().byOsUrl['https://unpkg.com/@uniswap/default-token-list@latest']).toBeUndefined()
      })

      it('puts in all the new lists', () => {
        expect(Object.keys(store.getState().byOsUrl.uniswap)).toEqual(DEFAULT_LIST_OF_LISTS.uniswap)
      })
      it('all lists are empty', () => {
        const s = store.getState()
        Object.keys(s.byOsUrl['uniswap']).forEach(url => {
          if (url === DEFAULT_TOKEN_LIST_URL['uniswap']) {
            expect(s.byOsUrl['uniswap'][url]).toEqual({
              error: null,
              current: null,
              loadingRequestId: null,
              pendingUpdate: null
            })
          } else {
            expect(s.byOsUrl['uniswap'][url]).toEqual({
              error: null,
              current: null,
              loadingRequestId: null,
              pendingUpdate: null
            })
          }
        })
      })
      it('sets initialized lists', () => {
        expect(store.getState().lastInitializedDefaultOsListOfLists).toEqual(DEFAULT_LIST_OF_LISTS)
      })
      it('sets selected list', () => {
        expect(store.getState().activeOsListUrls).toEqual(DEFAULT_ACTIVE_LIST_URLS)
      })
    })
    describe('initialized with a different set of lists', () => {
      beforeEach(() => {
        store = createStore(reducer, {
          byOsUrl: {
            uniswap: {
              'https://unpkg.com/@uniswap/default-token-list@latest/uniswap-default.tokenlist.json': {
                error: null,
                current: STUB_TOKEN_LIST,
                loadingRequestId: null,
                pendingUpdate: null
              },
              'https://unpkg.com/@uniswap/default-token-list@latest': {
                error: null,
                current: STUB_TOKEN_LIST,
                loadingRequestId: null,
                pendingUpdate: null
              }
            },
            sushiswap: {}
          },
          activeOsListUrls: undefined,
          lastInitializedDefaultOsListOfLists: {
            uniswap: ['https://unpkg.com/@uniswap/default-token-list@latest'],
            sushiswap: []
          }
        })
        store.dispatch(updateVersion())
      })

      it('does not remove lists not in last initialized list of lists', () => {
        expect(
          store.getState().byOsUrl['uniswap'][
            'https://unpkg.com/@uniswap/default-token-list@latest/uniswap-default.tokenlist.json'
          ]
        ).toEqual({
          error: null,
          current: STUB_TOKEN_LIST,
          loadingRequestId: null,
          pendingUpdate: null
        })
      })
      it('removes lists in the last initialized list of lists', () => {
        expect(
          store.getState().byOsUrl['uniswap']['https://unpkg.com/@uniswap/default-token-list@latest']
        ).toBeUndefined()
      })

      it('adds all the lists in the default list of lists', () => {
        expect(Object.keys(store.getState().byOsUrl.uniswap)).toContain(DEFAULT_TOKEN_LIST_URL.uniswap)
      })

      it('each of those initialized lists is empty', () => {
        const byOsUrl = store.getState().byOsUrl.uniswap
        // note we don't expect the uniswap default list to be prepopulated
        // this is ok.
        Object.keys(byOsUrl).forEach(url => {
          if (url !== 'https://unpkg.com/@uniswap/default-token-list@latest/uniswap-default.tokenlist.json') {
            expect(byOsUrl[url]).toEqual({
              error: null,
              current: null,
              loadingRequestId: null,
              pendingUpdate: null
            })
          }
        })
      })

      it('sets initialized lists', () => {
        expect(store.getState().lastInitializedDefaultOsListOfLists).toEqual(DEFAULT_LIST_OF_LISTS)
      })
      it('sets default list to selected list', () => {
        expect(store.getState().activeOsListUrls).toEqual(DEFAULT_ACTIVE_LIST_URLS)
      })
      it('default list is initialized', () => {
        expect(store.getState().byOsUrl['uniswap'][DEFAULT_TOKEN_LIST_URL['uniswap']]).toEqual({
          error: null,
          current: null,
          loadingRequestId: null,
          pendingUpdate: null
        })
      })
    })
  })
})
