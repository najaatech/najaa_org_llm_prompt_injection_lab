import { useEffect, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import QRCode from 'qrcode';
import { api } from '../api.js';

// Full-screen friendly QR code the presenter can show on a projector.
// The address comes from the server (the public ngrok URL when it is running); the current page is the fallback.
export function QrDialog({ open, onClose }) {
  const [url, setUrl] = useState('');
  const [image, setImage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    (async () => {
      try {
        setError('');
        const { publicUrl } = await api('/api/join_info');
        const address = publicUrl || window.location.origin;
        const picture = await QRCode.toDataURL(address, { width: 720, margin: 2, errorCorrectionLevel: 'M' });
        if (!cancelled) { setUrl(address); setImage(picture); }
      } catch (err) { if (!cancelled) setError(err.message); }
    })();
    return () => { cancelled = true; };
  }, [open]);

  const isLocalAddress = /^https?:\/\/(localhost|127\.|\[::1\])/.test(url);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Scan to join the lab</DialogTitle>
      <DialogContent sx={{ textAlign: 'center' }}>
        {error && <Alert severity="error">{error}</Alert>}
        {image && (
          <Box component="img" src={image} alt={`QR code for ${url}`} sx={{ width: '100%', maxWidth: 520, height: 'auto', imageRendering: 'pixelated' }} />
        )}
        {url && <Typography variant="h6" sx={{ wordBreak: 'break-all', mt: 1 }}>{url}</Typography>}
        {isLocalAddress && (
          <Alert severity="warning" sx={{ mt: 2, textAlign: 'left' }}>
            This address only works on this computer. Start the lab with <code>npm run start:ngrok</code> to get a public address.
          </Alert>
        )}
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
    </Dialog>
  );
}
