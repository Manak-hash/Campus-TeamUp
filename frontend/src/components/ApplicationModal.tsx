import React, { useState } from 'react';
import Modal from './Modal';
import Textarea from './Textarea';
import Button from './Button';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (message: string) => Promise<void>;
  projectName: string;
}

export const ApplicationModal: React.FC<ApplicationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  projectName,
}) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit(message);
      setMessage('');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Apply to ${projectName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm border border-red-200">
            {error}
          </div>
        )}
        <p className="text-sm text-gray-600">
          Introduce yourself, explain why you want to join this project, and highlight the skills you bring.
        </p>
        <Textarea
          id="motivation-message"
          name="message"
          label="Motivation Message"
          placeholder="I have experience with React and would love to build the frontend components..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={5}
        />
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-150">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Submit Application
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ApplicationModal;
