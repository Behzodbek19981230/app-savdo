import React from 'react';
import InputMask from 'react-input-mask';
import { Input } from './input';

export type PhoneInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
	mask?: string;
};

export function PhoneInput({ mask = '+998 99 999 99 99', ...props }: PhoneInputProps) {
	return (
		<InputMask mask={mask} maskChar={null} {...props}>
			{(inputProps: any) => <Input {...inputProps} />}
		</InputMask>
	);
}

export default PhoneInput;
