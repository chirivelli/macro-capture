import { Platform, type TextStyle } from 'react-native';

import { Text, TextInput, View } from '@/tw';
import { cn } from '@/utils/cn';

import { getHighlightedSegments } from './task-parser';
import type { ParsedTaskInput } from './types';

const webInputChrome = Platform.select({
  web: { caretColor: '#111827', outlineStyle: 'none' } as unknown as TextStyle,
  default: null,
});

type HighlightedTaskInputProps = {
  autoFocus?: boolean;
  className?: string;
  onBlur?: () => void;
  onChangeText: (value: string) => void;
  onFocus?: () => void;
  onSubmitEditing: () => void;
  parsedInput: ParsedTaskInput;
  placeholder?: string;
  showOverlay?: boolean;
  value: string;
};

export function HighlightedTaskInput({
  className,
  parsedInput,
  placeholder,
  showOverlay = true,
  value,
  ...props
}: HighlightedTaskInputProps) {
  const segments = getHighlightedSegments(value, parsedInput);
  const inputHasOverlay = showOverlay && value.length > 0;

  return (
    <View className="relative min-h-6">
      {inputHasOverlay && (
        <Text pointerEvents="none" className={cn('absolute inset-x-0 top-0 z-0', className)}>
          {(segments.length > 0 ? segments : [{ highlighted: false, index: 0, text: value }]).map(segment => (
            <Text
              key={`${segment.text}-${segment.index}`}
              className={segment.highlighted ? 'overflow-hidden rounded-md bg-amber-100 text-amber-800' : undefined}>
              {segment.text}
            </Text>
          ))}
        </Text>
      )}
      <TextInput
        {...props}
        value={value}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        returnKeyType="done"
        selectionColor="#111827"
        style={webInputChrome}
        className={cn(className, inputHasOverlay && 'relative z-[1] text-transparent')}
      />
    </View>
  );
}
