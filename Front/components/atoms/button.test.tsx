import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { Button } from './button';

test('affiche le bouton correctement', () => {
  render(<Button>Cliquez-moi</Button>);
  const button = screen.getByText('Cliquez-moi');
  expect(button).toBeDefined();
});
