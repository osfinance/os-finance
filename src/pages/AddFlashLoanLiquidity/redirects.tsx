import React from 'react'
import { Redirect, RouteComponentProps } from 'react-router-dom'
import AddFlashLoanLiquidity from './index'

export function RedirectToAddLiquidity() {
  return <Redirect to="/add/" />
}

export function RedirectFlashLoanAddLiquidity(props: RouteComponentProps<{ currencyId: string }>) {
  return <AddFlashLoanLiquidity {...props} />
}
