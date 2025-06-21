import React from 'react';
import { Box, Fab, Tooltip } from '@mui/material';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';

const ShareButtons: React.FC = () => {
  // Avoid SSR window reference errors
  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://opensauce-two.vercel.app/';
  const text = 'Discover open-source projects fast with Sauce!';

  const handleShare = (platform: 'twitter' | 'linkedin') => {
    let shareUrl = '';
    if (platform === 'twitter') {
      shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(text)}`;
    } else {
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`;
    }
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Box sx={{ position: 'fixed', bottom: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 1, zIndex: 1300 }}>
      <Tooltip title="Share on Twitter" placement="left">
        <Fab
          onClick={() => handleShare('twitter')}
          sx={{
            bgcolor: '#fff',
            color: '#000',
            width: { xs: 48, sm: 64 },
            height: { xs: 48, sm: 64 },
            '&:hover': { bgcolor: '#f1f1f1' },
          }}
        >
          <TwitterIcon sx={{ color: '#000', fontSize: { xs: 20, sm: 28 } }} />
        </Fab>
      </Tooltip>
      <Tooltip title="Share on LinkedIn" placement="left">
        <Fab
          onClick={() => handleShare('linkedin')}
          sx={{
            bgcolor: '#fff',
            color: '#000',
            width: { xs: 48, sm: 64 },
            height: { xs: 48, sm: 64 },
            '&:hover': { bgcolor: '#f1f1f1' },
          }}
        >
          <LinkedInIcon sx={{ color: '#000', fontSize: { xs: 20, sm: 28 } }} />
        </Fab>
      </Tooltip>
    </Box>
  );
};

export default ShareButtons;
