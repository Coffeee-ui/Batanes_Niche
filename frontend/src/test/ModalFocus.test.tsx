import React, { useState } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import Modal from '../components/ui/Modal';
import { resolveMediaUrl } from '../api/client';

function TestModalForm({ onClose }: { onClose?: () => void }) {
  const [text, setText] = useState('');
  const [comment, setComment] = useState('');

  return (
    <Modal
      isOpen={true}
      onClose={onClose || (() => {})}
      title="Test Dialog"
    >
      <form onSubmit={(e) => e.preventDefault()}>
        <div>
          <label htmlFor="test-input">Test Input</label>
          <input
            id="test-input"
            data-testid="test-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="test-textarea">Test Textarea</label>
          <textarea
            id="test-textarea"
            data-testid="test-textarea"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        <button type="submit" data-testid="submit-btn">
          Submit
        </button>
      </form>
    </Modal>
  );
}

describe('Bug 3 Fix: Modal Input Focus Stability', () => {
  it('retains input focus while typing in an input field and does not steal focus to buttons', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<TestModalForm />);

    // Fast-forward initial autofocus timer
    act(() => {
      vi.advanceTimersByTime(100);
    });

    const input = screen.getByTestId('test-input');
    input.focus();
    expect(document.activeElement).toBe(input);

    // Simulate multiple keystrokes with state re-renders
    fireEvent.change(input, { target: { value: 'B' } });
    act(() => {
      vi.advanceTimersByTime(60);
    });
    expect(document.activeElement).toBe(input);

    fireEvent.change(input, { target: { value: 'Ba' } });
    act(() => {
      vi.advanceTimersByTime(60);
    });
    expect(document.activeElement).toBe(input);

    fireEvent.change(input, { target: { value: 'Batanes' } });
    act(() => {
      vi.advanceTimersByTime(60);
    });
    expect(document.activeElement).toBe(input);
    expect(input).toHaveValue('Batanes');

    vi.useRealTimers();
  });

  it('retains textarea focus while typing in a textarea inside modal', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<TestModalForm />);

    act(() => {
      vi.advanceTimersByTime(100);
    });

    const textarea = screen.getByTestId('test-textarea');
    textarea.focus();
    expect(document.activeElement).toBe(textarea);

    fireEvent.change(textarea, { target: { value: 'Cover letter draft text.' } });
    act(() => {
      vi.advanceTimersByTime(60);
    });
    expect(document.activeElement).toBe(textarea);
    expect(textarea).toHaveValue('Cover letter draft text.');

    vi.useRealTimers();
  });

  it('calls onClose when Escape key is pressed', () => {
    const handleClose = vi.fn();
    render(<TestModalForm onClose={handleClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

describe('Media URL Resolution', () => {
  it('returns null for null or undefined input', () => {
    expect(resolveMediaUrl(null)).toBeNull();
    expect(resolveMediaUrl(undefined)).toBeNull();
  });

  it('preserves absolute URLs (http, https, blob, data)', () => {
    expect(resolveMediaUrl('https://example.com/photo.jpg')).toBe('https://example.com/photo.jpg');
    expect(resolveMediaUrl('http://example.com/photo.jpg')).toBe('http://example.com/photo.jpg');
    expect(resolveMediaUrl('blob:http://localhost/123')).toBe('blob:http://localhost/123');
  });

  it('prepends backend base URL to relative API paths', () => {
    const resolved = resolveMediaUrl('/api/v1/users/avatar/1');
    expect(resolved).toBeTruthy();
    expect(resolved?.endsWith('/api/v1/users/avatar/1')).toBe(true);
  });
});
