import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Footer from '../Footer';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValue) => defaultValue || key
  }),
}));

describe('Footer Component', () => {
    it('renders the branding text correctly', () => {
        render(<Footer />);

        expect(screen.getByText(/VITALSIM CORE/i)).toBeInTheDocument();
        expect(screen.getByText(/DESAFIO FINAL - JAVA AVANÇADO/i)).toBeInTheDocument();
    });

    it('renders the current year dynamically', () => {
        render(<Footer />);

        const currentYear = new Date().getFullYear().toString();
        // The regex ensures the text contains the year anywhere in the generated string
        expect(screen.getByText(new RegExp(currentYear, 'i'))).toBeInTheDocument();
    });
});
