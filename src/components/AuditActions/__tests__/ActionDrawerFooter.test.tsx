import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ActionDrawerFooter from '../ActionDrawerFooter';

describe('ActionDrawerFooter', () => {
  it('kaller onCancel når Avbryt klikkes', () => {
    const onCancel = vi.fn();
    const onSave = vi.fn();
    render(<ActionDrawerFooter onCancel={onCancel} onSave={onSave} isSaving={false} />);

    fireEvent.click(screen.getByRole('button', { name: /Avbryt/i }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('kaller onSave når "Lagre endringer" klikkes', () => {
    const onCancel = vi.fn();
    const onSave = vi.fn();
    render(<ActionDrawerFooter onCancel={onCancel} onSave={onSave} isSaving={false} />);

    fireEvent.click(screen.getByRole('button', { name: /Lagre endringer/i }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('viser "Lagrer..." og deaktiverer lagre-knapp når isSaving=true', () => {
    const onCancel = vi.fn();
    const onSave = vi.fn();
    render(<ActionDrawerFooter onCancel={onCancel} onSave={onSave} isSaving={true} />);

    const saveButton = screen.getByRole('button', { name: /Lagrer.../i });
    expect(saveButton).toBeDisabled();
  });
});
