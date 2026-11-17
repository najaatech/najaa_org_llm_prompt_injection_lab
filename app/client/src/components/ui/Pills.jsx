import { Chip, Stack } from '@mui/material';

/** Row of small labels. Each item is [label, color?]; falsy items are skipped. */
export const Pills = ({ items }) => (
  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mb: 1 }}>
    {items.filter(Boolean).map(([label, color]) => <Chip key={label} size="small" label={label} color={color || 'default'} variant="outlined" />)}
  </Stack>
);
