import { render, screen } from '@testing-library/react';
import Footer from '@/components/Footer';

describe('Footer', () => {
  it('renders without crashing', () => {
    render(<Footer />);
  });

  it('displays copyright with current year', () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(`© ${currentYear} Teo Parashkevov`)).toBeInTheDocument();
  });

  it('renders a footer element', () => {
    const { container } = render(<Footer />);
    const footer = container.querySelector('footer');
    expect(footer).toBeInTheDocument();
  });

  it('displays all social media links', () => {
    render(<Footer />);
    const githubLink = screen.getByLabelText('GitHub');
    const linkedinLink = screen.getByLabelText('LinkedIn');
    const youtubeLink = screen.getByLabelText('YouTube');

    expect(githubLink).toBeInTheDocument();
    expect(linkedinLink).toBeInTheDocument();
    expect(youtubeLink).toBeInTheDocument();
  });

  it('social links have correct URLs', () => {
    render(<Footer />);
    const githubLink = screen.getByLabelText('GitHub');
    const linkedinLink = screen.getByLabelText('LinkedIn');
    const youtubeLink = screen.getByLabelText('YouTube');

    expect(githubLink).toHaveAttribute('href', 'https://github.com/theoparashkevov');
    expect(linkedinLink).toHaveAttribute('href', 'https://www.linkedin.com/in/teo-parashkevov/');
    expect(youtubeLink).toHaveAttribute('href', expect.stringContaining('youtube.com'));
  });

  it('social links open in new tab', () => {
    render(<Footer />);
    const githubLink = screen.getByLabelText('GitHub');
    expect(githubLink).toHaveAttribute('target', '_blank');
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
