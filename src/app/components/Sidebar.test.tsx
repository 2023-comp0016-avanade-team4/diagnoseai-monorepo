import Sidebar, { getStylesForNavItem, ACTIVE_CLASSES, INACTIVE_CLASSES } from './Sidebar'
import { render } from '@testing-library/react'
import { usePathname } from 'next/navigation'

jest.mock('next/navigation', () => ({
  usePathname: jest.fn()
}))


describe("Sidebar", () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it("correct obtains styles for nav item depending on the current page", () => {
    expect(getStylesForNavItem('/', '/')).toBe(ACTIVE_CLASSES)
    expect(getStylesForNavItem('/no', '/')).toBe(INACTIVE_CLASSES)
    expect(getStylesForNavItem('/no', '/no')).toBe(ACTIVE_CLASSES)
    expect(getStylesForNavItem('/no2', '/no')).toBe(INACTIVE_CLASSES)
  })

  it("sidebar renders", () => {
    (usePathname as jest.Mock).mockReturnValueOnce('/')

    render(<Sidebar />)
    expect(usePathname).toHaveBeenCalled()
  })
})
