import React from "react";
import { Card, TextField, Button, CircularProgress } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

interface Props {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: () => void;
    loading: boolean;
  }

  const GitHubIssueSearchField: React.FC<Props> = ({ value, onChange, onSubmit, loading }) => {
    return (
      <Card
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        elevation={3}
        className="glass-card"
        sx={{
          display: "flex",
          alignItems: "center",
          padding: "0.75rem 1rem",
          margin: "2rem auto",
          maxWidth: "800px",
          borderRadius: "16px",
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.15)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.2)"
        }}
      >
        <SearchIcon sx={{ color: '#fff', mr: 2 }} />
        <TextField
          placeholder="Enter GitHub repository URL..."
          value={value}
          onChange={onChange}
          fullWidth
          variant="standard"
          size="small"
        />
        <Button
          type="submit"
          variant="contained"
          disabled={loading || !value.trim()}
          className="glass-button"
          sx={{
            marginLeft: "1rem",
            borderRadius: "12px",
            backgroundColor: '#fff',
            '& .MuiButton-startIcon': {
              color: '#fff'
            }
          }}
        >
          {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : "Summarize"}
        </Button>
      </Card>
    );
  };

  export default GitHubIssueSearchField;
