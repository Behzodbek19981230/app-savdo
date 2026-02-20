import React from 'react';
import InputMask from 'react-input-mask';
import { Input } from './input';

export type PhoneInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
	mask?: string;
};

export function PhoneInput({ mask = '+998 99 999 99 99', ...props }: PhoneInputProps) {
	const inputProps = { ...props } as PhoneInputProps;

	// If neither value nor defaultValue provided, set a sensible default '+998'.
	if (inputProps.value === undefined && inputProps.defaultValue === undefined) {
		inputProps.defaultValue = '+998';
	}

	return (
		<InputMask mask={mask} maskChar={null} {...inputProps}>
			{(innerProps: any) => <Input {...innerProps} />}
		</InputMask>
	);
}

export default PhoneInput;
