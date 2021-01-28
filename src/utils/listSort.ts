import { PathNameType } from 'state/lists/actions'
import { DEFAULT_LIST_OF_LISTS } from './../constants/lists'

// use ordering of default list of lists to assign priority
export default function sortByListPriority(pathName: PathNameType) {
  return (urlA: string, urlB: string) => {
    const first = DEFAULT_LIST_OF_LISTS[pathName].includes(urlA)
      ? DEFAULT_LIST_OF_LISTS[pathName].indexOf(urlA)
      : Number.MAX_SAFE_INTEGER
    const second = DEFAULT_LIST_OF_LISTS[pathName].includes(urlB)
      ? DEFAULT_LIST_OF_LISTS[pathName].indexOf(urlB)
      : Number.MAX_SAFE_INTEGER

    // need reverse order to make sure mapping includes top priority last
    if (first < second) return 1
    else if (first > second) return -1
    return 0
  }
}
