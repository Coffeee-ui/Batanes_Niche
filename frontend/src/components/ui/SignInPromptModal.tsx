import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Lock, ArrowRight, X } from 'lucide-react';
import { Modal } from './Modal';

interface SignInPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  actionText?: string;
}

export default function SignInPromptModal({
  isOpen,
  onClose,
  title = 'Sign in required',
  description = 'You need a Batanes Niche account to complete this action and access full vacancy details.',
  actionText = 'Sign in',
}: SignInPromptModalProps) {
  const location = useLocation();
  const currentPath = location.pathname + location.search;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      titleId="sign-in-prompt-title"
      maxWidth="max-w-md"
      asBottomSheet
    >
      <div className="text-center space-y-4 pt-2">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h3 id="sign-in-prompt-title" className="text-xl font-bold text-foreground">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
            {description}
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <Link
            to="/login"
            state={{ from: currentPath }}
            className="btn btn-primary w-full py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2"
          >
            {actionText} <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <Link
            to="/register"
            state={{ from: currentPath }}
            className="btn btn-secondary w-full py-3 text-xs font-bold rounded-xl block text-center"
          >
            Create an Account
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground font-medium py-1.5 block w-full text-center"
          >
            Not now
          </button>
        </div>
      </div>
    </Modal>
  );
}
