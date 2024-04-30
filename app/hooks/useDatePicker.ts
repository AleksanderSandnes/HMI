import { useState, useCallback } from 'react';

export function useDatePicker(initialDate = new Date()) {
  const [pickerDate, setPickerDate] = useState(initialDate);
  const [formattedPickerDate, setFormattedPickerDate] = useState(
    `${initialDate.getFullYear()}${`0${initialDate.getMonth() + 1}`.slice(-2)}${`0${initialDate.getDate()}`.slice(-2)}`
  );
  const [open, setOpen] = useState(false);

  const onDismiss = useCallback(() => {
    setOpen(false);
  }, []);

  const onConfirm = useCallback((params) => {
    setOpen(false);
    const selectedDate = params.date;
    const formattedDate = `${selectedDate.getFullYear()}${`0${selectedDate.getMonth() + 1}`.slice(-2)}${`0${selectedDate.getDate()}`.slice(-2)}`;
    setPickerDate(selectedDate);
    setFormattedPickerDate(formattedDate);
  }, []);

  const openDatePicker = useCallback(() => {
    setOpen(true);
  }, []);

  return {
    pickerDate,
    setPickerDate,
    formattedPickerDate,
    open,
    onDismiss,
    onConfirm,
    openDatePicker,
  };
}
