import { Path } from "react-hook-form";
import {
	preventSpecialCharacterInputForInvestmentAmount,
	preventSpecialCharacterInputForTypeNumber,
	preventSpecialCharacterInputForInvestmentAmount,
	preventSpecialCharacterInputForTypeNumber,
} from "../../../../lib/helper/deals/preventSpecialCharacterInputForTypeNumber";
import {
	addThousandSeparatorWithDP,
	formatAsDecimalString,
	addThousandSeparatorWithDP,
	formatAsDecimalString,
} from "../../../../lib/helper/formatNumber";
import { APrimePrimaryInvestmentFormSchemaType } from "./Form.schema";
import { DealDto, DealroomListing } from "../../../../generated/bops";
import IncrementSuggestion from "@/features/dealroom/components/OrderDetails/IncrementSuggestion";
import BigNumber from "bignumber.js";
import { ErrorMessageComponent } from "@/components/Common/Input/ErrorMessage/ErrorMessage";
import { addThousandSeparatorToStr } from "@/../../admin/lib/src/@/lib/number";

interface Props {
	deal: DealDto;
	formProps: any;
	minimumRequiredShares?: number;
	minimumInvestmentAmount?: BigNumber;
	deal: DealDto;
	formProps: any;
	minimumRequiredShares?: number;
	minimumInvestmentAmount?: BigNumber;
}

