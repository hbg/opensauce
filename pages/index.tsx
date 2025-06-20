import React, { useState } from "react";
import { Container, Typography, Card, CardContent, Box, ToggleButtonGroup, ToggleButton, Autocomplete, TextField, CircularProgress, Button, Pagination, IconButton, Chip } from "@mui/material";
import Image from "next/image";
import Layout from "../components/Layout";
import Head from 'next/head';
import ReactMarkdown from 'react-markdown';
import GitHubIssueSearchField from '../components/GitHubIssueSearchField';
import RepoResults from '../components/RepoResults';
import CloseIcon from '@mui/icons-material/Close';



export default function Home() {
  const toggleStyle = {
    fontFamily: 'Jua',
    borderRadius: '12px',
    '&.Mui-selected': {
      bgcolor: '#fff',
      color: '#000',
      '&:hover': { bgcolor: '#fff' },
    },
  } as const;
  const [repoUrl, setRepoUrl] = useState("");
  const [issues, setIssues] = useState<any[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [mode, setMode] = useState<'summarize' | 'search'>('search');
  const [tags, setTags] = useState<string[]>([]);
  const [repos, setRepos] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);

  const handleFetchIssues = async () => {
    if (!repoUrl.trim()) return;

    // Expecting URLs like https://github.com/owner/repo
    try {
      const [, owner, repo] = repoUrl.match(/github\.com\/(.*?)\/(.*?)(?:\.git|\/|$)/) || [];
      if (!owner || !repo) {
        setErrorMsg('Please enter a valid GitHub repository URL');
        return;
      }
      setLoading(true);
      const res = await fetch(`/api/issues?owner=${owner}&repo=${repo}`);
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      // fetch summary in parallel
      fetchSummary(owner, repo);
    } catch (err) {
      console.error('Issue fetch failed', err);
      setErrorMsg('Could not fetch issues. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async (owner: string, repo: string) => {
    try {
      setLoadingSummary(true);
      const resp = await fetch(`/api/issues-summary?owner=${owner}&repo=${repo}`);
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      setSummary(data.summary);
    } catch (err) {
      console.error('Summary fetch failed', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleSearchRepos = async () => {
    if (tags.length === 0) return;
    if (tags.length === 0) return;
    try {
      setLoading(true);
      const query = tags.join(' ');
      const resp = await fetch(`/api/search-repos?terms=${encodeURIComponent(query)}`);
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      setRepos(data.repos);
      setPage(1);
    } catch (e) {
      console.error('Repo search failed', e);
      alert('Could not search repositories');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = () => {
    if (mode === 'summarize') {
      handleFetchIssues();
    } else {
      handleSearchRepos();
    }
  };

  return (
    <>
      <Head>
        <title>sauce – Search GitHub Repositories and Summarize Issues</title>
        <meta name="description" content="Discover open-source projects, search repositories by keywords, and get concise issue summaries to start contributing quickly." />
        <meta name="keywords" content="open source, GitHub, repository search, issue summarization, contribute" />
      </Head>
      <Layout>
      <Container maxWidth="md" style={{ marginTop: "4rem" }}>

        <div style={{ textAlign: "center" }}>
          <Box display="flex" alignItems="center" justifyContent="center" gap={2}>
            <Typography
              variant="h2"
              gutterBottom
              sx={{
                color: '#fff',
                fontWeight: 700,
                background: 'linear-gradient(5deg, #fff 0%, #f1f1f1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontFamily: ['Jua'],
              }}
            >
              sauce
              <Image src="../sauce.svg" alt="Sauce logo" width={80} height={80} style={{
                verticalAlign: 'bottom',
              }} />
            </Typography>
            </Box>


          <Typography
            variant="h6"
            gutterBottom
            sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 4 }}
          >
            Discover meaningful ways to contribute to open source projects
          </Typography>

        <ToggleButtonGroup
          color="primary"
          exclusive
          onChange={(e, val) => {
            if (val) {
              setMode(val);
              setErrorMsg(''); // clear banner when switching modes
            }
          }}
          sx={{ mb: 3 }}
          value={mode}
        >
          <ToggleButton value="search" sx={toggleStyle}>Search Repositories</ToggleButton>
          <ToggleButton value="summarize" sx={toggleStyle}>Summarize Issues</ToggleButton>
        </ToggleButtonGroup>
        </div>

        {mode === 'summarize' && (
          <GitHubIssueSearchField
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            onSubmit={onSubmit}
            loading={loading}
          />
        )}

        {mode === 'search' && (
          <Box sx={{ mt: 3 }}>
            <Card
              sx={{
                display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 4px 24px rgba(0,0,0,0.2)', maxWidth: '800px', margin: '0 auto'
              }}
            >
            <Autocomplete
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip {...getTagProps({ index })} label={option} sx={{ bgcolor: '#fff', color: '#000' }} deleteIcon={<CloseIcon sx={{ color: '#000' }} />} />
                ))}

              sx={{ flexGrow: 1, mr: 2 }}
              multiple
              freeSolo
              options={[]}
              value={tags}
              onChange={(e, val) => setTags(val)}
              renderInput={(params) => <TextField {...params} label="Search terms" placeholder="Type a keyword and press Enter" />}
            />
            <Box>
              <Button className="glass-button" onClick={onSubmit} variant="contained" disabled={loading || tags.length === 0} sx={{ borderRadius: '12px', backgroundColor: '#fff' }}>
                {loading ? <CircularProgress size={20} /> : 'Search'}
              </Button>
            </Box>
            </Card>
          </Box>
        )}


        {errorMsg && (
            <Box sx={{ bgcolor: '#8B0000', color: '#fff', p: 2, borderRadius: 1, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography>{errorMsg}</Typography>
              <IconButton aria-label="close" size="small" sx={{ color: '#fff' }} onClick={() => setErrorMsg('')}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          )}


        {mode === 'summarize' && loadingSummary && (
          <Typography variant="body1" sx={{ color: '#fff', mt: 4 }}>
            Generating project summary...
          </Typography>
        )}

        {mode === 'summarize' && summary && (
          <Card sx={{ mt: 4, p: 3, backgroundColor: '#fff', color: '#000', borderRadius: '16px' }}>
            <CardContent>
              <Typography variant="h5" sx={{ mb: 2, color: '#000', fontFamily: 'Jua' }}>
                Project Summary & Getting Started Guide
              </Typography>
              <ReactMarkdown>{summary}</ReactMarkdown>
            </CardContent>
          </Card>
        )}

        {mode === 'search' && (
          <>
            <RepoResults repos={repos.slice((page-1)*pageSize, page*pageSize)} />
            {repos.length > pageSize && (
              <Box display="flex" justifyContent="center" mt={2}>
                <Pagination count={Math.ceil(repos.length / pageSize)} page={page} onChange={(_, v) => setPage(v)} color="primary" />
              </Box>
            )}
          </>
        )}
      </Container>
    </Layout>
    </>
  );
}