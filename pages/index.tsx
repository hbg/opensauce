import React, { useState, useEffect } from "react";
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
  const [tagInput, setTagInput] = useState('');
  const [typedSummary, setTypedSummary] = useState('');
  const [typedPlaceholder, setTypedPlaceholder] = useState('');
  const placeholderExamples = [
    'mri,unet,segmentation,3d,augmentation',
    'rl,motion,control,policy,simulation',
    'nlp,bert,transformer,question-answering,fine-tuning',
    'gan,images,super-resolution,style-transfer,pytorch',
    'cuda,kernels,gpu,optimization,parallel',
  ];

  // typing effect for generated summary
  useEffect(() => {
    setTypedSummary('');
    if (!summary) return;
    let i = 0;
    const id = setInterval(() => {
      setTypedSummary((prev) => prev + summary[i]);
      i += 1;
      if (i >= summary.length) clearInterval(id);
    }, 20);
    return () => clearInterval(id);
  }, [summary]);

  // typing effect for keywords placeholder
  useEffect(() => {
    let active = true;
    let exampleIndex = 0;
    let charIndex = 0;

    const typeNext = () => {
      if (!active) return;
      const current = placeholderExamples[exampleIndex];
      if (charIndex <= current.length) {
        setTypedPlaceholder(current.slice(0, charIndex));
        charIndex += 1;
        setTimeout(typeNext, 120);
      } else {
        setTimeout(() => {
          charIndex = 0;
          exampleIndex = (exampleIndex + 1) % placeholderExamples.length;
          setTypedPlaceholder('');
          setTimeout(typeNext, 500);
        }, 1500);
      }
    };

    typeNext();
    return () => {
      active = false;
    };
  }, []);
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
      setErrorMsg('');
    } catch (err: any) {
      console.error('Summary fetch failed', err);
      setErrorMsg(err?.message || 'Could not generate summary. The repository may be too large or complex.');
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleSearchRepos = async () => {
    // include any text still in the input box as a tag
    let searchTags = tags;
    if (tagInput.trim()) {
      searchTags = [...tags, tagInput.trim()];
      setTags(searchTags);
      setTagInput('');
    }
    if (searchTags.length === 0) return;
    try {
      setLoading(true);
      const query = searchTags.join(' ');
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
        <title>sauce – search GitHub repositories and summarize issues</title>
        <meta name="description" content="Discover open-source projects, search repositories by keywords, and get concise issue summaries to start contributing quickly." />
        <meta name="keywords" content="open source, GitHub, repository search, issue summarization, contribute" />


        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://opensauce-two.vercel.app/" />
        <meta property="og:title" content="Sauce" />
        <meta property="og:description" content="Search GitHub repositories and dive headfirst into feature requests with AI" />
        <meta property="og:image" content="https://opensauce-two.vercel.app/metatag.jpg" />

        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://opensauce-two.vercel.app/" />
        <meta property="twitter:title" content="Sauce" />
        <meta property="twitter:description" content="Search GitHub repositories and dive headfirst into feature requests with AI" />
        <meta property="twitter:image" content="https://opensauce-two.vercel.app/metatag.jpg" />
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
              if (val === 'search') {
                setSummary('');
                setLoadingSummary(false);
              }
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
                display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, padding: '0.75rem 1rem', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 4px 24px rgba(0,0,0,0.2)', maxWidth: '800px', margin: '0 auto'
              }}
            >
            <Autocomplete
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    label={option}
                    sx={{
                      bgcolor: '#fff',
                      color: '#000',
                      '& .MuiChip-deleteIcon': {
                        color: '#000',
                        '&:hover': { color: '#000' },
                      },
                    }}
                  />
                ))}

              sx={{ flexGrow: 1, mr: { xs: 0, sm: 2 }, mb: { xs: 1, sm: 0 } }}
              multiple
              freeSolo
              options={[]}
              value={tags}
              inputValue={tagInput}
              onInputChange={(e, val) => setTagInput(val)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  if (!tagInput.trim()) return;
                  e.preventDefault();
                  setTags([...tags, tagInput.trim()]);
                  setTagInput('');
                }
              }}
              onChange={(e, val) => setTags(val)}
              renderInput={(params) => <TextField {...params} label="Keywords" placeholder={typedPlaceholder || 'Enter keywords'} />}
            />
            <Box>
              <Button className="glass-button" onClick={onSubmit} variant="contained" disabled={loading || tags.length === 0} sx={{ borderRadius: '12px', backgroundColor: '#fff', mt: { xs: 1, sm: 0 } }}>
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
              <ReactMarkdown>{typedSummary}</ReactMarkdown>
            </CardContent>
          </Card>
        )}

        {mode === 'search' && (
          <>
            <RepoResults
              repos={repos.slice((page-1)*pageSize, page*pageSize)}
              onSummarize={(url) => {
                setRepoUrl(url);
                setMode('summarize');
                handleFetchIssues();
              }}
            />
            {repos.length > pageSize && (
              <Box display="flex" justifyContent="center" mt={2}>
                <Pagination
                  count={Math.ceil(repos.length / pageSize)}
                  page={page}
                  onChange={(_, v) => setPage(v)}
                  color="primary"
                  size="small"
                  sx={{ flexWrap: { xs: 'wrap', sm: 'nowrap' }, justifyContent: 'center' }}
                />
              </Box>
            )}
          </>
        )}
      </Container>
    </Layout>
    </>
  );
}