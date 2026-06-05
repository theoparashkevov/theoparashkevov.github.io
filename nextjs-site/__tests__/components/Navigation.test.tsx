import React from 'react';
import { render, screen } from '@testing-library/react';
import Navigation from '@/components/Navigation';

describe('Navigation', () => {
  it('renders without crashing', () => {
    render(<Navigation />);
  });

  it('displays the site title', () => {
    render(<Navigation />);
    expect(screen.getByText('Teo Parashkevov')).toBeInTheDocument();
  });

  it('renders all navigation items', () => {
    render(<Navigation />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Blog')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });

  it('renders a nav element', () => {
    const { container } = render(<Navigation />);
    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
  });

  it('site title links to home page', () => {
    render(<Navigation />);
    const titleLink = screen.getByText('Teo Parashkevov').closest('a');
    expect(titleLink).toHaveAttribute('href', '/');
  });

  it('navigation items have correct hrefs', () => {
    render(<Navigation />);
    const homeLink = screen.getByText('Home').closest('a');
    const blogLink = screen.getByText('Blog').closest('a');
    const aboutLink = screen.getByText('About').closest('a');
    const contactLink = screen.getByText('Contact').closest('a');

    expect(homeLink).toHaveAttribute('href', '/');
    expect(blogLink).toHaveAttribute('href', '/blog');
    expect(aboutLink).toHaveAttribute('href', '/about');
    expect(contactLink).toHaveAttribute('href', '/contact');
  });
});
