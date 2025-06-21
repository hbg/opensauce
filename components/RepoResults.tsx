import React from 'react';
import { Box, Card, CardContent, Typography, IconButton, Tooltip, Chip } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

interface Repo {
  id: number;
  name: string;
  description: string;
  stars: number;
  language: string;
  url: string;
}

interface Props {
  repos: Repo[];
  onSummarize?: (url: string) => void;
}

const formatStars = (num: number) => {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return num.toString();
};

const RepoResults: React.FC<Props> = ({ repos, onSummarize }) => {
  if (!repos || repos.length === 0) return null;

  return (
    <Box sx={{ mt: 4 }}>
      {repos.map((r) => (
        <Card
          component="a"
          href={r.url}
          target="_blank"
          key={r.id}
          sx={{
            mb: 2,
            borderRadius: '16px',
            color: '#000',
            textDecoration: 'none',
            cursor: 'pointer',
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            '&:hover': { boxShadow: '0 6px 28px rgba(0,0,0,0.25)' },
          }}
        >
          <CardContent sx={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            boxShadow: '0 6px 12px rgba(0,0,0,0.25)',
            transition: 'box-shadow 0.2s ease-in-out',
            color: '#000',
            mb: 2,
            '&:hover': {
              boxShadow: '0 6px 28px rgba(0,0,0,0.25)',
            }
          }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ minWidth: 0 }}>
              <Typography
                variant="h6"
                sx={{
                  wordBreak: 'break-word',
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {r.name}
              </Typography>
              <Tooltip title="Summarize with AI">
                <IconButton
                  size="small"
                  sx={{ color: '#000', mr: 0.5 }}
                  onClick={(e) => {
                    e.preventDefault();
                    onSummarize?.(r.url);
                  }}
                >
                  <AutoAwesomeIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Copy repo URL">
                <IconButton
                  size="small"
                  sx={{ color: '#000' }}
                  onClick={(e) => {
                    e.preventDefault();
                    navigator.clipboard.writeText(r.url);
                  }}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Chip label={`⭐ ${formatStars(r.stars)}`} sx={{ color: 'black', backgroundColor: '#f1f1f1' }} size="small" />
              {r.language && <Chip label={r.language} sx={{ color: 'black', backgroundColor: '#f1f1f1' }} size="small" />}
            </Box>
            <Typography variant="body2" sx={{ mb: 1 }}>{r.description}</Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default RepoResults;
