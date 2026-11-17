import { Card, CardContent, Typography } from '@mui/material';

/** Outlined card with an optional heading. */
export const Section = ({ title, children }) => (
  <Card variant="outlined" sx={{ mb: 2 }}>
    <CardContent>
      {title && <Typography variant="h6" gutterBottom>{title}</Typography>}
      {children}
    </CardContent>
  </Card>
);
