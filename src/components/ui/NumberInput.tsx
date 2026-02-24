import * as React from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface NumberInputProps extends Omit<React.ComponentProps<'input'>, 'type' | 'value' | 'onChange'> {
	value: string;
	onChange: (value: string) => void;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
	({ className, value, onChange, ...props }, ref) => {
		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			const inputValue = e.target.value;
			// Allow empty string, numbers, and decimal point
			if (inputValue === '' || /^\d*\.?\d*$/.test(inputValue)) {
				onChange(inputValue);
			}
		};

		return (
			<Input
				ref={ref}
				type='text'
				inputMode='decimal'
				value={value}
				onChange={handleChange}
				className={cn(className)}
				{...props}
			/>
		);
	}
);

NumberInput.displayName = 'NumberInput';

export default NumberInput;
