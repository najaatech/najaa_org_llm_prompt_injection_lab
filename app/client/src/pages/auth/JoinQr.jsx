import { useEffect, useState } from 'react';
import { Alert, Box, Typography } from '@mui/material';
import QRCode from 'qrcode';
import { api } from '../../api/client.js';

// QR code on the sign-in page so the audience can open the lab on their own device.
// The address comes from the server (the public ngrok URL when it is running); the current page is the fallback.
export function JoinQr() {
  const [address, setAddress] = useState('');
  const [image, setImage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { publicUrl } = await api('/api/join_info');
        const url = publicUrl || window.location.origin;
        const picture = await QRCode.toDataURL(url, { width: 360, margin: 2, errorCorrectionLevel: 'M' });
        if (!cancelled) { setAddress(url); setImage(picture); }
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (error) return <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>;
  if (!image) return null;

  return (
    <Box sx={{ mt: 4, textAlign: 'center' }}>
      <Typography variant="subtitle1" gutterBottom>Scan to join the lab</Typography>
      <Box component="img" src={image} alt={`QR code for ${address}`} sx={{ width: 220, height: 220, imageRendering: 'pixelated' }} />
      <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>{address}</Typography>
    </Box>
  );
}
