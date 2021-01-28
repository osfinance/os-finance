import React from 'react'
import { Redirect, RouteComponentProps } from 'react-router-dom'

// Redirects to pool but only replace the pathname
export function RedirectPathToPoolOnly({ location }: RouteComponentProps) {
  return <Redirect to={{ ...location, pathname: '/compound/pool' }} />
}
