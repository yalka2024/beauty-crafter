import React from 'react'
import { render, screen } from '@testing-library/react'
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption
} from '@/components/ui/table'
import '@testing-library/jest-dom'

describe('Table', () => {
  it('should render with default props', () => {
    render(<Table data-testid="table" />)
    
    const table = screen.getByTestId('table')
    expect(table).toBeInTheDocument()
    expect(table.tagName).toBe('TABLE')
    expect(table).toHaveClass('w-full', 'caption-bottom', 'text-sm')
  })

  it('should apply custom className', () => {
    render(<Table className="custom-table" data-testid="table" />)
    
    const table = screen.getByTestId('table')
    expect(table).toHaveClass('custom-table')
    expect(table).toHaveClass('w-full', 'caption-bottom')
  })

  it('should pass through additional props', () => {
    render(<Table data-testid="table" id="test-table" aria-label="Test Table" />)
    
    const table = screen.getByTestId('table')
    expect(table).toHaveAttribute('id', 'test-table')
    expect(table).toHaveAttribute('aria-label', 'Test Table')
  })

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLTableElement>()
    render(<Table ref={ref} data-testid="table" />)
    
    expect(ref.current).toBe(screen.getByTestId('table'))
  })
})

describe('TableHeader', () => {
  it('should render with default props', () => {
    render(<TableHeader data-testid="table-header" />)
    
    const header = screen.getByTestId('table-header')
    expect(header).toBeInTheDocument()
    expect(header.tagName).toBe('THEAD')
    expect(header).toHaveClass('[&_tr]:border-b')
  })

  it('should apply custom className', () => {
    render(<TableHeader className="custom-header" data-testid="table-header" />)
    
    const header = screen.getByTestId('table-header')
    expect(header).toHaveClass('custom-header')
    expect(header).toHaveClass('[&_tr]:border-b')
  })

  it('should pass through additional props', () => {
    render(<TableHeader data-testid="table-header" id="header-id" aria-label="Table Header" />)
    
    const header = screen.getByTestId('table-header')
    expect(header).toHaveAttribute('id', 'header-id')
    expect(header).toHaveAttribute('aria-label', 'Table Header')
  })
})

describe('TableBody', () => {
  it('should render with default props', () => {
    render(<TableBody data-testid="table-body" />)
    
    const body = screen.getByTestId('table-body')
    expect(body).toBeInTheDocument()
    expect(body.tagName).toBe('TBODY')
    expect(body).toHaveClass('[&_tr:last-child]:border-0')
  })

  it('should apply custom className', () => {
    render(<TableBody className="custom-body" data-testid="table-body" />)
    
    const body = screen.getByTestId('table-body')
    expect(body).toHaveClass('custom-body')
    expect(body).toHaveClass('[&_tr:last-child]:border-0')
  })

  it('should pass through additional props', () => {
    render(<TableBody data-testid="table-body" id="body-id" aria-label="Table Body" />)
    
    const body = screen.getByTestId('table-body')
    expect(body).toHaveAttribute('id', 'body-id')
    expect(body).toHaveAttribute('aria-label', 'Table Body')
  })
})

describe('TableFooter', () => {
  it('should render with default props', () => {
    render(<TableFooter data-testid="table-footer" />)
    
    const footer = screen.getByTestId('table-footer')
    expect(footer).toBeInTheDocument()
    expect(footer.tagName).toBe('TFOOT')
    expect(footer).toHaveClass('border-t', 'bg-muted/50', 'font-medium')
  })

  it('should apply custom className', () => {
    render(<TableFooter className="custom-footer" data-testid="table-footer" />)
    
    const footer = screen.getByTestId('table-footer')
    expect(footer).toHaveClass('custom-footer')
    expect(footer).toHaveClass('border-t', 'bg-muted/50')
  })

  it('should pass through additional props', () => {
    render(<TableFooter data-testid="table-footer" id="footer-id" aria-label="Table Footer" />)
    
    const footer = screen.getByTestId('table-footer')
    expect(footer).toHaveAttribute('id', 'footer-id')
    expect(footer).toHaveAttribute('aria-label', 'Table Footer')
  })
})

describe('TableRow', () => {
  it('should render with default props', () => {
    render(<TableRow data-testid="table-row" />)
    
    const row = screen.getByTestId('table-row')
    expect(row).toBeInTheDocument()
    expect(row.tagName).toBe('TR')
    expect(row).toHaveClass('border-b', 'transition-colors', 'hover:bg-muted/50')
  })

  it('should apply custom className', () => {
    render(<TableRow className="custom-row" data-testid="table-row" />)
    
    const row = screen.getByTestId('table-row')
    expect(row).toHaveClass('custom-row')
    expect(row).toHaveClass('border-b', 'transition-colors')
  })

  it('should pass through additional props', () => {
    render(<TableRow data-testid="table-row" id="row-id" aria-label="Table Row" />)
    
    const row = screen.getByTestId('table-row')
    expect(row).toHaveAttribute('id', 'row-id')
    expect(row).toHaveAttribute('aria-label', 'Table Row')
  })
})

