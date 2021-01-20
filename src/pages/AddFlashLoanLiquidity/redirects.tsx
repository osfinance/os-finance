import React from 'react'
import { Redirect, RouteComponentProps } from 'react-router-dom'
import AddFlashLoanLiquidity from './index'

export function RedirectToAddLiquidity() {
  return <Redirect to="/add/" />
}

const OLD_PATH_STRUCTURE = /^(0x[a-fA-F0-9]{40})$/
export function RedirectOldAddLiquidityPathStructure(props: RouteComponentProps<{ currencyId: string }>) {
  const {
    match: {
      params: { currencyId }
    }
  } = props
  const match = currencyId.match(OLD_PATH_STRUCTURE)
  if (match?.length) {
    return <Redirect to={`/add/${match[1]}`} />
  }

  return <AddFlashLoanLiquidity {...props} />
}

export function RedirectDuplicateTokenIds(props: RouteComponentProps<{ currencyIdA: string; currencyIdB: string }>) {
  const {
    match: {
      params: { currencyIdA, currencyIdB }
    }
  } = props
  if (currencyIdA.toLowerCase() === currencyIdB.toLowerCase()) {
    return <Redirect to={`/add/${currencyIdA}`} />
  }
  return <AddFlashLoanLiquidity {...props} />
}
