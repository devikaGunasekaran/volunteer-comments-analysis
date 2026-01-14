import React, { useState, useEffect } from 'react';
import { validateRealTime, validateContent } from '../../utils/contentValidator';
import './ValidatedTextInput.css';

/**
 * Text input with real-time content validation
 * Detects gibberish and profanity as user types
 */
const ValidatedTextInput = ({
    label,
    name,
    value,
    onChange,
    onBlur,
    required = false,
    minLength = 10,
    maxLength = 1000,
    placeholder = '',
    rows = 4,
    type = 'textarea', // 'textarea' or 'input'
    showCharCount = true,
    disabled = false
}) => {
    const [warning, setWarning] = useState(null);
    const [error, setError] = useState(null);
    const [touched, setTouched] = useState(false);

    // Real-time validation as user types
    useEffect(() => {
        if (value && value.length > 5) {
            const warningMessage = validateRealTime(value);
            setWarning(warningMessage);
        } else {
            setWarning(null);
        }
    }, [value]);

    // Validation on blur
    const handleBlur = (e) => {
        setTouched(true);

        if (value && value.trim().length > 0) {
            const validation = validateContent(value, label, minLength);
            if (!validation.isValid) {
                setError(validation.errors[0]); // Show first error
            } else {
                setError(null);
            }
        }

        if (onBlur) {
            onBlur(e);
        }
    };

    const handleChange = (e) => {
        const newValue = e.target.value;

        // Clear error when user starts typing
        if (error) {
            setError(null);
        }

        onChange(e);
    };

    const currentLength = value?.length || 0;
    const hasError = touched && error;
    const hasWarning = warning && !error;

    const inputClassName = `validated-text-input ${hasError ? 'has-error' : ''} ${hasWarning ? 'has-warning' : ''}`;

    return (
        <div className="validated-text-input-container">
            {label && (
                <label className="input-label">
                    {label}
                    {required && <span className="required-star">*</span>}
                </label>
            )}

            {type === 'textarea' ? (
                <textarea
                    name={name}
                    value={value}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    rows={rows}
                    maxLength={maxLength}
                    disabled={disabled}
                    className={inputClassName}
                />
            ) : (
                <input
                    type="text"
                    name={name}
                    value={value}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    disabled={disabled}
                    className={inputClassName}
                />
            )}

            {/* Real-time warning (yellow) */}
            {hasWarning && (
                <div className="validation-message warning">
                    {warning}
                </div>
            )}

            {/* Error message (red) */}
            {hasError && (
                <div className="validation-message error">
                    ❌ {error}
                </div>
            )}

            {/* Character counter */}
            {showCharCount && (
                <div className="char-counter">
                    <span className={currentLength < minLength ? 'insufficient' : 'sufficient'}>
                        {currentLength} / {minLength} minimum
                    </span>
                    {maxLength && (
                        <span className="max-length">
                            (max: {maxLength})
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default ValidatedTextInput;
