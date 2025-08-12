import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import ActionDetailsForm from '../ActionDetailsForm';

describe('ActionDetailsForm', () => {
  const setup = () => {
    const props = {
      name: 'Starttittel',
      description: 'Startbeskrivelse',
      procedures: 'Startprosedyrer',
      dueDate: '2025-01-01',
      workNotes: 'Startnotater',
      onNameChange: vi.fn(),
      onDescriptionChange: vi.fn(),
      onProceduresChange: vi.fn(),
      onDueDateChange: vi.fn(),
      onWorkNotesChange: vi.fn(),
    };
    render(<ActionDetailsForm {...props} />);
    return props;
  };

  it('renderer alle felter med etiketter', () => {
    setup();
    expect(screen.getByLabelText('Tittel')).toBeInTheDocument();
    expect(screen.getByLabelText('Beskrivelse')).toBeInTheDocument();
    expect(screen.getByLabelText('Prosedyrer')).toBeInTheDocument();
    expect(screen.getByLabelText('Forfallsdato')).toBeInTheDocument();
    expect(screen.getByLabelText('Arbeidsnotater')).toBeInTheDocument();
  });

  it('kaller tilhørende onChange ved inputendringer', async () => {
    const user = userEvent.setup();
    const props = setup();

    await user.clear(screen.getByLabelText('Tittel'));
    await user.type(screen.getByLabelText('Tittel'), 'Ny tittel');
    expect(props.onNameChange).toHaveBeenLastCalledWith('Ny tittel');

    await user.clear(screen.getByLabelText('Beskrivelse'));
    await user.type(screen.getByLabelText('Beskrivelse'), 'Ny beskrivelse');
    expect(props.onDescriptionChange).toHaveBeenLastCalledWith('Ny beskrivelse');

    await user.clear(screen.getByLabelText('Prosedyrer'));
    await user.type(screen.getByLabelText('Prosedyrer'), 'Nye prosedyrer');
    expect(props.onProceduresChange).toHaveBeenLastCalledWith('Nye prosedyrer');

    await user.clear(screen.getByLabelText('Arbeidsnotater'));
    await user.type(screen.getByLabelText('Arbeidsnotater'), 'Nye notater');
    expect(props.onWorkNotesChange).toHaveBeenLastCalledWith('Nye notater');

    await user.clear(screen.getByLabelText('Forfallsdato'));
    await user.type(screen.getByLabelText('Forfallsdato'), '2025-12-31');
    expect(props.onDueDateChange).toHaveBeenLastCalledWith('2025-12-31');
  });
});