const APrimePrimaryInvestmentFormAmount = ({
	deal,
	formProps,
	minimumRequiredShares,
	minimumInvestmentAmount,
	deal,
	formProps,
	minimumRequiredShares,
	minimumInvestmentAmount,
}: Props) => {
	const isSharesValidation =
		deal.listing.investment_by ===
		DealroomListing.investment_by.NUMBER_OF_SHARES;
	const incrementSize = Number(deal.listing.increment_size) || 0;
	const isSharesValidation =
		deal.listing.investment_by ===
		DealroomListing.investment_by.NUMBER_OF_SHARES;
	const incrementSize = Number(deal.listing.increment_size) || 0;

	const incrementSizeBN = deal.listing.increment_size
		? new BigNumber(deal.listing.increment_size as any)
		: new BigNumber(0);
	const incrementSizeBN = deal.listing.increment_size
		? new BigNumber(deal.listing.increment_size as any)
		: new BigNumber(0);

	const { setFocus } = formProps;
	const { setFocus } = formProps;

	const inputShares = formProps.watch(
		"noOfShares" as Path<APrimePrimaryInvestmentFormSchemaType>
	) as number;
	const inputShares = formProps.watch(
		"noOfShares" as Path<APrimePrimaryInvestmentFormSchemaType>
	) as number;

	const inputInvestment = formProps.watch(
		"investmentAmount" as Path<APrimePrimaryInvestmentFormSchemaType>
	) as number;
	const inputInvestment = formProps.watch(
		"investmentAmount" as Path<APrimePrimaryInvestmentFormSchemaType>
	) as number;

	const investmentAmountBN = new BigNumber(inputInvestment);
	const sharesBN = new BigNumber(inputShares);
	const minSharesBN = new BigNumber(minimumRequiredShares!);
	const investmentAmountBN = new BigNumber(inputInvestment);
	const sharesBN = new BigNumber(inputShares);
	const minSharesBN = new BigNumber(minimumRequiredShares!);

	const shouldRenderMinHelper: boolean = isSharesValidation
		? minSharesBN.isGreaterThan(0)
		: minimumInvestmentAmount
			? minimumInvestmentAmount.isGreaterThan(0)
			: false;
	const shouldRenderMinHelper: boolean = isSharesValidation
		? minSharesBN.isGreaterThan(0)
		: minimumInvestmentAmount
			? minimumInvestmentAmount.isGreaterThan(0)
			: false;

	console.log({
		minimumRequiredShares,
		minimumInvestmentAmount,
		isSharesValidation,
		incrementSize,
		incrementSizeBN,
		investmentAmountBN,
		sharesBN,
		minSharesBN,
	});
	console.log({
		minimumRequiredShares,
		minimumInvestmentAmount,
		isSharesValidation,
		incrementSize,
		incrementSizeBN,
		investmentAmountBN,
		sharesBN,
		minSharesBN,
	});

	let shouldShowIncrementSuggestion: boolean;
	let shouldShowIncrementSuggestion: boolean;

	if (isSharesValidation) {
		shouldShowIncrementSuggestion =
			isSharesValidation &&
			(sharesBN.isLessThan(minSharesBN) ||
				(!sharesBN.minus(minSharesBN).mod(incrementSizeBN).isZero() &&
					incrementSizeBN.isGreaterThan(0)));
	} else {
		shouldShowIncrementSuggestion =
			minimumInvestmentAmount !== undefined &&
			(investmentAmountBN.isLessThan(minimumInvestmentAmount) ||
				(!investmentAmountBN
					.minus(minimumInvestmentAmount)
					.mod(incrementSizeBN)
					.isZero() &&
					incrementSizeBN.isGreaterThan(0)));
	}
	if (isSharesValidation) {
		shouldShowIncrementSuggestion =
			isSharesValidation &&
			(sharesBN.isLessThan(minSharesBN) ||
				(!sharesBN.minus(minSharesBN).mod(incrementSizeBN).isZero() &&
					incrementSizeBN.isGreaterThan(0)));
	} else {
		shouldShowIncrementSuggestion =
			minimumInvestmentAmount !== undefined &&
			(investmentAmountBN.isLessThan(minimumInvestmentAmount) ||
				(!investmentAmountBN
					.minus(minimumInvestmentAmount)
					.mod(incrementSizeBN)
					.isZero() &&
					incrementSizeBN.isGreaterThan(0)));
	}

	const handleSetNewValue = (value: any) => {
		if (isSharesValidation) {
			// For number of shares, no formatting to decimal places
			const sharesBN = new BigNumber(value);
			formProps.setValue("noOfShares", sharesBN.toNumber(), {
				shouldValidate: true,
			});
		} else {
			// Set investment amount in raw format, then trigger blur to format
			const investmentBN = new BigNumber(value).decimalPlaces(
				2,
				BigNumber.ROUND_HALF_UP
			);
			formProps.setValue("investmentAmount", investmentBN.toNumber(), {
				shouldValidate: true,
			});
	const handleSetNewValue = (value: any) => {
		if (isSharesValidation) {
			// For number of shares, no formatting to decimal places
			const sharesBN = new BigNumber(value);
			formProps.setValue("noOfShares", sharesBN.toNumber(), {
				shouldValidate: true,
			});
		} else {
			// Set investment amount in raw format, then trigger blur to format
			const investmentBN = new BigNumber(value).decimalPlaces(
				2,
				BigNumber.ROUND_HALF_UP
			);
			formProps.setValue("investmentAmount", investmentBN.toNumber(), {
				shouldValidate: true,
			});

			// Trigger focus to show the raw editable value
			setTimeout(() => {
				setFocus("investmentAmount"); // Focus the field by its registered name
			}, 0);
		}
	};

	const calculateIntegerPartCursorPosition = (integerPart: string, unformattedPosition: number): number => {
		const newValueBeforeCursor = integerPart.slice(0, unformattedPosition);
		const formattedBeforeCursor = addThousandSeparatorToStr(newValueBeforeCursor);
		const newCommasBeforeCursor = (formattedBeforeCursor.match(/,/g) || []).length;
		return unformattedPosition + newCommasBeforeCursor;
	}
	const calculateDecimalPartCursorPosition = (
		formattedInteger: string,
		integerPart: string,
		unformattedPosition: number
	): number => {
		return formattedInteger.length + 1 + (unformattedPosition - integerPart.length - 1);
	}

	const formatInputValue = (value: string): {
		formattedValue: string;
		isValid: boolean;
		numValue: number;
		hasDecimalPoint: boolean;
		integerPart: string;
		decimalPart: string;
	} => {
		// remove commas for processing
		const valueWithoutCommas = value.replace(/,/g, "");
		// check if a decimal point was just added
		const justAddedDecimal = valueWithoutCommas.endsWith('.');

		// separate into integer and decimal parts
		const parts = valueWithoutCommas.split('.');
		const integerPart = parts[0];
		const decimalPart = parts.length > 1 ? parts[1].slice(0, 2) : "";

		// use unformatted value for validation
		const hasDecimalPoint = parts.length > 1 || valueWithoutCommas.endsWith('.');
		const unformattedValue = integerPart + (hasDecimalPoint ? '.' : '') + decimalPart;
		const isValid = justAddedDecimal || /^[0-9]*\.?[0-9]{0,2}$/.test(unformattedValue);

		let formattedValue = value;
		let numValue = 0;

		if (isValid) {
			numValue = parseFloat(unformattedValue) || 0;
			const formattedInteger = addThousandSeparatorToStr(integerPart);
			formattedValue = formattedInteger +
				(hasDecimalPoint ? '.' : '') +
				decimalPart;
		}

		return {
			formattedValue,
			isValid,
			numValue,
			hasDecimalPoint,
			integerPart,
			decimalPart
		};
	}

	const updateInputValue = (
		target: HTMLInputElement,
		setValue: (name: string, value: number, options?: any) => void
	): void => {
		const cursorPosition = target.selectionStart || 0;
		const originalValue = target.value;

		// process and format the value
		const {
			formattedValue,
			isValid,
			numValue,
			hasDecimalPoint,
			integerPart,
			decimalPart
		} = formatInputValue(originalValue);

		if (isValid) {
			// update form value
			setValue("investmentAmount", numValue, { shouldValidate: true });

			// get values for cursor position calculations
			const valueBeforeCursor = originalValue.slice(0, cursorPosition);
			const commasBeforeCursor = (valueBeforeCursor.match(/,/g) || []).length;
			const unformattedPosition = cursorPosition - commasBeforeCursor;

			// update display value
			target.value = formattedValue;

			// update cursor position
			const formattedInteger = addThousandSeparatorToStr(integerPart);
			const newPosition = unformattedPosition <= integerPart.length
				? calculateIntegerPartCursorPosition(integerPart, unformattedPosition)
				: calculateDecimalPartCursorPosition(formattedInteger, integerPart, unformattedPosition);

			// update cursor position after state update
			setTimeout(() => target.setSelectionRange(newPosition, newPosition), 0);
		} else {
			// revert to original value if invalid
			target.value = originalValue;
		}
	}

	return (
		<>
			<h2 className="text-xl font-light">Investment amount</h2>
			<p className="mt-2 text-sm text-slate-500">
				{isSharesValidation
					? "Enter the number of shares that you would like to invest."
					: "Enter the investment amount you would like to invest."}
			</p>
	return (
		<>
			<h2 className="text-xl font-light">Investment amount</h2>
			<p className="mt-2 text-sm text-slate-500">
				{isSharesValidation
					? "Enter the number of shares that you would like to invest."
					: "Enter the investment amount you would like to invest."}
			</p>

			{/* Conditional Input: Based on shares or Investment Amount */}
			{shouldRenderMinHelper && (
				<div className="mt-6 flex items-center rounded border border-[#BDD4D9] bg-slate-100/50 py-3 px-[10px]">
					<div>
						<div className="h-4 w-4">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								width={16}
								height={16}
								viewBox="0 0 24 24"
								strokeWidth="1.5"
								stroke="#0b3b29"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
								/>
							</svg>
						</div>
					</div>
					{isSharesValidation ? (
						<p className="ml-[10px] text-xs">
							The minimum requirement is{" "}
							<span className="font-bold">{minimumRequiredShares}</span> share
							{minimumRequiredShares! > 0 ? "s" : ""}.
						</p>
					) : (
						<p className="ml-[10px] text-xs">
							The minimum investment amount is{" "}
							<span className="font-bold">
								{deal.listing.currency.toUpperCase()}{" "}
								{formatAsDecimalString(Number(minimumInvestmentAmount), 2)}.
							</span>
						</p>
					)}
				</div>
			)}
			{/* Conditional Input: Based on shares or Investment Amount */}
			{shouldRenderMinHelper && (
				<div className="mt-6 flex items-center rounded border border-[#BDD4D9] bg-slate-100/50 py-3 px-[10px]">
					<div>
						<div className="h-4 w-4">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								width={16}
								height={16}
								viewBox="0 0 24 24"
								strokeWidth="1.5"
								stroke="#0b3b29"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
								/>
							</svg>
						</div>
					</div>
					{isSharesValidation ? (
						<p className="ml-[10px] text-xs">
							The minimum requirement is{" "}
							<span className="font-bold">{minimumRequiredShares}</span> share
							{minimumRequiredShares! > 0 ? "s" : ""}.
						</p>
					) : (
						<p className="ml-[10px] text-xs">
							The minimum investment amount is{" "}
							<span className="font-bold">
								{deal.listing.currency.toUpperCase()}{" "}
								{formatAsDecimalString(Number(minimumInvestmentAmount), 2)}.
							</span>
						</p>
					)}
				</div>
			)}

			{isSharesValidation && (
				<p className="mt-6 text-sm">
					Share Price:{" "}
					<span className="font-bold">
						{deal.listing.currency.toUpperCase()}{" "}
						{deal.listing.price_per_unit === null
							? "0.00"
							: formatAsDecimalString(Number(deal.listing.price_per_unit), 2)}
					</span>
				</p>
			)}
			{isSharesValidation && (
				<p className="mt-6 text-sm">
					Share Price:{" "}
					<span className="font-bold">
						{deal.listing.currency.toUpperCase()}{" "}
						{deal.listing.price_per_unit === null
							? "0.00"
							: formatAsDecimalString(Number(deal.listing.price_per_unit), 2)}
					</span>
				</p>
			)}

			{/* Input for Shares or Investment Amount */}
			{isSharesValidation ? (
				<div className="mt-6">
					<div
						className={
							`flex flex-row overflow-hidden rounded-md border-2` +
							(formProps.formState.errors.noOfShares
								? " border-red-400"
								: " border-slate-200")
						}
					>
						<div className="flex-none border-r-2 border-slate-200 bg-slate-100 p-3 text-center text-slate-500">
							No. of shares
						</div>
						<input
							type="number"
							step="1"
							className={`fp-text-input rounded-none border-0`}
							placeholder={`Minimum ${minimumRequiredShares} shares`}
							onKeyDown={(e: React.KeyboardEvent) =>
								preventSpecialCharacterInputForTypeNumber(e, "token")
							}
							onWheel={(e) => {
								e.currentTarget.blur();
							}}
							{...formProps.register(
								"noOfShares" as Path<APrimePrimaryInvestmentFormSchemaType>,
								{ valueAsNumber: true }
							)}
						/>
					</div>
				</div>
			) : (
				<div className="mt-6">
					<div
						className={
							`flex flex-row overflow-hidden rounded-md border-2` +
							(formProps.formState.errors.investmentAmount
								? " border-red-400"
								: " border-slate-200")
						}
					>
						<div className="flex-none border-r-2 border-slate-200 bg-slate-100 p-3 text-center text-slate-500">
							{deal.listing.currency.toUpperCase()}
						</div>
						<input
							type="text"
							step="0.01"
							className={`fp-text-input rounded-none border-0`}
							placeholder={`Minimum ${deal.listing.currency} ${formatAsDecimalString(
								Number(minimumInvestmentAmount),
								2
							)}`}
							onKeyDown={(e: React.KeyboardEvent) =>
								preventSpecialCharacterInputForInvestmentAmount(e, "token")
							}
							onWheel={(e) => {
								e.currentTarget.blur();
							}}
							onInput={(e: React.FormEvent<HTMLInputElement>) => {
								const target = e.target as HTMLInputElement;
								const cursorPosition = target.selectionStart || 0;
								const originalValue = target.value;

								// remove commas for processing
								const valueWithoutCommas = originalValue.replace(/,/g, "");
								const justAddedDecimal = valueWithoutCommas.endsWith('.') &&
									!originalValue.replace(/,/g, "").endsWith('.');

								// separate into integer and decimal parts for separate formatting rules
								const parts = valueWithoutCommas.split('.');
								const integerPart = parts[0];
								const decimalPart = parts.length > 1 ? parts[1].slice(0, 2) : "";

								// get values for cursor position calculations
								const valueBeforeCursor = originalValue.slice(0, cursorPosition);
								const commasBeforeCursor = (valueBeforeCursor.match(/,/g) || []).length;
								const unformattedPosition = cursorPosition - commasBeforeCursor;

								// use unformatted value for validation
								const hasDecimalPoint = parts.length > 1 || valueWithoutCommas.endsWith('.');
								let unformattedValue = integerPart + (hasDecimalPoint ? '.' : '') + decimalPart;

								const isValid = justAddedDecimal || /^[0-9]*\.?[0-9]{0,2}$/.test(unformattedValue);

								if (isValid) {
									// update form value
									const numericValue = parseFloat(unformattedValue) || 0;
									formProps.setValue("investmentAmount", numericValue, { shouldValidate: true });

									// format display value
									const formattedInteger = addThousandSeparatorToStr(integerPart);
									const formattedValue = formattedInteger +
										(hasDecimalPoint ? '.' : '') +
										decimalPart;
									target.value = formattedValue;

									// calculate new cursor positions
									const newPosition = unformattedPosition <= integerPart.length
										? calculateIntegerPartCursorPosition(integerPart, unformattedPosition)
										: calculateDecimalPartCursorPosition(formattedInteger, integerPart, unformattedPosition);

									// update cursor position only after state update
									setTimeout(() => target.setSelectionRange(newPosition, newPosition), 0);
								} else {
									// revert to original value if invalid
									target.value = originalValue;
								}
							}}
							onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
								const target = e.target as HTMLInputElement;
			{/* Input for Shares or Investment Amount */}
			{isSharesValidation ? (
				<div className="mt-6">
					<div
						className={
							`flex flex-row overflow-hidden rounded-md border-2` +
							(formProps.formState.errors.noOfShares
								? " border-red-400"
								: " border-slate-200")
						}
					>
						<div className="flex-none border-r-2 border-slate-200 bg-slate-100 p-3 text-center text-slate-500">
							No. of shares
						</div>
						<input
							type="number"
							step="1"
							className={`fp-text-input rounded-none border-0`}
							placeholder={`Minimum ${minimumRequiredShares} shares`}
							onKeyDown={(e: React.KeyboardEvent) =>
								preventSpecialCharacterInputForTypeNumber(e, "token")
							}
							onWheel={(e) => {
								e.currentTarget.blur();
							}}
							{...formProps.register(
								"noOfShares" as Path<APrimePrimaryInvestmentFormSchemaType>,
								{ valueAsNumber: true }
							)}
						/>
					</div>
				</div>
			) : (
				<div className="mt-6">
					<div
						className={
							`flex flex-row overflow-hidden rounded-md border-2` +
							(formProps.formState.errors.investmentAmount
								? " border-red-400"
								: " border-slate-200")
						}
					>
						<div className="flex-none border-r-2 border-slate-200 bg-slate-100 p-3 text-center text-slate-500">
							{deal.listing.currency.toUpperCase()}
						</div>
						<input
							type="text"
							step="0.01"
							className={`fp-text-input rounded-none border-0`}
							placeholder={`Minimum ${deal.listing.currency} ${formatAsDecimalString(
								Number(minimumInvestmentAmount),
								2
							)}`}
							onKeyDown={(e: React.KeyboardEvent) =>
								preventSpecialCharacterInputForInvestmentAmount(e, "token")
							}
							onWheel={(e) => {
								e.currentTarget.blur();
							}}
							onInput={(e: React.FormEvent<HTMLInputElement>) => {
								const target = e.target as HTMLInputElement;
								updateInputValue(target, (name, value, options) =>
									formProps.setValue(name, value, options)
								);
							}}
							onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
								const target = e.target as HTMLInputElement;

								// Get the raw value without commas
								const rawValue = target.value.replace(/,/g, "");
								// Get the raw value without commas
								const rawValue = target.value.replace(/,/g, "");

								// Format the value with thousands separators and two decimal places
								target.value = formatAsDecimalString(parseFloat(rawValue), 2);
							}}
						/>
					</div>
				</div>
			)}
								// Format the value with thousands separators and two decimal places
								target.value = formatAsDecimalString(parseFloat(rawValue), 2);
							}}
						/>
					</div>
				</div>
			)}

			{/* Error Message */}
			{isSharesValidation ? (
				<ErrorMessageComponent
					fieldError={formProps.formState.errors.noOfShares}
				/>
			) : (
				<ErrorMessageComponent
					fieldError={formProps.formState.errors.investmentAmount}
				/>
			)}
			{/* Error Message */}
			{isSharesValidation ? (
				<ErrorMessageComponent
					fieldError={formProps.formState.errors.noOfShares}
				/>
			) : (
				<ErrorMessageComponent
					fieldError={formProps.formState.errors.investmentAmount}
				/>
			)}

			{isSharesValidation ? (
				<div className="mt-2 text-sm text-gray-500">
					approx. {deal.listing.currency}{" "}
					{addThousandSeparatorWithDP(
						inputShares * Number(deal.listing.price_per_unit),
						2
					) || "0.00"}{" "}
					(excl. charges)
				</div>
			) : (
				<></>
			)}
			{isSharesValidation ? (
				<div className="mt-2 text-sm text-gray-500">
					approx. {deal.listing.currency}{" "}
					{addThousandSeparatorWithDP(
						inputShares * Number(deal.listing.price_per_unit),
						2
					) || "0.00"}{" "}
					(excl. charges)
				</div>
			) : (
				<></>
			)}

			{/* Increment Suggestions */}
			{isSharesValidation
				? shouldShowIncrementSuggestion && (
					<IncrementSuggestion
						currentValue={inputShares}
						incrementSize={incrementSize}
						isSharesValidation={isSharesValidation}
						currency={deal.listing.currency.toUpperCase()}
						setNewValue={handleSetNewValue}
						minimum={minSharesBN}
					/>
				)
				: shouldShowIncrementSuggestion && (
					<IncrementSuggestion
						currentValue={inputInvestment}
						incrementSize={incrementSize}
						isSharesValidation={isSharesValidation}
						currency={deal.listing.currency.toUpperCase()}
						setNewValue={handleSetNewValue}
						minimum={minimumInvestmentAmount}
					/>
				)}
		</>
	);
			{/* Increment Suggestions */}
			{isSharesValidation
				? shouldShowIncrementSuggestion && (
					<IncrementSuggestion
						currentValue={inputShares}
						incrementSize={incrementSize}
						isSharesValidation={isSharesValidation}
						currency={deal.listing.currency.toUpperCase()}
						setNewValue={handleSetNewValue}
						minimum={minSharesBN}
					/>
				)
				: shouldShowIncrementSuggestion && (
					<IncrementSuggestion
						currentValue={inputInvestment}
						incrementSize={incrementSize}
						isSharesValidation={isSharesValidation}
						currency={deal.listing.currency.toUpperCase()}
						setNewValue={handleSetNewValue}
						minimum={minimumInvestmentAmount}
					/>
				)}
		</>
	);
};

export default APrimePrimaryInvestmentFormAmount;