describe('TableHead', () => {
  it('should render with default props', () => {
    render(<TableHead data-testid="table-head">Header</TableHead>)
    
    const head = screen.getByTestId('table-head')
    expect(head).toBeInTheDocument()
    expect(head.tagName).toBe('TH')
    expect(head).toHaveTextContent('Header')
    expect(head).toHaveClass('h-12', 'px-4', 'text-left', 'align-middle', 'font-medium')
  })

  it('should apply custom className', () => {
    render(<TableHead className="custom-head" data-testid="table-head">Header</TableHead>)
    
    const head = screen.getByTestId('table-head')
    expect(head).toHaveClass('custom-head')
    expect(head).toHaveClass('h-12', 'px-4', 'text-left')
  })

  it('should pass through additional props', () => {
    render(<TableHead data-testid="table-head" id="head-id" aria-label="Table Head">Header</TableHead>)
    
    const head = screen.getByTestId('table-head')
    expect(head).toHaveAttribute('id', 'head-id')
    expect(head).toHaveAttribute('aria-label', 'Table Head')
  })
})

describe('TableCell', () => {
  it('should render with default props', () => {
    render(<TableCell data-testid="table-cell">Cell content</TableCell>)
    
    const cell = screen.getByTestId('table-cell')
    expect(cell).toBeInTheDocument()
    expect(cell.tagName).toBe('TD')
    expect(cell).toHaveTextContent('Cell content')
    expect(cell).toHaveClass('p-4', 'align-middle')
  })

  it('should apply custom className', () => {
    render(<TableCell className="custom-cell" data-testid="table-cell">Cell content</TableCell>)
    
    const cell = screen.getByTestId('table-cell')
    expect(cell).toHaveClass('custom-cell')
    expect(cell).toHaveClass('p-4', 'align-middle')
  })

  it('should pass through additional props', () => {
    render(<TableCell data-testid="table-cell" id="cell-id" aria-label="Table Cell">Cell content</TableCell>)
    
    const cell = screen.getByTestId('table-cell')
    expect(cell).toHaveAttribute('id', 'cell-id')
    expect(cell).toHaveAttribute('aria-label', 'Table Cell')
  })
})

describe('TableCaption', () => {
  it('should render with default props', () => {
    render(<TableCaption data-testid="table-caption">Table description</TableCaption>)
    
    const caption = screen.getByTestId('table-caption')
    expect(caption).toBeInTheDocument()
    expect(caption.tagName).toBe('CAPTION')
    expect(caption).toHaveTextContent('Table description')
    expect(caption).toHaveClass('mt-4', 'text-sm', 'text-muted-foreground')
  })

  it('should apply custom className', () => {
    render(<TableCaption className="custom-caption" data-testid="table-caption">Table description</TableCaption>)
    
    const caption = screen.getByTestId('table-caption')
    expect(caption).toHaveClass('custom-caption')
    expect(caption).toHaveClass('mt-4', 'text-sm')
  })

  it('should pass through additional props', () => {
    render(<TableCaption data-testid="table-caption" id="caption-id" aria-label="Table Caption">Table description</TableCaption>)
    
    const caption = screen.getByTestId('table-caption')
    expect(caption).toHaveAttribute('id', 'caption-id')
    expect(caption).toHaveAttribute('aria-label', 'Table Caption')
  })
})

describe('Table composition', () => {
  it('should render complete table structure', () => {
    render(
      <Table data-testid="table">
        <TableCaption data-testid="caption">Sample Table</TableCaption>
        <TableHeader data-testid="header">
          <TableRow data-testid="header-row">
            <TableHead data-testid="header-cell">Name</TableHead>
            <TableHead data-testid="header-cell-2">Age</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody data-testid="body">
          <TableRow data-testid="body-row">
            <TableCell data-testid="body-cell">John</TableCell>
            <TableCell data-testid="body-cell-2">25</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter data-testid="footer">
          <TableRow data-testid="footer-row">
            <TableCell data-testid="footer-cell">Total: 1</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    )
    
    const table = screen.getByTestId('table')
    const caption = screen.getByTestId('caption')
    const header = screen.getByTestId('header')
    const body = screen.getByTestId('body')
    const footer = screen.getByTestId('footer')
    
    expect(table).toBeInTheDocument()
    expect(caption).toBeInTheDocument()
    expect(header).toBeInTheDocument()
    expect(body).toBeInTheDocument()
    expect(footer).toBeInTheDocument()
    
    expect(table).toContainElement(caption)
    expect(table).toContainElement(header)
    expect(table).toContainElement(body)
    expect(table).toContainElement(footer)
  })

  it('should handle table with data attributes', () => {
    render(
      <TableRow data-testid="row" data-state="selected">
        <TableCell data-testid="cell">Selected row content</TableCell>
      </TableRow>
    )
    
    const row = screen.getByTestId('row')
    const cell = screen.getByTestId('cell')
    
    expect(row).toHaveAttribute('data-state', 'selected')
    expect(cell).toHaveTextContent('Selected row content')
  })
})
