import { useState } from 'react';
import { RiCloseLine, RiInformationLine } from 'react-icons/ri';

interface InputDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (value: string) => void;
    title: string;
    message: string;
    placeholder?: string;
    expectedValue?: string;
    confirmText?: string;
    cancelText?: string;
}

const InputDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    placeholder = '',
    expectedValue,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar'
}: InputDialogProps) => {
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (expectedValue && inputValue !== expectedValue) {
            setError('El valor ingresado no coincide');
            return;
        }
        onConfirm(inputValue);
        setInputValue('');
        setError('');
        onClose();
    };

    const handleClose = () => {
        setInputValue('');
        setError('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-fadeIn">
                {/* Header */}
                <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <RiInformationLine className="text-2xl text-blue-500" />
                            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <RiCloseLine className="text-2xl" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-6">
                    <p className="text-gray-600 mb-4 whitespace-pre-line">{message}</p>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value);
                            setError('');
                        }}
                        placeholder={placeholder}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            error ? 'border-red-500' : 'border-gray-300'
                        }`}
                        onKeyPress={(e) => e.key === 'Enter' && handleConfirm()}
                        autoFocus
                    />
                    {error && (
                        <p className="mt-2 text-sm text-red-600">{error}</p>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InputDialog;