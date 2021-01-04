import React, { ReactNode } from 'react'
import styled from 'styled-components'

const StyledPage = styled.div`
  width: 100%;
`

const StyledMain = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - ${({ theme }) => theme.topBarSize * 2}px);
`

export default function Page({ children }: { children: ReactNode }) {
  return (
    <StyledPage>
      <StyledMain>{children}</StyledMain>
    </StyledPage>
  )
}